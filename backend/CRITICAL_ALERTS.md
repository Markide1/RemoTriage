# Critical Alerts & Dispatch System

## Overview

The critical alerts system automatically sends email notifications to nearby hospitals and the Ministry of Health when a critical case is detected. It also creates dispatch orders that hospitals can update as they respond.

## Architecture

### 1. Data Models

#### CriticalAlert
- Tracks individual critical patient alerts
- Stores symptoms, recommendations, and patient location
- Maintains alert status (pending → sent → acknowledged)

#### AlertRecipient
- Tracks email delivery status for each recipient (hospital, MoH, emergency services)
- Records delivery IDs for traceability
- Timestamps for when emails were sent

#### Dispatch
- Creates a dispatch order for each hospital to respond
- Tracks vehicle information (ambulance unit, driver details)
- Monitors dispatch status: created → dispatched → enroute → arrived → completed
- Stores estimated arrival times and location information

### 2. Services

#### `critical_alert_service.py`
Main service orchestrating critical alerts:

- **`trigger_critical_alert()`** - Main entry point
  - Creates alert record
  - Identifies nearby hospitals
  - Sends email alerts to hospitals, MoH, emergency services
  - Creates dispatch orders
  
- **`create_dispatch_orders()`** - Creates dispatch queue for hospitals

- **`update_dispatch_status()`** - Updates dispatch progress

- **`get_active_alerts()`** - Retrieves recent unacknowledged alerts

#### `email_service.py`
- **`send_email()`** - Simulated email transport
- **`send_hospital_emergency_email()`** - Sends nearest-hospital emergency alert
- **`notify_moh_epidemic_if_needed()`** - Sends threshold-based possible epidemic alerts

#### `hospital_service.py` (Enhanced)
- **`get_nearby_hospitals()`** - Returns list of nearby hospitals sorted by distance
- Hospital registry with distance information

### 3. API Endpoints

#### Alert Management

**`GET /alerts/active`** - Get recent critical alerts
```json
{
  "limit": 50
}
```

**`GET /alerts/{alert_id}`** - Get full alert details
```json
{
  "alert": {...},
  "recipients": [...],
  "dispatches": [...],
  "summary": {
    "total_recipients": 5,
    "emails_sent": 4,
    "emails_failed": 1,
    "total_dispatches": 3
  }
}
```

**`POST /alerts/{alert_id}/acknowledge`** - Mark alert acknowledged
```json
{
  "alert_id": "...",
  "status": "acknowledged"
}
```

#### Dispatch Management

**`GET /alerts/dispatch/{dispatch_id}`** - Get dispatch details

**`PUT /alerts/dispatch/{dispatch_id}/status`** - Update dispatch status
```json
{
  "status": "dispatched",
  "ambulance_unit": "AMB-001",
  "driver_name": "John Doe",
  "driver_phone": "+254...",
  "estimated_arrival_time": 15,
  "notes": "En route to patient location"
}
```

**`GET /alerts/hospital/{hospital_phone}/pending`** - Get pending orders for a hospital

### 4. Configuration

Add to `.env`:
```env
# Hospital emergency inboxes (comma-separated)
HOSPITAL_ALERT_EMAILS=er-hospital@example.com,backup-hospital@example.com

# Ministry of Health inboxes (comma-separated)
MOH_ALERT_EMAILS=moh-alerts@example.com

# Emergency services inboxes (comma-separated)
EMERGENCY_SERVICES_EMAILS=emergency-ops@example.com

# Alert threshold (critical or moderate)
ALERT_THRESHOLD_SEVERITY=critical
```

## Flow Diagram

```
Patient Triage
    ↓
AI Analysis
    ↓
Severity = Critical?
    ├─ YES → trigger_critical_alert()
    │         ├─ Create CriticalAlert record
    │         ├─ Find nearby hospitals
    │         ├─ Get MoH email recipients
    │         ├─ Get emergency services email recipients
    │         ├─ Send email alerts
    │         ├─ Record email delivery status
    │         └─ Create Dispatch orders
    │
    └─ NO → Simple hospital alert
```

## Integration with Triage

The triage endpoint automatically triggers critical alerts:

```python
POST /triage/
{
  "symptoms": "Severe chest pain, difficulty breathing",
  "phone_number": "+254...",
  "location": "Nairobi"
}

Response:
{
  "prognosis_id": "case-123",
  "severity": "critical",
  "alert_triggered": true,
  "alert_id": "alert-456",  # New field - links to critical alert
  "referred_hospital": "Kenyatta National Hospital"
}
```

## Email Message Formats

### To Hospitals
```
🚨 CRITICAL PATIENT REFERRAL
Case ID: CASE123
Symptoms: Severe chest pain, difficulty breathing
Location: Nairobi
Recommended Action: Immediate hospitalization recommended
Full record: remotriage.app/case/case-id
```

### To Ministry of Health
```
🚨 CRITICAL CASE ALERT - Ministry of Health
Case ID: CASE123
Symptoms: Severe chest pain, difficulty breathing
Location: Nairobi
Action: Immediate hospitalization recommended
Full details: remotriage.app/case/case-id
```

### To Emergency Services
```
🚨 EMERGENCY DISPATCH ALERT
Case ID: CASE123
Symptoms: Severe chest pain, difficulty breathing
Location: Nairobi
Required Action: Immediate hospitalization recommended
Details: remotriage.app/case/case-id
```

## Database Setup

1. Update `.env` with your recipient email lists
2. Run migration:
   ```bash
   python create_tables.py
   ```

## Hospital Staff Workflow

1. Hospital receives email alert
2. Staff access platform /alerts/dispatch/{dispatch_id}
3. Update dispatch status as they respond:
   - **created** → Initial dispatch order received
   - **dispatched** → Ambulance sent to patient
   - **enroute** → In transit to patient location
   - **arrived** → Reached patient location
   - **completed** → Patient transported/case completed

4. POST `/alerts/hospital/{phone}/pending` to get all pending dispatches

## Ministry of Health Workflow

1. MoH receives email alert about critical case
2. Can acknowledge alert via API
3. Monitors summary of all active critical alerts
4. Tracks regional dispatch response times

## Testing

Use mock email mode:
```env
MOCK_AI=true
```

Email payloads are printed to console in simulation mode.

## Future Enhancements

1. Real-time dispatch tracking on map
2. Two-way acknowledgment workflow from hospitals
3. Automated escalation if no response within time threshold
4. Historical analytics on response times
5. Integration with external emergency dispatch systems
6. Patient UID tracking across multiple alerts
7. Insurance and billing integration

## Error Handling

- Email failures are logged but don't block alert creation
- Dispatch orders are created even if email delivery fails
- Failed email deliveries can be retried manually
- All transactions are atomic at alert level
