

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
from app.nlp.guardrails import validate_and_normalize_metadata, is_rate_limit_error

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
    logger.info("[AI DEBUG] /analyze request received")
    logger.info(f"[AI DEBUG] LOW_MEMORY_MODE={os.environ.get('LOW_MEMORY_MODE')}")
    logger.info("[AI DEBUG] Analysis started")

    raw_text = payload.text
    filename = payload.filename or ""

    if not raw_text or not raw_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript text cannot be empty."
        )

    logger.info(f"Received analysis request for transcript (filename: '{filename}', length: {len(raw_text)} chars)")

    # 1. Keywords Extraction
    try:
        keywords = extract_keywords(raw_text)
        logger.info(f"[FEATURE SUCCESS] Keywords: extracted {len(keywords)} terms")
    except Exception as e:
        if is_rate_limit_error(e):
            logger.warning("[AI] External provider rate limited; using local fallback.")
        else:
            logger.warning(f"[FEATURE FAILURE] Keywords extraction failed: {e}. Using guardrail fallback.")
        keywords = []

    # 2. Named Entities Recognition
    try:
        entities = extract_entities(raw_text)
        logger.info(f"[FEATURE SUCCESS] Entities: extracted {len(entities)} entities")
    except Exception as e:
        if is_rate_limit_error(e):
            logger.warning("[AI] External provider rate limited; using local fallback.")
        else:
            logger.warning(f"[FEATURE FAILURE] Entity extraction failed: {e}. Using guardrail fallback.")
        entities = []

    # 3. Sentiment Analysis
    try:
        sentiment = analyze_sentiment(raw_text)
        logger.info(f"[FEATURE SUCCESS] Sentiment: {sentiment.get('polarity')} (score: {sentiment.get('score')})")
    except Exception as e:
        if is_rate_limit_error(e):
            logger.warning("[AI] External provider rate limited; using local fallback.")
        else:
            logger.warning(f"[FEATURE FAILURE] Sentiment analysis failed: {e}. Using guardrail fallback.")
        sentiment = {"polarity": "neutral", "score": 0.0}

    # 4. Emotion Analysis
    try:
        emotions = analyze_emotions(raw_text)
        logger.info(f"[FEATURE SUCCESS] Emotions: extracted {len(emotions)} emotion scores")
    except Exception as e:
        if is_rate_limit_error(e):
            logger.warning("[AI] External provider rate limited; using local fallback.")
        else:
            logger.warning(f"[FEATURE FAILURE] Emotion analysis failed: {e}. Using guardrail fallback.")
        emotions = []

    # 5. Speaker Identification
    try:
        speakers = identify_speakers(raw_text)
        logger.info(f"[FEATURE SUCCESS] Speakers: identified {len(speakers)} speakers")
    except Exception as e:
        if is_rate_limit_error(e):
            logger.warning("[AI] External provider rate limited; using local fallback.")
        else:
            logger.warning(f"[FEATURE FAILURE] Speaker identification failed: {e}. Using guardrail fallback.")
        speakers = []

    # 6. Scene & Dialogue Segmentation
    try:
        segments = segment_transcript(raw_text)
        logger.info(f"[FEATURE SUCCESS] Segments: created {len(segments)} scene segments")
    except Exception as e:
        if is_rate_limit_error(e):
            logger.warning("[AI] External provider rate limited; using local fallback.")
        else:
            logger.warning(f"[FEATURE FAILURE] Scene segmentation failed: {e}. Using guardrail fallback.")
        segments = []

    # 7. Speaker Handoffs Extraction
    try:
        handoffs = extract_speaker_handoffs(segments)
        logger.info(f"[FEATURE SUCCESS] Handoffs: extracted {len(handoffs)} speaker handoffs")
    except Exception as e:
        if is_rate_limit_error(e):
            logger.warning("[AI] External provider rate limited; using local fallback.")
        else:
            logger.warning(f"[FEATURE FAILURE] Speaker handoff extraction failed: {e}. Using guardrail fallback.")
        handoffs = []

    # 8. Content Classification
    try:
        category = classify_content(raw_text, filename=filename)
        logger.info(f"[FEATURE SUCCESS] Classification: domain '{category.get('label')}' (confidence: {category.get('confidence')})")
    except Exception as e:
        if is_rate_limit_error(e):
            logger.warning("[AI] External provider rate limited; using local fallback.")
        else:
            logger.warning(f"[FEATURE FAILURE] Content classification failed: {e}. Using guardrail fallback.")
        category = {"label": "General", "confidence": 0.85}


    # Total Word Count via canonical tokenizer
    try:
        total_words = count_words(raw_text)
    except Exception:
        total_words = len(raw_text.split())

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
    try:
        validated_response = validate_and_normalize_metadata(raw_response, filename=filename)
        logger.info("[AI DEBUG] Analysis completed successfully")
        logger.info("Successfully completed transcript analysis and guardrail validation.")
        return validated_response
    except Exception as guardrail_err:
        logger.error(f"[AI DEBUG] Guardrail normalization failed: {guardrail_err}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Metadata guardrail validation failed: {str(guardrail_err)}"
        )


if __name__ == "__main__":
    import uvicorn
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    logger.info(f"Starting MetaMind AI NLP Service on {host}:{port}")
    uvicorn.run("app.main:app", host=host, port=port, reload=False)

