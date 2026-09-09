import logging
import re
import importlib
import threading
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

_vader_analyzer = None
_vader_lock = threading.Lock()

# Built-in Sentiment Lexicon with weights for fallback and calibration
POSITIVE_WORDS = {
    "delighted": 3.0, "phenomenal": 3.0, "outstanding": 3.0, "excellent": 2.8, "fantastic": 2.8,
    "superb": 2.8, "wonderful": 2.6, "brilliant": 2.6, "achievement": 2.5, "exceeded": 2.5,
    "growth": 2.2, "success": 2.5, "happy": 2.2, "great": 2.0, "good": 1.8, "love": 2.5,
    "perfect": 2.5, "innovative": 2.2, "impressive": 2.2, "excited": 2.4, "profit": 2.0,
    "revenue": 1.5, "approved": 1.8, "accomplish": 2.0, "victory": 2.5, "valuable": 2.0,
    "thriving": 2.2, "celebrate": 2.2, "proud": 2.2, "optimistic": 2.0, "beneficial": 2.0,
    "effective": 1.8, "progress": 1.8, "advantage": 1.8, "reward": 2.0, "pleased": 2.0,
    "strong": 1.6, "improved": 1.8, "fabulous": 2.8, "terrific": 2.6, "glad": 1.8,
    "best": 2.4, "positive": 1.8, "win": 2.2, "gain": 1.6, "breakthrough": 2.6
}

NEGATIVE_WORDS = {
    "horrific": 3.2, "dreadful": 3.0, "catastrophic": 3.2, "failure": 2.8, "disaster": 3.0,
    "terrible": 2.8, "awful": 2.8, "horrible": 2.8, "crisis": 2.6, "danger": 2.4, "threat": 2.4,
    "dead": 2.5, "kill": 2.5, "destroy": 2.5, "fraud": 2.8, "breach": 2.6, "lawsuit": 2.4,
    "deficit": 2.2, "loss": 2.2, "decline": 2.0, "broken": 2.2, "error": 2.0, "bug": 1.8,
    "damage": 2.2, "pain": 2.2, "hurt": 2.2, "sad": 2.0, "angry": 2.2, "hate": 2.5,
    "fear": 2.2, "panic": 2.5, "reject": 2.2, "struggle": 2.0, "delayed": 1.8, "bad": 2.0,
    "poor": 2.0, "worst": 2.8, "flaw": 2.0, "harm": 2.4, "severe": 2.0, "ugly": 2.0,
    "negative": 1.8, "lose": 2.0, "bottleneck": 1.8, "problem": 1.8, "impossible": 1.8
}

NEGATIONS = {"not", "never", "no", "without", "hardly", "scarcely", "barely", "cannot", "cant", "wont", "dont", "isnt", "wasnt", "arent"}
INTENSIFIERS = {"very": 1.5, "extremely": 2.0, "phenomenally": 2.0, "incredibly": 1.8, "exceptionally": 1.8, "highly": 1.5, "deeply": 1.5, "truly": 1.4, "super": 1.5}


def is_rate_limit_error(e: Exception) -> bool:
    if e is None:
        return False
    msg = str(e).lower()
    if "429" in msg or "rate limit" in msg or "ratelimit" in msg or "too many requests" in msg:
        return True
    status_code = getattr(e, "status_code", None) or getattr(getattr(e, "response", None), "status_code", None)
    return status_code == 429


