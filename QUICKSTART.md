# Remotriage Quick Start Guide

## ⚡ 30-Second Setup

### 1️⃣ Backend (Terminal 1)
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

### 2️⃣ Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```

### 3️⃣ Open Browser
```
http://localhost:5173
```

---

## 🔑 Before Running

Update `backend/.env` with real values:
```bash
GOOGLE_API_KEY=your_real_gemini_key  # Get from ai.google.dev
```

---

## ✅ Quick Test

### Test 1: Backend Health
```bash
curl http://localhost:8000/
# Expected: {"status": "ok", "service": "Remotriage API"}
```

### Test 2: API Docs
Open http://localhost:8000/docs in browser

### Test 3: Submit Triage
```bash
curl -X POST http://localhost:8000/triage/ \
  -H "Content-Type: application/json" \
  -d '{"symptoms":"fever and headache"}'
```

---

## 📱 In the Browser

1. Go to http://localhost:5173
2. Click "Start new assessment"
3. Fill the form
4. Click "Get triage assessment"
5. See your results!

---

## 🛠️ Troubleshooting

| What's wrong? | Quick fix |
|---|---|
| Backend won't start | Check `.env` has `GOOGLE_API_KEY`, `AT_API_KEY`, `AT_USERNAME` |
| Frontend won't connect | Is backend running on 8000? Check console errors (F12) |
| "Something went wrong" | Check backend logs for errors |
| Slow responses | First request is slow (Gemini cold start is normal) |

---

## 📚 Full Documentation

- **[README.md](README.md)** - Full project guide
- **[SETUP.md](SETUP.md)** - Detailed setup instructions
- **[TESTING.md](TESTING.md)** - Test cases & debugging
- **[INTEGRATION.md](INTEGRATION.md)** - Technical integration details

---

## 🚀 Next Steps

1. Get real Google Gemini API key from [ai.google.dev](https://ai.google.dev/)
2. Get Africa's Talking credentials for SMS/Voice
3. Set up PostgreSQL database
4. Deploy to production

---

**Happy hacking! 🎉**
