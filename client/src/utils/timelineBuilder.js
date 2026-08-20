/**
 * Conversation Dynamics Timeline Builder — MetaScript AI
 * 
 * Deterministically analyzes transcript segments and dialogue turns to compute:
 * - Segment-level sentiment trajectory
 * - Speaker participation sequences & turn distributions
 * - Emotion evolution across segments
 * - Topic and entity appearance positions
 * - Conversation intensity / activity index (0-100)
 * - Deterministic sentiment shifts and multi-signal turning points
 */

const POSITIVE_LEXICON = [
  'good', 'great', 'excellent', 'love', 'happy', 'wonderful', 'best', 'incredible',
  'amazing', 'perfect', 'glad', 'enjoy', 'positive', 'win', 'success', 'benefit',
  'smile', 'beautiful', 'bright', 'delight', 'hope', 'proud', 'strong', 'true'
];

const NEGATIVE_LEXICON = [
  'bad', 'terrible', 'awful', 'hate', 'sad', 'angry', 'worst', 'problem',
  'fail', 'failure', 'poor', 'wrong', 'hurt', 'pain', 'suffer', 'hard',
  'difficult', 'trouble', 'conflict', 'loss', 'danger', 'fear', 'threat', 'enemy'
];

// Helper to compute calibrated sentence sentiment (-1.0 to +1.0)
const calculateLexicalScore = (text) => {
  if (!text) return 0;
  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  if (words.length === 0) return 0;

  let posCount = 0;
  let negCount = 0;

  words.forEach((w) => {
    if (POSITIVE_LEXICON.includes(w)) posCount++;
    if (NEGATIVE_LEXICON.includes(w)) negCount++;
  });

  const total = posCount + negCount;
  if (total === 0) return 0;
  return Number(((posCount - negCount) / Math.max(1, total)).toFixed(2));
};