def get_vader_analyzer():
    global _vader_analyzer
    if _vader_analyzer is None:
        with _vader_lock:
            if _vader_analyzer is None:
                try:
                    logger.info("[MODEL] Loading VADER Sentiment Analyzer...")
                    nltk = importlib.import_module("nltk")
                    try:
                        nltk.data.find("sentiment/vader_lexicon.zip")
                    except LookupError:
                        try:
                            logger.info("Downloading NLTK VADER lexicon...")
                            nltk.download("vader_lexicon", quiet=True)
                        except Exception as e:
                            if is_rate_limit_error(e):
                                logger.warning("[AI] External provider rate limited; using local fallback.")
                            else:
                                logger.warning(f"Could not download VADER lexicon: {e}")
                    
                    vader_mod = importlib.import_module("nltk.sentiment.vader")
                    SentimentIntensityAnalyzer = getattr(vader_mod, "SentimentIntensityAnalyzer")
                    _vader_analyzer = SentimentIntensityAnalyzer()
                    logger.info("[MODEL] Loaded VADER Sentiment Analyzer successfully.")
                except Exception as e:
                    if is_rate_limit_error(e):
                        logger.warning("[AI] External provider rate limited; using local fallback.")
                    else:
                        logger.warning(f"[MODEL] Failed VADER Analyzer: {e}. Heuristic sentiment analyzer active.")
                    _vader_analyzer = False
    return _vader_analyzer



def _extract_utterances(text: str) -> List[str]:
    """Split transcript text into meaningful dialogue lines / sentences."""
    raw_lines = text.split('\n')
    utterances = []
    
    for line in raw_lines:
        cleaned = line.strip()
        if not cleaned:
            continue
        # Strip speaker labels like 'SARAH:' or 'AGENT SMITH:'
        cleaned = re.sub(r'^[A-Z0-9\s_\-\.]{2,30}:\s*', '', cleaned)
        # Strip scene markers like 'INT.' or 'EXT.'
        if re.match(r'^(INT\.|EXT\.|CUT TO:|FADE IN:)', cleaned, re.IGNORECASE):
            continue
        
        # Split line into sentences if multiple
        sentences = re.split(r'(?<=[.!?])\s+', cleaned)
        for s in sentences:
            s_clean = s.strip()
            if len(s_clean.split()) >= 2:
                utterances.append(s_clean)
                
    if not utterances:
        utterances = [text.strip()[:2000]]
    return utterances


def _heuristic_sentiment(text: str) -> Dict[str, Any]:
    """
    High-precision built-in rule/lexicon sentiment analyzer.
    Used when NLTK VADER is unavailable or to cross-calibrate.
    """
    utterances = _extract_utterances(text)
    total_pos_score = 0.0
    total_neg_score = 0.0
    pos_count = 0
    neg_count = 0
    
    for utt in utterances:
        words = re.findall(r'\b[a-zA-Z]+\b', utt.lower())
        utt_pos = 0.0
        utt_neg = 0.0
        
        for i, w in enumerate(words):
            multiplier = 1.0
            # Check preceding word for intensifier
            if i > 0 and words[i - 1] in INTENSIFIERS:
                multiplier = INTENSIFIERS[words[i - 1]]
            # Check preceding 1-2 words for negation
            is_negated = False
            if (i > 0 and words[i - 1] in NEGATIONS) or (i > 1 and words[i - 2] in NEGATIONS):
                is_negated = True
                
            if w in POSITIVE_WORDS:
                val = POSITIVE_WORDS[w] * multiplier
                if is_negated:
                    utt_neg += val * 0.8
                else:
                    utt_pos += val
            elif w in NEGATIVE_WORDS:
                val = NEGATIVE_WORDS[w] * multiplier
                if is_negated:
                    utt_pos += val * 0.6
                else:
                    utt_neg += val
                    
        if utt_pos > utt_neg and utt_pos >= 1.5:
            pos_count += 1
            total_pos_score += utt_pos
        elif utt_neg > utt_pos and utt_neg >= 1.5:
            neg_count += 1
            total_neg_score += utt_neg
            
    diff = total_pos_score - total_neg_score
    magnitude = total_pos_score + total_neg_score + 1.0
    
    # Calculate normalized compound score between -1.0 and 1.0
    raw_compound = diff / magnitude
    compound = max(-1.0, min(1.0, round(raw_compound * 1.5, 4)))
    
    if compound >= 0.04 or (pos_count > neg_count and total_pos_score > 2.0):
        polarity = "positive"
        if compound < 0.05:
            compound = 0.15
    elif compound <= -0.04 or (neg_count > pos_count and total_neg_score > 2.0):
        polarity = "negative"
        if compound > -0.05:
            compound = -0.15
    else:
        polarity = "neutral"
        compound = 0.0
        
    return {
        "polarity": polarity,
        "score": float(compound)
    }


