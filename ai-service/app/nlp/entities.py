import logging
import importlib
import threading
import re
from typing import List, Dict, Any

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


# Indicator sets for canonical entity categorization and rule-based validation
INSTITUTION_KEYWORDS = {
    "university", "college", "institute", "institution", "school", "academy",
    "polytechnic", "conservatory", "seminary", "faculty", "department",
    "ministry", "commission", "corporation", "corp", "inc", "llc", "ltd",
    "limited", "co", "company", "labs", "technologies", "technology", "tech",
    "group", "systems", "system", "foundation", "association", "agency",
    "board", "council", "committee", "bank", "hospital", "clinic", "trust",
    "federation", "union", "league", "party", "society", "bureau", "service",
    "services", "network", "station", "broadcasting", "news", "press", "media",
    "publishing", "enterprise", "enterprises", "ventures", "capital", "partners",
    "holdings", "solutions", "logistics", "pharmaceuticals", "biotech"
}

KNOWN_ORGS = {
    "microsoft", "google", "apple", "amazon", "meta", "cognizant", "ibm",
    "harvard", "harvard university", "mit", "massachusetts institute of technology",
    "stanford", "stanford university", "oxford", "oxford university",
    "cambridge", "cambridge university", "yale", "princeton", "columbia",
    "cornell", "uc berkeley", "caltech", "openai", "anthropic", "netflix",
    "tesla", "oracle", "intel", "nvidia", "nasa", "fbi", "cia", "nato", "un",
    "unesco", "who", "unicef", "cdc", "fda", "sec", "pfizer", "moderna"
}

LANDMARK_KEYWORDS = {
    "chapel", "cathedral", "church", "monastery", "abbey", "temple", "mosque",
    "shrine", "synagogue", "tower", "statue", "monument", "memorial", "bridge",
    "park", "square", "plaza", "street", "avenue", "boulevard", "road",
    "highway", "freeway", "lane", "drive", "alley", "mountain", "mount", "peak",
    "hill", "river", "lake", "sea", "ocean", "bay", "gulf", "strait", "canyon",
    "valley", "island", "islands", "isle", "peninsula", "cape", "coast",
    "palace", "castle", "fort", "bastion", "museum", "gallery", "library",
    "hall", "auditorium", "stadium", "arena", "colosseum", "center", "centre",
    "airport", "harbor", "port", "station", "terminal", "building"
}

KNOWN_LOCATIONS = {

    "sistine chapel", "eiffel tower", "statue of liberty", "taj mahal",
    "big ben", "golden gate bridge", "grand canyon", "empire state building",
    "louvre", "colosseum", "pyramids", "wall street", "times square",
    "broadway", "silicon valley", "hollywood", "mount everest", "niagara falls",
    "yellowstone", "yosemite", "london", "delhi", "new york", "boston",
    "cambridge", "paris", "tokyo", "san francisco", "california", "india",
    "usa", "uk", "zion", "massachusetts", "chicago", "seattle", "berlin",
    "toronto", "sydney", "mumbai", "singapore", "washington", "los angeles",
    "united states", "united kingdom", "europe", "asia", "africa"
}

HONORIFICS_PATTERN = r"\b(Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.|Sir|Lady|Officer|Agent|Detective|Senator|Governor|President|Prime Minister|Mayor|Captain|General|Colonel|Major|Sergeant|Lieutenant)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)"
ORG_SUFFIXES_PATTERN = r"\b([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)*\s+(?:Inc\.|Corp\.|Corporation|LLC|Ltd\.|University|College|Institute|Labs|Technologies|Group|Systems|Foundation|Association|Agency|Board|Department|Ministry))\b"
DATE_PATTERN = r"\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,\s+\d{4})?\b|\b\d{4}\b"

# Common job titles and role words that spaCy often misclassifies as PERSON entities when capitalized
COMMON_JOB_TITLES = {
    "engineer", "senior", "junior", "manager", "developer", "director", "intern",
    "assistant", "officer", "analyst", "consultant", "president", "executive",
    "lead", "architect", "designer", "administrator", "specialist", "coordinator",
    "head", "chief", "founder", "principal", "associate", "vice", "vp", "ceo",
    "cto", "cfo", "cmo", "coo", "professor", "doctor", "scientist", "researcher",
    "supervisor", "chair", "chairman", "chairperson", "editor", "producer"
}

# Conversational words, sentence-starting adjectives, and common verbs misclassified as PERSON
CONVERSATIONAL_ENGLISH_WORDS = {
    "great", "good", "how", "let", "well", "yes", "no", "okay", "sure", "thanks",
    "hello", "hi", "hey", "maybe", "really", "actually", "just", "also", "always",
    "never", "again", "today", "tomorrow", "yesterday", "some", "many", "much",
    "more", "most", "other", "another", "such", "what", "where", "when", "why",
    "who", "which", "there", "here", "this", "that", "these", "those", "have",
    "has", "had", "doing", "think", "said", "would", "could", "should", "want",
    "need", "make", "take", "come", "look", "like", "find", "give", "tell"
}



