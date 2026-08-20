const mongoose = require('mongoose');
const Transcript = require('../src/models/Transcript');

describe('Transcript Model & Metadata Representation Tests', () => {

  test('Transcript schema formats root-level domain fields cleanly', () => {
    const doc = new Transcript({
      title: 'Test Transcript',
      rawText: 'SEAN: We need to analyze machine learning models.',
      fileName: 'test.txt',
      status: 'completed',
      createdBy: new mongoose.Types.ObjectId(),
      metadata: {
        category: { label: 'Technology', confidence: 0.94 },
        keywords: ['Machine Learning'],
        entities: [{ text: 'Harvard University', label: 'ORGANIZATIONS' }]
      }
    });

    const json = doc.toJSON();

    expect(json.title).toBe('Test Transcript');
    expect(json.status).toBe('completed');
    expect(json.domain).toBe('Technology');
    expect(json.domainConfidence).toBe(0.94);
    expect(json.overallConfidence).toBe(0.90);
    expect(json.metadata.keywords).toContain('Machine Learning');
  });

  test('Transcript schema handles missing domain gracefully with default values', () => {
    const doc = new Transcript({
      title: 'Fallback Test',
      rawText: 'Sample text.',
      createdBy: new mongoose.Types.ObjectId()
    });

    const json = doc.toJSON();

    expect(json.domain).toBe('General');
    expect(json.domainConfidence).toBe(0.85);
    expect(json.overallConfidence).toBe(0.90);
  });
});
