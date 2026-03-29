import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.alert import CriticalAlert, AlertRecipient
from app.models.dispatch import Dispatch, DispatchStatus
from app.services.critical_alert_service import (
    get_active_alerts,
    get_alert_details,
    update_dispatch_status,
    acknowledge_alert,
)

router = APIRouter(prefix="/alerts", tags=["critical-alerts"])

# ============ Pydantic Models ============

class AlertRecipientResponse(BaseModel):
    id: str
    recipient_type: str
    recipient_name: str
    recipient_email: str
    email_status: str
    sent_at: str | None = None
    
    class Config:
        from_attributes = True

class DispatchResponse(BaseModel):
    id: str
    hospital_name: str
    hospital_phone: str
    status: str
    estimated_arrival_time: int | None = None
    ambulance_unit: str | None = None
    driver_name: str | None = None
    driver_phone: str | None = None
    created_at: str
    dispatched_at: str | None = None
    arrived_at: str | None = None
    
    class Config:
        from_attributes = True

class CriticalAlertResponse(BaseModel):
    id: str
    case_id: str
    alert_type: str
    status: str
    symptoms: list[str]
    recommendation: str
    patient_location: str | None = None
    created_at: str
    sent_at: str | None = None
    
    class Config:
        from_attributes = True

class AlertDetailsResponse(BaseModel):
    alert: CriticalAlertResponse
    recipients: list[AlertRecipientResponse]
    dispatches: list[DispatchResponse]
    summary: dict

class UpdateDispatchStatusRequest(BaseModel):
    status: str
    ambulance_unit: str | None = None
    driver_name: str | None = None
    driver_phone: str | None = None
    estimated_arrival_time: int | None = None
    notes: str | None = None

# ============ API Endpoints ============

