#!/usr/bin/env python3
"""
Database schema sync script.

Creates new tables and adds missing columns for existing tables.
"""

import sys
from sqlalchemy import inspect, text
from app.core.database import Base, engine
from app.models.case import Case
from app.models.alert import CriticalAlert, AlertRecipient
from app.models.dispatch import Dispatch
from app.models.follow_up_history import FollowUpHistory


CASE_COLUMN_DEFS: dict[str, str] = {
    "custom_id": "VARCHAR",
    "pin_hash": "VARCHAR",
    "patient_full_name": "VARCHAR",
    "patient_initials": "VARCHAR",
    "date_of_birth": "VARCHAR",
    "gender": "VARCHAR",
    "email": "VARCHAR",
    "current_medications": "TEXT",
    "previous_illness": "TEXT",
    "family_illnesses": "TEXT",
    "doctor_type": "VARCHAR",
    "disease_description": "TEXT",
    "care_plan": "TEXT",
    "likely_diseases": "TEXT",
    "reasoning": "TEXT",
    "follow_up_history": "TEXT",
    "updated_at": "TIMESTAMP",
}


def ensure_case_columns() -> None:
    """Add missing columns to the cases table without dropping data."""
    inspector = inspect(engine)
    if "cases" not in inspector.get_table_names():
        return

    existing = {col["name"] for col in inspector.get_columns("cases")}
    missing = {name: col_type for name, col_type in CASE_COLUMN_DEFS.items() if name not in existing}
    if not missing:
        print("- cases table already has all expected columns")
        return

    print(f"- adding {len(missing)} missing columns to cases table")
    with engine.begin() as conn:
        for name, col_type in missing.items():
            conn.execute(text(f"ALTER TABLE cases ADD COLUMN {name} {col_type}"))
            if name == "updated_at":
                conn.execute(text("UPDATE cases SET updated_at = NOW() WHERE updated_at IS NULL"))

        # Ensure custom_id uniqueness for new ID flow.
        conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_cases_custom_id ON cases (custom_id)"))


def ensure_alert_recipient_columns() -> None:
    """Rename legacy SMS-era columns in alert_recipients to email-era names."""
    inspector = inspect(engine)
    if "alert_recipients" not in inspector.get_table_names():
        return

    existing = {col["name"] for col in inspector.get_columns("alert_recipients")}
    rename_map = {
        "recipient_phone": "recipient_email",
        "sms_status": "email_status",
        "sms_id": "email_id",
    }
    renames = [(old, new) for old, new in rename_map.items() if old in existing and new not in existing]

    if not renames:
        print("- alert_recipients table already uses email-era column names")
        return

    print(f"- renaming {len(renames)} alert_recipients columns to email-era names")
    with engine.begin() as conn:
        for old, new in renames:
            conn.execute(text(f"ALTER TABLE alert_recipients RENAME COLUMN {old} TO {new}"))

def create_tables():
    """Create tables and synchronize missing columns."""
    print("Synchronizing database schema...")
    try:
        Base.metadata.create_all(bind=engine)
        ensure_case_columns()
        ensure_alert_recipient_columns()
        print("✓ Database schema synchronized successfully")
        print("\nCore tables:")
        print("  - cases")
        print("  - critical_alerts")
        print("  - alert_recipients")
        print("  - dispatches")
        print("  - follow_up_history")
        return True
    except Exception as e:
        print(f"✗ Error synchronizing schema: {e}", file=sys.stderr)
        return False

if __name__ == "__main__":
    create_tables()
