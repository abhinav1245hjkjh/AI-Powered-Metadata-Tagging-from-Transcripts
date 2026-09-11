const axios = require('axios');
const Transcript = require('../models/Transcript');

let rawAiUrl = (process.env.AI_SERVICE_URL || 'http://localhost:8000').trim().replace(/\/+$/, '');
if (rawAiUrl && !/^https?:\/\//i.test(rawAiUrl)) {
  rawAiUrl = `http://${rawAiUrl}`;
}
const AI_SERVICE_URL = rawAiUrl;

console.log(`[ANALYSIS] AI_SERVICE_URL configured as: ${AI_SERVICE_URL}`);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// In-memory set to track active analysis jobs to prevent duplicate processing
const activeAnalyses = new Set();

/**
 * Checks if an analysis job is currently active in memory
 */
const isAnalysisActive = (transcriptId) => {
  return activeAnalyses.has(String(transcriptId));
};

/**
 * Classifies AI provider and network errors into deterministic failure categories.
 */
const classifyAiError = (error) => {
  const status = error.response?.status;
  const detail = error.response?.data?.detail || error.response?.data?.message || error.message || '';
  const detailLower = String(detail).toLowerCase();

  // Parse Retry-After header if provided
  let retryAfterMs = null;
  const retryHeader = error.response?.headers?.['retry-after'];
  if (retryHeader) {
    const parsed = parseInt(retryHeader, 10);
    if (!isNaN(parsed) && parsed > 0) {
      retryAfterMs = parsed * 1000;
    }
  }

  // 1. Explicit Rate Limit (HTTP 429 or provider quota / rate limit text)
  if (
    status === 429 ||
    detailLower.includes('rate limit') ||
    detailLower.includes('ratelimit') ||
    detailLower.includes('too many requests') ||
    detailLower.includes('quota exceeded') ||
    detailLower.includes('resource exhausted')
  ) {
    return {
      isRateLimit: true,
      isPermanent: false,
      errorType: 'RATE_LIMIT',
      message: 'The AI provider is currently rate limiting requests. Your transcript is safe. Please retry analysis in a moment.',
      retryAfterMs
    };
  }

  // 2. Invalid API Key / Auth (HTTP 401 / 403 or invalid key text)
  if (
    status === 401 ||
    status === 403 ||
    detailLower.includes('invalid api key') ||
    detailLower.includes('unauthorized') ||
    detailLower.includes('authentication') ||
    detailLower.includes('invalid_api_key')
  ) {
    return {
      isRateLimit: false,
      isPermanent: true,
      errorType: 'INVALID_API_KEY',
      message: 'Invalid API Key or AI provider credentials configured. Please check server environment settings.',
      retryAfterMs: null
    };
  }

  // 3. Invalid Request (HTTP 400)
  if (status === 400 || detailLower.includes('bad request') || detailLower.includes('invalid request')) {
    return {
      isRateLimit: false,
      isPermanent: true,
      errorType: 'INVALID_REQUEST',
      message: `Invalid transcript analysis request: ${detail}`,
      retryAfterMs: null
    };
  }

  // 4. Connection refused / Microservice Offline
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return {
      isRateLimit: false,
      isPermanent: false,
      errorType: 'SERVICE_UNAVAILABLE',
      message: 'AI NLP Microservice is unavailable or offline. Please ensure Python FastAPI service is running on port 8000.',
      retryAfterMs: null
    };
  }

  // 5. Timeout
  if (error.code === 'ECONNABORTED' || detailLower.includes('timeout')) {
    return {
      isRateLimit: false,
      isPermanent: false,
      errorType: 'TIMEOUT',
      message: 'AI processing timed out after 180 seconds.',
      retryAfterMs: null
    };
  }

  // 6. Transient server error (502, 503, 504)
  if (status && [502, 503, 504].includes(status)) {
    return {
      isRateLimit: false,
      isPermanent: false,
      errorType: 'SERVICE_UNAVAILABLE',
      message: 'AI Microservice is starting up or temporarily low on memory. Please retry in a few seconds.',
      retryAfterMs: null
    };
  }

  // 7. Generic unexpected provider/server error
  return {
    isRateLimit: false,
    isPermanent: false,
    errorType: 'UNKNOWN',
    message: detail ? `AI Processing Error: ${detail}` : 'Metadata processing failed. Please retry.',
    retryAfterMs: null
  };
};

/**
 * Sends transcript text to the Python FastAPI NLP microservice and updates MongoDB document.
 * @param {string} transcriptId - The MongoDB document ID
 * @param {string} rawText - The transcript text
 * @param {string} fileName - Original file name if available
 */
