from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import Base, engine
from app.api.routes import triage, prognosis, voice
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Remotriage API",
    description="AI-powered symptom triage and health dispatch platform.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(triage.router)
app.include_router(voice.router)
app.include_router(prognosis.router)

@app.get("/")
def health_check():
    return {"status": "ok", "service": "Remotriage API"}