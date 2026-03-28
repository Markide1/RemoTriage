import africastalking
from app.core.config import settings

africastalking.initialize(settings.AT_USERNAME, settings.AT_API_KEY)
sms = africastalking.SMS

def build_sms_message(prognosis_id: str, severity: str, recommendation: str) -> str:
    severity_prefix = {
        "normal": "✓ REMOTRIAGE",
        "moderate": "⚠ REMOTRIAGE",
        "critical": "🚨 REMOTRIAGE EMERGENCY",
    }.get(severity, "REMOTRIAGE")

    return (
        f"{severity_prefix}\n"
        f"Case ID: {prognosis_id[:8].upper()}\n\n"
        f"{recommendation}\n\n"
        f"View full report: remotriage.app/case/{prognosis_id}"
    )

def send_sms(phone_number: str, prognosis_id: str, severity: str, recommendation: str) -> bool:
    message = build_sms_message(prognosis_id, severity, recommendation)
    if not AT_AVAILABLE or not sms:
        print(f"[SMS MOCK] To: {phone_number}\n{message}\n")
        return True
    try:
        sms.send(message, [phone_number], sender_id=settings.AT_SENDER_ID)
        return True
    except Exception as e:
        print(f"SMS send failed for {phone_number}: {e}")
        return False