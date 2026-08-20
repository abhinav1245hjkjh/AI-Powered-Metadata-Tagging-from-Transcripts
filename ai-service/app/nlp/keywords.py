import logging
import importlib
import re
import threading
from typing import List

logger = logging.getLogger(__name__)

_kw_model = None
_kw_lock = threading.Lock()

# Comprehensive conversational stop words and fillers for transcript domain
CONVERSATIONAL_STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at",
    "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can", "can't", "cannot",
    "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few",
    "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll",
    "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll",
    "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most",
    "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our",
    "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't",
    "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there",
    "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too",
    "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't",
    "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's",
    "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself",
    "yourselves",
    # Conversational fillers & low-value verbs
    "know", "tell", "like", "probably", "maybe", "haven", "kid", "think", "said", "say", "says", "gonna", "wanna",
    "got", "let", "come", "see", "look", "well", "mean", "right", "okay", "yeah", "yes", "sure", "thing", "things",
    "really", "actually", "just", "much", "many", "good", "great", "way", "need", "want", "take", "make", "made",
    "give", "given", "feel", "feels", "feeling", "look", "looks", "looking", "man", "men", "guy", "guys", "lot",
    "day", "night", "talk", "talking", "ask", "asked", "asking", "told", "heard", "hear", "listen", "listening",
    "int", "ext", "scene", "comms", "over", "behind", "across"
}


def get_keybert_model():
    """
    Singleton thread-safe loader for KeyBERT with all-MiniLM-L6-v2 embeddings.
    """
    global _kw_model
    if _kw_model is None:
        with _kw_lock:
            if _kw_model is None:
                try:
                    logger.info("[MODEL] Loading KeyBERT (all-MiniLM-L6-v2)...")
                    keybert_module = importlib.import_module("keybert")
                    KeyBERT = getattr(keybert_module, "KeyBERT")
                    _kw_model = KeyBERT(model="all-MiniLM-L6-v2")
                    logger.info("[MODEL] Loaded KeyBERT successfully.")
                except Exception as e:
                    logger.warning(f"[MODEL] Failed KeyBERT: {e}. Semantic TF-IDF fallback will be active.")
                    _kw_model = False
    return _kw_model


def is_valid_phrase(phrase: str) -> bool:
    """
    Filter out phrases that consist entirely of stop words, single characters, or numbers.
    """
    cleaned = phrase.strip().lower()
    if len(cleaned) < 3:
        return False

    tokens = [t for t in re.findall(r'[a-zA-Z]+', cleaned) if len(t) > 1]
    if not tokens:
        return False

    # Check that at least one token is a meaningful, non-stopword word
    substantive_tokens = [t for t in tokens if t not in CONVERSATIONAL_STOPWORDS and len(t) > 2]
    if not substantive_tokens:
        return False

    # Filter out single conversational filler words
    if len(tokens) == 1 and tokens[0] in CONVERSATIONAL_STOPWORDS:
        return False

    return True


def format_phrase(phrase: str) -> str:
    """
    Clean and title-case keyphrases for clean presentation.
    """
    # Clean whitespace and unwanted symbols
    cleaned = re.sub(r'[\r\n\t_]+', ' ', phrase).strip()
    words = cleaned.split()
    return " ".join(words)


def extract_keywords(text: str, top_n: int = 10) -> List[str]:
    """
    Extract high-relevance keyphrases and multi-word conceptual topics using KeyBERT with MMR diversity.
    Ensures multi-word n-gram support (1–3 words) and prunes conversational filler words.
    """
    if not text or not text.strip():
        return []

    # Clean text
    cleaned_text = re.sub(r'[\r\n\t]+', ' ', text).strip()
    if len(cleaned_text.split()) < 4:
        words = [w.strip(".,!?:;\"'()[]{}") for w in cleaned_text.split() if is_valid_phrase(w)]
        return list(dict.fromkeys([format_phrase(w) for w in words]))[:top_n]

    model = get_keybert_model()

    if model:
        try:
            # Run inference without gradient tracking to conserve RAM (< 512MB)
            try:
                import torch
                ctx = torch.inference_mode() if hasattr(torch, "inference_mode") else torch.no_grad()
            except Exception:
                ctx = None

            params = {
                "keyphrase_ngram_range": (1, 3),
                "stop_words": "english",
                "use_mmr": True,
                "diversity": 0.55,
                "top_n": top_n * 2
            }

            if ctx:
                with ctx:
                    extracted = model.extract_keywords(cleaned_text, **params)
            else:
                extracted = model.extract_keywords(cleaned_text, **params)

            # Filter, clean, and deduplicate
            unique_phrases = []
            seen = set()

            for item in extracted:
                phrase = item[0].strip()
                if is_valid_phrase(phrase):
                    formatted = format_phrase(phrase)
                    key = formatted.lower()
                    if key not in seen:
                        seen.add(key)
                        unique_phrases.append(formatted)
                    if len(unique_phrases) >= top_n:
                        break

            if unique_phrases:
                return unique_phrases

        except Exception as e:
            logger.warning(f"KeyBERT extraction failed, using TF-IDF n-gram fallback: {e}")

    # Fallback to TF-IDF with Multi-Word N-Grams and Conversational Stopword Filtering
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer

        stop_list = list(CONVERSATIONAL_STOPWORDS)
        vectorizer = TfidfVectorizer(
            stop_words=stop_list,
            ngram_range=(1, 3),
            min_df=1,
            max_df=0.9,
            max_features=top_n * 4
        )

        tfidf_matrix = vectorizer.fit_transform([cleaned_text])
        feature_names = vectorizer.get_feature_names_out()
        scores = tfidf_matrix.toarray()[0]
        sorted_indices = scores.argsort()[::-1]

        fallback_keywords = []
        seen = set()

        for idx in sorted_indices:
            kw = feature_names[idx].strip()
            if is_valid_phrase(kw):
                formatted = format_phrase(kw)
                key = formatted.lower()
                # Check for redundancy with already selected phrases
                if key not in seen and not any(key in p.lower() or p.lower() in key for p in fallback_keywords):
                    seen.add(key)
                    fallback_keywords.append(formatted)
            if len(fallback_keywords) >= top_n:
                break

        if fallback_keywords:
            return fallback_keywords

    except Exception as e:
        logger.error(f"TF-IDF fallback keyword extraction failed: {e}")

    # Pure heuristic multi-word regex extractor
    candidates = re.findall(r'\b[A-Za-z]{3,}(?:\s+[A-Za-z]{3,}){1,2}\b', cleaned_text)
    meaningful = []
    seen = set()
    for cand in candidates:
        if is_valid_phrase(cand):
            formatted = format_phrase(cand)
            key = formatted.lower()
            if key not in seen:
                seen.add(key)
                meaningful.append(formatted)
        if len(meaningful) >= top_n:
            break

    return meaningful or ["General Discussion", "Transcript Analysis"]
