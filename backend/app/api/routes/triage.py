import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import validate_email, validate_phone, validate_pin, hash_pin, verify_pin
from app.core.utils import generate_custom_id, format_follow_up_entry
from app.models.case import Case, InputMode
from app.models.follow_up_history import FollowUpHistory
from app.services.email_service import notify_moh_epidemic_if_needed
from app.services.critical_alert_service import trigger_critical_alert
from app.services.ai_service import run_triage
from app.services.hospital_service import find_nearest_hospital, get_nearby_hospitals

router = APIRouter(prefix="/triage", tags=["triage"])

class TriageRequest(BaseModel):
    symptoms: str
    full_name: str | None = None
    dob: str | None = None
    gender: str | None = None
    phone_number: str | None = None
    email: str | None = None
    location: str | None = None
    # Patient history (new fields)
    current_medications: list[str] = Field(default_factory=list)
    previous_illness: list[str] = Field(default_factory=list)
    family_illnesses: list[str] = Field(default_factory=list)
    doctor_type: str | None = None
    disease_description: str | None = None
    # PIN for data protection
    pin: str | None = None


class LikelyDisease(BaseModel):
    name: str
    probability: float


class ClinicOption(BaseModel):
    id: str
    name: str
    phone: str
    location: str
    distance: float | int


class TriageResponse(BaseModel):
    prognosis_id: str
    custom_id: str
    doctor_type: str | None = None
    severity: str
    symptoms_detected: list[str]
    recommendation: str
    care_plan: list[str]
    likely_diseases: list[LikelyDisease]
    alert_triggered: bool
    referred_hospital: str | None = None
    nearby_clinics: list[ClinicOption] = Field(default_factory=list)


class PINValidationRequest(BaseModel):
    pin: str


class PINValidationResponse(BaseModel):
    valid: bool
    message: str


class FollowUpRequest(BaseModel):
    additional_symptoms: str
    location: str | None = None
    phone_number: str | None = None


def _infer_doctor_type(severity: str, symptoms_text: str) -> str:
    symptoms = (symptoms_text or "").lower()
    if severity == "critical":
        return "Emergency medicine"
    if any(k in symptoms for k in ["chest", "heart", "palpitation"]):
        return "Cardiologist"
    if any(k in symptoms for k in ["breath", "cough", "wheeze", "lung"]):
        return "Pulmonologist"
    if any(k in symptoms for k in ["skin", "rash", "itch"]):
        return "Dermatologist"
    if any(k in symptoms for k in ["tooth", "gum", "jaw", "dental"]):
        return "Dentist"
    if any(k in symptoms for k in ["eye", "vision"]):
        return "Ophthalmologist"
    return "General physician"


def _serialize_clinics(location: str | None, limit: int = 3) -> list[dict]:
    return [
        {
            "id": c.get("id", ""),
            "name": c.get("name", "Unknown clinic"),
            "phone": c.get("phone", ""),
            "location": c.get("location", ""),
            "distance": c.get("distance", 999),
        }
        for c in get_nearby_hospitals(location, limit=limit)
    ]

@router.post("/", response_model=TriageResponse)
async def submit_triage(payload: TriageRequest, db: Session = Depends(get_db)):
    if not payload.symptoms.strip():
        raise HTTPException(status_code=422, detail="Symptoms cannot be empty.")

    # Validate email if provided
    if payload.email and not validate_email(payload.email):
        raise HTTPException(status_code=422, detail="Invalid email format.")

    # Validate phone if provided
    if payload.phone_number and not validate_phone(payload.phone_number):
        raise HTTPException(status_code=422, detail="Invalid phone number format.")

    # Validate PIN if provided
    if payload.pin:
        is_valid, msg = validate_pin(payload.pin)
        if not is_valid:
            raise HTTPException(status_code=422, detail=msg)

    # Objective 2: AI-driven severity classification
    result = await run_triage(payload.symptoms)
    system_doctor_type = _infer_doctor_type(result.get("severity", "moderate"), payload.symptoms)
    nearby_clinics = _serialize_clinics(payload.location)

    hospital_name = None
    nearest_hospital = None
    if result.get("alert_triggered"):
        nearest_hospital = find_nearest_hospital(payload.location)
        if nearest_hospital:
            hospital_name = nearest_hospital["name"]

    # Generate custom ID
    custom_id = generate_custom_id(payload.full_name)

    # Hash PIN if provided
    pin_hash = hash_pin(payload.pin) if payload.pin else None

    # Create initial follow-up history entry
    follow_up_entry = format_follow_up_entry(
        symptoms=payload.symptoms,
        severity=result["severity"],
        reasoning=result.get("reasoning", "Initial assessment")
    )

    # Objective 4: Data stored for outbreak tracking and clinical audit
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
        # New fields
        custom_id=custom_id,
        pin_hash=pin_hash,
        patient_full_name=payload.full_name,
        date_of_birth=payload.dob,
        gender=payload.gender,
        email=payload.email,
        current_medications=json.dumps(payload.current_medications) if payload.current_medications else None,
        previous_illness=json.dumps(payload.previous_illness) if payload.previous_illness else None,
        family_illnesses=json.dumps(payload.family_illnesses) if payload.family_illnesses else None,
        doctor_type=system_doctor_type,
        disease_description=payload.disease_description,
        care_plan=json.dumps(result.get("care_plan", [])),
        likely_diseases=json.dumps(result.get("likely_diseases", [])),
        reasoning=result.get("reasoning", ""),
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    case_id = str(case.id)

    db.add(
        FollowUpHistory(
            case_id=str(case.id),
            symptoms_added=follow_up_entry.get("symptoms_added"),
            severity=follow_up_entry.get("severity", "moderate"),
            reasoning=follow_up_entry.get("reasoning", "Initial assessment"),
        )
    )
    db.commit()

    # Notify MOH when similar diagnosis count indicates a possible epidemic (>3 in 24h).
    try:
        likely = result.get("likely_diseases", [])
        primary_diagnosis = likely[0].get("name") if isinstance(likely, list) and likely and isinstance(likely[0], dict) else None
        notify_moh_epidemic_if_needed(db, primary_diagnosis, payload.location, threshold=3)
    except Exception:
        pass

    # Objective 3: Trigger full critical alert workflow (hospital + MoH + emergency services recipients).
    if result.get("alert_triggered"):
        try:
            trigger_critical_alert(
                db=db,
                case_id=case_id,
                symptoms=result.get("symptoms_detected", []),
                recommendation=result["recommendation"],
                patient_phone=case.phone_number,
                patient_location=case.location,
                severity=result.get("severity", "critical"),
            )
        except Exception as exc:
            db.rollback()
            print(f"Critical alert workflow failed for case {case_id}: {exc}")

    # Final Response
    return TriageResponse(
        prognosis_id=case_id,
        custom_id=custom_id,
        doctor_type=system_doctor_type,
        severity=result["severity"],
        symptoms_detected=result.get("symptoms_detected", []),
        recommendation=result["recommendation"],
        care_plan=result.get("care_plan", []),
        likely_diseases=result.get("likely_diseases", []),
        alert_triggered=result.get("alert_triggered", False),
        referred_hospital=hospital_name,
        nearby_clinics=nearby_clinics,
    )


