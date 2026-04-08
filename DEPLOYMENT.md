# Deployment Guide - AI Procurement System

This guide outlines the steps to deploy the AI Procurement System to production.

---

## 1. Backend Deployment (FastAPI)

We recommend using **Render**, **Railway**, or **Fly.io** for the backend.

### Prerequisites
- A GitHub repository (already created).
- A PostgreSQL database (e.g., **Neon.tech**).

### Deployment Steps (Render Example)
There are two ways to deploy on Render:

#### Option A: Native Python (Simplest)
1. **New Web Service**: Connect your GitHub repository.
2. **Root Directory**: Select `backend`.
3. **Language**: `Python`.
4. **Build Command**: `pip install -r requirements.txt`.
5. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`.

#### Option B: Docker (Recommended for Consistency)
1. **New Web Service**: Connect your GitHub repository.
2. **Root Directory**: Select `backend`.
3. **Language**: `Docker`.
4. Render will automatically detect the `Dockerfile` in the `backend` folder.

6. **Environment Variables**:
   - `DATABASE_URL`: Your PostgreSQL connection string (from Neon).
   - `JWT_SECRET`: A long random string.
   - `GROQ_API_KEY`: Your Groq API key for AI features.
   - `GEMINI_API_KEY`: Your Google Gemini key.
   - `PYTHON_ENV`: `production`.

> [!IMPORTANT]
> **Ephemeral Storage**: Platforms like Render have ephemeral filesystems. Uploaded PDF files in `/uploads` will be lost on restart. For production, consider using **AWS S3** or **Google Cloud Storage** for documents.

---

## 2. Frontend Deployment (Vite + React)

We recommend using **Vercel** or **Netlify**.

### Deployment Steps (Vercel Example)
1. **New Project**: Connect your GitHub repository.
2. **Root Directory**: Select the root folder `./`.
3. **Framework Preset**: `Vite`.
4. **Build Command**: `npm run build`.
5. **Output Directory**: `dist`.
6. **Environment Variables**:
   - `VITE_API_BASE_URL`: The URL of your deployed backend (e.g., `https://ai-procurement-api.onrender.com`).

---

## 3. Database Setup (Neon PostgreSQL)

1. Create a project on [Neon.tech](https://neon.tech).
2. Get the connection string.
3. The backend `database/connection.py` is designed to handle both SQLite (development) and PostgreSQL (production).

---

## 4. Post-Deployment Checklist

### 🔓 CORS Configuration
In `backend/main.py`, update the `CORSMiddleware` to include your production frontend URL:

```python
# backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://ai-procurement-web.vercel.app", # Add your deployed URL here
    ],
    ...
)
```

### 📁 Uploads Directory
Ensure the backend has permissions to create the `uploads` directory. On most platforms, this is automatic, but remember the persistent storage warning above.

### 🤖 AI Keys
Make sure all API keys are correctly set in the backend environment variables, not hardcoded in the code.
