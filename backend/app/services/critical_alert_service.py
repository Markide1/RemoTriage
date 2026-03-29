"""
Critical Alert Service - Handles sending alerts to hospitals, MoH, and creating dispatch orders
"""
import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.alert import CriticalAlert, AlertRecipient, AlertType, AlertStatus
from app.models.dispatch import Dispatch, DispatchStatus
from app.services.email_service import send_email
from app.services.hospital_service import find_nearest_hospital, get_nearby_hospitals


def trigger_critical_alert(
    db: Session,
    case_id: str,
    symptoms: list[str],
    recommendation: str,
    patient_phone: str | None = None,
    patient_location: str | None = None,
    severity: str = "critical"
) -> CriticalAlert:
    """
    Trigger a critical alert that sends email alerts to:
    1. Nearby hospitals
    2. Ministry of Health
    3. Emergency services stakeholders (if configured)
    
    Then creates dispatch orders for hospitals
    """
    
    # Create critical alert record
    alert = CriticalAlert(
        case_id=case_id,
        alert_type=AlertType.critical if severity == "critical" else AlertType.moderate,
        status=AlertStatus.pending,
        symptoms=json.dumps(symptoms),
        recommendation=recommendation,
        patient_phone=patient_phone,
        patient_location=patient_location,
    )
    db.add(alert)
    db.flush()  # Get alert.id without committing
    
    # Build recipient list
    recipients = []
    alert_recipients_data = []
    
    # 1. Add nearby hospitals
    nearby_hospitals = get_nearby_hospitals(patient_location)
    default_hospital_emails = settings.hospital_alert_emails
    for hospital in nearby_hospitals:
        recipient_email = hospital.get("email") or (default_hospital_emails[0] if default_hospital_emails else "")
        recipients.append({
            "email": recipient_email,
            "name": hospital["name"],
            "type": "hospital"
        })
        alert_recipients_data.append({
            "alert_id": alert.id,
            "recipient_type": "hospital",
            "recipient_name": hospital["name"],
            "recipient_email": recipient_email,
        })
    
    # 2. Add Ministry of Health
    for moh_email in settings.moh_alert_emails:
        recipients.append({
            "email": moh_email,
            "name": "Ministry of Health",
            "type": "moh"
        })
        alert_recipients_data.append({
            "alert_id": alert.id,
            "recipient_type": "moh",
            "recipient_name": "Ministry of Health",
            "recipient_email": moh_email,
        })
    
    # 3. Add Emergency Services (if configured)
    for emergency_email in settings.emergency_services_emails:
        recipients.append({
            "email": emergency_email,
            "name": "Emergency Services",
            "type": "emergency"
        })
        alert_recipients_data.append({
            "alert_id": alert.id,
            "recipient_type": "emergency",
            "recipient_name": "Emergency Services",
            "recipient_email": emergency_email,
        })
    
    # Send bulk email alerts (simulated)
    if recipients:
        for i, recipient in enumerate(recipients):
            subject = f"CRITICAL ALERT - {recipient['name']} - Case {case_id[:8].upper()}"
            body = (
                f"Case ID: {case_id}\n"
                f"Recipient: {recipient['name']}\n"
                f"Symptoms: {', '.join(symptoms) if symptoms else 'N/A'}\n"
                f"Location: {patient_location or 'Not specified'}\n"
                f"Patient contact: {patient_phone or 'Not specified'}\n"
                f"Recommendation: {recommendation}"
            )
            success = send_email(recipient["email"], subject, body)
            alert_recipients_data[i]["email_status"] = "sent" if success else "failed"
            alert_recipients_data[i]["email_id"] = f"email-{case_id[:8]}" if success else None
            if success:
                alert_recipients_data[i]["sent_at"] = datetime.utcnow()
    
    # Create AlertRecipient records
    for recipient_data in alert_recipients_data:
        alert_recipient = AlertRecipient(**recipient_data)
        db.add(alert_recipient)
    
    # Update alert status
    if any(r.get("email_status") == "sent" for r in alert_recipients_data):
        alert.status = AlertStatus.sent
        alert.sent_at = datetime.utcnow()
    
    db.add(alert)
    db.flush()
    
    # Create dispatch orders for hospitals
    create_dispatch_orders(db, alert.id, case_id, nearby_hospitals, symptoms, recommendation, patient_location, patient_phone)
    
    db.commit()
    return alert