def analyze_sentiment(text: str) -> Dict[str, Any]:
    """
    Analyze sentiment using sentence/utterance-level NLTK VADER aggregation
    with robust heuristic lexicon fallback.
    Returns polarity ('positive', 'negative', 'neutral') and compound score (-1.0 to 1.0).
    """
    if not text or not text.strip():
        return {
            "polarity": "neutral",
            "score": 0.0
        }

    analyzer = get_vader_analyzer()
    if not analyzer:
        return _heuristic_sentiment(text)

    try:
        utterances = _extract_utterances(text)
        
        # If single short sentence, score directly
        if len(utterances) <= 1:
            scores = analyzer.polarity_scores(text[:2000])
            compound = round(scores.get("compound", 0.0), 4)
            pos_val = scores.get("pos", 0.0)
            neg_val = scores.get("neg", 0.0)
            
            if compound >= 0.05 or (pos_val > neg_val + 0.05 and pos_val > 0.1):
                polarity = "positive"
            elif compound <= -0.05 or (neg_val > pos_val + 0.05 and neg_val > 0.1):
                polarity = "negative"
            else:
                polarity = "neutral"
                
            return {
                "polarity": polarity,
                "score": float(compound)
            }

        # Multi-utterance transcript aggregation
        utterance_compounds = []
        emotive_weights = []
        pos_utterance_count = 0
        neg_utterance_count = 0
        total_pos_intensity = 0.0
        total_neg_intensity = 0.0

        for utt in utterances[:60]:  # Evaluate up to top 60 representative utterances
            scores = analyzer.polarity_scores(utt)
            c = scores.get("compound", 0.0)
            p = scores.get("pos", 0.0)
            n = scores.get("neg", 0.0)

            total_pos_intensity += p
            total_neg_intensity += n

            if c >= 0.05:
                pos_utterance_count += 1
                utterance_compounds.append(c)
                emotive_weights.append(1.0 + abs(c))
            elif c <= -0.05:
                neg_utterance_count += 1
                utterance_compounds.append(c)
                emotive_weights.append(1.0 + abs(c))
            else:
                utterance_compounds.append(c)
                emotive_weights.append(0.3)  # Downweight neutral lines to prevent flattening

        if sum(emotive_weights) > 0:
            weighted_compound = sum(c * w for c, w in zip(utterance_compounds, emotive_weights)) / sum(emotive_weights)
        else:
            weighted_compound = 0.0

        # Also get whole-document VADER baseline
        doc_scores = analyzer.polarity_scores(text[:12000])
        doc_compound = doc_scores.get("compound", 0.0)
        
        # Blend weighted utterance compound with document compound
        final_compound = round((weighted_compound * 0.7) + (doc_compound * 0.3), 4)

        # Polarity decision based on calibrated compound and utterance dominance
        if final_compound >= 0.05 or (pos_utterance_count > neg_utterance_count and total_pos_intensity > total_neg_intensity * 1.3):
            polarity = "positive"
            if final_compound < 0.05:
                final_compound = max(0.08, round(weighted_compound, 4))
        elif final_compound <= -0.05 or (neg_utterance_count > pos_utterance_count and total_neg_intensity > total_pos_intensity * 1.3):
            polarity = "negative"
            if final_compound > -0.05:
                final_compound = min(-0.08, round(weighted_compound, 4))
        else:
            polarity = "neutral"
            final_compound = 0.0

        return {
            "polarity": polarity,
            "score": float(final_compound)
        }

    except Exception as e:
        if is_rate_limit_error(e):
            logger.warning("[AI] External provider rate limited; using local fallback.")
        else:
            logger.error(f"Error during VADER sentiment analysis: {e}. Using fallback heuristic.")
        return _heuristic_sentiment(text)
