import logging
import re
import importlib
import threading
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

_emotion_pipeline = None
_emotion_lock = threading.Lock()

ALL_EMOTIONS = [
    "joy",
    "optimism",
    "enthusiasm",
    "trust",
    "curiosity",
    "surprise",
    "sadness",
    "anger",
    "fear",
    "disgust",
    "frustration",
    "neutral"
]

EMOTION_LEXICONS = {
    "joy": [
        "happy", "great", "excellent", "love", "delight", "wonderful", "glad", "laugh",
        "smile", "success", "cheer", "celebrate", "pleased", "content", "bliss", "proud"
    ],
    "optimism": [
        "hope", "optimistic", "promising", "future", "opportunity", "growth", "potential",
        "confident", "progress", "achieve", "improve", "forecast", "positive", "favorable", "forward"
    ],
    "enthusiasm": [
        "excited", "enthusiastic", "thrilled", "passionate", "eager", "momentum", "fantastic",
        "amazing", "incredible", "energized", "inspiring", "dynamic", "phenomenal"
    ],
    "trust": [
        "trust", "agree", "approved", "partner", "reliable", "support", "collaborate",
        "respect", "honest", "commit", "guarantee", "assure", "secure", "aligned", "faith"
    ],
    "curiosity": [
        "curious", "wonder", "explore", "investigate", "question", "interest", "discover",
        "learn", "how", "why", "what if", "analyze", "inquire", "fascinating", "research"
    ],
    "surprise": [
        "surprise", "shock", "unexpected", "astonished", "wow", "unbelievable", "suddenly",
        "stunned", "revelation", "jaw-dropping", "startled", "astounded"
    ],
    "sadness": [
        "sad", "depressed", "sorrow", "grief", "cry", "mourn", "hurt", "unhappy",
        "pain", "loss", "tragic", "tear", "regret", "lonely", "heartbroken", "despair"
    ],
    "anger": [
        "angry", "furious", "hate", "rage", "mad", "outrage", "hostility", "fury",
        "resent", "offend", "spite", "yell", "wrath", "bitter", "enraged"
    ],
    "fear": [
        "afraid", "fear", "scared", "terror", "danger", "panic", "horrified", "dread",
        "worry", "alarm", "anxious", "anxiety", "threat", "terrified", "frightened"
    ],
    "disgust": [
        "disgust", "nasty", "gross", "revolting", "horrible", "vile", "offensive",
        "sick", "repulsive", "loathe", "appalled", "distaste", "abhor"
    ],
    "frustration": [
        "frustrated", "annoyed", "irritated", "bottleneck", "delay", "obstacle", "stuck",
        "struggle", "friction", "blocker", "impatient", "bother", "hassle", "headache"
    ],
    "neutral": [
        "is", "the", "are", "we", "okay", "alright", "proceed", "meeting", "normal",
        "said", "note", "item", "standard", "scheduled", "agenda", "status", "report"
    ]
}


def get_emotion_pipeline():
    global _emotion_pipeline
    if _emotion_pipeline is not None:
        if _emotion_pipeline is not False:
            logger.info("[MODEL] Reusing cached Emotion model")
        return _emotion_pipeline

    with _emotion_lock:
        if _emotion_pipeline is None:
            try:
                logger.info("[MODEL] Loading Emotion classification model (j-hartmann/emotion-english-distilroberta-base)...")
                transformers_mod = importlib.import_module("transformers")
                pipeline = getattr(transformers_mod, "pipeline")
                
                device = -1
                try:
                    torch_mod = importlib.import_module("torch")
                    if torch_mod.cuda.is_available():
                        device = 0
                except Exception:
                    device = -1

                _emotion_pipeline = pipeline(
                    "text-classification",
                    model="j-hartmann/emotion-english-distilroberta-base",
                    top_k=None,
                    device=device,
                    truncation=True,
                    max_length=512
                )
                logger.info("[MODEL] Loaded Emotion model successfully.")
            except (MemoryError, Exception) as e:
                logger.warning(f"[MODEL] Failed Emotion model: {e}. Fallback emotion heuristic will be active.")
                _emotion_pipeline = False
    return _emotion_pipeline


def _extract_lexicon_scores(text: str) -> Dict[str, float]:
    """Compute raw keyword frequency scores across all 12 emotions."""
    lower_text = text.lower()
    raw_scores: Dict[str, float] = {}
    
    for emo, words in EMOTION_LEXICONS.items():
        score = 0.0
        for w in words:
            # Word boundary matching
            matches = len(re.findall(r'\b' + re.escape(w) + r'\b', lower_text))
            score += matches * (1.5 if emo in ["frustration", "curiosity", "optimism", "enthusiasm", "trust"] else 1.0)
        raw_scores[emo] = score

    # Base baseline for smooth distribution
    for emo in ALL_EMOTIONS:
        if emo not in raw_scores:
            raw_scores[emo] = 0.0
        raw_scores[emo] += (0.8 if emo == "neutral" else 0.1)

    return raw_scores


