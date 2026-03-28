import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.case import Case, InputMode
from app.services.ai_service import run_triage
from app.services.hospital_service import find_nearest_hospital, alert_hospital

router = APIRouter(prefix="/triage", tags=["triage"])

class TriageRequest(BaseModel):
    symptoms: str
    full_name: str | None = None
    dob: str | None = None
    gender: str | None = None
    phone_number: str | None = None
    email: str | None = None
    location: str | None = None

class TriageResponse(BaseModel):
    prognosis_id: str
    severity: str
    symptoms_detected: list[str]
    recommendation: str
    alert_triggered: bool
    referred_hospital: str | None = None

@router.post("/", response_model=TriageResponse)
async def submit_triage(payload: TriageRequest, db: Session = Depends(get_db)):
    if not payload.symptoms.strip():
        raise HTTPException(status_code=422, detail="Symptoms cannot be empty.")

    result = await run_triage(payload.symptoms)

    hospital_name = None
    if result.get("alert_triggered"):
        hospital = find_nearest_hospital(payload.location)
        if hospital:
            alert_hospital(hospital, "pending", result.get("symptoms_detected", []), result["recommendation"])
            hospital_name = hospital["name"]

    case = Case(
        raw_input=payload.symptoms,
        phone_number=payload.phone_number,
        location=payload.location,
        symptoms_detected=json.dumps(result.get("symptoms_detected", [])),
        severity=result["severity"],
        recommendation=result["recommendation"],
        input_mode=InputMode.text,
        alert_triggered=result.get("alert_triggered", False),
        referred_to_hospital=hospital_name is not None,
        hospital_name=hospital_name,
    )
    db.add(case)
    db.commit()
    db.refresh(case)

    # Update hospital alert with real case ID
    if hospital_name and result.get("alert_triggered"):
        hospital = find_nearest_hospital(payload.location)
        if hospital:
            alert_hospital(hospital, case.id, result.get("symptoms_detected", []), result["recommendation"])

    return TriageResponse(
        prognosis_id=case.id,
        severity=result["severity"],
        symptoms_detected=result.get("symptoms_detected", []),
        recommendation=result["recommendation"],
        alert_triggered=result.get("alert_triggered", False),
        referred_hospital=hospital_name,
    )