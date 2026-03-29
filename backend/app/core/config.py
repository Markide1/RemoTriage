from pydantic_settings import BaseSettings
import re

try:
    import bcrypt
    BCRYPT_AVAILABLE = True
except ImportError:
    BCRYPT_AVAILABLE = False


class Settings(BaseSettings):
    DATABASE_URL: str
    GOOGLE_API_KEY: str
    GOOGLE_MODEL: str = "gemini-2.5-flash"
    GOOGLE_PLACES_API_KEY: str = ""
    SMTP_ENABLED: bool = False
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "Remotriage Alerts"
    SMTP_USE_TLS: bool = True
    SMTP_USE_SSL: bool = False
    SMTP_TIMEOUT_SECONDS: int = 20
    HOSPITAL_ALERT_EMAILS: str = ""
    MOH_ALERT_EMAILS: str = ""
    EMERGENCY_SERVICES_EMAILS: str = ""
    APP_ENV: str = "development"
    MOCK_AI: bool = False
    
    # Critical Alert Configuration
    ALERT_THRESHOLD_SEVERITY: str = "critical"  # Minimum severity to trigger alert ("moderate", "critical")

    class Config:
        env_file = ".env"
    
    @property
    def emergency_services_emails(self) -> list[str]:
        """Parse EMERGENCY_SERVICES_EMAILS into a list."""
        return [e.strip() for e in self.EMERGENCY_SERVICES_EMAILS.split(",") if e.strip()]

    @property
    def hospital_alert_emails(self) -> list[str]:
        """Parse HOSPITAL_ALERT_EMAILS into a list."""
        return [e.strip() for e in self.HOSPITAL_ALERT_EMAILS.split(",") if e.strip()]

    @property
    def moh_alert_emails(self) -> list[str]:
        """Parse MOH_ALERT_EMAILS into a list."""
        return [e.strip() for e in self.MOH_ALERT_EMAILS.split(",") if e.strip()]

settings = Settings()


# ============ Validation Utilities ============

def validate_email(email: str) -> bool:
    """Validate email format."""
    if not email or not isinstance(email, str):
        return False
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email.strip()))


def validate_phone(phone: str) -> bool:
    """Validate phone number format."""
    if not phone or not isinstance(phone, str):
        return False
    phone = phone.strip()
    digits_only = re.sub(r'\D', '', phone)
    if len(digits_only) < 9:
        return False
    return True


def validate_pin(pin: str) -> tuple[bool, str]:
    """Validate PIN strength (4-10 digits)."""
    if not pin:
        return False, "PIN cannot be empty."
    if not re.match(r'^\d{4,10}$', pin.strip()):
        return False, "PIN must be 4-10 digits."
    return True, "Valid PIN."


def hash_pin(pin: str) -> str:
    """Hash PIN using bcrypt. Falls back to plaintext if bcrypt unavailable."""
    if not BCRYPT_AVAILABLE:
        import hashlib
        return hashlib.sha256(pin.encode()).hexdigest()
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pin.encode(), salt).decode()


def verify_pin(pin: str, pin_hash: str) -> bool:
    """Verify PIN against hash."""
    if not BCRYPT_AVAILABLE:
        import hashlib
        return hashlib.sha256(pin.encode()).hexdigest() == pin_hash
    try:
        return bcrypt.checkpw(pin.encode(), pin_hash.encode())
    except Exception:
        return False