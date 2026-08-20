const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Transcript = require('../models/Transcript');

// Institution and Landmark lists for Node-side migration normalization
const INSTITUTION_NAMES = new Set([
  'harvard', 'harvard university', 'mit', 'massachusetts institute of technology',
  'stanford', 'stanford university', 'oxford', 'cambridge', 'yale', 'princeton',
  'columbia', 'cornell', 'uc berkeley', 'caltech', 'nasa', 'fbi', 'cia', 'nato'
]);

const LANDMARK_NAMES = new Set([
  'sistine chapel', 'eiffel tower', 'statue of liberty', 'taj mahal',
  'big ben', 'golden gate bridge', 'grand canyon', 'empire state building',
  'louvre', 'colosseum', 'pyramids', 'wall street', 'times square'
]);

const CONVERSATIONAL_REJECTS = new Set([
  'you don', 'have the faintest', 'i think', 'well you know', 'you know', 'i mean'
]);

/**
 * Migration & Normalization script for existing MongoDB Transcript documents.
 * Preserves existing data while populating root-level fields and repairing metadata anomalies.
 */
const migrateTranscripts = async () => {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/metamind_ai';
  console.log(`[Migration] Connecting to ${MONGO_URI}...`);

  let connected = false;
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 3000 });
    connected = true;
    console.log('[Migration] Connected to MongoDB.');
  } catch (err) {
    console.warn(`[Migration] External MongoDB unreachable (${err.message}). Attempting in-memory server...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      await mongoose.connect(mongoServer.getUri());
      connected = true;
      console.log('[Migration] Connected to in-memory MongoDB.');
    } catch (memErr) {
      console.error('[Migration] Failed to connect to MongoDB engine:', memErr.message);
      return { success: false, error: memErr.message };
    }
  }

  if (!connected) return { success: false, error: 'Database connection failed' };

  try {
    const transcripts = await Transcript.find({});
    console.log(`[Migration] Found ${transcripts.length} transcript records to inspect.`);

    let updatedCount = 0;

    for (const doc of transcripts) {
      let isModified = false;

      // 1. Populate root-level domain metadata fields
      const meta = doc.metadata || {};
      const catLabel = meta.category && meta.category.label ? meta.category.label : 'General';
      const catConf = meta.category && typeof meta.category.confidence === 'number' ? meta.category.confidence : 0.85;

      if (!doc.domain || doc.domain === 'General' && catLabel !== 'General') {
        doc.domain = catLabel;
        isModified = true;
      }
      if (doc.domainConfidence === undefined || doc.domainConfidence === null) {
        doc.domainConfidence = catConf;
        isModified = true;
      }
      if (doc.overallConfidence === undefined || doc.overallConfidence === null) {
        doc.overallConfidence = 0.90;
        isModified = true;
      }

      // 2. Normalize metadata entities if present
      if (meta.entities && Array.isArray(meta.entities)) {
        const cleanedEntities = [];
        const seen = new Set();

        meta.entities.forEach((ent) => {
          if (!ent || !ent.text) return;
          const text = ent.text.trim();
          const textLower = text.toLowerCase();
          let label = ent.label || 'OTHER';

          if (INSTITUTION_NAMES.has(textLower) || textLower.includes('university') || textLower.includes('institute')) {
            label = 'ORGANIZATIONS';
          } else if (LANDMARK_NAMES.has(textLower) || textLower.includes('chapel') || textLower.includes('tower')) {
            label = 'LOCATIONS';
          } else if (label === 'PERSON') {
            label = 'PEOPLE';
          } else if (label === 'ORG') {
            label = 'ORGANIZATIONS';
          } else if (label === 'GPE' || label === 'LOC' || label === 'FAC') {
            label = 'LOCATIONS';
          }

          const key = `${textLower}___${label}`;
          if (!seen.has(key)) {
            seen.add(key);
            cleanedEntities.append ? cleanedEntities.append({ text, label }) : cleanedEntities.push({ text, label });
          }
        });

        if (cleanedEntities.length !== meta.entities.length || JSON.stringify(cleanedEntities) !== JSON.stringify(meta.entities)) {
          meta.entities = cleanedEntities;
          isModified = true;
        }
      }

      // 3. Normalize keywords if present
      if (meta.keywords && Array.isArray(meta.keywords)) {
        const cleanedKw = meta.keywords.filter((kw) => {
          if (!kw || typeof kw !== 'string') return false;
          return !CONVERSATIONAL_REJECTS.has(kw.trim().toLowerCase());
        });

        if (cleanedKw.length !== meta.keywords.length) {
          meta.keywords = cleanedKw;
          isModified = true;
        }
      }

      // 4. Ensure segments have non-empty excerpt preview
      if (meta.segments && Array.isArray(meta.segments)) {
        meta.segments.forEach((seg) => {
          if (seg.text && (!seg.excerpt || seg.excerpt === '')) {
            const clean = seg.text.replace(/^\s*[A-Z0-9\.\'\s\-]{2,25}\s*:\s*/, '').trim();
            seg.excerpt = clean.length > 150 ? clean.substring(0, 150) + '...' : clean;
            isModified = true;
          }
        });
      }

      if (isModified) {
        doc.metadata = meta;
        doc.markModified('metadata');
        await doc.save();
        updatedCount++;
      }
    }

    console.log(`[Migration] Completed successfully. Updated ${updatedCount} / ${transcripts.length} documents.`);
    return { success: true, total: transcripts.length, updated: updatedCount };

  } catch (err) {
    console.error('[Migration] Error during migration:', err);
    return { success: false, error: err.message };
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
};

if (require.main === module) {
  migrateTranscripts().then((res) => {
    console.log('[Migration] Finished:', res);
    process.exit(res.success ? 0 : 1);
  });
}

module.exports = migrateTranscripts;
