const path = require('path');
const Transcript = require('../models/Transcript');
const { analyzeTranscript } = require('../services/aiService');

// @desc    Create/Upload new transcript
// @route   POST /api/transcripts
// @access  Private
const createTranscript = async (req, res) => {
  try {
    let rawText = '';
    let fileName = '';
    let title = req.body.title ? req.body.title.trim() : '';

    if (req.file) {
      fileName = req.file.originalname;
      const ext = path.extname(fileName).toLowerCase();

      try {
        const bufferString = req.file.buffer.toString('utf-8');

        if (ext === '.json') {
          try {
            const parsedJson = JSON.parse(bufferString);
            if (typeof parsedJson === 'string') {
              rawText = parsedJson;
            } else if (parsedJson.text) {
              rawText = parsedJson.text;
            } else if (parsedJson.transcript) {
              rawText = parsedJson.transcript;
            } else if (parsedJson.script) {
              rawText = parsedJson.script;
            } else if (parsedJson.content) {
              rawText = parsedJson.content;
            } else {
              // Extract all string values from the JSON document
              rawText = JSON.stringify(parsedJson, null, 2);
            }

            if (!title && parsedJson.meetingTitle) {
              title = parsedJson.meetingTitle;
            } else if (!title && parsedJson.title) {
              title = parsedJson.title;
            }
          } catch (jsonErr) {
            return res.status(400).json({
              success: false,
              message: 'Malformed JSON file. Please ensure the uploaded file contains valid JSON.'
            });
          }
        } else {
          rawText = bufferString;
        }
      } catch (encodingErr) {
        return res.status(400).json({
          success: false,
          message: 'Unsupported file encoding. Please upload UTF-8 encoded text.'
        });
      }

      if (!title) {
        title = path.parse(fileName).name.replace(/[_\-]+/g, ' ');
      }
    } else if (req.body.text) {
      rawText = req.body.text;
      fileName = req.body.fileName || 'pasted_transcript.txt';
      if (!title) {
        title = req.body.title ? req.body.title.trim() : 'Pasted Transcript';
      }
    }

    if (!rawText || !rawText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Transcript text cannot be empty. Please provide valid transcript text or file.'
      });
    }

    if (!title) {
      title = 'Untitled Transcript';
    }

    // Create transcript record in MongoDB
    console.log(`[ANALYSIS] frontend request received - POST /api/transcripts (title: "${title}", fileName: "${fileName}", length: ${rawText.length} chars)`);
    const transcript = await Transcript.create({
      title,
      rawText: rawText.trim(),
      fileName,
      status: 'queued',
      metadata: null,
      error: null,
      createdBy: req.user._id
    });

    // Asynchronously dispatch NLP analysis without blocking response
    analyzeTranscript(transcript._id, transcript.rawText, fileName).catch((err) => {
      console.error(`Background analysis error for ${transcript._id}:`, err);
    });

    return res.status(201).json({
      success: true,
      message: 'Transcript uploaded successfully. Processing queued.',
      transcript
    });

  } catch (error) {
    console.error('Error creating transcript:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating transcript.'
    });
  }
};

// @desc    Get all transcripts with search and filtering
// @route   GET /api/transcripts
// @access  Private
const getTranscripts = async (req, res) => {
  try {
    const { q, search, status, category, sentiment } = req.query;
    const filter = { createdBy: req.user._id };

    // Search query on title
    const searchParam = q || search;
    if (searchParam && searchParam.trim()) {
      filter.title = { $regex: searchParam.trim(), $options: 'i' };
    }

    // Status filter
    if (status && ['queued', 'processing', 'completed', 'failed'].includes(status)) {
      filter.status = status;
    }

    // Category filter
    if (category && category.trim()) {
      filter['metadata.category.label'] = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
    }

    // Sentiment filter
    if (sentiment && ['positive', 'negative', 'neutral'].includes(sentiment.toLowerCase())) {
      filter['metadata.sentiment.polarity'] = sentiment.toLowerCase();
    }

    const transcripts = await Transcript.find(filter)
      .sort({ createdAt: -1 })
      .select('title rawText fileName status metadata createdAt error');

    return res.status(200).json({
      success: true,
      count: transcripts.length,
      transcripts
    });

  } catch (error) {
    console.error('Error fetching transcripts:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching transcripts.'
    });
  }
};

// @desc    Get single transcript by ID
// @route   GET /api/transcripts/:id
// @access  Private
const getTranscriptById = async (req, res) => {
  try {
    const transcript = await Transcript.findById(req.params.id);

    if (!transcript) {
      return res.status(404).json({
        success: false,
        message: 'Transcript not found.'
      });
    }

    if (transcript.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this transcript.'
      });
    }

    console.log(`[ANALYSIS] frontend polling status - GET /api/transcripts/${req.params.id} -> status: "${transcript.status}"`);

    return res.status(200).json({
      success: true,
      transcript
    });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Invalid transcript ID format.'
      });
    }
    console.error('Error fetching transcript details:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching transcript details.'
    });
  }
};

// @desc    Delete transcript
// @route   DELETE /api/transcripts/:id
// @access  Private
const deleteTranscript = async (req, res) => {
  try {
    const transcript = await Transcript.findById(req.params.id);

    if (!transcript) {
      return res.status(404).json({
        success: false,
        message: 'Transcript not found.'
      });
    }

    if (transcript.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized action.'
      });
    }

    await Transcript.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Transcript deleted successfully.'
    });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Invalid transcript ID format.'
      });
    }
    console.error('Error deleting transcript:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting transcript.'
    });
  }
};

// @desc    Retry processing failed transcript
// @route   POST /api/transcripts/:id/retry
// @access  Private
const retryTranscript = async (req, res) => {
  try {
    const transcript = await Transcript.findById(req.params.id);

    if (!transcript) {
      return res.status(404).json({
        success: false,
        message: 'Transcript not found.'
      });
    }

    if (transcript.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized action.'
      });
    }

    transcript.status = 'queued';
    transcript.error = null;
    await transcript.save();

    // Trigger analysis
    analyzeTranscript(transcript._id, transcript.rawText, transcript.fileName).catch((err) => {
      console.error(`Retry analysis error for ${transcript._id}:`, err);
    });

    return res.status(200).json({
      success: true,
      message: 'Transcript processing re-queued.',
      transcript
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while retrying transcript.'
    });
  }
};

module.exports = {
  createTranscript,
  getTranscripts,
  getTranscriptById,
  deleteTranscript,
  retryTranscript
};