def canonicalize_entity_label(text: str, raw_label: str) -> str:
    """
    Determines the strict canonical entity category: PEOPLE, ORGANIZATIONS, LOCATIONS,
    or secondary categories like DATES_TIMES, PRODUCTS_EVENTS, OTHER.

    Strict Validation Logic:
    1. Institutions (Harvard University, MIT, NASA) -> ORGANIZATIONS (NEVER PEOPLE).
    2. Landmarks (Sistine Chapel, Eiffel Tower, Statue of Liberty) -> LOCATIONS (NEVER PEOPLE).
    3. Standalone Job Titles (Engineer, Senior, Manager) & Conversational Words (Great, How, Let) -> Rejected or reclassified.
    4. GPE, LOC, FAC -> LOCATIONS.
    5. PERSON entities must represent actual human names supported by context.
    """
    clean_text = text.strip().strip(".,!?:;\"'()[]{}")
    text_lower = clean_text.lower()
    words = [w.strip(".,!?:;\"'()[]{}") for w in text_lower.split()]
    raw_upper = (raw_label or "OTHER").upper()

    # Rule 1: Explicit Check for Known Organizations or Institution Keywords
    # WHY: spaCy often misclassifies multi-word institutions like "Harvard University" as PERSON due to capitalized tokens.
    if text_lower in KNOWN_ORGS or any(w in INSTITUTION_KEYWORDS for w in words):
        return "ORGANIZATIONS"

    # Rule 2: Explicit Check for Known Landmarks or Location Keywords
    # WHY: Landmarks like "Sistine Chapel" or "Eiffel Tower" contain capitalized words that spaCy's default model misclassifies as PERSON.
    if text_lower in KNOWN_LOCATIONS or any(w in LANDMARK_KEYWORDS for w in words):
        return "LOCATIONS"

    # Rule 3: Check spaCy raw label mappings for Locations and Organizations
    if raw_upper in {"GPE", "LOC", "FAC", "LOCATION", "LOCATIONS"}:
        return "LOCATIONS"

    if raw_upper in {"ORG", "ORGANIZATION", "ORGANIZATIONS"}:
        return "ORGANIZATIONS"

    if raw_upper in {"DATE", "TIME", "DATES_TIMES"}:
        return "DATES_TIMES"

    if raw_upper in {"PRODUCT", "WORK_OF_ART", "EVENT", "LAW", "PRODUCTS_EVENTS"}:
        return "PRODUCTS_EVENTS"

    if raw_upper in {"PERSON", "PEOPLE"}:
        # Rule 4: Reject Standalone Job Titles and Common English Words mislabeled as PERSON
        # WHY: Words like "Engineer", "Senior", "Great", "How", "Let" are capitalized at line starts or in title headers, triggering spaCy false positives.
        if text_lower in COMMON_JOB_TITLES or text_lower in CONVERSATIONAL_ENGLISH_WORDS:
            return "OTHER"

        if any(w in INSTITUTION_KEYWORDS for w in words) or text_lower in KNOWN_ORGS:
            return "ORGANIZATIONS"
        if any(w in LANDMARK_KEYWORDS for w in words) or text_lower in KNOWN_LOCATIONS:
            return "LOCATIONS"

        return "PEOPLE"

    # Default fallback heuristics
    return "OTHER"


def compute_entity_quality_score(text: str, label: str) -> float:
    """
    Computes a multi-signal linguistic quality score (0.0 to 1.0) for an entity.
    Evaluates:
    - Canonical label suitability
    - Proper noun casing
    - Known dictionary indicator matches
    - Token length & alphabetic composition
    - Rejection of conversational noise, job titles, and stopwords
    """
    clean = text.strip()
    clean_lower = clean.lower()
    words = clean.split()

    # 1. Absolute Rejections (Quality score = 0.0)
    if clean_lower in COMMON_JOB_TITLES or clean_lower in CONVERSATIONAL_ENGLISH_WORDS:
        return 0.0
    if len(clean) < 2:
        return 0.0
    if len(words) == 1 and len(clean) <= 3 and clean_lower not in {"nasa", "mit", "fbi", "cia", "nato", "un", "who", "usa", "uk"}:
        return 0.0

    # 2. Known Dictionary Matches (Highest Confidence 0.95 - 1.0)
    if clean_lower in KNOWN_ORGS or clean_lower in KNOWN_LOCATIONS:
        return 0.98
    if any(w.lower() in INSTITUTION_KEYWORDS for w in words) or any(w.lower() in LANDMARK_KEYWORDS for w in words):
        return 0.95

    # 3. Proper Noun Casing Signal
    is_proper_cased = all(w[0].isupper() for w in words if len(w) > 0 and w[0].isalpha())

    score = 0.70
    if is_proper_cased:
        score += 0.15
    if len(words) >= 2:
        score += 0.10

    return min(0.95, round(score, 2))


