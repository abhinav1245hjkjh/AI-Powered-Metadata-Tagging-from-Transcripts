from typing import List, Optional
from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    text: str = Field(..., description="Raw transcript text to analyze")
    filename: Optional[str] = Field(default="", description="Original filename if available")


class EntityItem(BaseModel):
    text: str
    label: str
    confidence: Optional[float] = 0.90



class SentimentResult(BaseModel):
    polarity: str  # positive, negative, neutral
    score: float   # compound score between -1.0 and 1.0


class EmotionItem(BaseModel):
    label: str
    score: float


class SpeakerItem(BaseModel):
    speaker: str
    lineCount: int
    wordCount: Optional[int] = 0


class SegmentItem(BaseModel):
    index: int
    heading: str
    speaker: Optional[str] = ""
    text: str
    excerpt: str = ""
    preview: Optional[str] = ""


class HandoffItem(BaseModel):
    from_speaker: str = Field(..., alias="from")
    to_speaker: str = Field(..., alias="to")
    segmentIndex: Optional[int] = 1
    heading: Optional[str] = ""
    context: Optional[str] = ""

    class Config:
        allow_population_by_field_name = True


class CategoryResult(BaseModel):
    label: str
    confidence: float


class AnalyzeResponse(BaseModel):
    wordCount: Optional[int] = 0
    keywords: List[str]
    entities: List[EntityItem]
    sentiment: SentimentResult
    emotions: List[EmotionItem]
    speakers: List[SpeakerItem]
    segments: List[SegmentItem]
    handoffs: Optional[List[HandoffItem]] = []
    category: CategoryResult

