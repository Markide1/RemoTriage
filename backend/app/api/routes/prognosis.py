import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.case import Case
from app.services.hospital_service import find_nearest_hospital, alert_hospital

router = APIRouter(prefix="/prognosis", tags=["prognosis"])

@router.get("/{prognosis_id}")
def get_prognosis(prognosis_id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == prognosis_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Prognosis ID not found.")

    return {
        "prognosis_id": case.id,
        "severity": case.severity,
        "symptoms_detected": json.loads(case.symptoms_detected),
        "recommendation": case.recommendation,
        "alert_triggered": case.alert_triggered,
        "referred_to_hospital": case.referred_to_hospital,
        "hospital_name": case.hospital_name,
        "input_mode": case.input_mode,
        "created_at": case.created_at.isoformat(),
    }

@router.post("/{prognosis_id}/refer")
def confirm_referral(prognosis_id: str, db: Session = Depends(get_db)):
    """Patient-initiated referral for moderate cases."""
    case = db.query(Case).filter(Case.id == prognosis_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Prognosis ID not found.")
    if case.referred_to_hospital:
        return {"message": "Already referred.", "hospital": case.hospital_name}
    if case.severity == "normal":
        raise HTTPException(status_code=400, detail="Referral not required for normal severity.")

    hospital = find_nearest_hospital(case.location)
    if not hospital:
        raise HTTPException(status_code=503, detail="No hospital found in your area.")

    symptoms = json.loads(case.symptoms_detected)
    alert_hospital(hospital, case.id, symptoms, case.recommendation)

    case.referred_to_hospital = True
    case.hospital_name = hospital["name"]
    db.commit()

    return {"message": "Referred successfully.", "hospital": hospital["name"]}