@router.get("/active", response_model=list[CriticalAlertResponse])
async def get_active_critical_alerts(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get recent critical alerts"""
    alerts = get_active_alerts(db, limit)
    return [
        {
            "id": alert.id,
            "case_id": alert.case_id,
            "alert_type": alert.alert_type.value,
            "status": alert.status.value,
            "symptoms": json.loads(alert.symptoms),
            "recommendation": alert.recommendation,
            "patient_location": alert.patient_location,
            "created_at": alert.created_at.isoformat(),
            "sent_at": alert.sent_at.isoformat() if alert.sent_at else None,
        }
        for alert in alerts
    ]

@router.get("/{alert_id}", response_model=AlertDetailsResponse)
async def get_alert_details_endpoint(
    alert_id: str,
    db: Session = Depends(get_db)
):
    """Get full alert details with recipients and dispatch status"""
    details = get_alert_details(db, alert_id)
    
    if not details:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert = details["alert"]
    recipients = details["recipients"]
    dispatches = details["dispatches"]
    summary = details["summary"]
    
    return {
        "alert": {
            "id": alert.id,
            "case_id": alert.case_id,
            "alert_type": alert.alert_type.value,
            "status": alert.status.value,
            "symptoms": json.loads(alert.symptoms),
            "recommendation": alert.recommendation,
            "patient_location": alert.patient_location,
            "created_at": alert.created_at.isoformat(),
            "sent_at": alert.sent_at.isoformat() if alert.sent_at else None,
        },
        "recipients": [
            {
                "id": r.id,
                "recipient_type": r.recipient_type,
                "recipient_name": r.recipient_name,
                "recipient_email": r.recipient_email,
                "email_status": r.email_status,
                "sent_at": r.sent_at.isoformat() if r.sent_at else None,
            }
            for r in recipients
        ],
        "dispatches": [
            {
                "id": d.id,
                "hospital_name": d.hospital_name,
                "hospital_phone": d.hospital_phone,
                "status": d.status.value,
                "estimated_arrival_time": d.estimated_arrival_time,
                "ambulance_unit": d.ambulance_unit,
                "driver_name": d.driver_name,
                "driver_phone": d.driver_phone,
                "created_at": d.created_at.isoformat(),
                "dispatched_at": d.dispatched_at.isoformat() if d.dispatched_at else None,
                "arrived_at": d.arrived_at.isoformat() if d.arrived_at else None,
            }
            for d in dispatches
        ],
        "summary": summary,
    }

@router.post("/{alert_id}/acknowledge")
async def acknowledge_critical_alert(
    alert_id: str,
    db: Session = Depends(get_db)
):
    """Mark alert as acknowledged (hospital/MoH confirmed receipt)"""
    alert = acknowledge_alert(db, alert_id)
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return {
        "alert_id": alert.id,
        "status": alert.status.value,
        "message": "Alert acknowledged"
    }

@router.put("/dispatch/{dispatch_id}/status")
async def update_dispatch_status_endpoint(
    dispatch_id: str,
    payload: UpdateDispatchStatusRequest,
    db: Session = Depends(get_db)
):
    """Update dispatch status (created, dispatched, enroute, arrived, completed)"""
    
    # Validate status
    valid_statuses = [e.value for e in DispatchStatus]
    if payload.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    metadata = {
        "ambulance_unit": payload.ambulance_unit,
        "driver_name": payload.driver_name,
        "driver_phone": payload.driver_phone,
        "estimated_arrival_time": payload.estimated_arrival_time,
        "notes": payload.notes,
    }
    # Remove None values
    metadata = {k: v for k, v in metadata.items() if v is not None}
    
    dispatch = update_dispatch_status(
        db,
        dispatch_id,
        DispatchStatus[payload.status],
        metadata
    )
    
    if not dispatch:
        raise HTTPException(status_code=404, detail="Dispatch not found")
    
    return {
        "dispatch_id": dispatch.id,
        "status": dispatch.status.value,
        "hospital_name": dispatch.hospital_name,
        "updated_at": dispatch.dispatched_at.isoformat() if dispatch.dispatched_at else "updated",
    }

@router.get("/hospital/{hospital_phone}/pending")
async def get_hospital_pending_dispatches(
    hospital_phone: str,
    db: Session = Depends(get_db)
):
    """Get pending dispatch orders for a hospital (for hospital staff)"""
    dispatches = (
        db.query(Dispatch)
        .filter(
            Dispatch.hospital_phone == hospital_phone,
            Dispatch.status.in_([DispatchStatus.created, DispatchStatus.dispatched, DispatchStatus.enroute])
        )
        .order_by(Dispatch.created_at.desc())
        .all()
    )
    
    return [
        {
            "id": d.id,
            "case_id": d.case_id,
            "patient_location": d.patient_location,
            "patient_phone": d.patient_phone,
            "status": d.status.value,
            "ambulance_unit": d.ambulance_unit,
            "estimated_arrival_time": d.estimated_arrival_time,
            "notes": d.notes,
            "created_at": d.created_at.isoformat(),
        }
        for d in dispatches
    ]

@router.get("/dispatch/{dispatch_id}")
async def get_dispatch_details(
    dispatch_id: str,
    db: Session = Depends(get_db)
):
    """Get detailed dispatch information"""
    dispatch = db.query(Dispatch).filter(Dispatch.id == dispatch_id).first()
    
    if not dispatch:
        raise HTTPException(status_code=404, detail="Dispatch not found")
    
    return {
        "id": dispatch.id,
        "case_id": dispatch.case_id,
        "hospital_name": dispatch.hospital_name,
        "hospital_phone": dispatch.hospital_phone,
        "status": dispatch.status.value,
        "patient_phone": dispatch.patient_phone,
        "patient_location": dispatch.patient_location,
        "ambulance_unit": dispatch.ambulance_unit,
        "driver_name": dispatch.driver_name,
        "driver_phone": dispatch.driver_phone,
        "estimated_arrival_time": dispatch.estimated_arrival_time,
        "notes": dispatch.notes,
        "created_at": dispatch.created_at.isoformat(),
        "dispatched_at": dispatch.dispatched_at.isoformat() if dispatch.dispatched_at else None,
        "arrived_at": dispatch.arrived_at.isoformat() if dispatch.arrived_at else None,
        "completed_at": dispatch.completed_at.isoformat() if dispatch.completed_at else None,
    }