const analyzeTranscript = async (transcriptId, rawText, fileName = '') => {
  const idStr = String(transcriptId);

  // Duplicate analysis check
  if (activeAnalyses.has(idStr)) {
    console.log(`[ANALYSIS] Analysis for transcript ${idStr} is already active/in progress. Skipping duplicate request.`);
    return await Transcript.findById(transcriptId);
  }

  activeAnalyses.add(idStr);

  try {
    // 1. Transition state to 'processing'
    console.log(`[ANALYSIS] MongoDB status update - Transcript ${idStr} -> processing`);
    await Transcript.findByIdAndUpdate(transcriptId, {
      status: 'processing',
      error: null
    });

    const sanitizedUrl = AI_SERVICE_URL.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@');
    console.log(`[AI DEBUG] Calling AI service: ${sanitizedUrl}`);
    console.log(`[AI DEBUG] Request started for transcript ${idStr}`);

    // 2. Controlled exponential backoff retry loop ONLY for rate limits
    let response;
    const maxRetries = 3;
    let attempt = 0;
    let lastClassified = null;

    while (attempt < maxRetries) {
      attempt++;
      console.log(`[ANALYSIS LOG] Transcript ID: ${idStr} | Attempt: ${attempt}/${maxRetries} started.`);

      try {
        response = await axios.post(
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

        console.log(`[ANALYSIS LOG] Transcript ID: ${idStr} | Attempt: ${attempt}/${maxRetries} succeeded with HTTP ${response.status}.`);
        lastClassified = null;
        break; // Success!
      } catch (axiosErr) {
        lastClassified = classifyAiError(axiosErr);

        console.warn(
          `[ANALYSIS LOG] Transcript ID: ${idStr} | Attempt: ${attempt}/${maxRetries} failed | ` +
          `Provider Error Type: ${lastClassified.errorType} | Rate Limited: ${lastClassified.isRateLimit} | ` +
          `Message: "${lastClassified.message}"`
        );

        // Controlled retry ONLY if error is genuinely rate-limit related and maxRetries not reached
        if (lastClassified.isRateLimit && attempt < maxRetries) {
          let backoffMs = lastClassified.retryAfterMs || (Math.pow(2, attempt - 1) * 1500 + Math.floor(Math.random() * 400));
          console.log(
            `[ANALYSIS LOG] Transcript ID: ${idStr} | Rate limited on attempt ${attempt}. ` +
            `Retrying after delay: ${backoffMs}ms (Next attempt: ${attempt + 1}/${maxRetries}).`
          );
          await delay(backoffMs);
        } else {
          // Stop retrying (either permanent error, non-rate-limit error, or retries exhausted)
          console.log(
            `[ANALYSIS LOG] Transcript ID: ${idStr} | Stopping retry loop at attempt ${attempt}. ` +
            `Reason: ${lastClassified.isRateLimit ? 'Max retries reached' : 'Non-retryable error (' + lastClassified.errorType + ')'}.`
          );
          break;
        }
      }
    }

    if (lastClassified) {
      // Retries failed or non-retryable error encountered
      const finalStatus = lastClassified.isRateLimit ? 'temporarily_rate_limited' : 'failed';
      const finalReason = lastClassified.message;

      console.error(
        `[ANALYSIS LOG] Final failure for Transcript ID: ${idStr} | ` +
        `Final Status: ${finalStatus} | Error Type: ${lastClassified.errorType} | ` +
        `Final Failure Reason: "${finalReason}"`
      );

      await Transcript.findByIdAndUpdate(transcriptId, {
        status: finalStatus,
        error: finalReason
      });

      return null;
    }

    const metadata = response.data || {};
    const domain = metadata.category && metadata.category.label ? metadata.category.label : 'General';
    const domainConfidence = metadata.category && typeof metadata.category.confidence === 'number' ? metadata.category.confidence : 0.85;
    const overallConfidence = 0.90;

    const words = (rawText || '').trim().split(/[\s\r\n\t]+/).filter(Boolean);
    const wordCount = metadata.wordCount || words.length;

    console.log(`[ANALYSIS] AI service response - Received HTTP ${response.status} for transcript ${idStr} (domain: ${domain})`);

    // 3. Persist extracted metadata and mark completed
    console.log(`[ANALYSIS] MongoDB status update - Transcript ${idStr} -> completed`);
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
    console.error(`[ANALYSIS LOG] Unexpected processing exception for Transcript ID: ${idStr}:`, error);
    await Transcript.findByIdAndUpdate(transcriptId, {
      status: 'failed',
      error: error.message || 'Metadata processing failed. Please retry.'
    });
    return null;
  } finally {
    activeAnalyses.delete(idStr);
  }
};

module.exports = {
  analyzeTranscript,
  isAnalysisActive,
  AI_SERVICE_URL
};

