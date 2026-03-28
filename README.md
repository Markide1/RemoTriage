# Remotriage 🏥

**Remotriage: AI-Powered Medical Triage at Your Fingertips**

Remotriage is an intelligent healthcare platform that brings medical triage from hospitals directly to patients' first point of contact. Like Google Assistant for diseases, it analyzes voice and text symptoms to provide immediate recommendations and alert emergency services when critical.

## Vision

Transform healthcare access in Kenya and Africa by:
- Reducing hospital overcrowding through intelligent pre-screening
- Enabling symptom assessment via voice calls and web interface
- Providing multilingual support (English, Kiswahili, Kikuyu)
- Tracking disease outbreaks through aggregated symptom data
- Connecting patients to appropriate care levels instantly

---

## 🎯 How It Works

```
┌─────────────────┐
│  Voice/Text     │  Patient calls or types symptoms
│  Input          │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────┐
│  AI Symptom Analysis        │  Google Gemini 2.0 Flash analyzes
│  (Google Gemini API)        │  symptoms and determines severity
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│  Triage Decision            │
├─────────────────────────────┤
│ ✅ ADVICE (Normal)          │  Self-care at home
│ 🏥 CLINIC VISIT (Moderate)  │  Visit clinic within 24h
│ 🚨 EMERGENCY (Critical)     │  Emergency alert + hospital
└────────┬────────────────────┘
         │
         ↓
┌─────────────────┐
│  Data Storage   │  Cases stored for outbreak
│  & Alerts       │  tracking & analysis
└─────────────────┘
```

---

## ⚙️ Architecture

### **Backend (FastAPI + PostgreSQL)**
- RESTful API for symptom triage
- Voice call handling via Africa's Talking integration
- SMS alerts and clinical recommendations
- Hospital lookup and emergency alert system
- AI-powered severity assessment via Google Gemini API
- Multi-language support (Google Cloud Translate)

### **Frontend (React + TypeScript)**
- Responsive web interface for symptom input
- Real-time triage assessment display
- Contact/referral pages
- Integration with backend API

### **Data Flow**
1. **Voice Input** → Africa's Talking records call → Speech-to-text transcription
2. **Text Input** → Web form submission → Direct to AI analysis
3. **AI Analysis** → OpenAI GPT → Severity determination
4. **Response** → SMS/Web display → Patient actionable advice
5. **Storage** → PostgreSQL → Aggregated for outbreak tracking

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** (Backend)
- **Node.js 16+** (Frontend)
- **PostgreSQL 12+** (Database)
- **API Keys**:
  - Google Gemini API key (via Google AI Studio or Google Cloud)
  - Africa's Talking API credentials
  - Google Cloud Translation credentials (optional, for multilingual support)

### Installation

#### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with required credentials
cat > .env << EOF
DATABASE_URL=postgresql://user:password@localhost/remotriage
GOOGLE_API_KEY=your_google_gemini_api_key_here
AT_API_KEY=your_africas_talking_api_key
AT_USERNAME=your_africas_talking_username
AT_SENDER_ID=REMOTRIAGE
APP_ENV=development
EOF

# Initialize database (if needed)
# psql -U postgres -c "CREATE DATABASE remotriage;"
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file (if needed for API configuration)
cat > .env << EOF
VITE_API_URL=http://localhost:8000
EOF
```

---

## 🏃 Running the Application

### Start Backend Server

```bash
cd backend

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Run FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
- **Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Start Frontend Dev Server

```bash
cd frontend

# Run development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

---

## 📋 API Endpoints

### Triage Endpoints

#### **POST `/triage/assess`** — Text-based symptom assessment
```json
Request:
{
  "symptoms": "I have a high fever and severe headache",
  "age": 35,
  "location": "Nairobi"
}

Response:
{
  "severity": "moderate",
  "symptoms_detected": ["fever", "headache"],
  "recommendation": "Please visit a clinic within the next 24 hours for proper evaluation.",
  "alert_triggered": false
}
```

#### **POST `/voice/webhook`** — Voice call callback (Africa's Talking)
- Receives transcribed speech from call
- Returns triage assessment
- Triggers SMS alerts if critical

#### **GET `/prognosis/lookup`** — Look up case history
```json
Response:
{
  "phone_number": "+254712345678",
  "cases": [
    {
      "id": "uuid",
      "symptoms": ["fever", "cough"],
      "severity": "moderate",
      "recommendation": "Visit clinic",
      "timestamp": "2024-03-28T10:30:00"
    }
  ]
}
```

#### **POST `/prognosis/track-outbreak`** — Record symptom data
```json
Request:
{
  "symptom": "fever",
  "location": "Nairobi",
  "severity": "moderate"
}

