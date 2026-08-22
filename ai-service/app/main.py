

import os
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import AnalyzeRequest, AnalyzeResponse
from app.nlp.keywords import extract_keywords, get_keybert_model
from app.nlp.entities import extract_entities, get_spacy_model
from app.nlp.sentiment import analyze_sentiment, get_vader_analyzer
from app.nlp.emotion import analyze_emotions, get_emotion_pipeline
from app.nlp.classify import classify_content, get_classifier_pipeline
from app.nlp.speakers import identify_speakers, count_words, extract_speaker_handoffs
from app.nlp.segmentation import segment_transcript
from app.nlp.guardrails import validate_and_normalize_metadata

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("MetaMindAI")


def is_low_memory_mode() -> bool:
    val = os.environ.get("LOW_MEMORY_MODE", "true").strip().lower()
    return val in {"true", "1", "yes", "on"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    mode = "low_memory" if is_low_memory_mode() else "standard"
    logger.info(f"MetaMind AI NLP Microservice online in [{mode}] mode.")
    if is_low_memory_mode():
        logger.info("[MODEL] Low-memory mode active: using fast lightweight NLP engines (TF-IDF, VADER, spaCy/rules, 12-emotion lexicon, 10-domain keyword classifier).")
    else:
        logger.info("[MODEL] Standard mode active: heavy NLP models will be lazy-loaded on demand.")
    try:
        get_vader_analyzer()
    except Exception as e:
        logger.warning(f"VADER startup notice: {e}")
    yield
    logger.info("Shutting down MetaMind AI NLP Microservice.")


app = FastAPI(
    title="MetaMind AI - NLP Microservice",
    description="Automated transcript metadata extraction, entity recognition, sentiment, emotion, speaker tracking, and classification API.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
async def root():
    mode = "low_memory" if is_low_memory_mode() else "standard"
    return {
        "service": "MetaMind AI NLP Service",
        "status": "online",
        "mode": mode,
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    mode = "low_memory" if is_low_memory_mode() else "standard"
    return {
        "status": "healthy",
        "mode": mode
    }


@app.post(
    "/analyze",
    response_model=AnalyzeResponse,
    status_code=status.HTTP_200_OK,
    tags=["Analysis"]
)
async def analyze_transcript(payload: AnalyzeRequest):
    """
    Analyzes raw transcript text and returns structured metadata according to the exact required schema:
    - keywords
    - entities
    - sentiment
    - emotions
    - speakers
    - segments
    - category
    """
    raw_text = payload.text
    filename = payload.filename or ""

    if not raw_text or not raw_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript text cannot be empty."
        )

    logger.info(f"Received analysis request for transcript (filename: '{filename}', length: {len(raw_text)} chars)")

    try:
        # 1. Keywords Extraction
        keywords = extract_keywords(raw_text)

        # 2. Named Entities Recognition
        entities = extract_entities(raw_text)

        # 3. Sentiment Analysis
        sentiment = analyze_sentiment(raw_text)

        # 4. Emotion Analysis
        emotions = analyze_emotions(raw_text)

        # 5. Speaker Identification & Canonical Word Counts
        speakers = identify_speakers(raw_text)

        # 6. Scene & Dialogue Segmentation
        segments = segment_transcript(raw_text)

        # 7. Speaker Handoffs Extraction
        handoffs = extract_speaker_handoffs(segments)

        # 8. Content Classification
        category = classify_content(raw_text, filename=filename)

        # Total Word Count via canonical tokenizer
        total_words = count_words(raw_text)

        raw_response = {
            "wordCount": total_words,
            "keywords": keywords,
            "entities": entities,
            "sentiment": sentiment,
            "emotions": emotions,
            "speakers": speakers,
            "segments": segments,
            "handoffs": handoffs,
            "category": category
        }

        # 9. Pass through centralized guardrails validation & normalization layer
        validated_response = validate_and_normalize_metadata(raw_response, filename=filename)


        logger.info("Successfully completed transcript analysis and guardrail validation.")
        return validated_response

    except Exception as e:
        logger.error(f"Error during transcript analysis: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Metadata processing failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    logger.info(f"Starting MetaMind AI NLP Service on {host}:{port}")
    uvicorn.run("app.main:app", host=host, port=port, reload=False)

