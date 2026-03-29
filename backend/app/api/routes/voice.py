import json
from fastapi import APIRouter, Form, Depends
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models.case import Case, InputMode
from app.services.ai_service import run_triage
from app.services.email_service import send_email
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
        recipient = settings.hospital_alert_emails[0] if settings.hospital_alert_emails else ""
        if recipient:
            send_email(
                recipient,
                "VOICE TRIAGE: Unclear transcription",
                f"Caller {callerNumber} had unclear voice symptoms. Please advise callback or app-based triage.",
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
            alert_hospital(
                hospital,
                case.id,
                result.get("symptoms_detected", []),
                result["recommendation"],
                patient_location=case.location,
            )

    recipient = settings.hospital_alert_emails[0] if settings.hospital_alert_emails else ""
    if recipient:
        send_email(
            recipient,
            f"VOICE TRIAGE RESULT - Case {str(case.id)[:8].upper()}",
            (
                f"Caller: {callerNumber}\n"
                f"Severity: {result['severity']}\n"
                f"Recommendation: {result['recommendation']}\n"
                f"Case ID: {case.id}"
            ),
        )

    return "OK"