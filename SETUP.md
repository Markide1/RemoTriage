# Remotriage Setup & Integration Guide

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend# Create virtual environmentpython -m venv venvsource venv/bin/activate  # Windows: venvScriptsactivate# Install dependenciespip install -r requirements.txt# Configure environmentcat > .env << EOFDATABASE_URL=postgresql://postgres:Post_1234@localhost:5432/remotriageGOOGLE_API_KEY=your_google_gemini_api_key_hereAT_API_KEY=your_africas_talking_api_keyAT_USERNAME=your_africas_talking_usernameAT_SENDER_ID=REMOTRIAGEAPP_ENV=developmentEOF# Start backend serveruvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: **[http://localhost:8000](http://localhost:8000)**

### 2. Frontend Setup

```bash
cd frontend# Install dependenciesnpm install# Frontend automatically detects backend from .env# Development: http://localhost:8000 (default in .env)
```

Frontend will be available at: **[http://localhost:5173](http://localhost:5173)**

---

## 📋 Environment Configuration

### Backend (.env)

Variable

Description

Example

`DATABASE_URL`

PostgreSQL connection

`postgresql://postgres:password@localhost:5432/remotriage`

`GOOGLE_API_KEY`

Google Gemini API key

`AIzaSyD...`

`AT_API_KEY`

Africa's Talking API key

`xxx...`

`AT_USERNAME`

Africa's Talking username

`your_username`

`AT_SENDER_ID`

SMS sender ID

`REMOTRIAGE`

`APP_ENV`

Environment mode

`development` or `production`

### Frontend (.env)

Variable

Description

Example

`VITE_API_URL`

Backend API URL

`http://localhost:8000` (dev) or `https://api.remotriage.app` (prod)

---

## 🔌 API Integration Points

### Frontend → Backend Communication

The frontend communicates with the backend through these endpoints:

1.  **POST /triage/** — Submit symptom assessment
    
    ```javascript
    const response = await submitTriage({  symptoms: "I have a high fever and headache",  full_name: "Jane Doe",  phone_number: "+254712345678",  location: "Nairobi",  gender: "female",  dob: "1990-01-15",  email: "jane@example.com"})
    ```
    
2.  **GET /prognosis/{id}** — Retrieve case details
    
3.  **POST /prognosis/{id}/refer** — Confirm referral
    

### CORS Configuration

The backend has CORS enabled for all origins in development:

```python
app.add_middleware(    CORSMiddleware,    allow_origins=["*"],  # ⚠️ Change to specific domains in production    allow_methods=["*"],    allow_headers=["*"],)
```

---

## ✅ Testing the Integration

### 1. Check Backend Health

```bash
curl http://localhost:8000/# Expected: {"status": "ok", "service": "Remotriage API"}
```

### 2. View API Documentation

-   **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
-   **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### 3. Test Triage Endpoint

```bash
curl -X POST http://localhost:8000/triage/   -H "Content-Type: application/json"   -d '{    "symptoms": "I have a high fever and severe headache",    "location": "Nairobi",    "phone_number": "+254712345678"  }'
```

### 4. Access Frontend

Open [http://localhost:5173](http://localhost:5173) in your browser and test the form.

---

## 🛠️ Troubleshooting

### Backend won't start

```bash
# 1. Check PostgreSQL is runningpsql -U postgres -c "SELECT 1"# 2. Verify .env has all required variablescat backend/.env# 3. Check if port 8000 is in uselsof -i :8000# 4. Reinstall dependenciespip install -r requirements.txt --force-reinstall
```

### Frontend can't connect to backend

```bash
# 1. Verify backend is runningcurl http://localhost:8000/# 2. Check VITE_API_URL in frontend/.envcat frontend/.env# 3. Check browser console for CORS errors# 4. Restart frontend dev servernpm run dev
```

### CORS errors in browser

-   Backend CORS already allows all origins in development
-   In production, update the `allow_origins` to your domain

### API timeouts

-   Check if Gemini API key is valid
-   Check internet connection
-   Monitor backend logs for errors

---

## 📁 Project Structure

```
remotriage/├── backend/              # FastAPI Python backend│   ├── app/│   │   ├── api/routes/│   │   │   ├── triage.py           # Symptom assessment│   │   │   ├── voice.py            # Voice calls│   │   │   └── prognosis.py        # Case lookup│   │   ├── services/│   │   │   ├── ai_service.py       # Gemini integration│   │   │   ├── hospital_service.py # Hospital lookup│   │   │   └── sms_service.py      # SMS alerts│   │   ├── models/│   │   │   └── case.py             # Database models│   │   └── core/│   │       ├── config.py           # Settings│   │       └── database.py         # SQLAlchemy setup│   ├── main.py                     # App entry│   ├── requirements.txt            # Dependencies│   ├── .env                        # Config (not in git)│   └── venv/                       # Python virtual env│├── frontend/             # React TypeScript frontend│   ├── src/│   │   ├── components/   # React components│   │   ├── pages/        # Page components│   │   ├── api/          # API client│   │   ├── types/        # TypeScript types│   │   └── styles/       # CSS modules│   ├── public/           # Static assets│   ├── .env              # Config (not in git)│   ├── vite.config.ts    # Vite config│   └── package.json      # Dependencies│├── README.md             # Main documentation└── SETUP.md              # This file
```

---

## 🚢 Production Deployment

### Backend Deployment

Option 1: Docker

```dockerfile
FROM python:3.11-slimWORKDIR /appCOPY requirements.txt .RUN pip install -r requirements.txtCOPY . .CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Option 2: Traditional hosting (Heroku, Railway, etc.)

-   Ensure `APP_ENV=production`
-   Configure CORS to allow your frontend domain
-   Set all environment variables

### Frontend Deployment

```bash
# Buildnpm run build# Deploy dist/ to:# - Vercel (recommended)# - Netlify# - AWS S3 + CloudFront# - GitHub Pages
```

Update `frontend/.env.production` with your deployed backend URL before building.

---

## 🔐 Security Checklist

-    Change CORS `allow_origins` from `["*"]` to specific domains in production
-    Store API keys securely (use environment variables, not hardcoded)
-    Enable HTTPS for all API calls
-    Implement rate limiting on backend
-    Add request validation and sanitization
-    Use JWT tokens for authentication (when added)
-    Encrypt sensitive data in database
-    Set up monitoring and logging

---

## 📚 API Reference

See [README.md](./README.md) for full API documentation and response examples.

---

## 💡 Tips

1.  **Development workflow**:
    
    ```bash
    # Terminal 1: Backendcd backend && source venv/bin/activate && uvicorn main:app --reload# Terminal 2: Frontendcd frontend && npm run dev# Terminal 3: Monitor PostgreSQL (optional)psql remotriage
    ```
    
2.  **Test with curl**:
    
    ```bash
    # Get health checkcurl http://localhost:8000/# Submit triagecurl -X POST http://localhost:8000/triage/   -H "Content-Type: application/json"   -d '{"symptoms":"fever","location":"Nairobi"}'
    ```
    
3.  **Frontend debugging**:
    
    -   Open browser DevTools (F12)
    -   Check Network tab for API requests
    -   Check Console for JavaScript errors
    -   Check Application tab for stored data

---

**Questions?** Check the main [README.md](./README.md) or open an issue on GitHub.