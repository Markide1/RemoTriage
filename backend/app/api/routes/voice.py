import json
from fastapi import APIRouter, Form, Depends
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.case import Case, InputMode
from app.services.ai_service import run_triage
from app.services.sms_service import send_sms
from app.services.hospital_service import find_nearest_hospital, alert_hospital

router = APIRouter(prefix="/voice", tags=["voice"])

@router.post("/webhook", response_class=PlainTextResponse)
async def voice_webhook(
    isActive: str = Form(...),
    callerNumber: str = Form(...),
    dtmfDigits: str = Form(default=""),
    recordingUrl: str = Form(default=""),
    transcription: str = Form(default=""),
    db: Session = Depends(get_db),
):
    """
    Africa's Talking calls this endpoint after a call session.
    'transcription' contains the speech-to-text of what the caller said.
    Configure this as the callback URL in your AT voice number settings.
    """
    symptoms_text = transcription.strip()

    if not symptoms_text:
        send_sms(
            callerNumber, "none", "normal",
            "We could not hear your symptoms clearly. Please call again or visit remotriage.app to type your symptoms."
        )
        return "OK"

    result = await run_triage(symptoms_text)

    hospital_name = None
    if result.get("alert_triggered"):
        hospital = find_nearest_hospital(None)
        if hospital:
            hospital_name = hospital["name"]

    case = Case(
        raw_input=symptoms_text,
        phone_number=callerNumber,
        location=None,
        symptoms_detected=json.dumps(result.get("symptoms_detected", [])),
        severity=result["severity"],
        recommendation=result["recommendation"],
        input_mode=InputMode.voice,
        alert_triggered=result.get("alert_triggered", False),
        referred_to_hospital=hospital_name is not None,
        hospital_name=hospital_name,
    )
    db.add(case)
    db.commit()
    db.refresh(case)

    if hospital_name:
        hospital = find_nearest_hospital(None)
        if hospital:
            alert_hospital(hospital, case.id, result.get("symptoms_detected", []), result["recommendation"])

    send_sms(callerNumber, case.id, result["severity"], result["recommendation"])

    return "OK"