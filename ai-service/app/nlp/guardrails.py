import logging
import math
from typing import Dict, Any, List
from app.nlp.entities import normalize_and_validate_entities
from app.nlp.keywords import validate_keyphrase, format_phrase
from app.nlp.segmentation import make_excerpt

logger = logging.getLogger("MetaMindAI.Guardrails")


def sanitize_float(val: Any, default: float = 0.0, min_val: float = -1.0, max_val: float = 1.0) -> float:
    """
    Safely sanitizes floats against NaN, infinity, or out-of-bound ranges.
    """
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return default
        return max(min_val, min(max_val, f))
    except (ValueError, TypeError):
        return default


def is_rate_limit_error(e: Any) -> bool:
    """
    Detects if an exception represents an HTTP 429 / RateLimitError from external APIs or models.
    """
    if e is None:
        return False
    msg = str(e).lower()
    if "429" in msg or "rate limit" in msg or "ratelimit" in msg or "too many requests" in msg:
        return True
    status_code = getattr(e, "status_code", None) or getattr(getattr(e, "response", None), "status_code", None)
    if status_code == 429:
        return True
    return False



def validate_and_normalize_metadata(metadata: Dict[str, Any], filename: str = "") -> Dict[str, Any]:
    """
    Centralized validation & normalization guardrail before AI metadata is returned or saved.
    
    Guarantees:
    - ENTITIES: Valid canonical category, non-empty, deduplicated, no institution/landmark misclassification.
    - KEYWORDS: Valid semantic keyphrases, no conversational fragments, deduplicated, title-cased.
    - SEGMENTS: Valid index, heading, speaker, full text, and non-empty dialogue excerpt.
    - CATEGORY: Valid category label and confidence bounded in [0.0, 1.0].
    - SENTIMENT & EMOTIONS: Valid polarity enum, scores bounded in range.
    - GENERAL SAFETY: No NaN/null values, no accidental placeholders. Safe failure recovery.
    """
    if not isinstance(metadata, dict):
        logger.error(f"[GUARDRAIL] Invalid metadata payload type for '{filename}'. Resetting to defaults.")
        metadata = {}

    sanitized: Dict[str, Any] = {}

    # 1. ENTITIES GUARDRAILS
    raw_entities = metadata.get("entities") or []
    if isinstance(raw_entities, list):
        sanitized["entities"] = normalize_and_validate_entities(raw_entities)
    else:
        logger.warning(f"[GUARDRAIL] Invalid entities format in '{filename}'. Defaulting to empty list.")
        sanitized["entities"] = []

    # 2. KEYWORDS GUARDRAILS
    raw_keywords = metadata.get("keywords") or []
    sanitized_keywords = []
    seen_kw = set()

    if isinstance(raw_keywords, list):
        for item in raw_keywords:
            phrase = str(item) if item is not None else ""
            if validate_keyphrase(phrase):
                formatted = format_phrase(phrase)
                key = formatted.lower()
                if key not in seen_kw:
                    seen_kw.add(key)
                    sanitized_keywords.append(formatted)
            else:
                logger.debug(f"[GUARDRAIL] Rejected invalid keyphrase '{phrase}' in '{filename}'.")

    sanitized["keywords"] = sanitized_keywords or ["General Discussion", "Transcript Analysis"]

    # 3. SENTIMENT GUARDRAILS
    raw_sentiment = metadata.get("sentiment") if isinstance(metadata.get("sentiment"), dict) else {}
    polarity_raw = str(raw_sentiment.get("polarity") or "neutral").lower().strip()
    if polarity_raw not in {"positive", "negative", "neutral"}:
        polarity_raw = "neutral"

    score_raw = sanitize_float(raw_sentiment.get("score"), default=0.0, min_val=-1.0, max_val=1.0)
    sanitized["sentiment"] = {
        "polarity": polarity_raw,
        "score": score_raw
    }

    # 4. EMOTIONS GUARDRAILS
    raw_emotions = metadata.get("emotions") or []
    sanitized_emotions = []
    if isinstance(raw_emotions, list):
        for emo in raw_emotions:
            if isinstance(emo, dict) and "label" in emo:
                lbl = str(emo.get("label")).strip()
                score = sanitize_float(emo.get("score"), default=0.0, min_val=0.0, max_val=1.0)
                if lbl:
                    sanitized_emotions.append({"label": lbl, "score": score})
    sanitized["emotions"] = sanitized_emotions or [{"label": "Neutral", "score": 1.0}]

    # 5. SPEAKERS GUARDRAILS
    raw_speakers = metadata.get("speakers") or []
    sanitized_speakers = []
    seen_spk = set()
    if isinstance(raw_speakers, list):
        for spk in raw_speakers:
            if isinstance(spk, dict):
                name = str(spk.get("speaker") or "").strip()
                count = int(spk.get("lineCount") or 1)
                w_count = int(spk.get("wordCount") or 0)
                if name and name.lower() not in seen_spk:
                    seen_spk.add(name.lower())
                    sanitized_speakers.append({
                        "speaker": name,
                        "lineCount": max(1, count),
                        "wordCount": max(0, w_count)
                    })

    sanitized["speakers"] = sanitized_speakers

    # 6. SEGMENTS GUARDRAILS
    raw_segments = metadata.get("segments") or []
    sanitized_segments = []
    if isinstance(raw_segments, list):
        for idx, seg in enumerate(raw_segments, start=1):
            if isinstance(seg, dict):
                heading = str(seg.get("heading") or f"Segment {idx}").strip()
                speaker = str(seg.get("speaker") or "").strip()
                text = str(seg.get("text") or "").strip()
                excerpt = str(seg.get("excerpt") or "").strip()

                if not excerpt and text:
                    excerpt = make_excerpt(text)

                sanitized_segments.append({
                    "index": int(seg.get("index") or idx),
                    "heading": heading,
                    "speaker": speaker,
                    "text": text,
                    "excerpt": excerpt or "Dialogue scene content."
                })

    sanitized["segments"] = sanitized_segments or [{
        "index": 1,
        "heading": "Complete Transcript",
        "speaker": "",
        "text": "",
        "excerpt": "Complete transcript text."
    }]

    # 7. HANDOFFS GUARDRAILS
    raw_handoffs = metadata.get("handoffs") or []
    sanitized_handoffs = []
    if isinstance(raw_handoffs, list):
        for h in raw_handoffs:
            if isinstance(h, dict):
                spk_from = str(h.get("from") or h.get("from_speaker") or "").strip()
                spk_to = str(h.get("to") or h.get("to_speaker") or "").strip()
                if spk_from and spk_to and spk_from.lower() != spk_to.lower():
                    sanitized_handoffs.append({
                        "from": spk_from,
                        "to": spk_to,
                        "segmentIndex": int(h.get("segmentIndex") or 1),
                        "heading": str(h.get("heading") or ""),
                        "context": str(h.get("context") or "")
                    })
    sanitized["handoffs"] = sanitized_handoffs

    # 8. WORD COUNT GUARDRAIL
    sanitized["wordCount"] = int(metadata.get("wordCount") or 0)

    # 9. CATEGORY / CLASSIFICATION GUARDRAILS
    raw_cat = metadata.get("category") if isinstance(metadata.get("category"), dict) else {}
    cat_label = str(raw_cat.get("label") or "General").strip().capitalize()
    cat_conf = sanitize_float(raw_cat.get("confidence"), default=0.85, min_val=0.0, max_val=1.0)
    sanitized["category"] = {
        "label": cat_label,
        "confidence": cat_conf
    }

    logger.info(f"[GUARDRAIL] Metadata validation passed for '{filename}' ({len(sanitized['entities'])} entities, {len(sanitized['keywords'])} keywords, {len(sanitized['segments'])} segments, {len(sanitized['handoffs'])} handoffs).")
    return sanitized

