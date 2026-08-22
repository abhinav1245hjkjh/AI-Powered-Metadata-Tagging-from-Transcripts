import re
from typing import List, Dict, Any


def make_excerpt(text: str, max_chars: int = 160) -> str:
    """
    Creates a concise preview/excerpt derived from the actual dialogue text.
    Strips inline speaker headers if present and truncates safely on word boundaries.
    """
    if not text or not text.strip():
        return ""

    # Remove inline speaker prefix if at the start of text (e.g. "SEAN: Hello world")
    clean = re.sub(r'^\s*[A-Z0-9\.\'\s\-]{2,25}\s*:\s*', '', text.strip())

    if len(clean) <= max_chars:
        return clean

    # Truncate at word boundary
    truncated = clean[:max_chars]
    last_space = truncated.rfind(' ')
    if last_space > 40:
        truncated = truncated[:last_space]

    return truncated.rstrip(".,!?:; ") + "..."


def detect_speaker_from_text(text: str) -> str:
    """
    Extracts speaker name from segment header or leading dialogue line if present.
    """
    if not text:
        return ""
    first_line = text.splitlines()[0].strip() if text.splitlines() else ""
    match = re.match(r'^\s*([A-Z0-9\.\'\s\-]{2,25})\s*:', first_line)
    if match:
        spk = match.group(1).strip()
        if spk.upper() not in {"INT", "EXT", "INT/EXT", "CONTINUOUS", "NIGHT", "DAY"}:
            return spk
    return ""


def segment_transcript(text: str) -> List[Dict[str, Any]]:
    """
    Segment transcript based on scene headings (INT./EXT.), timestamps, or dialogue blocks.
    Ensures every segment object contains:
    - index: int
    - heading: str
    - speaker: str
    - text: str (complete text)
    - excerpt: str (concise preview derived from actual dialogue text)
    """
    if not text or not text.strip():
        return []

    lines = text.splitlines()

    # Check 1: Movie script scene headings: INT., EXT., INT/EXT, SCENE 1
    scene_heading_regex = re.compile(
        r'^\s*(INT\.|EXT\.|INT/EXT\.|INT\s*/\s*EXT\.|SCENE\s+\d+|PROLOGUE|EPILOGUE)(?:\s+.*)?$',
        re.IGNORECASE
    )

    # Check 2: Timestamp markers: [00:01:23], 00:01:23, 01:23 - 02:45
    timestamp_regex = re.compile(
        r'^\s*(?:\[|\()?(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[-–—]\s*\d{1,2}:\d{2}(?::\d{2})?)?)(?:\]|\))?\s*(?:[-–—:]\s*(.*))?$'
    )

    segments = []
    current_heading = None
    current_lines = []

    has_explicit_scenes = any(scene_heading_regex.match(line) for line in lines)
    has_explicit_timestamps = any(timestamp_regex.match(line) for line in lines)

    if has_explicit_scenes:
        index = 1
        for line in lines:
            if scene_heading_regex.match(line):
                if current_heading is not None and current_lines:
                    full_text = "\n".join(current_lines).strip()
                    spk = detect_speaker_from_text(full_text)
                    segments.append({
                        "index": index,
                        "heading": current_heading,
                        "speaker": spk,
                        "text": full_text,
                        "excerpt": make_excerpt(full_text)
                    })
                    index += 1
                    current_lines = []
                current_heading = line.strip()
            else:
                if current_heading is not None:
                    current_lines.append(line)
                else:
                    if line.strip():
                        current_lines.append(line)

        if current_heading or current_lines:
            full_text = "\n".join(current_lines).strip()
            spk = detect_speaker_from_text(full_text)
            segments.append({
                "index": index,
                "heading": current_heading if current_heading else "Prologue / Introduction",
                "speaker": spk,
                "text": full_text,
                "excerpt": make_excerpt(full_text)
            })
        return segments

    elif has_explicit_timestamps:
        index = 1
        for line in lines:
            ts_match = timestamp_regex.match(line)
            if ts_match:
                if current_heading is not None and current_lines:
                    full_text = "\n".join(current_lines).strip()
                    spk = detect_speaker_from_text(full_text)
                    segments.append({
                        "index": index,
                        "heading": current_heading,
                        "speaker": spk,
                        "text": full_text,
                        "excerpt": make_excerpt(full_text)
                    })
                    index += 1
                    current_lines = []
                ts_val = ts_match.group(1)
                extra = ts_match.group(2)
                current_heading = f"Timestamp [{ts_val}]" + (f" - {extra}" if extra else "")
            else:
                if current_heading is not None:
                    current_lines.append(line)
                else:
                    if line.strip():
                        current_lines.append(line)

        if current_heading or current_lines:
            full_text = "\n".join(current_lines).strip()
            spk = detect_speaker_from_text(full_text)
            segments.append({
                "index": index,
                "heading": current_heading if current_heading else "Introduction",
                "speaker": spk,
                "text": full_text,
                "excerpt": make_excerpt(full_text)
            })
        return segments

    # For general conversational text or scripts without headers: segment by paragraph blocks
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    if len(paragraphs) <= 1:
        paragraphs = [p.strip() for p in text.split("\n") if p.strip()]

    chunk_size = max(1, len(paragraphs) // 4) if len(paragraphs) > 4 else 1
    segments = []

    for i in range(0, len(paragraphs), chunk_size):
        chunk = paragraphs[i:i + chunk_size]
        full_text = "\n\n".join(chunk).strip()
        spk = detect_speaker_from_text(full_text)

        heading = f"Segment {len(segments) + 1}"
        if spk:
            heading = f"Segment {len(segments) + 1} ({spk})"

        segments.append({
            "index": len(segments) + 1,
            "heading": heading,
            "speaker": spk,
            "text": full_text,
            "excerpt": make_excerpt(full_text)
        })

    return segments if segments else [{
        "index": 1,
        "heading": "Complete Transcript",
        "speaker": detect_speaker_from_text(text),
        "text": text.strip(),
        "excerpt": make_excerpt(text)
    }]

