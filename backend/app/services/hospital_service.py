from app.services.sms_service import send_sms

# Placeholder hospital registry — replace with DB or Google Places API lookup
HOSPITALS = [
    {"name": "Kenyatta National Hospital", "phone": "+254700000001", "location": "Nairobi"},
    {"name": "Moi Teaching & Referral Hospital", "phone": "+254700000002", "location": "Eldoret"},
    {"name": "Coast General Hospital", "phone": "+254700000003", "location": "Mombasa"},
]

def find_nearest_hospital(location: str | None) -> dict | None:
    """Returns nearest hospital. Extend with real geolocation logic."""
    if not HOSPITALS:
        return None
    # Basic match on location string; replace with PostGIS proximity query
    if location:
        for h in HOSPITALS:
            if location.lower() in h["location"].lower():
                return h
    return HOSPITALS[0]  # Default fallback

def alert_hospital(hospital: dict, prognosis_id: str, symptoms: list[str], recommendation: str) -> bool:
    message = (
        f"REMOTRIAGE REFERRAL\n"
        f"Case ID: {prognosis_id[:8].upper()}\n"
        f"Symptoms: {', '.join(symptoms)}\n"
        f"Action: {recommendation}\n"
        f"Full record: remotriage.app/case/{prognosis_id}"
    )
    try:
        send_sms(hospital["phone"], prognosis_id, "critical", message)
        return True
    except Exception as e:
        print(f"Hospital alert failed: {e}")
        return False