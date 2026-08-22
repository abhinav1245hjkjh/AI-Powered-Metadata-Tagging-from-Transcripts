import logging
import re
import importlib
import threading
from typing import Dict, Any

logger = logging.getLogger(__name__)

_classifier_pipeline = None
_classifier_lock = threading.Lock()

CANDIDATE_LABELS = [
    "entertainment",
    "interview",
    "meeting",
    "education",
    "news",
    "technology",
    "finance",
    "healthcare",
    "legal",
    "podcast"
]

def get_classifier_pipeline():
    global _classifier_pipeline
    if _classifier_pipeline is not None:
        if _classifier_pipeline is not False:
            logger.info("[MODEL] Reusing cached Zero-shot classification model")
        return _classifier_pipeline

    with _classifier_lock:
        if _classifier_pipeline is None:
            try:
                logger.info("[MODEL] Loading Zero-shot classification pipeline (typeform/distilbert-base-uncased-mnli)...")
                transformers_mod = importlib.import_module("transformers")
                pipeline = getattr(transformers_mod, "pipeline")
                
                device = -1
                try:
                    torch_mod = importlib.import_module("torch")
                    if torch_mod.cuda.is_available():
                        device = 0
                except Exception:
                    device = -1

                _classifier_pipeline = pipeline(
                    "zero-shot-classification",
                    model="typeform/distilbert-base-uncased-mnli",
                    device=device
                )
                logger.info("[MODEL] Loaded Zero-shot classification pipeline successfully.")
            except (MemoryError, Exception) as e:
                logger.warning(f"[MODEL] Failed Zero-shot classification model: {e}. Heuristic classifier active.")
                _classifier_pipeline = False
    return _classifier_pipeline


def classify_content(text: str, filename: str = "") -> Dict[str, Any]:
    """
    Classify transcript into 10 domain candidate labels:
    entertainment, interview, meeting, education, news, technology, finance, healthcare, legal, podcast.
    Returns: {"label": "technology", "confidence": 0.94}
    """
    if not text or not text.strip():
        return {
            "label": "entertainment",
            "confidence": 0.5
        }

    pipeline = get_classifier_pipeline()
    if pipeline:
        try:
            # Sample first 1500 chars which strongly indicate domain/format
            sample_text = text[:1500]

            try:
                import torch
                ctx = torch.inference_mode() if hasattr(torch, "inference_mode") else torch.no_grad()
            except Exception:
                ctx = None

            if ctx:
                with ctx:
                    result = pipeline(
                        sample_text,
                        candidate_labels=CANDIDATE_LABELS,
                        multi_label=False
                    )
            else:
                result = pipeline(
                    sample_text,
                    candidate_labels=CANDIDATE_LABELS,
                    multi_label=False
                )

            if result and "labels" in result and "scores" in result:
                top_label = result["labels"][0]
                top_score = float(result["scores"][0])
                return {
                    "label": top_label,
                    "confidence": round(top_score, 4)
                }
        except Exception as e:
            logger.error(f"Transformer zero-shot classification error: {e}")

    # Fallback high-precision rule/keyword classifier
    combined_text = (filename + " " + text[:6000]).lower()
    
    cue_scores = {lbl: 0.0 for lbl in CANDIDATE_LABELS}
    
    # 1. Entertainment cues
    if any(k in combined_text for k in ["int.", "ext.", "scene", "script", "movie", "screenplay", "dialogue", "cut to:", "fade in:"]):
        cue_scores["entertainment"] += 4.5
    if "act 1" in combined_text or "act 2" in combined_text or "stage direction" in combined_text:
        cue_scores["entertainment"] += 3.0

    # 2. Interview cues
    if any(k in combined_text for k in ["interviewer:", "interviewee:", "q:", "welcome to the show", "thanks for having me", "tell us about"]):
        cue_scores["interview"] += 4.5
    if "interview" in combined_text:
        cue_scores["interview"] += 3.0
        
    # 3. Meeting cues
    if any(k in combined_text for k in ["meeting", "agenda", "action item", "standup", "committee", "board meeting", "sync", "rollout"]):
        cue_scores["meeting"] += 4.0
    if any(k in combined_text for k in ["q1", "q2", "q3", "q4", "quarterly", "executive committee"]):
        cue_scores["meeting"] += 3.5

    # 4. Education cues
    if any(k in combined_text for k in ["lecture", "course", "professor", "syllabus", "chapter", "homework", "curriculum", "textbook"]):
        cue_scores["education"] += 4.5
    if "student" in combined_text or "assignment" in combined_text or "university" in combined_text:
        cue_scores["education"] += 2.5

    # 5. News cues
    if any(k in combined_text for k in ["reporting live", "headline", "correspondent", "news anchor", "breaking news", "press release", "bulletin"]):
        cue_scores["news"] += 4.5
    if "broadcast" in combined_text or "journalism" in combined_text:
        cue_scores["news"] += 2.5

    # 6. Technology cues
    if any(k in combined_text for k in ["kubernetes", "docker", "microservice", "backend", "frontend", "github", "database", "latency", "pipeline", "gpu"]):
        cue_scores["technology"] += 4.5
    if any(k in combined_text for k in ["software", "cloud", "algorithm", "python", "javascript", "machine learning", "api", "ai model"]):
        cue_scores["technology"] += 3.0

    # 7. Finance cues
    if any(k in combined_text for k in ["investment", "portfolio", "dividend", "ebitda", "balance sheet", "equity", "wall street", "valuation"]):
        cue_scores["finance"] += 4.5
    if any(k in combined_text for k in ["revenue", "fiscal", "stocks", "interest rate", "banking", "capital", "inflation"]):
        cue_scores["finance"] += 3.0

    # 8. Healthcare cues
    if any(k in combined_text for k in ["patient", "doctor", "clinical", "diagnosis", "symptom", "therapy", "prescription", "physician"]):
        cue_scores["healthcare"] += 4.5
    if any(k in combined_text for k in ["hospital", "medical", "pharma", "surgery", "disease", "treatment"]):
        cue_scores["healthcare"] += 3.0

    # 9. Legal cues
    if any(k in combined_text for k in ["court", "judge", "attorney", "plaintiff", "defendant", "verdict", "deposition", "counsel", "lawsuit"]):
        cue_scores["legal"] += 4.5
    if any(k in combined_text for k in ["contract", "jurisdiction", "compliance", "clause", "liability", "statute", "gdpr", "soc2"]):
        cue_scores["legal"] += 3.0

    # 10. Podcast cues
    if any(k in combined_text for k in ["podcast", "episode", "listener", "welcome back to the podcast", "tune in", "patreon", "co-host"]):
        cue_scores["podcast"] += 4.5
    if "sponsor" in combined_text or "shoutout" in combined_text or "subscribers" in combined_text:
        cue_scores["podcast"] += 2.5

    # Determine top label
    best_label = max(cue_scores, key=cue_scores.get)
    max_score = cue_scores[best_label]
    
    if max_score > 0:
        confidence = min(0.72 + (max_score * 0.04), 0.97)
    else:
        best_label = "entertainment"
        confidence = 0.65

    return {
        "label": best_label,
        "confidence": round(confidence, 4)
    }