@router.post("/{prognosis_id}/follow-up", response_model=TriageResponse)
async def add_follow_up_data(prognosis_id: str, payload: FollowUpRequest, db: Session = Depends(get_db)):
    """Re-assess an existing case with additional symptoms/details."""
    case = db.query(Case).filter(Case.id == prognosis_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Prognosis ID not found.")
    case_id = str(case.id)

    if not payload.additional_symptoms.strip():
        raise HTTPException(status_code=422, detail="Additional symptoms cannot be empty.")

    combined_input = f"{case.raw_input}\n\nFollow-up update: {payload.additional_symptoms.strip()}"
    result = await run_triage(combined_input)
    system_doctor_type = _infer_doctor_type(result.get("severity", "moderate"), combined_input)

    updated_location = payload.location or case.location
    updated_phone = payload.phone_number or case.phone_number
    nearby_clinics = _serialize_clinics(updated_location)
    # Track follow-up in dedicated timeline table
    follow_up_entry = format_follow_up_entry(
        symptoms=payload.additional_symptoms.strip(),
        severity=result["severity"],
        reasoning=result.get("reasoning", "Follow-up assessment")
    )

    case.raw_input = combined_input
    case.location = updated_location
    case.phone_number = updated_phone
    case.symptoms_detected = json.dumps(result.get("symptoms_detected", []))
    case.severity = result["severity"]
    case.recommendation = result["recommendation"]
    case.alert_triggered = result.get("alert_triggered", False)
    case.care_plan = json.dumps(result.get("care_plan", []))
    case.likely_diseases = json.dumps(result.get("likely_diseases", []))
    case.reasoning = result.get("reasoning", "")
    case.doctor_type = system_doctor_type

    hospital_name = case.hospital_name
    if result.get("alert_triggered"):
        hospital = find_nearest_hospital(updated_location)
        if hospital:
            hospital_name = hospital["name"]
            case.referred_to_hospital = True
            case.hospital_name = hospital_name

        try:
            trigger_critical_alert(
                db=db,
                case_id=case_id,
                symptoms=result.get("symptoms_detected", []),
                recommendation=result["recommendation"],
                patient_phone=updated_phone,
                patient_location=updated_location,
                severity=result.get("severity", "critical"),
            )
        except Exception as exc:
            db.rollback()
            print(f"Critical follow-up alert workflow failed for case {case_id}: {exc}")

    # Re-check diagnosis clustering on follow-up updates.
    try:
        likely = result.get("likely_diseases", [])
        primary_diagnosis = likely[0].get("name") if isinstance(likely, list) and likely and isinstance(likely[0], dict) else None
        notify_moh_epidemic_if_needed(db, primary_diagnosis, updated_location, threshold=3)
    except Exception:
        pass

    db.add(
        FollowUpHistory(
            case_id=str(case.id),
            symptoms_added=follow_up_entry.get("symptoms_added"),
            severity=follow_up_entry.get("severity", "moderate"),
            reasoning=follow_up_entry.get("reasoning", "Follow-up assessment"),
        )
    )

    db.commit()
    db.refresh(case)

    return TriageResponse(
        prognosis_id=case_id,
        custom_id=case.custom_id or "",
        doctor_type=case.doctor_type,
        severity=result["severity"],
        symptoms_detected=result.get("symptoms_detected", []),
        recommendation=result["recommendation"],
        care_plan=result.get("care_plan", []),
        likely_diseases=result.get("likely_diseases", []),
        alert_triggered=result.get("alert_triggered", False),
        referred_hospital=hospital_name,
        nearby_clinics=nearby_clinics,
    )


@router.post("/{prognosis_id}/validate-pin", response_model=PINValidationResponse)
async def validate_pin_endpoint(prognosis_id: str, payload: PINValidationRequest, db: Session = Depends(get_db)):
    """Validate PIN for accessing case details."""
    case = db.query(Case).filter(Case.id == prognosis_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Prognosis ID not found.")

    if not case.pin_hash:
        return PINValidationResponse(valid=True, message="No PIN set for this case.")

    is_valid = verify_pin(payload.pin, case.pin_hash)

    if is_valid:
        return PINValidationResponse(valid=True, message="PIN verified successfully.")
    return PINValidationResponse(valid=False, message="Invalid PIN.")