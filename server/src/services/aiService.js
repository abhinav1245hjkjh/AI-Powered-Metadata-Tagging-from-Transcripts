const axios = require('axios');
const Transcript = require('../models/Transcript');

let rawAiUrl = (process.env.AI_SERVICE_URL || 'http://localhost:8000').trim().replace(/\/+$/, '');
if (!rawAiUrl.startsWith('http://') && !rawAiUrl.startsWith('https://')) {
  rawAiUrl = `http://${rawAiUrl}`;
}
const AI_SERVICE_URL = rawAiUrl;

console.log(`[ANALYSIS] AI_SERVICE_URL configured as: ${AI_SERVICE_URL}`);

/**
 * Sends transcript text to the Python FastAPI NLP microservice and updates MongoDB document.
 * @param {string} transcriptId - The MongoDB document ID
 * @param {string} rawText - The transcript text
 * @param {string} fileName - Original file name if available
 */
const analyzeTranscript = async (transcriptId, rawText, fileName = '') => {
  try {
    // 1. Transition state to 'processing'
    console.log(`[ANALYSIS] MongoDB status update - Transcript ${transcriptId} -> processing`);
    await Transcript.findByIdAndUpdate(transcriptId, {
      status: 'processing',
      error: null
    });

    console.log(`[ANALYSIS] Node -> AI service - Dispatching POST ${AI_SERVICE_URL}/analyze for transcript ${transcriptId}`);

    // 2. Call Python FastAPI AI Service with a 180s timeout
    const response = await axios.post(
      `${AI_SERVICE_URL}/analyze`,
      {
        text: rawText,
        filename: fileName
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 180000 // 180 seconds (3 minutes)
      }
    );

    const metadata = response.data || {};

    const domain = metadata.category && metadata.category.label ? metadata.category.label : 'General';
    const domainConfidence = metadata.category && typeof metadata.category.confidence === 'number' ? metadata.category.confidence : 0.85;
    const overallConfidence = 0.90;

    // Canonical Word Count calculation
    const words = (rawText || '').trim().split(/[\s\r\n\t]+/).filter(Boolean);
    const wordCount = metadata.wordCount || words.length;

    console.log(`[ANALYSIS] AI service response - Received HTTP ${response.status} for transcript ${transcriptId} (domain: ${domain})`);

    // 3. Persist extracted metadata and root-level fields, mark as completed
    console.log(`[ANALYSIS] MongoDB status update - Transcript ${transcriptId} -> completed`);
    const updated = await Transcript.findByIdAndUpdate(
      transcriptId,
      {
        status: 'completed',
        metadata: metadata,
        domain: domain,
        domainConfidence: domainConfidence,
        overallConfidence: overallConfidence,
        wordCount: wordCount,
        error: null
      },
      { new: true }
    );

    return updated;

  } catch (error) {
    let errorMessage = 'Metadata processing failed. Please retry.';

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      errorMessage = 'AI NLP Microservice is unavailable or offline. Please ensure Python FastAPI service is running on port 8000.';
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      errorMessage = 'AI processing timed out after 180 seconds.';
    } else if (error.response && [502, 503, 504].includes(error.response.status)) {
      errorMessage = 'AI Microservice is starting up or temporarily low on memory. Please retry in a few seconds.';
    } else if (error.response && error.response.data && error.response.data.detail) {
      errorMessage = `AI Processing Error: ${error.response.data.detail}`;
    } else if (error.message) {
      errorMessage = `Processing failure: ${error.message}`;
    }

    console.error(`[ANALYSIS] AI service response ERROR - Transcript ${transcriptId}:`, errorMessage);

    // 4. Update status to failed with exact safe error description
    console.log(`[ANALYSIS] MongoDB status update - Transcript ${transcriptId} -> failed (${errorMessage})`);
    await Transcript.findByIdAndUpdate(transcriptId, {
      status: 'failed',
      error: errorMessage
    });

    return null;
  }
};

module.exports = {
  analyzeTranscript,
  AI_SERVICE_URL
};
