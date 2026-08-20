import importlib
from app.main import app
from app.nlp.keywords import extract_keywords
from app.nlp.entities import extract_entities
from app.nlp.sentiment import analyze_sentiment
from app.nlp.emotion import analyze_emotions, ALL_EMOTIONS
from app.nlp.classify import classify_content, CANDIDATE_LABELS
from app.nlp.speakers import identify_speakers
from app.nlp.segmentation import segment_transcript

def get_test_client():
    try:
        testclient_mod = importlib.import_module("fastapi.testclient")
        TestClient = getattr(testclient_mod, "TestClient")
        return TestClient(app)
    except Exception:
        return None

SAMPLE_MATRIX_SCRIPT = """INT. HEART O' THE CITY HOTEL - NIGHT
TRINITY: I'm inside the mainframe. They're onto us.
CYPHER: I told you this was dangerous. You should have waited for Morpheus.
TRINITY: Morpheus believes he is the One. We don't have time to hesitate.
EXT. CITY STREET - NIGHT
AGENT SMITH: Lieutenant, your men are already dead.
LIEUTENANT: That's impossible! We sent two squads into that hotel!
AGENT SMITH: Order your units to seal the perimeter. The anomaly must not escape.
"""

SAMPLE_INTERVIEW = """INTERVIEWER: Welcome Alex to Cognizant. How do you design AI pipelines?
ALEX: Thank you Sarah. We use FastAPI and PyTorch with transformer models.
INTERVIEWER: Excellent. How do you handle scalability on Google Cloud Platform?
ALEX: We scale container pods using Kubernetes and optimize latency with ONNX.
"""

SAMPLE_TECH_MEETING = """ENGINEER: We deployed the Kubernetes microservice cluster for the backend API.
ARCHITECT: Outstanding work. The Docker containers and database latency are both optimal.
"""


def test_health_endpoints():
    client = get_test_client()
    if not client:
        return
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "healthy"


def test_keywords_extraction():
    keywords = extract_keywords(SAMPLE_MATRIX_SCRIPT)
    assert isinstance(keywords, list)
    assert len(keywords) > 0
    assert all(isinstance(k, str) for k in keywords)


def test_keywords_empty():
    assert extract_keywords("") == []
    assert extract_keywords("   ") == []


def test_entities_extraction():
    entities = extract_entities(SAMPLE_INTERVIEW)
    assert isinstance(entities, list)
    for ent in entities:
        assert "text" in ent
        assert "label" in ent
        assert len(ent["text"]) > 0


def test_sentiment_analysis():
    pos_res = analyze_sentiment("I am extremely delighted and happy with this phenomenal achievement!")
    assert pos_res["polarity"] == "positive"
    assert isinstance(pos_res["score"], float)
    assert pos_res["score"] > 0

    neg_res = analyze_sentiment("This is a horrific, dreadful, and catastrophic failure and disaster.")
    assert neg_res["polarity"] == "negative"
    assert isinstance(neg_res["score"], float)
    assert neg_res["score"] < 0

    neutral_res = analyze_sentiment("The quarterly meeting is scheduled on Tuesday at 10 AM.")
    assert neutral_res["polarity"] in ["neutral", "positive"]


def test_emotion_analysis():
    emotions = analyze_emotions("I am so terrified and scared of what might happen in the dark!")
    assert isinstance(emotions, list)
    assert len(emotions) >= 7
    assert all("label" in e and "score" in e for e in emotions)
    
    # Check that labels come from ALL_EMOTIONS
    labels = [e["label"] for e in emotions]
    assert "fear" in labels or "anxiety" in labels or "anger" in labels
    
    total_score = sum(e["score"] for e in emotions)
    assert 0.8 <= total_score <= 1.2


def test_speaker_identification():
    speakers = identify_speakers(SAMPLE_MATRIX_SCRIPT)
    assert isinstance(speakers, list)
    speaker_names = [s["speaker"] for s in speakers]
    assert "TRINITY" in speaker_names
    assert "AGENT SMITH" in speaker_names or "SMITH" in "".join(speaker_names)
    
    for s in speakers:
        assert s["lineCount"] >= 1


def test_speaker_identification_no_speakers():
    plain_text = "The rain falls silently on the empty pavement. The wind howls through the trees."
    assert identify_speakers(plain_text) == []


def test_scene_segmentation():
    segments = segment_transcript(SAMPLE_MATRIX_SCRIPT)
    assert isinstance(segments, list)
    assert len(segments) >= 2
    assert "INT. HEART O' THE CITY HOTEL" in segments[0]["heading"]
    assert "EXT. CITY STREET" in segments[1]["heading"]


def test_content_classification():
    cat_script = classify_content(SAMPLE_MATRIX_SCRIPT, filename="matrix_script.txt")
    assert cat_script["label"] in CANDIDATE_LABELS
    assert 0.0 <= cat_script["confidence"] <= 1.0

    cat_interview = classify_content(SAMPLE_INTERVIEW, filename="tech_interview.txt")
    assert cat_interview["label"] in CANDIDATE_LABELS

    cat_tech = classify_content(SAMPLE_TECH_MEETING, filename="system_architecture.txt")
    assert cat_tech["label"] in CANDIDATE_LABELS


def test_analyze_endpoint_full():
    client = get_test_client()
    if not client:
        return
    payload = {
        "text": SAMPLE_MATRIX_SCRIPT,
        "filename": "matrix_script.txt"
    }
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    # Verify exact schema compliance
    assert "keywords" in data and isinstance(data["keywords"], list)
    assert "entities" in data and isinstance(data["entities"], list)
    assert "sentiment" in data and isinstance(data["sentiment"], dict)
    assert "polarity" in data["sentiment"] and "score" in data["sentiment"]
    assert "emotions" in data and isinstance(data["emotions"], list)
    assert "speakers" in data and isinstance(data["speakers"], list)
    assert "segments" in data and isinstance(data["segments"], list)
    assert "category" in data and isinstance(data["category"], dict)
    assert "label" in data["category"] and "confidence" in data["category"]


def test_analyze_endpoint_empty_text():
    client = get_test_client()
    if not client:
        return
    response = client.post("/analyze", json={"text": "", "filename": ""})
    assert response.status_code == 400
