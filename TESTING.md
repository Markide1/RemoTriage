# Frontend-Backend Integration Testing Guide

## 📋 Prerequisites

- **Backend** running on `http://localhost:8000`
- **Frontend** running on `http://localhost:5173`
- **PostgreSQL** running locally (optional for basic API testing)
- **Google Gemini API key** (set in backend/.env)

---

## 🚀 Step-by-Step Setup

### 1. Terminal 1 - Start Backend

```bash
cd /home/pc/devs/remotriage/backend

# Activate virtual environment
source venv/bin/activate

# Start server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

### 2. Terminal 2 - Start Frontend

```bash
cd /home/pc/devs/remotriage/frontend

# Install dependencies (if not done)
npm install

# Start dev server
npm run dev
```

Expected output:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
➜  press h to show help
```

### 3. Terminal 3 (Optional) - Monitor Backend

```bash
cd /home/pc/devs/remotriage/backend

# Watch for errors or access logs
tail -f server.log
```

---

## ✅ Test Cases

### Test 1: Health Check

```bash
curl http://localhost:8000/
```

Expected response:
```json
{"status": "ok", "service": "Remotriage API"}
```

### Test 2: API Documentation

Open in browser:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Test 3: Submit Triage (API)

```bash
curl -X POST http://localhost:8000/triage/ \
  -H "Content-Type: application/json" \
  -d '{
    "symptoms": "I have a high fever and severe headache for 2 days",
    "full_name": "John Doe",
    "phone_number": "+254712345678",
    "location": "Nairobi",
    "gender": "male"
  }'
```

Expected response:
```json
{
  "prognosis_id": "550e8400-e29b-41d4-a716-446655440000",
  "severity": "moderate",
  "symptoms_detected": ["fever", "headache"],
  "recommendation": "Please visit a clinic within 24 hours for evaluation.",
  "alert_triggered": false,
  "referred_hospital": null
}
```

### Test 4: Frontend UI Test

1. Open http://localhost:5173 in browser
2. Click "Start new assessment"
3. Fill in the form:
   - **Full name**: Jane Doe
   - **Date of birth**: 1995-06-15
   - **Gender**: Female
   - **Phone**: +254712345678
   - **Email**: jane@example.com
   - **Location**: Nairobi
   - **Symptoms**: I have a high fever and severe headache for 2 days, also experiencing nausea
4. Click "Get triage assessment"
5. **Expected**: See results with severity badge and recommendation

### Test 5: Case Lookup

Note: This requires cases to exist in the database.

```bash
curl http://localhost:8000/prognosis/550e8400-e29b-41d4-a716-446655440000
```

---

## 🔍 Troubleshooting

### Backend Issues

**Problem**: `ModuleNotFoundError: No module named 'app'`
```bash
# Solution: Make sure you're in backend directory and have venv activated
cd /home/pc/devs/remotriage/backend
source venv/bin/activate
```

**Problem**: `ValidationError: DATABASE_URL / GOOGLE_API_KEY missing`
```bash
# Solution: Check backend/.env has values
cat backend/.env

# Update with proper values if needed
```

**Problem**: `psycopg2.OperationalError: could not connect to server`
```bash
# Solution: PostgreSQL not running. Either:
# 1. Start PostgreSQL
# 2. Or use SQLite for testing:
# DATABASE_URL=sqlite:///./remotriage.db
```

### Frontend Issues

**Problem**: `VITE_API_URL is undefined`
```bash
# Solution: Check frontend/.env exists and has VITE_API_URL
cat frontend/.env

# Should have: VITE_API_URL=http://localhost:8000
```

**Problem**: API calls fail with 404
```bash
# Check:
# 1. Backend is running on port 8000
# 2. Frontend .env has correct API_URL
# 3. Browser console shows actual error
```

**Problem**: CORS errors in console
```bash
# Backend CORS should allow all origins in development
# Already configured in main.py

# If still failing, check backend is actually running
curl http://localhost:8000/
```

### Database Issues

**Problem**: Cannot connect to PostgreSQL
```bash
# Check if PostgreSQL is running
psql -U postgres -c "SELECT 1"

# If not, start it:
# Linux: sudo systemctl start postgresql
# Mac: brew services start postgresql
#Windows: Services app → PostgreSQL
```

**Problem**: Database does not exist
```bash
# Create the database
psql -U postgres -c "CREATE DATABASE remotriage;"

# Or use SQLite for testing (update DATABASE_URL in .env)
```

---

## 📊 API Flow Diagram

```
┌─────────────────┐
│  Browser/React  │
│  (localhost:5173)
└────────┬────────┘
         │ HTTP POST /triage/
         │ with symptoms data
         ↓
┌─────────────────────────────┐
│  FastAPI Backend            │
│  (localhost:8000)           │
├─────────────────────────────┤
│ 1. Validate input           │
│ 2. Call Gemini API          │
│ 3. Get AI assessment        │
│ 4. Store in PostgreSQL      │
│ 5. Return prognosis ID      │
└────────┬────────────────────┘
         │ JSON Response
         │ {prognosis_id, severity,
         │  recommendation, ...}
         ↓
┌─────────────────┐
│  Browser/React  │
│  Display Result │
└─────────────────┘
```

---

## 🧪 Automated Testing

### Backend Tests
```bash
cd backend
pip install pytest pytest-asyncio

# Run tests (if any exist)
pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm run test
```

---

## 📝 Checklist

Before deploying to production:

- [ ] Backend starts without errors
- [ ] Frontend connects to backend
- [ ] Health check endpoint responds
- [ ] Triage API returns valid responses
- [ ] Frontend form submission works
- [ ] Results display correctly
- [ ] Error handling works
- [ ] CORS configured properly
- [ ] API keys are real (not test values)
- [ ] Database is properly configured
- [ ] Logs are monitored

---

## 🚀 Performance Tips

1. **Enable caching** on frontend for repeated requests
2. **Add rate limiting** on backend to prevent abuse
3. **Implement request timeout** (~10s) on frontend
4. **Add loading states** to prevent duplicate submissions
5. **Monitor Gemini API** usage and costs

---

## 🤝 Support

If issues persist:

1. Check all terminal outputs for error messages
2. Verify all environment variables are set
3. Test individual API endpoints with curl
4. Check browser DevTools (Network tab)
5. Check backend logs for detailed errors

---

**Happy testing! 🎉**