Response:
{
  "status": "recorded",
  "data_id": "uuid"
}
```

#### **GET `/` — Health check**
```json
Response:
{
  "status": "ok",
  "service": "Remotriage API"
}
```

---

## 🔧 Configuration

### Environment Variables (`.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost/remotriage` |
| `GOOGLE_API_KEY` | Google Gemini API key | `AIzaSy...` |
| `AT_API_KEY` | Africa's Talking API key | `xxx...` |
| `AT_USERNAME` | Africa's Talking username | `your_username` |
| `AT_SENDER_ID` | SMS sender ID | `REMOTRIAGE` |
| `APP_ENV` | Environment | `development` or `production` |

### Database Schema

Key tables:
- **cases**: Stores triage assessments and patient records
- **outbreak_tracking**: Aggregated symptom data for epidemiology

---

## 📦 Project Structure

```
remotriage/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── triage.py       # Symptom assessment API
│   │   │   │   ├── voice.py        # Voice callback handler
│   │   │   │   ├── prognosis.py    # Case lookup & tracking
│   │   │   │   └── referral.py     # Hospital referral
│   │   │   └── __init__.py
│   │   ├── core/
│   │   │   ├── config.py           # Settings & env vars
│   │   │   ├── database.py         # SQLAlchemy setup
│   │   │   └── __init__.py
│   │   ├── models/
│   │   │   ├── case.py             # Database models
│   │   │   └── __init__.py
│   │   ├── services/
│   │   │   ├── ai_service.py       # OpenAI integration
│   │   │   ├── sms_service.py      # SMS via Africa's Talking
│   │   │   ├── hospital_service.py # Hospital lookup
│   │   │   └── __init__.py
│   │   └── __init__.py
│   ├── main.py                     # FastAPI app entry
│   ├── requirements.txt            # Python dependencies
│   └── venv/                       # Virtual environment
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SymptomForm.tsx     # Symptom input form
│   │   │   ├── PrognosisCard.tsx   # Results display
│   │   │   ├── SeverityBadge.tsx   # Severity indicator
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── pages/
│   │   │   ├── HomePage.tsx        # Home & assessment
│   │   │   ├── AssessmentPage.tsx  # Results page
│   │   │   ├── LookupPage.tsx      # Case history
│   │   │   └── ContactPage.tsx     # Contact info
│   │   ├── hooks/
│   │   │   └── useReveal.ts        # Animation hook
│   │   ├── api/
│   │   │   └── index.ts            # API client
│   │   ├── types/
│   │   │   └── index.ts            # TypeScript types
│   │   ├── styles/
│   │   │   └── tokens.css          # Design tokens
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── index.html
│
└── README.md
```

---

## 🔐 Security & Privacy

- **HIPAA Compliance**: Patient data is encrypted in transit and at rest
- **API Authentication**: Implement JWT tokens for production
- **Rate Limiting**: Prevent abuse via Africa's Talking and OpenAI integrations
- **Data Retention**: Aggregate outbreak data; purge individual case data after 90 days
- **GDPR Ready**: Support data deletion and access requests

---

## 🌐 Multilingual Support

The system supports:
- **English** (Default)
- **Kiswahili** (via Google Translate)
- **Kikuyu** (via Google Translate)

To enable translations:
1. Set up Google Cloud Translation API credentials
2. Pass `language` parameter in requests: `?language=sw` (Kiswahili) or `?language=ki` (Kikuyu)

---

## 📊 AI Model Details

### Symptom Analysis (Google Gemini 2.0 Flash)

The system uses Google's Gemini 2.0 Flash model to:
- Parse natural language symptom descriptions
- Identify key medical symptoms from casual language
- Assess severity based on symptom combination and urgency signals
- Generate clear, non-technical recommendations

**Severity Classification:**
- **Normal**: Self-manageable at home (cold, minor rash, mild headache)
- **Moderate**: Clinic visit needed within 24 hours (high fever, persistent pain, vomiting)
- **Critical**: Emergency care needed immediately (chest pain, difficulty breathing, seizures, severe bleeding)

---

## 🧪 Testing & Development

### Run Backend Tests
```bash
cd backend
pytest tests/
```

### Run Frontend Tests
```bash
cd frontend
npm run test
```

### Build Frontend for Production
```bash
cd frontend
npm run build
```

---

## 🚀 Deployment

### Backend Deployment (Docker)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Deployment
```bash
npm run build
# Deploy dist/ folder to Netlify, Vercel, or static hosting
```

---

## 🛠️ Troubleshooting

### Backend won't start
- Verify PostgreSQL is running: `psql -U postgres -c "SELECT 1"`
- Check `.env` file has all required variables
- Install dependencies: `pip install -r requirements.txt`

### Voice webhook not working
- Verify Africa's Talking API key and username
- Configure webhook URL in AT dashboard to: `https://yourapp.com/voice/webhook`
- Test with curl: `curl -X POST http://localhost:8000/voice/webhook`

### Frontend API errors
- Check backend is running on correct port (default: 8000)
- Verify `VITE_API_URL` in frontend `.env`
- Check browser console for CORS errors

---

## 📝 Contributing

We welcome contributions! To get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Areas for Contribution
- [ ] Add more language support
- [ ] Improve AI triage logic
- [ ] Add patient history dashboard
- [ ] Integrate hospital management systems
- [ ] Create mobile app (React Native)
- [ ] Add predictive analytics for outbreak detection

---

## 📄 License

This project is licensed under MIT - see LICENSE file for details.

---

## 🤝 Support & Contact

- **Issues**: Open a GitHub issue for bugs or features
- **Email**: support@remotriage.app
- **Documentation**: Full API docs available at `/docs` when backend is running

---

## 🙏 Acknowledgments

Built with:
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://react.dev/) - UI library
- [Google Gemini API](https://ai.google.dev/) - AI medical analysis
- [Africa's Talking](https://africastalking.com/) - Voice & SMS
- [Google Cloud Translate](https://cloud.google.com/translate) - Multilingual support
- [PostgreSQL](https://www.postgresql.org/) - Database
- [SQLAlchemy](https://www.sqlalchemy.org/) - ORM

---

## 🎯 Roadmap

- **Phase 1** (Current): Text & voice symptom assessment
- **Phase 2**: Hospital integration & real-time alerts
- **Phase 3**: Mobile app with offline capability
- **Phase 4**: ML-based outbreak prediction
- **Phase 5**: Telemedicine consultation integration

---

**Remotriage: Bringing Healthcare to Where It's Needed Most** 🌍💚