export const buildConversationTimeline = (transcript) => {
  if (!transcript || !transcript.rawText) {
    return {
      segments: [],
      metrics: { overallSentiment: 'Neutral', shiftsCount: 0, turningPointsCount: 0, speakersCount: 0, topicsCount: 0 },
      turningPoints: [],
      speakerDistribution: [],
      topicOccurrences: [],
      entityOccurrences: []
    };
  }

  const meta = transcript.metadata || {};
  const rawText = transcript.rawText;
  const globalSentiment = meta.sentiment || { polarity: 'neutral', score: 0 };
  const globalEmotions = meta.emotions || [];
  const rawKeywords = meta.keywords || [];
  const rawEntities = meta.entities || [];
  const rawSpeakers = meta.speakers || [];

  // 1. Establish Discrete Timeline Segments
  let rawSegments = meta.segments && meta.segments.length > 0 ? meta.segments : [];

  // Fallback: If no explicit scene segments exist, partition rawText by speaker dialogue turns or paragraphs
  if (rawSegments.length === 0) {
    const lines = rawText.split(/\r\n|\r|\n/).filter((l) => l.trim().length > 0);
    const generated = [];
    let currentSpeaker = 'Speaker';
    let currentBlock = [];

    lines.forEach((line, idx) => {
      const speakerMatch = line.match(/^([A-Z0-9\s._-]{2,25}):\s*(.*)/i);
      if (speakerMatch) {
        if (currentBlock.length > 0) {
          generated.push({
            index: generated.length,
            heading: `Turn ${generated.length + 1} (${currentSpeaker})`,
            speaker: currentSpeaker,
            text: currentBlock.join(' ')
          });
          currentBlock = [];
        }
        currentSpeaker = speakerMatch[1].trim();
        currentBlock.push(speakerMatch[2].trim());
      } else {
        currentBlock.push(line.trim());
      }
    });

    if (currentBlock.length > 0) {
      generated.push({
        index: generated.length,
        heading: `Turn ${generated.length + 1} (${currentSpeaker})`,
        speaker: currentSpeaker,
        text: currentBlock.join(' ')
      });
    }

    rawSegments = generated.length > 0 ? generated : [{ index: 0, heading: 'Document Block', text: rawText }];
  }

  // 2. Build Rich Segment Data Series
  const segments = [];
  const speakerDialogueCounts = {};

  rawSegments.forEach((seg, idx) => {
    const text = seg.text || '';
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

    // Detect Speaker for this segment
    let speaker = seg.speaker || null;
    if (!speaker) {
      const match = text.match(/^([A-Z0-9\s._-]{2,25}):/);
      if (match) {
        speaker = match[1].trim();
      } else {
        // Match with known speakers
        const found = rawSpeakers.find((s) => text.toLowerCase().includes((s.speaker || '').toLowerCase()));
        speaker = found ? found.speaker : 'General Dialogue';
      }
    }

    speakerDialogueCounts[speaker] = (speakerDialogueCounts[speaker] || 0) + 1;

    // Calculate Segment Sentiment
    const localScore = calculateLexicalScore(text);
    // Blend with global score baseline
    const blendedScore = Number((localScore * 0.7 + (globalSentiment.score || 0) * 0.3).toFixed(2));
    const polarity = blendedScore > 0.15 ? 'Positive' : blendedScore < -0.15 ? 'Negative' : 'Neutral';

    // Calculate Conversation Intensity (0-100)
    // Factors: word density, lexical polarization, exclamation/question presence
    const puncIntensity = (text.match(/[!?]/g) || []).length * 8;
    const polarIntensity = Math.abs(blendedScore) * 40;
    const lengthIntensity = Math.min(40, (wordCount / 30) * 40);
    const intensity = Math.min(100, Math.max(15, Math.round(puncIntensity + polarIntensity + lengthIntensity)));

    // Detect Topics Present in Segment
    const matchedTopics = rawKeywords.filter((kw) => text.toLowerCase().includes(kw.toLowerCase()));

    // Detect Entities Present in Segment
    const matchedEntities = rawEntities
      .map((ent) => (typeof ent === 'string' ? ent : ent?.text || ent?.name || '').trim())
      .filter((entText) => entText && text.toLowerCase().includes(entText.toLowerCase()));

    // Dominant Emotion Proxy (calibrated by segment polarity and global top emotions)
    let dominantEmotion = 'Neutral';
    if (polarity === 'Positive') {
      dominantEmotion = globalEmotions.find((e) => ['joy', 'optimism', 'enthusiasm', 'trust'].includes(e.label.toLowerCase()))?.label || 'Optimism';
    } else if (polarity === 'Negative') {
      dominantEmotion = globalEmotions.find((e) => ['anger', 'frustration', 'sadness', 'fear'].includes(e.label.toLowerCase()))?.label || 'Frustration';
    } else {
      dominantEmotion = 'Neutral';
    }

    segments.push({
      index: idx + 1,
      id: `seg_${idx + 1}`,
      title: seg.heading || `Segment ${idx + 1}`,
      speaker,
      text,
      wordCount,
      sentimentScore: blendedScore,
      polarity,
      dominantEmotion: dominantEmotion.charAt(0).toUpperCase() + dominantEmotion.slice(1),
      intensity,
      topics: Array.from(new Set(matchedTopics)),
      entities: Array.from(new Set(matchedEntities))
    });
  });

  // 3. Detect Sentiment Shifts & Potential Turning Points
  const turningPoints = [];
  let shiftsCount = 0;

  for (let i = 1; i < segments.length; i++) {
    const prev = segments[i - 1];
    const curr = segments[i];

    const isPolarityShift = prev.polarity !== curr.polarity;
    const isMajorScoreDelta = Math.abs(curr.sentimentScore - prev.sentimentScore) >= 0.35;
    const isSpeakerChange = prev.speaker !== curr.speaker;
    const isTopicTransition = curr.topics.length > 0 && !curr.topics.some((t) => prev.topics.includes(t));

    if (isPolarityShift || isMajorScoreDelta) {
      shiftsCount++;
    }

    // A Turning Point is flagged when multiple structural signals converge
    let signalCount = 0;
    if (isPolarityShift) signalCount += 2;
    if (isMajorScoreDelta) signalCount += 1;
    if (isSpeakerChange) signalCount += 1;
    if (isTopicTransition) signalCount += 1;
    if (curr.intensity >= 65) signalCount += 1;

    if (signalCount >= 3) {
      turningPoints.push({
        id: `tp_${curr.index}`,
        segmentIndex: curr.index,
        segmentTitle: curr.title,
        speaker: curr.speaker,
        fromPolarity: prev.polarity,
        toPolarity: curr.polarity,
        fromScore: prev.sentimentScore,
        toScore: curr.sentimentScore,
        intensity: curr.intensity,
        dominantEmotion: curr.dominantEmotion,
        topic: curr.topics[0] || 'Dialogue Shift',
        summary: `${prev.polarity} → ${curr.polarity} shift with ${curr.speaker}`,
        confidence: signalCount >= 4 ? 'High' : 'Moderate'
      });
    }
  }

  // 4. Compute Speaker Distribution
  const totalTurns = segments.length || 1;
  const speakerDistribution = Object.entries(speakerDialogueCounts).map(([name, count]) => ({
    name,
    count,
    sharePercentage: Math.round((count / totalTurns) * 100)
  })).sort((a, b) => b.count - a.count);

  // 5. Compute Topic Occurrences along Sequence
  const topicOccurrences = rawKeywords.slice(0, 8).map((topic) => {
    const activeIndices = segments
      .filter((s) => s.topics.includes(topic))
      .map((s) => s.index);
    return {
      topic,
      occurrences: activeIndices.length,
      indices: activeIndices
    };
  }).filter((t) => t.occurrences > 0);

  // 6. Compute Entity Occurrences along Sequence
  const uniqueEntities = Array.from(
    new Set(rawEntities.map((e) => (typeof e === 'string' ? e : e?.text || e?.name || '').trim()))
  ).filter(Boolean).slice(0, 8);
  const entityOccurrences = uniqueEntities.map((ent) => {
    const activeIndices = segments
      .filter((s) => s.entities.includes(ent))
      .map((s) => s.index);
    return {
      entity: ent,
      occurrences: activeIndices.length,
      indices: activeIndices
    };
  }).filter((e) => e.occurrences > 0);

  return {
    segments,
    metrics: {
      overallSentiment: globalSentiment.polarity
        ? globalSentiment.polarity.charAt(0).toUpperCase() + globalSentiment.polarity.slice(1)
        : 'Neutral',
      shiftsCount,
      turningPointsCount: turningPoints.length,
      speakersCount: speakerDistribution.length,
      topicsCount: rawKeywords.length
    },
    turningPoints,
    speakerDistribution,
    topicOccurrences,
    entityOccurrences
  };
};
