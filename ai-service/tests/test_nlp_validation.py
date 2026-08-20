import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.nlp.entities import extract_entities, normalize_and_validate_entities, canonicalize_entity_label
from app.nlp.keywords import validate_keyphrase, format_phrase
from app.nlp.segmentation import segment_transcript, make_excerpt
from app.nlp.guardrails import validate_and_normalize_metadata, sanitize_float


class TestNERValidation(unittest.TestCase):

    def test_harvard_university_is_organization(self):
        label = canonicalize_entity_label("Harvard University", "PERSON")
        self.assertEqual(label, "ORGANIZATIONS")

    def test_sistine_chapel_is_location(self):
        label = canonicalize_entity_label("Sistine Chapel", "PERSON")
        self.assertEqual(label, "LOCATIONS")

    def test_nasa_is_organization(self):
        label = canonicalize_entity_label("NASA", "ORG")
        self.assertEqual(label, "ORGANIZATIONS")

    def test_john_is_person(self):
        label = canonicalize_entity_label("John", "PERSON")
        self.assertEqual(label, "PEOPLE")

    def test_mit_and_eiffel_tower(self):
        mit_label = canonicalize_entity_label("Massachusetts Institute of Technology", "PERSON")
        eiffel_label = canonicalize_entity_label("Eiffel Tower", "PERSON")
        self.assertEqual(mit_label, "ORGANIZATIONS")
        self.assertEqual(eiffel_label, "LOCATIONS")

    def test_ner_pipeline_test_cases(self):
        text = "She studied at Harvard University. The group visited the Sistine Chapel. John spoke with the director of NASA."
        entities = extract_entities(text)
        entity_map = {e["text"]: e["label"] for e in entities}

        self.assertEqual(entity_map.get("Harvard University"), "ORGANIZATIONS")
        self.assertEqual(entity_map.get("Sistine Chapel"), "LOCATIONS")
        self.assertEqual(entity_map.get("NASA"), "ORGANIZATIONS")
        self.assertEqual(entity_map.get("John"), "PEOPLE")

    def test_rejection_of_job_titles_and_common_words(self):
        raw = [
            {"text": "Engineer", "label": "PERSON"},
            {"text": "Senior", "label": "PERSON"},
            {"text": "Great", "label": "PERSON"},
            {"text": "How", "label": "PERSON"},
            {"text": "Let", "label": "PERSON"},
            {"text": "Sarah", "label": "PERSON"}
        ]
        validated = normalize_and_validate_entities(raw)
        texts = [v["text"] for v in validated]
        self.assertNotIn("Engineer", texts)
        self.assertNotIn("Senior", texts)
        self.assertNotIn("Great", texts)
        self.assertNotIn("How", texts)
        self.assertNotIn("Let", texts)
        self.assertIn("Sarah", texts)

    def test_entity_deduplication(self):
        raw = [
            {"text": "Harvard University", "label": "PERSON"},
            {"text": "harvard university", "label": "ORG"},
            {"text": "John", "label": "PERSON"}
        ]
        validated = normalize_and_validate_entities(raw)
        self.assertEqual(len(validated), 2)
        labels = {v["text"]: v["label"] for v in validated}
        self.assertEqual(labels["Harvard University"], "ORGANIZATIONS")
        self.assertEqual(labels["John"], "PEOPLE")



class TestKeyphraseValidation(unittest.TestCase):

    def test_valid_meaningful_keyphrases(self):
        valid_examples = [
            "machine learning",
            "climate change",
            "artificial intelligence",
            "quantum computing",
            "financial markets"
        ]
        for phrase in valid_examples:
            self.assertTrue(validate_keyphrase(phrase), f"Failed for valid phrase: {phrase}")

    def test_rejection_of_conversational_fragments(self):
        invalid_examples = [
            "You Don",
            "Have The Faintest",
            "I Think",
            "Well You Know",
            "you know",
            "i mean",
            "kind of",
            "sort of"
        ]
        for phrase in invalid_examples:
            self.assertFalse(validate_keyphrase(phrase), f"Failed to reject fragment: {phrase}")

    def test_stopword_heavy_and_empty_phrases(self):
        self.assertFalse(validate_keyphrase(""))
        self.assertFalse(validate_keyphrase("the and of"))
        self.assertFalse(validate_keyphrase("a"))

    def test_keyphrase_formatting(self):
        self.assertEqual(format_phrase("machine learning"), "Machine Learning")
        self.assertEqual(format_phrase("natural language processing"), "Natural Language Processing")
        self.assertEqual(format_phrase("ai models"), "AI Models")