def create_dispatch_orders(
    db: Session,
    alert_id: str,
    case_id: str,
    hospitals: list[dict],
    symptoms: list[str],
    recommendation: str,
    patient_location: str | None = None,
    patient_phone: str | None = None,
) -> list[Dispatch]:
    """Create dispatch orders for nearby hospitals"""
    
    dispatches = []
    
    for hospital in hospitals[:3]:  # Limit to top 3 nearest hospitals
        dispatch = Dispatch(
            alert_id=alert_id,
            case_id=case_id,
            hospital_name=hospital["name"],
            hospital_phone=hospital["phone"],
            hospital_id=hospital.get("id"),
            patient_phone=patient_phone,
            patient_location=patient_location,
            status=DispatchStatus.created,
            notes=f"Critical case alert. Symptoms: {', '.join(symptoms)}. {recommendation}"
        )
        db.add(dispatch)
        dispatches.append(dispatch)
    
    return dispatches


def acknowledge_alert(db: Session, alert_id: str) -> CriticalAlert:
    """Mark alert as acknowledged when hospital/MoH responds"""
    alert = db.query(CriticalAlert).filter(CriticalAlert.id == alert_id).first()
    if alert:
        alert.status = AlertStatus.acknowledged
        db.commit()
    return alert


def update_dispatch_status(
    db: Session,
    dispatch_id: str,
    status: DispatchStatus,
    metadata: dict | None = None
) -> Dispatch:
    """Update dispatch status (created -> dispatched -> enroute -> arrived -> completed)"""
    dispatch = db.query(Dispatch).filter(Dispatch.id == dispatch_id).first()
    
    if dispatch:
        dispatch.status = status
        
        # Update timestamp based on status
        if status == DispatchStatus.dispatched:
            dispatch.dispatched_at = datetime.utcnow()
        elif status == DispatchStatus.arrived:
            dispatch.arrived_at = datetime.utcnow()
        elif status == DispatchStatus.completed:
            dispatch.completed_at = datetime.utcnow()
        
        # Update additional metadata
        if metadata:
            if "ambulance_unit" in metadata:
                dispatch.ambulance_unit = metadata["ambulance_unit"]
            if "driver_name" in metadata:
                dispatch.driver_name = metadata["driver_name"]
            if "driver_phone" in metadata:
                dispatch.driver_phone = metadata["driver_phone"]
            if "estimated_arrival_time" in metadata:
                dispatch.estimated_arrival_time = metadata["estimated_arrival_time"]
            if "notes" in metadata:
                dispatch.notes = metadata["notes"]
        
        db.commit()
    
    return dispatch


def get_active_alerts(db: Session, limit: int = 50) -> list[CriticalAlert]:
    """Get recent critical alerts that haven't been completed"""
    from sqlalchemy import and_
    alerts = (
        db.query(CriticalAlert)
        .filter(
            and_(
                CriticalAlert.status != AlertStatus.acknowledged,
            )
        )
        .order_by(CriticalAlert.created_at.desc())
        .limit(limit)
        .all()
    )
    return alerts


def get_alert_details(db: Session, alert_id: str) -> dict:
    """Get full alert details including recipients and dispatch status"""
    alert = db.query(CriticalAlert).filter(CriticalAlert.id == alert_id).first()
    
    if not alert:
        return None
    
    recipients = db.query(AlertRecipient).filter(AlertRecipient.alert_id == alert_id).all()
    dispatches = db.query(Dispatch).filter(Dispatch.alert_id == alert_id).all()
    
    return {
        "alert": alert,
        "recipients": recipients,
        "dispatches": dispatches,
        "summary": {
            "total_recipients": len(recipients),
            "emails_sent": sum(1 for r in recipients if r.email_status == "sent"),
            "emails_failed": sum(1 for r in recipients if r.email_status == "failed"),
            "total_dispatches": len(dispatches),
            "dispatches_status": {
                "created": sum(1 for d in dispatches if d.status == DispatchStatus.created),
                "dispatched": sum(1 for d in dispatches if d.status == DispatchStatus.dispatched),
                "enroute": sum(1 for d in dispatches if d.status == DispatchStatus.enroute),
                "arrived": sum(1 for d in dispatches if d.status == DispatchStatus.arrived),
            }
        }
    }
