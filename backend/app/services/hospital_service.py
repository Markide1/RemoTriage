import logging
import math
import requests
from app.core.config import settings
from app.services.email_service import send_hospital_emergency_email

# Fallback registry if Places API is unavailable.
HOSPITALS = [
    {"id": "h1", "name": "Kenyatta National Hospital", "phone": "+254700000001", "email": "knh-alert@example.com", "location": "Nairobi", "distance": 0},
    {"id": "h2", "name": "Moi Teaching & Referral Hospital", "phone": "+254700000002", "email": "mtrh-alert@example.com", "location": "Eldoret", "distance": 150},
    {"id": "h3", "name": "Coast General Hospital", "phone": "+254700000003", "email": "cgh-alert@example.com", "location": "Mombasa", "distance": 350},
    {"id": "h4", "name": "Aga Khan Hospital", "phone": "+254700000004", "email": "akh-alert@example.com", "location": "Nairobi", "distance": 5},
    {"id": "h5", "name": "Karen Hospital", "phone": "+254700000005", "email": "karen-alert@example.com", "location": "Nairobi", "distance": 12},
]

logger = logging.getLogger(__name__)
_PLACE_CACHE: dict[str, dict] = {}


def _get_places_key() -> str:
    return settings.GOOGLE_PLACES_API_KEY or settings.GOOGLE_API_KEY


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


def _geocode_location(location: str) -> tuple[float, float] | None:
    api_key = _get_places_key()
    if not api_key:
        return None
    try:
        resp = requests.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            params={"address": location, "key": api_key},
            timeout=8,
        )
        resp.raise_for_status()
        payload = resp.json()
        if payload.get("status") != "OK" or not payload.get("results"):
            return None
        coords = payload["results"][0]["geometry"]["location"]
        return float(coords["lat"]), float(coords["lng"])
    except Exception as exc:
        logger.warning("Geocoding failed for '%s': %s", location, exc)
        return None


def _search_places_hospitals(location: str, limit: int) -> list[dict]:
    api_key = _get_places_key()
    if not api_key:
        return []

    query = f"hospital near {location}" if location else "hospital"
    origin = _geocode_location(location) if location else None

    try:
        resp = requests.get(
            "https://maps.googleapis.com/maps/api/place/textsearch/json",
            params={
                "query": query,
                "key": api_key,
                "region": "ke",
            },
            timeout=10,
        )
        resp.raise_for_status()
        payload = resp.json()
        if payload.get("status") not in {"OK", "ZERO_RESULTS"}:
            logger.warning("Places API lookup failed: %s", payload.get("status"))
            return []

        clinics: list[dict] = []
        default_emails = settings.hospital_alert_emails
        for rank, place in enumerate(payload.get("results", [])[: max(limit, 1)], start=1):
            loc = place.get("geometry", {}).get("location", {})
            lat, lng = loc.get("lat"), loc.get("lng")
            distance = 999.0
            if origin and lat is not None and lng is not None:
                distance = round(_haversine_km(origin[0], origin[1], float(lat), float(lng)), 2)
            elif rank:
                distance = float(rank)

            clinic = {
                "id": place.get("place_id") or f"place-{rank}",
                "name": place.get("name", "Unknown clinic"),
                "phone": "",
                "email": default_emails[(rank - 1) % len(default_emails)] if default_emails else "",
                "location": place.get("formatted_address", location or "Unknown"),
                "distance": distance,
            }
            clinics.append(clinic)
            _PLACE_CACHE[clinic["id"]] = clinic

        return sorted(clinics, key=lambda x: x.get("distance", 999))[:limit]
    except Exception as exc:
        logger.warning("Places API hospital search failed: %s", exc)
        return []

def find_nearest_hospital(location: str | None) -> dict | None:
    """Return nearest hospital from Places API geospatial results or fallback registry."""
    nearby = get_nearby_hospitals(location, limit=1)
    if nearby:
        return nearby[0]
    return None

def get_nearby_hospitals(location: str | None, limit: int = 5) -> list[dict]:
    """Return nearby hospitals using Google Places geospatial search with fallback."""
    if location:
        places = _search_places_hospitals(location, limit)
        if places:
            return places

    if not HOSPITALS:
        return []

    if location:
        matched = [h for h in HOSPITALS if location.lower() in h["location"].lower()]
        if matched:
            return sorted(matched, key=lambda x: x.get("distance", 999))[:limit]
    return sorted(HOSPITALS, key=lambda x: x.get("distance", 999))[:limit]

def get_hospital_by_id(hospital_id: str) -> dict | None:
    """Lookup a hospital/clinic by registry ID."""
    if hospital_id in _PLACE_CACHE:
        return _PLACE_CACHE[hospital_id]
    for hospital in HOSPITALS:
        if hospital.get("id") == hospital_id:
            return hospital
    return None

def alert_hospital(
    hospital: dict,
    prognosis_id: str,
    symptoms: list[str],
    recommendation: str,
    patient_location: str | None = None,
    patient_phone: str | None = None,
) -> bool:
    recipient_email = hospital.get("email") or (settings.hospital_alert_emails[0] if settings.hospital_alert_emails else "")
    try:
        send_hospital_emergency_email(
            hospital_name=hospital.get("name", "Nearest Hospital"),
            hospital_email=recipient_email,
            case_id=prognosis_id,
            symptoms=symptoms,
            recommendation=recommendation,
            patient_location=patient_location or hospital.get("location"),
            patient_phone=patient_phone,
        )
        return True
    except Exception as e:
        print(f"Hospital alert failed: {e}")
        return False