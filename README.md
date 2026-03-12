# 🤖 AI Customer Discovery Tool

An AI-powered app that turns a business idea into customer discovery questions and a structured market insight report.

## 🔗 Live Demo
Not deployed yet

## 📌 What It Does
This project helps founders and product teams validate early-stage ideas faster. Users enter a business description, get four AI-generated customer discovery questions, answer them, and receive a structured report with target segments, pain points, solution ideas, quick wins, and a summary.

## 🛠 Tech Stack
- **Frontend:** React, Vite
- **Backend:** FastAPI, Python
- **AI:** Groq (`llama-3.3-70b-versatile`)
- **Deployment:** Railway (backend) + Vercel (frontend)

## ✨ Features
- Generate exactly four AI-powered customer discovery questions from a business idea.
- Capture interview-style answers in a simple multi-step frontend workflow.
- Produce a structured market discovery report with segments, pain points, solution ideas, quick wins, and summary insights.

## 🚀 Run Locally

### Backend
```bash
cd backend
pip install -r ../requirements.txt
uvicorn backend.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🔑 Environment Variables

### Backend (.env)
```
GROQ_API_KEY=your_groq_api_key
```

### Frontend (.env)
```
VITE_API_URL=your_railway_backend_url
```

## 📁 Project Structure
```
project/
├── backend/
│   ├── main.py
│   └── __init__.py
├── frontend/
│   ├── package.json
│   └── src/
│       ├── App.jsx
│       └── main.jsx
├── Procfile
├── README.md
└── requirements.txt
```

---
Built by Project Owner | Portfolio URL not configured | LinkedIn URL not configured
