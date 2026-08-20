# MetaMind AI — Production Deployment Guide

This guide provides end-to-end instructions for deploying **MetaMind AI** across cloud platforms (Render, Vercel, Railway, AWS/DigitalOcean VPS, or Docker).

---

## 🏗️ Architecture Overview

The platform consists of 4 components:

```
┌──────────────────────────────────────────────────────────┐
│ 1. Frontend Client (React 18 + Vite + Tailwind)          │
│    Hosts: Vercel / Netlify / Render Static Site          │
└────────────────────────────┬─────────────────────────────┘
                             │  VITE_API_BASE_URL (REST / JWT)
                             ▼
┌──────────────────────────────────────────────────────────┐
│ 2. Backend API Gateway (Node.js + Express + Mongoose)    │
│    Hosts: Render Web Service / Railway / Fly.io / VPS    │
└──────────────┬────────────────────────────┬──────────────┘
               │ AI_SERVICE_URL             │ MONGO_URI
               ▼                            ▼
┌──────────────────────────────┐ ┌─────────────────────────┐
│ 3. AI / NLP Microservice     │ │ 4. Database             │
│    (Python FastAPI + Docker) │ │    MongoDB Atlas (Free) │
│    Hosts: Render / Railway   │ │    or Container Mongo   │
└──────────────────────────────┘ └─────────────────────────┘
```

---

## 🚀 Quick Decision Matrix: Choose Your Deployment Target

| Method | Best For | Cost | Effort |
|---|---|---|---|
| **Method 1: Render Blueprint (`render.yaml`)** | Full-Stack All-in-One Cloud Deployment | Free tier available | ⭐ Easiest (1-Click) |
| **Method 2: Vercel + Render + MongoDB Atlas** | Maximum frontend performance + CDN | Free tier available | ⭐⭐ Recommended |
| **Method 3: Docker Compose on VPS (EC2/DigitalOcean)** | Dedicated server / Custom domain / Full control | $4–$10/mo | ⭐⭐ Fast single command |
| **Method 4: Railway.app** | Instant developer PaaS | $5 free trial | ⭐ Easiest |

---

## 📋 Step 0: Set Up Free Cloud MongoDB Atlas (Required for Cloud Deployments)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Create a free **M0 Shared Cluster** (choose your closest AWS/GCP region).
3. Under **Security → Database Access**, create a database user (e.g. `metamind_admin` with a secure password).
4. Under **Security → Network Access**, add IP `0.0.0.0/0` (Allow access from anywhere).
5. Click **Connect → Drivers (Node.js)** and copy your connection string:
   ```
   mongodb+srv://metamind_admin:<password>@cluster0.abcde.mongodb.net/metamind_ai?retryWrites=true&w=majority
   ```
   *(Replace `<password>` with your actual password and ensure the DB name `/metamind_ai` is specified)*.

---

## 🌐 Method 1: 1-Click Cloud Deployment via Render Blueprint (Easiest)

