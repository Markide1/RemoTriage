import json
import asyncio
import google.generativeai as genai
from app.core.config import settings

genai.configure(api_key=settings.GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')

# Development mode: use mock responses if MOCK_AI is set (useful when API quota is exhausted)
USE_MOCK_AI = settings.MOCK_AI

SYSTEM_PROMPT = """You are Remotriage, an AI medical triage assistant for patients in Kenya and Africa.
Your job is to assess reported symptoms and return a structured triage decision.

Severity levels:
- normal: Minor symptoms manageable at home (cold, mild headache, minor rash)
- moderate: Symptoms needing clinic attention within 24 hours (high fever, persistent pain, vomiting)
- critical: Life-threatening symptoms needing immediate emergency care (chest pain, difficulty breathing, seizures, unconsciousness, severe bleeding)

Always respond ONLY with valid JSON in this exact format:
{
  "severity": "normal|moderate|critical",
  "symptoms_detected": ["symptom1", "symptom2"],
  "recommendation": "Clear, plain-English advice for the patient.",
  "alert_triggered": true|false
}

Rules:
- alert_triggered is true only for critical severity
- recommendation must be warm, clear, and actionable — not clinical jargon
- If input is unclear or not health-related, return severity: normal with a recommendation to describe symptoms better
- Never diagnose a specific disease. Triage only."""

def _run_triage_sync(symptoms_text: str) -> dict:
    """Synchronous wrapper for Gemini API call."""
    if USE_MOCK_AI:
        # Mock response for development when API quota is exhausted
        symptoms_lower = symptoms_text.lower()
        
        # Simple heuristic-based mock responses
        critical_keywords = ['chest pain', 'difficulty breathing', 'seizure', 'unconscious', 'severe bleeding', 'stroke', 'heart attack']
        moderate_keywords = ['high fever', 'persistent pain', 'vomiting', 'severe headache', 'difficulty swallowing']
        
        severity = 'normal'
        if any(keyword in symptoms_lower for keyword in critical_keywords):
            severity = 'critical'
        elif any(keyword in symptoms_lower for keyword in moderate_keywords):
            severity = 'moderate'
        
        return {
            "severity": severity,
            "symptoms_detected": [s.strip() for s in symptoms_text.split(',')][:3],
            "recommendation": "Please seek appropriate medical attention." if severity != 'normal' else "Monitor your symptoms and rest. Seek care if they worsen.",
            "alert_triggered": severity == 'critical'
        }
    
    prompt = f"{SYSTEM_PROMPT}\n\nPatient reports: {symptoms_text}"
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=0.2,
        )
    )
    return json.loads(response.text)

async def run_triage(symptoms_text: str) -> dict:
    """Async wrapper that runs Gemini API in thread pool."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _run_triage_sync, symptoms_text)