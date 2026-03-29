import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import verify_pin
from app.models.case import Case
from app.models.follow_up_history import FollowUpHistory
from app.services.ai_service import run_triage
from app.services.hospital_service import find_nearest_hospital, alert_hospital, get_nearby_hospitals, get_hospital_by_id

router = APIRouter(prefix="/prognosis", tags=["prognosis"])


class ReferralRequest(BaseModel):
    clinic_id: str | None = None


class PINCheckRequest(BaseModel):
    pin: str | None = None


@router.post("/{prognosis_id}")
async def get_prognosis(prognosis_id: str, payload: PINCheckRequest | None = None, db: Session = Depends(get_db)):
    """Get case details with optional PIN validation."""
    case = db.query(Case).filter(Case.id == prognosis_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Prognosis ID not found.")

    # Validate PIN if case has one
    if case.pin_hash:
        if not payload or not payload.pin:
            raise HTTPException(status_code=401, detail="PIN required for this case.")
        if not verify_pin(payload.pin, case.pin_hash):
            raise HTTPException(status_code=401, detail="Invalid PIN.")

    refreshed = await run_triage(case.raw_input)
    nearby_clinics = [
        {
            "id": c.get("id", ""),
            "name": c.get("name", "Unknown clinic"),
            "phone": c.get("phone", ""),
            "location": c.get("location", ""),
            "distance": c.get("distance", 999),
        }
        for c in get_nearby_hospitals(case.location, limit=3)
    ]

    history_rows = (
        db.query(FollowUpHistory)
        .filter(FollowUpHistory.case_id == str(case.id))
        .order_by(FollowUpHistory.created_at.asc())
        .all()
    )
    follow_up_history = [
        {
            "timestamp": row.created_at.isoformat(),
            "symptoms_added": row.symptoms_added,
            "severity": row.severity,
            "reasoning": row.reasoning or "",
        }
        for row in history_rows
    ]

    return {
        "prognosis_id": case.id,
        "custom_id": case.custom_id,
        "doctor_type": case.doctor_type,
        "severity": case.severity,
        "symptoms_detected": json.loads(case.symptoms_detected),
        "recommendation": case.recommendation,
        "care_plan": refreshed.get("care_plan", [case.recommendation]),
        "likely_diseases": refreshed.get("likely_diseases", [{"name": "Undifferentiated illness", "probability": 100}]),
        "alert_triggered": case.alert_triggered,
        "referred_to_hospital": case.referred_to_hospital,
        "hospital_name": case.hospital_name,
        "nearby_clinics": nearby_clinics,
        "input_mode": case.input_mode,
        "created_at": case.created_at.isoformat(),
        "follow_up_history": follow_up_history,
    }


@router.post("/{prognosis_id}/refer")
def confirm_referral(prognosis_id: str, payload: ReferralRequest | None = None, db: Session = Depends(get_db)):
    """Patient-initiated referral for moderate cases."""
    case = db.query(Case).filter(Case.id == prognosis_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Prognosis ID not found.")
    if case.referred_to_hospital:
        return {"message": "Already referred.", "hospital": case.hospital_name}
    if case.severity == "normal":
        raise HTTPException(status_code=400, detail="Referral not required for normal severity.")

    hospital = None
    if payload and payload.clinic_id:
        hospital = get_hospital_by_id(payload.clinic_id)
        if not hospital:
            raise HTTPException(status_code=404, detail="Selected clinic not found.")
    else:
        hospital = find_nearest_hospital(case.location)

    if not hospital:
        raise HTTPException(status_code=503, detail="No hospital found in your area.")

    symptoms = json.loads(case.symptoms_detected)
    alert_hospital(hospital, case.id, symptoms, case.recommendation, patient_location=case.location)

    case.referred_to_hospital = True
    case.hospital_name = hospital["name"]
    db.commit()

    return {"message": "Referred successfully.", "hospital": hospital["name"]}
