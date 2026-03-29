"""Utility functions for ID generation, formatting, and data processing."""
import uuid
from datetime import datetime


def extract_initials(full_name: str) -> str:
    """Extract initials from full name."""
    if not full_name or not isinstance(full_name, str):
        return ""
    parts = full_name.strip().split()
    return "".join(p[0].lower() for p in parts if p)[:2]


def generate_custom_id(patient_full_name: str | None = None) -> str:
    """
    Generate a custom ID format: initials-department-mmdd-token
    Example: jane-john-29031-a1b2c3d4
    """
    now = datetime.utcnow()
    month_day = now.strftime("%m%d")  # e.g. "0329"
    
    initials = extract_initials(patient_full_name or "")
    if not initials:
        initials = "xx"
    
    short_uuid = str(uuid.uuid4())[:8]  # First 8 chars of UUID
    
    custom_id = f"{initials}-presc-{month_day}-{short_uuid}".lower()
    return custom_id


def format_follow_up_entry(symptoms: str | None, severity: str, reasoning: str) -> dict:
    """Format a follow-up history entry."""
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "symptoms_added": symptoms,
        "severity": severity,
        "reasoning": reasoning,
    }
