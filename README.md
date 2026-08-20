# MetaScript AI — Metadata Intelligence Platform

> **Cognizant Hackathon Submission**  
> *Tag → Understand → Search → Discover*

[![FastAPI](https://img.shields.io/badge/AI_Service-FastAPI_0.111-009688?logo=fastapi)](http://localhost:8000/docs)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_Express-339933?logo=node.js)](http://localhost:5000)
[![React](https://img.shields.io/badge/Frontend-React_Vite_Tailwind-61DAFB?logo=react)](http://localhost:5173)
[![spaCy](https://img.shields.io/badge/NER-spaCy_en__core__web__sm-09A3D5?logo=spacy)](https://spacy.io)
[![Transformers](https://img.shields.io/badge/Emotion%20%26%20Zero--Shot-HuggingFace_Transformers-FFD21E?logo=huggingface)](https://huggingface.co)

---

## 1. Executive Summary & Problem Statement

Unstructured audio/video transcripts, movie scripts, interviews, podcasts, and corporate meetings represent massive volumes of unindexed text. Organizations struggle to rapidly discover key moments, extract named entities, assess emotional valence, track speaker contributions, and classify domains.

**MetaScript AI** converts unstructured transcript content into structured, searchable, and actionable metadata using NLP and Generative AI via a deterministic multi-model pipeline.

---

## 2. Core Capabilities

1. **Topics & Keywords**: Extract keyphrases using **KeyBERT** and TF-IDF with stopword removal and deduplication.
2. **Named Entity Recognition (NER)**: Extract and categorize entities (`PERSON`, `ORG`, `GPE`, `DATE`, `PRODUCT`, `LOC`, `EVENT`) with **spaCy** `en_core_web_sm`.
3. **Sentiment Valence**: Compute exact polarity (`positive`, `negative`, `neutral`) and compound metrics using **NLTK VADER** with utterance-level scoring and lexical fallback.
4. **Emotion Distribution**: Analyze 12 multidimensional emotional probabilities (`joy`, `optimism`, `enthusiasm`, `trust`, `curiosity`, `surprise`, `sadness`, `anger`, `fear`, `disgust`, `frustration`, `neutral`) using **DistilRoBERTa** and contextual nuance extractors.
5. **Speaker Identification & Turn Counts**: Deterministic regex rule-engine recognizing script headers, colons, and dialogue turns with line counts.
6. **Time/Scene-Based Segmentation**: Scene boundaries (`INT.`, `EXT.`, `INT./EXT.`), timestamp markers (`[00:01:23]`), or dialogue-block segmentations without inventing fake timestamps.
7. **Zero-Shot Domain Classification**: Categorize content into 10 domains (`entertainment`, `interview`, `meeting`, `education`, `news`, `technology`, `finance`, `healthcare`, `legal`, `podcast`) with confidence metrics using **BART-Large-MNLI**.
8. **Export Engine**: Export full structured metadata in JSON and flattened CSV formats with descriptive filenames.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Axios, Recharts, react-dropzone, react-hot-toast, Lucide React |
| **Backend API Gateway** | Node.js, Express.js, MongoDB Atlas / Mongoose ODM, JWT, bcryptjs, Multer, Morgan, CORS, Dotenv |
| **AI / NLP Microservice** | Python 3.10+, FastAPI, Uvicorn, spaCy (`en_core_web_sm`), NLTK (`vader_lexicon`), HuggingFace Transformers, PyTorch, KeyBERT, Scikit-learn |
| **Containers & DevOps** | Docker, Docker Compose, Nginx |

---

## 4. Architecture

```
                               ┌─────────────────────────────┐
                               │   React 18 + Vite Client    │
                               │     (Port 5173 / Nginx)     │
                               └──────────────┬──────────────┘
                                              │  REST / JWT
                                              ▼
                               ┌─────────────────────────────┐
                               │    Node.js + Express API    │
                               │   Gateway / Auth (Port 5000)│
                               └──────┬──────────────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 │                                         │
                 ▼                                         ▼
  ┌─────────────────────────────┐           ┌─────────────────────────────┐
  │   Python FastAPI Service    │           │    MongoDB Atlas / Mongo    │
  │     NLP Pipeline (Port 8000)│           │  Users, Transcripts, Meta   │
  └──────────────┬──────────────┘           └─────────────────────────────┘
                 │
                 ├── KeyBERT (Keywords)
                 ├── spaCy en_core_web_sm (NER)
                 ├── NLTK VADER (Sentiment)
                 ├── DistilRoBERTa (Emotions)
                 ├── BART-Large-MNLI (Zero-shot Classifier)
                 └── Regex Rule Engines (Speakers & Scenes)
```

---

## 5. Folder Structure

```
metadata-tagging-hackathon/
├── client/
│   ├── src/
│   │   ├── api/axios.js
│   │   ├── components/
│   │   │   ├── Badge.jsx
│   │   │   ├── CategoryBadge.jsx
│   │   │   ├── EmotionChart.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── EntityChip.jsx
│   │   │   ├── KeywordCloud.jsx
│   │   │   ├── MetadataCard.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProcessingStatus.jsx
│   │   │   ├── SceneTimeline.jsx
│   │   │   ├── SentimentChart.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Skeleton.jsx
│   │   │   ├── SpeakerTable.jsx
│   │   │   └── UploadZone.jsx
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── TranscriptDetail.jsx
│   │   │   └── Upload.jsx
│   │   ├── utils/exportUtils.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   └── transcript.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   └── upload.middleware.js
│   │   ├── models/
│   │   │   ├── Transcript.js
│   │   │   └── User.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   └── transcript.routes.js
│   │   ├── services/aiService.js
│   │   └── server.js
│   ├── tests/
│   │   ├── auth.test.js
│   │   └── transcript.test.js
│   ├── Dockerfile
│   └── package.json
├── ai-service/
│   ├── app/
│   │   ├── nlp/
│   │   │   ├── classify.py
│   │   │   ├── emotion.py
│   │   │   ├── entities.py
│   │   │   ├── keywords.py
│   │   │   ├── segmentation.py
│   │   │   ├── sentiment.py
│   │   │   └── speakers.py
│   │   ├── main.py
│   │   └── schemas.py
│   ├── tests/test_nlp.py
│   ├── Dockerfile
│   └── requirements.txt
├── data/
│   └── sample_transcripts/
│       ├── movie_script_matrix.txt
│       ├── movie_script_good_will_hunting.txt
│       ├── tech_interview.txt
│       └── quarterly_business_meeting.json
├── AGENTS.md
├── docker-compose.yml
└── README.md
```

---

## 6. Environment Configuration

### `server/.env`
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/metamind_ai
JWT_SECRET=super_secure_jwt_secret_key_cognizant_2026
AI_SERVICE_URL=http://localhost:8000
CLIENT_URL=http://localhost:5173
```

### `ai-service/.env`
```env
HF_TOKEN=
OPENAI_API_KEY=
GEMINI_API_KEY=
```

### `client/.env`
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 7. How to Run Locally

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- MongoDB (local or Atlas URI)

### Step 1: Start the Python AI/NLP Microservice
```bash
cd ai-service
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python -c "import nltk; nltk.download('vader_lexicon'); nltk.download('punkt'); nltk.download('stopwords')"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*API docs will be live at `http://localhost:8000/docs`.*

### Step 2: Start the Backend API Gateway
```bash
cd server
npm install
npm run dev
```
*API gateway will be live at `http://localhost:5000`.*

### Step 3: Start the React Client
```bash
cd client
npm install
npm run dev
```
*Application will be live at `http://localhost:5173`.*

---

## 8. Deployment Options

For a full step-by-step production deployment guide across all major cloud providers, see [**DEPLOYMENT.md**](DEPLOYMENT.md).

### Quick Options:
- **1-Click Cloud Deployment (Render Blueprint)**: Push your repo to GitHub and import as a Blueprint on [Render](https://dashboard.render.com) using [`render.yaml`](render.yaml).
- **Vercel + Render + MongoDB Atlas**: Deploy the React client on Vercel, Express backend on Render, and Python AI service on Render Docker.
- **Docker Compose (Local or VPS)**:
  ```bash
  docker-compose up --build
  ```
  - Client: `http://localhost:5173`
  - Backend API: `http://localhost:5000`
  - AI Service & Swagger Docs: `http://localhost:8000/docs`


---

## 9. API Specification

### Authentication
- `POST /api/auth/register`: Register new user `{ name, email, password }`
- `POST /api/auth/login`: Authenticate user `{ email, password }`
- `GET /api/auth/me`: Get current authenticated profile

### Transcripts
- `POST /api/transcripts`: Upload `.txt`/`.json` file (up to 5MB) or send raw `{ title, text, fileName }`
- `GET /api/transcripts`: List transcripts (supports `?q=`, `?status=`, `?category=`, `?sentiment=`)
- `GET /api/transcripts/:id`: Retrieve transcript with full extracted metadata
- `DELETE /api/transcripts/:id`: Delete transcript
- `POST /api/transcripts/:id/retry`: Re-trigger NLP analysis if failed

### AI Microservice Contract
- `POST /analyze`:
```json
{
  "text": "INT. HOTEL - NIGHT\nTRINITY: The mainframe is breached.",
  "filename": "matrix.txt"
}
```
**Response Schema:**
```json
{
  "keywords": ["mainframe", "breached", "trinity"],
  "entities": [
    { "text": "Trinity", "label": "PERSON" },
    { "text": "Hotel", "label": "FAC" }
  ],
  "sentiment": {
    "polarity": "negative",
    "score": -0.296
  },
  "emotions": [
    { "label": "fear", "score": 0.58 },
    { "label": "neutral", "score": 0.22 }
  ],
  "speakers": [
    { "speaker": "TRINITY", "lineCount": 1 }
  ],
  "segments": [
    { "index": 1, "heading": "INT. HOTEL - NIGHT", "text": "TRINITY: The mainframe is breached." }
  ],
  "category": {
    "label": "entertainment",
    "confidence": 0.94
  }
}
```

---

## 10. Automated Testing

### Backend Tests (Jest / Supertest)
```bash
cd server
npm test
```
*Runs automated unit and integration tests with in-memory MongoDB covering registration, login, JWT authorization guards, transcript upload/CRUD, search filtering, and error handling.*

### AI Service Tests (Pytest)
```bash
cd ai-service
pytest tests/
```
*Tests keyword extraction, entity recognition, VADER sentiment boundaries, emotion distribution, speaker parsing, scene segmentation, zero-shot classification, and complete `/analyze` contract integrity.*

---

## 11. Cognizant Hackathon Demo Flow

1. Open `http://localhost:5173/signup` and register a new account.
2. Navigate to **Upload Transcript**.
3. Click on one of the pre-loaded **Kaggle Movie Script Excerpts** (*The Matrix*, *Good Will Hunting*, *Tech Interview*).
4. Click **Extract Metadata & Analyze**.
5. Watch the real-time **Processing Stepper** transition from `Queued` → `Processing` → `Completed`.
6. Explore the **Transcript Intelligence Dashboard**:
   - Inspect zero-shot **Content Classification** and confidence.
   - Gauge **VADER Sentiment** polarity and compound score.
   - Browse **KeyBERT Keywords** and filter **spaCy Named Entities** by tag (`PERSON`, `ORG`, `GPE`).
   - Examine **DistilRoBERTa Emotion Distribution** via interactive Recharts.
   - Review **Speaker Turns Table** and dialogue percentages.
   - Navigate the **Scene Timeline** and expand dialogue blocks.
7. Click **Export JSON** and **Export CSV** to verify downloaded intelligence artifacts.

---

## 12. Security & Best Practices

- Passwords securely hashed with **bcrypt** (salt factor 10).
- Stateless **JWT** authentication with bearer token authorization.
- Zero plaintext secrets in Git; strict `.env` usage with `.env.example` templates.
- Strict Multer file upload validation (5MB max size, `.txt` and `.json` MIME/extension filtering).
- Robust fallback heuristics ensuring the NLP microservice never crashes if external connectivity is restricted.
