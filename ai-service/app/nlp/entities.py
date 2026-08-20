import logging
import importlib
import threading
import re
from typing import List, Dict

logger = logging.getLogger(__name__)

_nlp_spacy = None
_spacy_lock = threading.Lock()


def get_spacy_model():
    """
    Thread-safe loader for spaCy en_core_web_sm model.
    Falls back gracefully to dynamic download or rule-based NER pipeline.
    """
    global _nlp_spacy
    if _nlp_spacy is None:
        with _spacy_lock:
            if _nlp_spacy is None:
                # 1. Try direct import of en_core_web_sm package
                try:
                    logger.info("[MODEL] Loading spaCy package en_core_web_sm...")
                    en_core_web_sm = importlib.import_module("en_core_web_sm")
                    _nlp_spacy = en_core_web_sm.load()
                    logger.info("[MODEL] Loaded en_core_web_sm successfully via module.")
                    return _nlp_spacy
                except Exception as e_mod:
                    logger.debug(f"[MODEL] Direct module load failed: {e_mod}")

                # 2. Try spacy.load("en_core_web_sm")
                try:
                    spacy = importlib.import_module("spacy")
                    _nlp_spacy = spacy.load("en_core_web_sm")
                    logger.info("[MODEL] Loaded spaCy en_core_web_sm successfully.")
                    return _nlp_spacy
                except Exception as e_spacy:
                    logger.warning(f"[MODEL] spacy.load('en_core_web_sm') failed: {e_spacy}. Attempting download.")
                    try:
                        from spacy.cli import download
                        download("en_core_web_sm")
                        spacy = importlib.import_module("spacy")
                        _nlp_spacy = spacy.load("en_core_web_sm")
                        logger.info("[MODEL] Downloaded and loaded en_core_web_sm.")
                        return _nlp_spacy
                    except Exception as e_dl:
                        logger.warning(f"[MODEL] spaCy download failed: {e_dl}. Using rule-based NER fallback.")
                        _nlp_spacy = False

    return _nlp_spacy


# Regex patterns for deterministic rule-based NER fallback
KNOWN_ORGS = {
  "microsoft", "google", "apple", "amazon", "meta", "cognizant", "ibm",
  "harvard", "harvard university", "mit", "stanford", "oxford", "cambridge",
  "openai", "anthropic", "netflix", "tesla", "oracle", "intel", "nvidia"
}

KNOWN_LOCATIONS = {
  "london", "delhi", "new york", "boston", "cambridge", "paris", "tokyo",
  "san francisco", "california", "india", "usa", "uk", "zion", "massachusetts",
  "chicago", "seattle", "berlin", "toronto", "sydney", "mumbai", "singapore"
}

HONORIFICS = r"\b(Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.|Officer|Agent|Detective)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)"
ORG_SUFFIXES = r"\b([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)*\s+(?:Inc\.|Corp\.|Corporation|LLC|Ltd\.|University|College|Institute|Labs|Technologies|Group|Systems))\b"
DATE_PATTERN = r"\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,\s+\d{4})?\b|\b\d{4}\b"


def extract_rule_based_entities(text: str) -> List[Dict[str, str]]:
    """
    Deterministic rule-based NER fallback if spaCy en_core_web_sm model binary is not available.
    """
    entities = []
    seen = set()

    def add_entity(txt, lbl):
        clean = txt.strip().strip(".,!?:;\"'()[]{}")
        if len(clean) >= 2 and clean.lower() not in {"the", "this", "that", "there", "what", "where", "when", "here"}:
            key = (clean.lower(), lbl)
            if key not in seen:
                seen.add(key)
                entities.append({"text": clean, "label": lbl})

    # 1. Match Honorifics + Names (Dr. Sean Maguire, Agent Smith, Mr. Anderson)
    for match in re.finditer(HONORIFICS, text):
        full_name = f"{match.group(1)} {match.group(2)}"
        add_entity(full_name, "PERSON")

    # 2. Match Organization Suffixes (Harvard University, Microsoft Corp)
    for match in re.finditer(ORG_SUFFIXES, text):
        add_entity(match.group(1), "ORG")

    # 3. Match Dates (January 15, 2026)
    for match in re.finditer(DATE_PATTERN, text):
        add_entity(match.group(0), "DATE")

    # 4. Match Known Orgs & Locations
    text_lower = text.lower()
    for org in KNOWN_ORGS:
        if org in text_lower:
            # Find original casing in text
            idx = text_lower.find(org)
            original_cased = text[idx:idx + len(org)]
            add_entity(original_cased, "ORG")

    for loc in KNOWN_LOCATIONS:
        if loc in text_lower:
            idx = text_lower.find(loc)
            original_cased = text[idx:idx + len(loc)]
            add_entity(original_cased, "GPE")

    # 5. Extract Capitalized Name Pairs (e.g. John Smith, Will Hunting, Thomas Anderson)
    cap_pairs = re.findall(r"\b([A-Z][a-z]{2,}\s+[A-Z][a-z]{2,})\b", text)
    for pair in cap_pairs:
        # Avoid common title beginnings
        if not any(pair.lower().startswith(w) for w in ["the ", "this ", "that ", "there ", "what ", "good "]):
            add_entity(pair, "PERSON")

    return entities


def extract_entities(text: str) -> List[Dict[str, str]]:
    """
    Extract named entities using spaCy en_core_web_sm model.
    Returns clean list of unique entity objects with 'text' and 'label'.
    """
    if not text or not text.strip():
        return []

    nlp = get_spacy_model()

    # If spaCy model is loaded and has NER component
    if nlp and hasattr(nlp, "pipe_names") and "ner" in nlp.pipe_names:
        sample_text = text[:50000]
        try:
            doc = nlp(sample_text)
            entities = []
            seen = set()

            for ent in doc.ents:
                clean_text = ent.text.strip().strip(".,!?:;\"'()[]{}")
                label = ent.label_

                # Filter out noisy or meaningless entity captures
                if len(clean_text) < 2 or clean_text.lower() in {"the", "a", "an", "this", "that"}:
                    continue

                key = (clean_text.lower(), label)
                if key not in seen:
                    seen.add(key)
                    entities.append({
                        "text": clean_text,
                        "label": label
                    })

            # If spaCy found entities, return them
            if entities:
                return entities

        except Exception as e:
            logger.error(f"Error during spaCy entity extraction: {e}")

    # Fallback to deterministic rule-based NER if spaCy returns empty or failed
    logger.info("[NER] Running rule-based entity extraction fallback.")
    return extract_rule_based_entities(text)
