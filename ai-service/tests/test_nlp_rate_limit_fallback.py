import unittest
from unittest.mock import patch
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.nlp.guardrails import is_rate_limit_error, validate_and_normalize_metadata
from app.nlp.keywords import extract_keywords
from app.nlp.entities import extract_entities
from app.nlp.sentiment import analyze_sentiment
from app.nlp.emotion import analyze_emotions
from app.nlp.classify import classify_content

try:
    from fastapi.testclient import TestClient
    client = TestClient(app)
except Exception:
    client = None


class Custom429Exception(Exception):
    def __init__(self, message="Rate limit exceeded", status_code=429):
        super().__init__(message)
        self.status_code = status_code


GOOD_WILL_HUNTING_EXCERPT = """
INT. SEAN'S OFFICE - DAY

SEAN:
You're just a kid. You don't have the faintest idea what you're talking about.

WILL:
Try me.

SEAN:
You've never been out of Boston. So if I asked you about art, you'd probably give me the skinny on every art book ever written. Michelangelo, know a lot about him. But I'll bet you can't tell me what it smells like in the Sistine Chapel.
"""


class TestRateLimitFallback(unittest.TestCase):

    def test_is_rate_limit_error_helper(self):
        err_429 = Custom429Exception()
        self.assertTrue(is_rate_limit_error(err_429))
        self.assertTrue(is_rate_limit_error(Exception("429 Too Many Requests")))
        self.assertTrue(is_rate_limit_error(Exception("Rate limit exceeded")))
        self.assertFalse(is_rate_limit_error(Exception("Division by zero")))
        self.assertFalse(is_rate_limit_error(None))

    @patch("app.nlp.keywords.get_keybert_model")
    @patch("app.nlp.entities.get_spacy_model")
    @patch("app.nlp.sentiment.get_vader_analyzer")
    @patch("app.nlp.emotion.get_emotion_pipeline")
    @patch("app.nlp.classify.get_classifier_pipeline")
    def test_analyze_endpoint_recovers_from_429_rate_limit(
        self, mock_classify, mock_emotion, mock_vader, mock_spacy, mock_kw
    ):
        """
        Simulates HTTP 429 rate limit exceptions across external providers/models
        and verifies that /analyze returns HTTP 200 with real local fallback metadata.
        """
        # All models throw 429 rate limit exception when called
        mock_kw.side_effect = Custom429Exception("429 Too Many Requests")
        mock_spacy.side_effect = Custom429Exception("Rate limit exceeded")
        mock_vader.side_effect = Custom429Exception("429 RateLimitError")
        mock_emotion.side_effect = Custom429Exception("429 Client Error: Too Many Requests")
        mock_classify.side_effect = Custom429Exception("429 RateLimit")

        if client:
            response = client.post("/analyze", json={
                "text": GOOD_WILL_HUNTING_EXCERPT,
                "filename": "good_will_hunting.txt"
            })

            self.assertEqual(response.status_code, 200, "Endpoint must return 200 even under provider 429 rate limit")
            data = response.json()

            # Verify response schema integrity
            self.assertIn("keywords", data)
            self.assertIn("entities", data)
            self.assertIn("sentiment", data)
            self.assertIn("emotions", data)
            self.assertIn("speakers", data)
            self.assertIn("segments", data)
            self.assertIn("category", data)

            # Verify real metadata derived from local fallbacks
            self.assertGreater(len(data["keywords"]), 0)
            self.assertIsInstance(data["sentiment"], dict)
            self.assertIn("polarity", data["sentiment"])
            self.assertGreater(len(data["emotions"]), 0)
            self.assertGreater(len(data["speakers"]), 0)

            # Speaker identification should recognize SEAN and WILL
            speaker_names = [s["speaker"] for s in data["speakers"]]
            self.assertIn("SEAN", speaker_names)
            self.assertIn("WILL", speaker_names)

    @patch("app.nlp.keywords.get_keybert_model")
    @patch("app.nlp.entities.get_spacy_model")
    @patch("app.nlp.sentiment.get_vader_analyzer")
    @patch("app.nlp.emotion.get_emotion_pipeline")
    @patch("app.nlp.classify.get_classifier_pipeline")
    def test_analyze_endpoint_recovers_from_generic_exceptions(
        self, mock_classify, mock_emotion, mock_vader, mock_spacy, mock_kw
    ):
        """
        Simulates generic model errors and verifies HTTP 200 response with normalized local metadata.
        """
        mock_kw.side_effect = RuntimeError("GPU memory overflow")
        mock_spacy.side_effect = OSError("Model file corrupt")
        mock_vader.side_effect = ValueError("Corrupt lexicon")
        mock_emotion.side_effect = RuntimeError("Inference error")
        mock_classify.side_effect = Exception("Model unreachable")

        if client:
            response = client.post("/analyze", json={
                "text": GOOD_WILL_HUNTING_EXCERPT,
                "filename": "good_will_hunting.txt"
            })

            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn("category", data)
            self.assertIn(data["category"]["label"], ["General", "Entertainment"])

    def test_local_fallbacks_produce_real_metadata(self):
        """
        Verifies that local fallbacks compute real metadata derived from text without dummy hardcoded values.
        """
        # 1. Keywords
        kw = extract_keywords(GOOD_WILL_HUNTING_EXCERPT)
        self.assertGreater(len(kw), 0)
        self.assertNotIn("demo", [k.lower() for k in kw])
        self.assertNotIn("sample", [k.lower() for k in kw])
        self.assertNotIn("test", [k.lower() for k in kw])

        # 2. Entities
        entities = extract_entities("Sean Maguire visited the Sistine Chapel in Boston with Will.")
        entity_texts = [e["text"] for e in entities]
        self.assertIn("Sistine Chapel", entity_texts)
        self.assertIn("Boston", entity_texts)

        # 3. Sentiment
        sentiment = analyze_sentiment("You are brilliant, outstanding, and fantastic!")
        self.assertEqual(sentiment["polarity"], "positive")

        # 4. Emotions
        emotions = analyze_emotions("I am so happy and enthusiastic about our success!")
        top_emotion = emotions[0]["label"]
        self.assertIn(top_emotion, ["joy", "enthusiasm", "optimism"])

        # 5. Classification
        cat = classify_content(GOOD_WILL_HUNTING_EXCERPT, filename="script.txt")
        self.assertEqual(cat["label"], "entertainment")


if __name__ == "__main__":
    unittest.main()
