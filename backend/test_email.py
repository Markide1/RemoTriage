#!/usr/bin/env python3
"""Simple SMTP smoke test for Remotriage email transport."""

import sys
from app.services.email_service import send_email


def main() -> int:
    recipient = sys.argv[1] if len(sys.argv) > 1 else ""
    if not recipient:
        print("Usage: python test_email.py recipient@example.com")
        return 1

    ok = send_email(
        to_email=recipient,
        subject="Remotriage SMTP Test",
        body=(
            "This is a test email from Remotriage.\n"
            "If you received this, SMTP is configured correctly."
        ),
    )

    if ok:
        print("SMTP test send succeeded.")
        return 0

    print("SMTP test send failed.")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