Render can automatically provision and interconnect all 3 services using our included [`render.yaml`](file:///c:/Users/CrazyN/OneDrive/Documents/AI-Powered%20Metadata%20Tagging%20from%20Transcripts/render.yaml).

### Steps:
1. Push your repository to **GitHub** or **GitLab**.
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** → **Blueprint**.
4. Connect your GitHub repository.
5. Render will automatically detect `render.yaml` and configure:
   - `metamind-ai-service` (Docker container running Python FastAPI)
   - `metamind-server` (Node.js Express API Gateway)
   - `metamind-client` (React 18 Vite static site)
6. Under Blueprint parameters, set your **`MONGO_URI`** (from Step 0).
7. Click **Apply**.
8. Once built:
   - Your frontend will be live at: `https://metamind-client.onrender.com`
   - Your backend API at: `https://metamind-server.onrender.com`
   - Your AI microservice at: `https://metamind-ai-service.onrender.com`

---

## ⚡ Method 2: Modern Decoupled Deployment (Vercel + Render + MongoDB Atlas)

### Part A: Deploy the Python AI Service on Render (Docker)
1. In Render Dashboard, click **New +** → **Web Service**.
2. Connect your repo and configure:
   - **Root Directory**: `ai-service`
   - **Runtime**: `Docker`
   - **Instance Type**: `Free`
   - **Health Check Path**: `/health`
3. Add Environment Variables:
   - `PYTHONUNBUFFERED` = `1`
4. Click **Create Web Service**. Note the deployed URL (e.g. `https://metamind-ai-service.onrender.com`).

### Part B: Deploy the Express Backend on Render (Node.js)
1. In Render Dashboard, click **New +** → **Web Service**.
2. Connect your repo and configure:
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
3. Add Environment Variables:
   - `PORT` = `5000`
   - `MONGO_URI` = `mongodb+srv://...` (your Atlas URI)
   - `JWT_SECRET` = `<random-32-char-secret-string>`
   - `AI_SERVICE_URL` = `https://metamind-ai-service.onrender.com` (from Part A)
   - `CLIENT_URL` = `*` (or your Vercel domain once created)
4. Click **Create Web Service**. Note the backend URL (e.g. `https://metamind-backend.onrender.com`).

### Part C: Deploy the React Frontend on Vercel
1. Go to [Vercel Dashboard](https://vercel.com) and click **Add New...** → **Project**.
2. Import your GitHub repository.
3. In Project Settings:
   - **Root Directory**: Select `client`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL` = `https://metamind-backend.onrender.com/api` (backend URL with `/api` suffix)
5. Click **Deploy**.
   *(Note: The included `client/vercel.json` ensures all React Router paths work without 404s).*

---

## 🐳 Method 3: Single-Command VPS Deployment (Docker Compose)

Deploy everything on any Linux Virtual Machine (AWS EC2, DigitalOcean Droplet, Linode, Hetzner, GCP Compute).

### 1. Connect to your VPS and install Docker & Docker Compose:
```bash
sudo apt update && sudo apt install -y docker.io docker-compose git
sudo systemctl enable --now docker
```

### 2. Clone your repository:
```bash
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>
```

### 3. (Optional) Configure environment variables:
Create a `.env` file at root if you want custom keys:
```env
MONGO_URI=mongodb://mongo:27017/metamind_ai
JWT_SECRET=super_secure_production_jwt_secret_key_2026
```

### 4. Build and start all 4 containers:
```bash
docker-compose up -d --build
```

### 5. Check container health:
```bash
docker-compose ps
docker-compose logs -f
```

- **Frontend Client**: `http://<your-server-ip>:5173`
- **Backend API**: `http://<your-server-ip>:5000`
- **AI Microservice**: `http://<your-server-ip>:8000/docs`
- **MongoDB**: `localhost:27017`

---

## 🚆 Method 4: Deploying on Railway.app

1. Go to [Railway.app](https://railway.app) and create a **New Project**.
2. Click **Deploy from GitHub repo**.
3. Add MongoDB: Click **+ New** → **Database** → **Add MongoDB**.
4. Add AI Service: Click **+ New** → **GitHub Repo** → Set root directory to `/ai-service`.
5. Add Backend Service: Click **+ New** → **GitHub Repo** → Set root directory to `/server`.
   - Set env vars: `MONGO_URI=${{MongoDB.MONGO_URL}}`, `AI_SERVICE_URL=${{metamind-ai-service.RAILWAY_PUBLIC_DOMAIN}}`, `JWT_SECRET=...`.
6. Add Client Service: Click **+ New** → **GitHub Repo** → Set root directory to `/client`.
   - Set env var: `VITE_API_BASE_URL=https://${{metamind-server.RAILWAY_PUBLIC_DOMAIN}}/api`.

---

## 🔑 Environment Variables Reference

### Backend Server (`server/.env`)
| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | Port the Express server listens on | `5000` |
| `MONGO_URI` | MongoDB Atlas or local MongoDB connection URI | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key used to sign and verify user JWTs | `a_long_random_secret_string` |
| `AI_SERVICE_URL` | Base URL of the Python FastAPI NLP service | `http://localhost:8000` or `https://ai-service.onrender.com` |
| `CLIENT_URL` | Frontend URL for CORS origin validation | `http://localhost:5173` or `*` |

### Python AI Service (`ai-service/.env`)
| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | Port for FastAPI uvicorn server | `8000` |
| `PYTHONUNBUFFERED` | Ensures stdout/stderr flush immediately for logging | `1` |
| `HF_TOKEN` | (Optional) Hugging Face token for rate limits | `hf_...` |
| `OPENAI_API_KEY` | (Optional) OpenAI API key for extended LLM tasks | `sk-...` |
| `GEMINI_API_KEY` | (Optional) Google Gemini API key | `AIza...` |

### Frontend Client (`client/.env`)
| Variable | Description | Example / Default |
|---|---|---|
| `VITE_API_BASE_URL` | Full URL to the backend `/api` route endpoint | `https://your-backend-domain.com/api` |

---

## ✅ Post-Deployment Verification Checklist

1. **AI Microservice Health**:
   - Visit `https://<your-ai-service-url>/health` → Expect `{"status": "healthy"}`
   - Visit `https://<your-ai-service-url>/docs` → Interactive Swagger UI loads
2. **Backend API Gateway Health**:
   - Visit `https://<your-backend-url>/api/health` → Expect `{"status": "healthy", "database": "connected"}`
3. **Frontend Application**:
   - Open `https://<your-frontend-url>`
   - Click **Sign Up** and create a user account.
   - Go to **Upload Transcript** → Click sample script (e.g. *The Matrix*).
   - Click **Extract Metadata & Analyze**.
   - Verify that all visual intelligence modules (Classification, Sentiment, Keywords, Entities, Emotions, Speakers, Scene Segments) render accurately.
   - Click **Export JSON** and **Export CSV** to verify file downloads.

---

## 🛠️ Troubleshooting

- **CORS Errors in browser console**:
  Ensure `CLIENT_URL` on the backend matches your frontend domain or is set to `*`.
- **404 on page refresh on Vercel/Netlify**:
  Ensure `client/vercel.json` or `client/netlify.toml` is present in the repository root or client root.
- **Render Free Tier Cold Starts**:
  Free tier instances on Render sleep after 15 minutes of inactivity. First request might take ~30–45 seconds to spin up.
- **MongoDB connection timeout**:
  Ensure MongoDB Atlas Network Access has `0.0.0.0/0` whitelisted and your password does not have unescaped special characters.
