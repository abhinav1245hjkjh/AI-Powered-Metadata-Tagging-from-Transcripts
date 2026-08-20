const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../src/server');
const User = require('../src/models/User');
const Transcript = require('../src/models/Transcript');

let mongoServer;
let userToken;
let userId;
let otherUserToken;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_jwt_secret_key_123';
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Register main test user
  const res = await request(app).post('/api/auth/register').send({
    name: 'Hackathon Tester',
    email: 'tester@metamind.ai',
    password: 'Password123!'
  });
  userToken = res.body.token;
  userId = res.body.user._id;

  // Register secondary user for authorization isolation testing
  const resOther = await request(app).post('/api/auth/register').send({
    name: 'Other User',
    email: 'other@metamind.ai',
    password: 'Password123!'
  });
  otherUserToken = resOther.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Transcript.deleteMany({});
});

describe('Transcript API Suite', () => {
  const sampleScript = `INT. COGNIZANT LAB - DAY
ENGINEER: The AI pipeline is operational.
ARCHITECT: Excellent. All tests pass with zero mock data.`;

  describe('POST /api/transcripts', () => {
    it('should create a transcript via raw text payload', async () => {
      const res = await request(app)
        .post('/api/transcripts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Cognizant Lab Scene',
          text: sampleScript,
          fileName: 'cognizant_lab.txt'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.transcript.title).toBe('Cognizant Lab Scene');
      expect(res.body.transcript.status).toBe('queued');
      expect(res.body.transcript.rawText).toBe(sampleScript);
    });

    it('should create a transcript via file upload (.txt)', async () => {
      const res = await request(app)
        .post('/api/transcripts')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', Buffer.from(sampleScript), 'uploaded_script.txt');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.transcript.title).toBe('uploaded script');
      expect(res.body.transcript.fileName).toBe('uploaded_script.txt');
    });

    it('should create a transcript via JSON file upload', async () => {
      const jsonContent = JSON.stringify({
        meetingTitle: 'Annual Strategy Review',
        text: 'CEO: Welcome everyone to the quarterly board meeting.'
      });

      const res = await request(app)
        .post('/api/transcripts')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', Buffer.from(jsonContent), 'meeting_notes.json');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.transcript.title).toBe('Annual Strategy Review');
    });

    it('should reject empty transcript', async () => {
      const res = await request(app)
        .post('/api/transcripts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Empty Transcript',
          text: '   '
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject unauthenticated upload attempt', async () => {
      const res = await request(app)
        .post('/api/transcripts')
        .send({ title: 'No Auth', text: sampleScript });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/transcripts', () => {
    beforeEach(async () => {
      await Transcript.create([
        {
          title: 'The Matrix Script',
          rawText: 'TRINITY: The mainframe is ready.',
          status: 'completed',
          metadata: {
            category: { label: 'entertainment', confidence: 0.95 },
            sentiment: { polarity: 'neutral', score: 0.0 },
            segments: [{ index: 0, heading: 'Intro', text: 'TRINITY: The mainframe is ready.' }],
            entities: [{ text: 'Mainframe', label: 'PRODUCT' }],
            speakers: [{ speaker: 'TRINITY', lineCount: 1 }]
          },
          createdBy: userId
        },
        {
          title: 'Tech Interview with Alex',
          rawText: 'INTERVIEWER: Welcome to the team.',
          status: 'completed',
          metadata: {
            category: { label: 'interview', confidence: 0.88 },
            sentiment: { polarity: 'positive', score: 0.6 },
            segments: [{ index: 0, heading: 'Dialogue', text: 'INTERVIEWER: Welcome to the team.' }],
            entities: [{ text: 'Alex', label: 'PERSON' }],
            speakers: [{ speaker: 'INTERVIEWER', lineCount: 1 }]
          },
          createdBy: userId
        }
      ]);
    });

    it('should list all transcripts for the authenticated user with rawText and full metadata included', async () => {
      const res = await request(app)
        .get('/api/transcripts')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.transcripts[0].rawText).toBeDefined();
      expect(typeof res.body.transcripts[0].rawText).toBe('string');
      expect(res.body.transcripts[0].metadata).toBeDefined();
      expect(Array.isArray(res.body.transcripts[0].metadata.segments)).toBe(true);
      expect(Array.isArray(res.body.transcripts[0].metadata.entities)).toBe(true);
      expect(Array.isArray(res.body.transcripts[0].metadata.speakers)).toBe(true);
    });

    it('should filter transcripts by search query', async () => {
      const res = await request(app)
        .get('/api/transcripts?q=Matrix')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.transcripts[0].title).toBe('The Matrix Script');
    });

    it('should filter transcripts by category', async () => {
      const res = await request(app)
        .get('/api/transcripts?category=interview')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.transcripts[0].title).toBe('Tech Interview with Alex');
    });
  });

  describe('GET /api/transcripts/:id', () => {
    let transcriptId;

    beforeEach(async () => {
      const t = await Transcript.create({
        title: 'Single Transcript Test',
        rawText: 'Test dialogue text',
        status: 'completed',
        metadata: { keywords: ['ai', 'testing'] },
        createdBy: userId
      });
      transcriptId = t._id;
    });

    it('should retrieve single transcript with metadata', async () => {
      const res = await request(app)
        .get(`/api/transcripts/${transcriptId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.transcript.title).toBe('Single Transcript Test');
      expect(res.body.transcript.metadata.keywords).toContain('ai');
    });

    it('should deny access to another user transcript (403)', async () => {
      const res = await request(app)
        .get(`/api/transcripts/${transcriptId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent transcript', async () => {
      const randomId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/transcripts/${randomId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/transcripts/:id', () => {
    let transcriptId;

    beforeEach(async () => {
      const t = await Transcript.create({
        title: 'Delete Test',
        rawText: 'To be deleted',
        status: 'completed',
        createdBy: userId
      });
      transcriptId = t._id;
    });

    it('should delete transcript successfully', async () => {
      const res = await request(app)
        .delete(`/api/transcripts/${transcriptId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await Transcript.findById(transcriptId);
      expect(check).toBeNull();
    });

    it('should prevent unauthorized deletion (403)', async () => {
      const res = await request(app)
        .delete(`/api/transcripts/${transcriptId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(403);
    });
  });
});