def analyze_emotions(text: str) -> List[Dict[str, Any]]:
    """
    Extract multidimensional emotion distribution across 12 nuanced labels:
    joy, optimism, enthusiasm, trust, curiosity, surprise, sadness, anger, fear, disgust, frustration, neutral.
    Returns list of dicts: [{"label": "optimism", "score": 0.35}, ...] sorted descending.
    """
    if not text or not text.strip():
        base_scores = [{"label": emo, "score": 1.0 if emo == "neutral" else 0.0} for emo in ALL_EMOTIONS]
        return base_scores

    nlp_pipeline = get_emotion_pipeline()
    lex_scores = _extract_lexicon_scores(text)
    
    if nlp_pipeline:
        try:
            # Chunking long transcripts into representative segments
            paragraphs = [p.strip() for p in text.split('\n') if len(p.strip()) > 20]
            if not paragraphs:
                paragraphs = [text[:1000]]
            
            sample_paragraphs = paragraphs[:5]
            aggregated_scores: Dict[str, float] = {emo: 0.0 for emo in ALL_EMOTIONS}

            try:
                import torch
                ctx = torch.inference_mode() if hasattr(torch, "inference_mode") else torch.no_grad()
            except Exception:
                ctx = None

            for p in sample_paragraphs:
                chunk_text = p[:500]
                if ctx:
                    with ctx:
                        results = nlp_pipeline(chunk_text)
                else:
                    results = nlp_pipeline(chunk_text)

                if results and isinstance(results, list):
                    item_scores = results[0] if isinstance(results[0], list) else results
                    for entry in item_scores:
                        lbl = entry["label"].lower()
                        score = float(entry["score"])
                        if lbl in aggregated_scores:
                            aggregated_scores[lbl] += score

            count = max(len(sample_paragraphs), 1)
            for lbl in aggregated_scores:
                aggregated_scores[lbl] = aggregated_scores[lbl] / count

            # Enrich base transformer 7 emotions with nuanced sub-emotions from text
            # E.g. Split joy into joy, optimism, enthusiasm; split anger into anger, frustration; add trust & curiosity
            joy_score = aggregated_scores.get("joy", 0.0)
            anger_score = aggregated_scores.get("anger", 0.0)

            total_lex = sum(lex_scores.values()) or 1.0
            lex_norm = {k: v / total_lex for k, v in lex_scores.items()}

            # Blend sub-emotions based on lexical cues
            aggregated_scores["optimism"] = round((joy_score * 0.35) + (lex_norm.get("optimism", 0.0) * 0.65), 4)
            aggregated_scores["enthusiasm"] = round((joy_score * 0.30) + (lex_norm.get("enthusiasm", 0.0) * 0.70), 4)
            aggregated_scores["trust"] = round((aggregated_scores.get("neutral", 0.0) * 0.2) + (lex_norm.get("trust", 0.0) * 0.8), 4)
            aggregated_scores["curiosity"] = round(lex_norm.get("curiosity", 0.0) * 0.9 + (aggregated_scores.get("surprise", 0.0) * 0.1), 4)
            aggregated_scores["frustration"] = round((anger_score * 0.45) + (lex_norm.get("frustration", 0.0) * 0.55), 4)
            
            # Recalibrate joy and anger to share mass with sub-emotions
            aggregated_scores["joy"] = round(joy_score * 0.45 + (lex_norm.get("joy", 0.0) * 0.55), 4)
            aggregated_scores["anger"] = round(anger_score * 0.55 + (lex_norm.get("anger", 0.0) * 0.45), 4)

            # Normalize all 12 emotions to sum to 1.0
            total_sum = sum(aggregated_scores.values()) or 1.0
            formatted = [
                {"label": emo, "score": round(score / total_sum, 4)}
                for emo, score in aggregated_scores.items()
            ]
            formatted.sort(key=lambda x: x["score"], reverse=True)
            return formatted

        except Exception as e:
            logger.error(f"Error during transformer emotion inference: {e}. Using fallback heuristic.")

    # Fallback heuristic using 12-emotion lexicon
    total = sum(lex_scores.values()) or 1.0
    fallback_res = [
        {"label": emo, "score": round(score / total, 4)}
        for emo, score in lex_scores.items()
    ]
    fallback_res.sort(key=lambda x: x["score"], reverse=True)
    return fallback_res
