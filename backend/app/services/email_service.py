import json
import smtplib
import ssl
from datetime import datetime, timedelta
from email.message import EmailMessage
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.case import Case


def send_email(to_email: str, subject: str, body: str) -> bool:
    """Send email via SMTP when enabled; otherwise use mock console output."""
    if not to_email:
        return False

    smtp_ready = settings.SMTP_ENABLED and settings.SMTP_HOST and (settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME)
    if not smtp_ready:
        print(f"[EMAIL MOCK] To: {to_email}\nSubject: {subject}\n\n{body}\n")
        return True

    from_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME
    from_name = settings.SMTP_FROM_NAME.strip()
    from_header = f"{from_name} <{from_email}>" if from_name else from_email

    msg = EmailMessage()
    msg["From"] = from_header
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)

    try:
        if settings.SMTP_USE_SSL:
            with smtplib.SMTP_SSL(
                settings.SMTP_HOST,
                settings.SMTP_PORT,
                timeout=settings.SMTP_TIMEOUT_SECONDS,
                context=ssl.create_default_context(),
            ) as server:
                if settings.SMTP_USERNAME:
                    server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.send_message(msg)
            return True

        with smtplib.SMTP(
            settings.SMTP_HOST,
            settings.SMTP_PORT,
            timeout=settings.SMTP_TIMEOUT_SECONDS,
        ) as server:
            if settings.SMTP_USE_TLS:
                server.starttls(context=ssl.create_default_context())
            if settings.SMTP_USERNAME:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as exc:
        print(f"SMTP send failed for {to_email}: {exc}")
        return False


def send_hospital_emergency_email(
    hospital_name: str,
    hospital_email: str,
    case_id: str,
    symptoms: list[str],
    recommendation: str,
    patient_location: str | None = None,
    patient_phone: str | None = None,
) -> bool:
    subject = f"EMERGENCY ALERT - {hospital_name} - Case {case_id[:8].upper()}"
    body = (
        f"Emergency triage case detected.\n"
        f"Case ID: {case_id}\n"
        f"Hospital: {hospital_name}\n"
        f"Symptoms: {', '.join(symptoms) if symptoms else 'N/A'}\n"
        f"Location: {patient_location or 'Not specified'}\n"
        f"Patient contact: {patient_phone or 'Not specified'}\n"
        f"Recommendation: {recommendation}\n"
        f"Action: Immediate emergency response required."
    )
    return send_email(hospital_email, subject, body)


def _extract_primary_diagnosis(likely_diseases_raw: str | None) -> str | None:
    if not likely_diseases_raw:
        return None
    try:
        parsed = json.loads(likely_diseases_raw)
        if isinstance(parsed, list) and parsed:
            top = parsed[0]
            if isinstance(top, dict):
                name = str(top.get("name", "")).strip()
                return name or None
    except Exception:
        return None
    return None


def count_similar_recent_cases(db: Session, diagnosis: str, hours: int = 24) -> int:
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    recent_cases = db.query(Case).filter(Case.created_at >= cutoff).all()
    count = 0
    diagnosis_norm = diagnosis.strip().lower()
    for case in recent_cases:
        primary = _extract_primary_diagnosis(case.likely_diseases)
        if primary and primary.strip().lower() == diagnosis_norm:
            count += 1
    return count


def notify_moh_epidemic_if_needed(
    db: Session,
    diagnosis: str | None,
    location: str | None,
    threshold: int = 3,
) -> tuple[bool, int]:
    """Send MOH alert when more than threshold similar cases are seen in last 24h.

    To avoid repeat spam, trigger only when count == threshold + 1.
    """
    if not diagnosis:
        return False, 0

    count = count_similar_recent_cases(db, diagnosis, hours=24)
    if count != threshold + 1:
        return False, count

    recipients = settings.moh_alert_emails
    if not recipients:
        return False, count

    subject = f"POSSIBLE EPIDEMIC ALERT - {diagnosis}"
    body = (
        f"Possible epidemic signal detected by Remotriage.\n"
        f"Diagnosis cluster: {diagnosis}\n"
        f"Cases in last 24h: {count}\n"
        f"Location context: {location or 'Not specified'}\n"
        f"Please review surveillance data and investigate promptly."
    )

    sent_any = False
    for email in recipients:
        sent_any = send_email(email, subject, body) or sent_any

    return sent_any, count
