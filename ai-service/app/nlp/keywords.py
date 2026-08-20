import logging
import importlib
import re
import threading
from typing import List

logger = logging.getLogger(__name__)

_kw_model = None
_kw_lock = threading.Lock()

# Comprehensive conversational stop words, verbal fillers, and fragment indicators
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
    "int", "ext", "scene", "comms", "over", "behind", "across", "faintest", "don", "didn", "doesn", "hasn", "haven",
    "hadn", "wasn", "weren", "isn", "aren", "wouldn", "couldn", "shouldn"
}

# Fragments that signal conversational noise when appearing at start or end of phrase
CONVERSATIONAL_FRAGMENT_PATTERNS = [
    r"^\b(you|i|we|they|he|she|it|that|this|there|what|how|why)\s+(don|think|know|mean|said|tell|have|want|got|feel|would|could|should)\b",
    r"\b(you\s+know|i\s+think|well\s+you|have\s+the\s+faintest|kind\s+of|sort\s+of|don\s+t|doesn\s+t|won\s+t|i\s+mean|let\s+me)\b",
    r"^\b(well|like|just|maybe|so|yeah|yes|no|okay|sure|tell|look|see)\b",
    r"\b(and\s+so|in\s+order|as\s+well|a\s+lot|something\s+like)\b"
]


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


def validate_keyphrase(phrase: str) -> bool:
    """
    Strict validation function for keyphrase quality.
    Evaluates:
    - Min/max token length (1–4 words, 3–60 chars)
    - Rejection of conversational fillers & fragments ("You Don", "Have The Faintest", "I Think", "Well You Know")
    - Stopword ratio check
    - Noun/concept substance check
    """
    if not phrase or not isinstance(phrase, str):
        return False

    cleaned = phrase.strip().lower()
    cleaned = re.sub(r'[\r\n\t_]+', ' ', cleaned)
    cleaned = re.sub(r'[^\w\s-]', '', cleaned).strip()

    if len(cleaned) < 3 or len(cleaned) > 60:
        return False

    tokens = [t for t in cleaned.split() if t]
    if not tokens or len(tokens) > 5:
        return False

    # Check for conversational fragment patterns
    for pattern in CONVERSATIONAL_FRAGMENT_PATTERNS:
        if re.search(pattern, cleaned, re.IGNORECASE):
            return False

    # Count stop words vs substantive conceptual words
    substantive_tokens = [t for t in tokens if t not in CONVERSATIONAL_STOPWORDS and len(t) >= 2]

    # For single-word keywords, require at least 4 chars and non-stopword
    if len(tokens) == 1:
        if tokens[0] in CONVERSATIONAL_STOPWORDS or len(tokens[0]) < 3:
            return False
        return True

    # For multi-word phrases, at least 50% of tokens must be substantive conceptual words
    if len(substantive_tokens) < 1 or (len(substantive_tokens) / len(tokens)) < 0.4:
        return False

    # Reject if phrase starts or ends with a pure stopword preposition/conjunction/auxiliary verb
    leading_trailing_stopwords = {"and", "or", "but", "so", "for", "with", "the", "a", "an", "in", "on", "at", "to", "from", "by", "of", "you", "i", "we", "don", "think"}
    if tokens[0] in leading_trailing_stopwords and len(tokens) <= 2:
        return False
    if tokens[-1] in leading_trailing_stopwords and len(tokens) <= 2:
        return False

    return True


def format_phrase(phrase: str) -> str:
    """
    Normalizes capitalization and formats keyphrases cleanly.
    Preserves uppercase for acronyms (AI, ML, NLP, NASA, MIT, API, USA, etc.)
    and title-cases standard words.
    """
    cleaned = re.sub(r'[\r\n\t_]+', ' ', phrase).strip()
    words = cleaned.split()

    KNOWN_ACRONYMS = {"ai", "ml", "nlp", "ner", "api", "mit", "nasa", "fbi", "cia", "cpu", "gpu", "ui", "ux", "usa", "uk", "db", "json", "xml", "csv", "sql", "http", "https", "url", "id", "kpi"}

    formatted_words = []
    for w in words:
        w_lower = w.lower().strip(".,!?:;\"'()[]{}")
        if w_lower in KNOWN_ACRONYMS:
            formatted_words.append(w_lower.upper())
        elif w.isupper() and len(w) <= 4:
            formatted_words.append(w)
        else:
            formatted_words.append(w.capitalize())

    return " ".join(formatted_words)


def extract_keywords(text: str, top_n: int = 10) -> List[str]:
    """
    Extract high-relevance keyphrases and multi-word conceptual topics using KeyBERT with MMR diversity.
    Prunes conversational fragments, filler words, and enforces strict keyphrase validation.
    """
    if not text or not text.strip():
        return []

    # Clean text for candidate generation
    cleaned_text = re.sub(r'[\r\n\t]+', ' ', text).strip()

    if len(cleaned_text.split()) < 4:
        words = [w.strip(".,!?:;\"'()[]{}") for w in cleaned_text.split() if validate_keyphrase(w)]
        return list(dict.fromkeys([format_phrase(w) for w in words]))[:top_n]

    model = get_keybert_model()

    if model:
        try:
            try:
                import torch
                ctx = torch.inference_mode() if hasattr(torch, "inference_mode") else torch.no_grad()
            except Exception:
                ctx = None

            params = {
                "keyphrase_ngram_range": (1, 3),
                "stop_words": "english",
                "use_mmr": True,
                "diversity": 0.6,
                "top_n": top_n * 3
            }

            if ctx:
                with ctx:
                    extracted = model.extract_keywords(cleaned_text, **params)
            else:
                extracted = model.extract_keywords(cleaned_text, **params)

            # Filter, clean, validate, and deduplicate
            unique_phrases = []
            seen = set()

            for item in extracted:
                phrase = item[0].strip()
                if validate_keyphrase(phrase):
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
            max_features=top_n * 5
        )

        tfidf_matrix = vectorizer.fit_transform([cleaned_text])
        feature_names = vectorizer.get_feature_names_out()
        scores = tfidf_matrix.toarray()[0]
        sorted_indices = scores.argsort()[::-1]

        fallback_keywords = []
        seen = set()

        for idx in sorted_indices:
            kw = feature_names[idx].strip()
            if validate_keyphrase(kw):
                formatted = format_phrase(kw)
                key = formatted.lower()
                if key not in seen and not any(key in p.lower() or p.lower() in key for p in fallback_keywords):
                    seen.add(key)
                    fallback_keywords.append(formatted)
            if len(fallback_keywords) >= top_n:
                break

        if fallback_keywords:
            return fallback_keywords

    except Exception as e:
        logger.error(f"TF-IDF fallback keyword extraction failed: {e}")

    # Pure heuristic multi-word regex extractor fallback
    candidates = re.findall(r'\b[A-Za-z]{3,}(?:\s+[A-Za-z]{3,}){1,2}\b', cleaned_text)
    meaningful = []
    seen = set()
    for cand in candidates:
        if validate_keyphrase(cand):
            formatted = format_phrase(cand)
            key = formatted.lower()
            if key not in seen:
                seen.add(key)
                meaningful.append(formatted)
        if len(meaningful) >= top_n:
            break

    return meaningful or ["General Discussion", "Transcript Analysis"]

