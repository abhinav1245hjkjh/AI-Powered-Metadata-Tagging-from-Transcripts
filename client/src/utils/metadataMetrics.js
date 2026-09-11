/**
 * Metadata Metrics Utility — MetaMind AI
 * 
 * Provides centralized, data-driven calculation helpers for transcript metadata:
 * - Segment counts (scenes & dialogue blocks)
 * - Entity counts (spaCy extracted mentions)
 * - Speaker identification (distinct interlocutors across the library)
 * - Aggregate library KPI metrics
 */

/**
 * Get the count of segments for a single transcript
 * @param {Object} transcript
 * @returns {number}
 */
export const getSegmentCount = (transcript) => {
  if (!transcript || !transcript.metadata || !Array.isArray(transcript.metadata.segments)) {
    return 0;
  }
  return transcript.metadata.segments.length;
};

/**
 * Get the count of extracted named entities for a single transcript
 * @param {Object} transcript
 * @returns {number}
 */
export const getEntityCount = (transcript) => {
  if (!transcript || !transcript.metadata || !Array.isArray(transcript.metadata.entities)) {
    return 0;
  }
  return transcript.metadata.entities.length;
};

/**
 * Get distinct speaker names for a single transcript
 * @param {Object} transcript
 * @returns {string[]}
 */
export const getSpeakerNames = (transcript) => {
  if (!transcript || !transcript.metadata || !Array.isArray(transcript.metadata.speakers)) {
    return [];
  }
  return transcript.metadata.speakers
    .map((s) => (s.speaker ? s.speaker.trim() : ''))
    .filter(Boolean);
};

/**
 * Get speaker count for a single transcript
 * @param {Object} transcript
 * @returns {number}
 */
export const getSpeakerCount = (transcript) => {
  return getSpeakerNames(transcript).length;
};

/**
 * Canonical Word Count Tokenizer Helper — MetaMind AI
 * Uses authoritative backend transcript.wordCount if available, or normalizes raw text tokens.
 * @param {Object} transcript
 * @returns {number}
 */
export const getTranscriptWordCount = (transcript) => {
  if (!transcript) return 0;
  if (typeof transcript.wordCount === 'number' && transcript.wordCount >= 0) {
    return transcript.wordCount;
  }
  if (transcript.metadata && typeof transcript.metadata.wordCount === 'number' && transcript.metadata.wordCount >= 0) {
    return transcript.metadata.wordCount;
  }
  const text = transcript.rawText || '';
  if (!text.trim()) return 0;
  return text.trim().split(/[\s\r\n\t]+/).filter(Boolean).length;
};

/**
 * Compute real aggregate library KPI metrics across an array of transcripts
 * @param {Array} transcripts
 * @returns {Object} { total, processed, processing, failed, totalWords, totalSegments, totalEntities, distinctSpeakers }
 */
export const computeLibraryMetrics = (transcripts = []) => {
  if (!Array.isArray(transcripts) || transcripts.length === 0) {
    return {
      total: 0,
      totalCount: 0,
      processed: 0,
      completedCount: 0,
      processing: 0,
      processingCount: 0,
      failed: 0,
      failedCount: 0,
      completionPercentage: 0,
      totalWords: 0,
      totalSegments: 0,
      totalEntities: 0,
      totalEntitiesCount: 0,
      distinctSpeakers: 0,
      totalSpeakersCount: 0,
      uniqueCategoriesCount: 0
    };
  }

  const total = transcripts.length;
  let processed = 0;
  let processing = 0;
  let failed = 0;
  let totalWords = 0;
  let totalSegments = 0;
  let totalEntities = 0;
  const distinctSpeakerSet = new Set();
  const categorySet = new Set();

  transcripts.forEach((t) => {
    const status = t.status || 'queued';
    if (status === 'completed') {
      processed += 1;
    } else if (status === 'processing' || status === 'queued') {
      processing += 1;
    } else if (status === 'failed' || status === 'temporarily_rate_limited') {
      failed += 1;
    }

    totalWords += getTranscriptWordCount(t);

    if (t.metadata) {
      const catLabel = typeof t.metadata.category === 'object' ? t.metadata.category?.label : t.metadata.category;
      if (catLabel && String(catLabel).trim()) {
        categorySet.add(String(catLabel).trim().toLowerCase());
      }
    }

    // Only completed transcripts with valid metadata contribute to NLP metrics
    if (t.metadata && status === 'completed') {
      // 1. Total Segments (sum of segment blocks)
      if (Array.isArray(t.metadata.segments)) {
        totalSegments += t.metadata.segments.length;
      }

      // 2. Named Entities (sum of extracted mentions)
      if (Array.isArray(t.metadata.entities)) {
        totalEntities += t.metadata.entities.length;
      }

      // 3. Speakers Identified (distinct interlocutors normalized across the library)
      if (Array.isArray(t.metadata.speakers)) {
        t.metadata.speakers.forEach((s) => {
          const name = s.speaker ? s.speaker.trim() : '';
          if (name) {
            distinctSpeakerSet.add(name.toUpperCase());
          }
        });
      }
    }
  });

  const completionPercentage = total > 0 ? Math.round((processed / total) * 100) : 0;

  return {
    total,
    totalCount: total,
    processed,
    completedCount: processed,
    processing,
    processingCount: processing,
    failed,
    failedCount: failed,
    completionPercentage,
    totalWords,
    totalSegments,
    totalEntities,
    totalEntitiesCount: totalEntities,
    distinctSpeakers: distinctSpeakerSet.size,
    totalSpeakersCount: distinctSpeakerSet.size,
    uniqueCategoriesCount: categorySet.size
  };
};