class TestSegmentValidation(unittest.TestCase):

    def test_segment_creation_with_excerpt(self):
        text = "SEAN: We need to reconsider the entire approach before launching the new system."
        segments = segment_transcript(text)
        self.assertGreaterEqual(len(segments), 1)
        first = segments[0]

        self.assertIn("speaker", first)
        self.assertIn("text", first)
        self.assertIn("excerpt", first)
        self.assertEqual(first["speaker"], "SEAN")
        self.assertIn("We need to reconsider", first["excerpt"])
        self.assertFalse(first["excerpt"].startswith("SEAN:"))

    def test_long_dialogue_truncation(self):
        long_dialogue = "WILL: " + "We should analyze data carefully. " * 30
        excerpt = make_excerpt(long_dialogue, max_chars=100)
        self.assertLessEqual(len(excerpt), 110)
        self.assertTrue(excerpt.endswith("..."))

    def test_missing_speaker_handling(self):
        text = "The system automatically processes incoming data without manual intervention."
        segments = segment_transcript(text)
        self.assertGreaterEqual(len(segments), 1)
        self.assertIn("text", segments[0])
        self.assertIn("excerpt", segments[0])


from app.nlp.speakers import count_words, extract_speaker_handoffs, identify_speakers


class TestTokenizerAndHandoffs(unittest.TestCase):

    def test_canonical_count_words_tokenizer(self):
        sample_line = "SEAN: [00:01:23] We need to discuss machine learning models at Harvard University."
        count = count_words(sample_line)
        # Should count "We need to discuss machine learning models at Harvard University" (10 words)
        self.assertEqual(count, 10)

    def test_speaker_handoffs_extraction(self):
        text = """SEAN:
We should reconsider the research approach.

WILL:
I agree with the machine learning strategy.

SEAN:
Let's review the results tomorrow.
"""
        segments = segment_transcript(text)
        handoffs = extract_speaker_handoffs(segments)

        self.assertGreaterEqual(len(handoffs), 2)
        self.assertEqual(handoffs[0]["from"], "SEAN")
        self.assertEqual(handoffs[0]["to"], "WILL")
        self.assertEqual(handoffs[1]["from"], "WILL")
        self.assertEqual(handoffs[1]["to"], "SEAN")


class TestGuardrails(unittest.TestCase):

    def test_sanitize_float(self):
        self.assertEqual(sanitize_float(0.95, default=0.5, min_val=0.0, max_val=1.0), 0.95)
        self.assertEqual(sanitize_float(5.0, default=0.5, min_val=0.0, max_val=1.0), 1.0)
        self.assertEqual(sanitize_float(float("nan"), default=0.85), 0.85)

    def test_full_metadata_guardrail(self):
        raw_meta = {
            "entities": [{"text": "Harvard University", "label": "PERSON"}],
            "keywords": ["machine learning", "You Don"],
            "sentiment": {"polarity": "positive", "score": 1.5},
            "category": {"label": "technology", "confidence": float("nan")},
            "segments": [{"index": 1, "heading": "Seg 1", "text": "SEAN: Hello world."}],
            "handoffs": [{"from": "SEAN", "to": "WILL"}]
        }
        clean = validate_and_normalize_metadata(raw_meta, filename="test.txt")

        self.assertEqual(clean["entities"][0]["label"], "ORGANIZATIONS")
        self.assertIn("Machine Learning", clean["keywords"])
        self.assertNotIn("You Don", clean["keywords"])
        self.assertEqual(clean["sentiment"]["score"], 1.0)
        self.assertEqual(clean["category"]["confidence"], 0.85)
        self.assertEqual(clean["segments"][0]["excerpt"], "Hello world.")
        self.assertEqual(clean["handoffs"][0]["from"], "SEAN")
        self.assertEqual(clean["handoffs"][0]["to"], "WILL")


if __name__ == "__main__":
    unittest.main()