def normalize_and_validate_entities(raw_entities: List[Dict[str, str]]) -> List[Dict[str, str]]:
    """
    Reusable normalization, deduplication, and strict validation layer for entity extractions.
    Filters out noise, standalone job titles, and low-confidence entities (< 0.60 quality score).
    """
    if not raw_entities:
        return []

    validated = []
    seen_keys = set()

    for item in raw_entities:
        if not isinstance(item, dict):
            continue

        raw_text = item.get("text") or item.get("entity") or item.get("name") or ""
        raw_label = item.get("label") or item.get("type") or "OTHER"

        clean_text = raw_text.strip().strip(".,!?:;\"'()[]{}")
        clean_lower = clean_text.lower()

        # Rule 5: Reject short noise tokens, conversational stop words, and standalone job titles
        if (
            len(clean_text) < 2
            or clean_lower in {"the", "a", "an", "this", "that", "there", "what", "where", "when", "here"}
            or clean_lower in COMMON_JOB_TITLES
            or clean_lower in CONVERSATIONAL_ENGLISH_WORDS
        ):
            continue

        # Determine strict canonical label
        canonical_label = canonicalize_entity_label(clean_text, str(raw_label))

        if canonical_label == "OTHER":
            continue

        # Compute linguistic quality score
        quality_score = compute_entity_quality_score(clean_text, canonical_label)
        if quality_score < 0.60:
            continue

        # Deduplication key
        dedup_key = (clean_lower, canonical_label)
        if dedup_key not in seen_keys:
            seen_keys.add(dedup_key)
            validated.append({
                "text": clean_text,
                "label": canonical_label,
                "confidence": quality_score
            })

    return validated



def extract_rule_based_entities(text: str) -> List[Dict[str, str]]:
    """
    Deterministic rule-based NER fallback if spaCy model binary is unavailable.
    """
    entities = []

    # 1. Match Honorifics + Names (Dr. Sean Maguire, Agent Smith, Mr. Anderson, Sarah Connor)
    for match in re.finditer(HONORIFICS_PATTERN, text):
        full_name = f"{match.group(1)} {match.group(2)}"
        entities.append({"text": full_name, "label": "PEOPLE"})

    # 2. Match Organization Suffixes (Harvard University, Microsoft Corp)
    for match in re.finditer(ORG_SUFFIXES_PATTERN, text):
        entities.append({"text": match.group(1), "label": "ORGANIZATIONS"})

    # 3. Match Dates (January 15, 2026)
    for match in re.finditer(DATE_PATTERN, text):
        entities.append({"text": match.group(0), "label": "DATES_TIMES"})

    # 4. Match Known Orgs & Locations
    text_lower = text.lower()
    for org in KNOWN_ORGS:
        if org in text_lower:
            idx = text_lower.find(org)
            original_cased = text[idx:idx + len(org)]
            entities.append({"text": original_cased, "label": "ORGANIZATIONS"})

    for loc in KNOWN_LOCATIONS:
        if loc in text_lower:
            idx = text_lower.find(loc)
            original_cased = text[idx:idx + len(loc)]
            entities.append({"text": original_cased, "label": "LOCATIONS"})

    # 5. Extract Capitalized Names (Full Names or legitimate Single Names like Sarah, John, Will, Neo)
    cap_names = re.findall(r"\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?)\b", text)
    for name in cap_names:
        clean = name.strip()
        clean_lower = clean.lower()
        if (
            clean
            and clean_lower not in CONVERSATIONAL_ENGLISH_WORDS
            and clean_lower not in COMMON_JOB_TITLES
            and not any(clean_lower in s for s in [KNOWN_ORGS, KNOWN_LOCATIONS])
        ):
            entities.append({"text": clean, "label": "PEOPLE"})

    return normalize_and_validate_entities(entities)




def extract_entities(text: str) -> List[Dict[str, str]]:
    """
    Extract named entities using spaCy en_core_web_sm model, followed by the strict validation layer.
    Returns clean list of unique entity objects with 'text' and canonical 'label'.
    """
    if not text or not text.strip():
        return []

    nlp = get_spacy_model()
    raw_entities = []

    # If spaCy model is loaded and has NER component
    if nlp and hasattr(nlp, "pipe_names") and "ner" in nlp.pipe_names:
        sample_text = text[:50000]
        try:
            doc = nlp(sample_text)
            for ent in doc.ents:
                raw_entities.append({
                    "text": ent.text,
                    "label": ent.label_
                })
        except Exception as e:
            logger.error(f"Error during spaCy entity extraction: {e}")

    # Fallback to rule-based NER if spaCy returns no entities
    if not raw_entities:
        logger.info("[NER] Running rule-based entity extraction fallback.")
        return extract_rule_based_entities(text)

    # Pass through strict normalization & validation layer
    return normalize_and_validate_entities(raw_entities)

