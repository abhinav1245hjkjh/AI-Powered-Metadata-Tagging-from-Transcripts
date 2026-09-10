import re
from typing import List, Dict, Any

# Common False positives in scripts (stage directions, transitions, scene tags)
EXCLUDED_KEYWORDS = {
    "INT", "EXT", "INT/EXT", "CONTINUOUS", "NIGHT", "DAY", "DUSK", "DAWN",
    "FADE IN", "FADE OUT", "CUT TO", "DISSOLVE TO", "FLASHBACK", "SCENE",
    "THE END", "ACT ONE", "ACT TWO", "ACT THREE", "TRANSCRIPT", "NOTE", "TITLE"
}


def count_words(text: str) -> int:
    """
    Canonical Word Tokenizer Utility — MetaMind AI
    
    Tokenizer Rules:
    1. Removes inline speaker prefix headers (e.g., "SEAN:", "WILL:").
    2. Removes timestamp markers (e.g., "[00:01:23]").
    3. Removes scene heading indicators ("INT. ROOM - DAY").
    4. Matches word tokens using Unicode boundary pattern `\\b[\\w'-]+\\b`.
    """
    if not text or not isinstance(text, str):
        return 0

    # 1. Strip speaker headers (e.g. "SEAN:")
    clean = re.sub(r'^\s*[A-Z0-9\.\'\s\-]{2,25}\s*:\s*', '', text, flags=re.MULTILINE)
    # 2. Strip timestamps e.g. [00:01:23]
    clean = re.sub(r'\[?\b\d{1,2}:\d{2}(?::\d{2})?\b\]?', '', clean)
    # 3. Strip scene headers
    clean = re.sub(r'^\s*(INT\.|EXT\.|INT/EXT\.|SCENE\s+\d+).*$', '', clean, flags=re.MULTILINE | re.IGNORECASE)

    words = re.findall(r"\b[\w'-]+\b", clean)
    return len(words)


def extract_speaker_handoffs(segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Extracts chronological dialogue handoffs (transitions between interlocutors).
    Returns list of structured handoff objects:
    {
      "from": "Speaker A",
      "to": "Speaker B",
      "segmentIndex": 2,
      "heading": "Segment 2",
      "context": "Dialogue snippet..."
    }
    """
    if not segments:
        return []

    handoffs = []
    prev_speaker = None

    for seg in segments:
        spk = (seg.get("speaker") or "").strip()
        if not spk:
            # Fallback speaker check from segment heading or text
            txt = seg.get("text") or ""
            match = re.match(r'^\s*([A-Z0-9\.\'\s\-]{2,25})\s*:', txt)
            if match:
                spk = match.group(1).strip()

        if spk and prev_speaker and spk.lower() != prev_speaker.lower():
            if spk.upper() not in EXCLUDED_KEYWORDS and prev_speaker.upper() not in EXCLUDED_KEYWORDS:
                handoffs.append({
                    "from": prev_speaker,
                    "to": spk,
                    "segmentIndex": seg.get("index", len(handoffs) + 1),
                    "heading": seg.get("heading") or f"Segment {seg.get('index', 1)}",
                    "context": seg.get("excerpt") or (seg.get("text")[:140] if seg.get("text") else "")
                })

        if spk and spk.upper() not in EXCLUDED_KEYWORDS:
            prev_speaker = spk

    return handoffs


def identify_speakers(text: str) -> List[Dict[str, Any]]:
    """
    Identifies speakers, counts dialogue turns, and computes canonical word counts per speaker.
    """
    if not text or not text.strip():
        return []

    lines = text.splitlines()
    speaker_turn_counts: Dict[str, int] = {}
    speaker_word_counts: Dict[str, int] = {}

    pattern_colon = re.compile(r'^\s*([A-Z0-9\.\'\s\-]{2,30}?)(?:\s*\([A-Za-z0-9\.\s]+\))?\s*:\s*(.*)$')
    pattern_standalone = re.compile(r'^\s{0,20}([A-Z][A-Z0-9\.\'\s\-]{1,25})(?:\s*\([A-Za-z0-9\.\s]+\))?\s*$')

    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if not stripped:
            i += 1
            continue

        match_colon = pattern_colon.match(line)
        if match_colon:
            raw_speaker = match_colon.group(1).strip()
            clean_speaker = re.sub(r'\s*\([^)]*\)', '', raw_speaker).strip()
            inline_dialogue = match_colon.group(2).strip()

            if clean_speaker and clean_speaker.upper() not in EXCLUDED_KEYWORDS and len(clean_speaker) <= 30:
                speaker_turn_counts[clean_speaker] = speaker_turn_counts.get(clean_speaker, 0) + 1
                words_in_line = count_words(inline_dialogue) if inline_dialogue else 0

                # Accrue dialogue words from subsequent lines until next speaker or scene marker
                j = i + 1
                while j < len(lines):
                    next_line = lines[j]
                    next_stripped = next_line.strip()
                    if not next_stripped:
                        j += 1
                        continue
                    if pattern_colon.match(next_line) or (pattern_standalone.match(next_line) and next_stripped.isupper()):
                        break
                    if re.match(r'^\s*(INT\.|EXT\.|INT/EXT\.|SCENE\s+\d+)', next_line, re.IGNORECASE):
                        break
                    words_in_line += count_words(next_stripped)
                    j += 1

                speaker_word_counts[clean_speaker] = speaker_word_counts.get(clean_speaker, 0) + words_in_line
                i = max(i + 1, j)
                continue

        match_standalone = pattern_standalone.match(line)
        if match_standalone and stripped.isupper():
            candidate = match_standalone.group(1).strip()
            clean_candidate = re.sub(r'\s*\([^)]*\)', '', candidate).strip()

            if (
                clean_candidate
                and clean_candidate.upper() not in EXCLUDED_KEYWORDS
                and not clean_candidate.startswith("INT.")
                and not clean_candidate.startswith("EXT.")
                and len(clean_candidate.split()) <= 4
            ):
                speaker_turn_counts[clean_candidate] = speaker_turn_counts.get(clean_candidate, 0) + 1
                words_in_line = 0
                j = i + 1
                while j < len(lines):
                    next_line = lines[j]
                    next_stripped = next_line.strip()
                    if not next_stripped:
                        j += 1
                        continue
                    if pattern_colon.match(next_line) or (pattern_standalone.match(next_line) and next_stripped.isupper()):
                        break
                    if re.match(r'^\s*(INT\.|EXT\.|INT/EXT\.|SCENE\s+\d+)', next_line, re.IGNORECASE):
                        break
                    words_in_line += count_words(next_stripped)
                    j += 1

                speaker_word_counts[clean_candidate] = speaker_word_counts.get(clean_candidate, 0) + words_in_line
                i = max(i + 1, j)
                continue

        i += 1


    results = [
        {
            "speaker": spk,
            "lineCount": count,
            "wordCount": speaker_word_counts.get(spk, 0)
        }
        for spk, count in speaker_turn_counts.items()
        if count >= 1
    ]

    results.sort(key=lambda x: x["lineCount"], reverse=True)
    return results

