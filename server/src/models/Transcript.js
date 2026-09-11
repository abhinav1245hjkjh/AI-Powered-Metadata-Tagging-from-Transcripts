const mongoose = require('mongoose');

const transcriptSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 250
  },
  rawText: {
    type: String,
    required: [true, 'Raw transcript text is required']
  },
  fileName: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['queued', 'processing', 'completed', 'failed', 'temporarily_rate_limited'],
    default: 'queued',
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  domain: {
    type: String,
    default: 'General',
    index: true
  },
  domainConfidence: {
    type: Number,
    default: 0.85
  },
  overallConfidence: {
    type: Number,
    default: 0.90
  },
  wordCount: {
    type: Number,
    default: 0
  },
  error: {
    type: String,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Clean output transformations exposing root-level metadata
transcriptSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    
    // Fallback: Populate root-level domain fields from metadata if domain is not set or is default General
    if (ret.metadata && ret.metadata.category && ret.metadata.category.label) {
      if (!ret.domain || ret.domain === 'General') {
        ret.domain = ret.metadata.category.label;
      }
      if ((ret.domainConfidence === undefined || ret.domainConfidence === null || ret.domainConfidence === 0.85) && typeof ret.metadata.category.confidence === 'number') {
        ret.domainConfidence = ret.metadata.category.confidence;
      }
    }
    if (ret.overallConfidence === undefined || ret.overallConfidence === null) {
      ret.overallConfidence = 0.90;
    }
    if (!ret.wordCount && ret.rawText) {
      ret.wordCount = ret.rawText.trim().split(/[\s\r\n\t]+/).filter(Boolean).length;
    }

    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Transcript', transcriptSchema);


