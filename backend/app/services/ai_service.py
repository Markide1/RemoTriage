import json
import asyncio
import logging
import google.generativeai as genai
from google.api_core.exceptions import NotFound
from app.core.config import settings

# Setup Gemini client
genai.configure(api_key=settings.GOOGLE_API_KEY)
logger = logging.getLogger(__name__)

# Try configured model first, then fall back to widely available options.
MODEL_CANDIDATES = [
    settings.GOOGLE_MODEL,
    "gemini-2.5-flash",
    "gemini-1.5-flash",
]

SYSTEM_PROMPT = """You are the Remotriage Clinical Engine. 
Your goal is to provide intelligent triage for the African healthcare context.

GROUNDING CLASSIFICATION:
- normal: Minor symptoms manageable at home (rest, hydration).
- moderate: Symptoms needing clinic attention within 24 hours (persistent pain, vomiting).
- critical: Life-threatening emergencies (chest pain, difficulty breathing, severe bleeding).

Return ONLY valid JSON:
{
  "severity": "normal|moderate|critical",
  "symptoms_detected": ["symptom1", "symptom2"],
  "recommendation": "Warm, plain-English advice.",
  "alert_triggered": true|false,
  "reasoning": "Clinical justification for this classification (Explainability).",
  "care_plan": ["Short action step 1", "Short action step 2"],
  "likely_diseases": [
    {"name": "Condition 1", "probability": 55},
    {"name": "Condition 2", "probability": 30},
    {"name": "Condition 3", "probability": 15}
  ]
}"""


def _normalize_probabilities(items: list[dict]) -> list[dict]:
    cleaned: list[dict] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        name = str(item.get("name", "")).strip()
        if not name:
            continue
        raw_prob = item.get("probability", 0)
        try:
            prob = float(raw_prob)
        except (TypeError, ValueError):
            prob = 0.0
        if 0 < prob <= 1:
            prob *= 100
        prob = max(0.0, min(100.0, prob))
        cleaned.append({"name": name, "probability": prob})

    if not cleaned:
        return []

    total = sum(item["probability"] for item in cleaned)
    if total <= 0:
        even = round(100 / len(cleaned), 2)
        return [{"name": item["name"], "probability": even} for item in cleaned]

    normalized = [
        {
            "name": item["name"],
            "probability": round((item["probability"] / total) * 100, 2),
        }
        for item in cleaned
    ]
    return sorted(normalized, key=lambda x: x["probability"], reverse=True)[:5]


def _fallback_response(reasoning: str) -> dict:
    return {
        "severity": "moderate",
        "symptoms_detected": ["general malaise"],
        "recommendation": "Please visit the nearest clinic for a physical assessment.",
        "alert_triggered": False,
        "reasoning": reasoning,
        "care_plan": [
            "Hydrate and rest.",
            "Monitor symptoms over the next 6-12 hours.",
            "Visit a nearby clinic if symptoms worsen or persist.",
        ],
        "likely_diseases": [
            {"name": "Undifferentiated illness", "probability": 100}
        ],
    }


def _normalize_triage_result(data: dict) -> dict:
    severity = str(data.get("severity", "moderate")).lower()
    if severity not in {"normal", "moderate", "critical"}:
        severity = "moderate"

    symptoms_detected = data.get("symptoms_detected", [])
    if not isinstance(symptoms_detected, list):
        symptoms_detected = [str(symptoms_detected)] if symptoms_detected else []
    symptoms_detected = [str(s).strip() for s in symptoms_detected if str(s).strip()][:8]

    recommendation = str(data.get("recommendation", "Please visit the nearest clinic for a physical assessment.")).strip()
    reasoning = str(data.get("reasoning", "Model produced a best-effort triage summary.")).strip()

    care_plan = data.get("care_plan", [])
    if not isinstance(care_plan, list):
        care_plan = [str(care_plan)] if care_plan else []
    care_plan = [str(step).strip() for step in care_plan if str(step).strip()][:6]
    if not care_plan:
        care_plan = [
            "Hydrate and rest.",
            "Monitor symptom progression.",
            "Seek in-person care if symptoms persist or worsen.",
        ]

    likely_diseases = _normalize_probabilities(data.get("likely_diseases", []))
    if not likely_diseases:
        likely_diseases = [{"name": "Undifferentiated illness", "probability": 100}]

    return {
        "severity": severity,
        "symptoms_detected": symptoms_detected,
        "recommendation": recommendation,
        "alert_triggered": bool(data.get("alert_triggered", severity == "critical")),
        "reasoning": reasoning,
        "care_plan": care_plan,
        "likely_diseases": likely_diseases,
    }

async def run_triage(symptoms_text: str) -> dict:
    """
    Implements Objective 2: AI-driven severity classification.
    Incorporates a safety-first override for immediate emergencies.
    """
    # Safety Override Layer: Immediate Critical triggers
    red_flags = ['chest pain', 'difficulty breathing', 'seizure', 'unconscious', 'severe bleeding']
    if any(flag in symptoms_text.lower() for flag in red_flags):
        return _normalize_triage_result({
            "severity": "critical",
            "symptoms_detected": ["emergency respiratory/cardiac symptoms"],
            "recommendation": "EMERGENCY: Remain rested. An ambulance is being dispatched.",
            "alert_triggered": True,
            "reasoning": "Automated override for high-mortality red-flag symptoms.",
            "care_plan": [
                "Call emergency services immediately.",
                "Keep patient still and monitor breathing.",
                "Prepare transfer to nearest emergency facility.",
            ],
            "likely_diseases": [
                {"name": "Acute cardiopulmonary emergency", "probability": 80},
                {"name": "Severe respiratory distress", "probability": 20},
            ],
        })

    # Clinical Analysis via Gemini
    prompt = f"{SYSTEM_PROMPT}\n\nPatient reports: {symptoms_text}"

    # De-duplicate while preserving order
    candidates = list(dict.fromkeys([m for m in MODEL_CANDIDATES if m]))

    response_text = None
    for model_name in candidates:
        try:
            model = genai.GenerativeModel(model_name)
            response = await asyncio.to_thread(model.generate_content, prompt)
            response_text = response.text
            break
        except NotFound:
            logger.warning("Gemini model not found/accessible: %s", model_name)
            continue
        except Exception as exc:
            logger.exception("Gemini request failed with model %s: %s", model_name, exc)
            break

    if not response_text:
        return _fallback_response("Fallback triggered because the AI service is temporarily unavailable.")

    try:
        return _normalize_triage_result(json.loads(response_text))
    except Exception:
        # Secure fallback if model returns non-JSON text
        return _fallback_response("Fallback triggered due to inconclusive analysis.")