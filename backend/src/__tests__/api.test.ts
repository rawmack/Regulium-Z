import request from 'supertest';
import express from 'express';
import apiRoutes from '../routes/api';

const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

describe('API Endpoints', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/laws', () => {
    it('should return all laws', async () => {
      const response = await request(app).get('/api/laws');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/features', () => {
    it('should return all features', async () => {
      const response = await request(app).get('/api/features');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/compliance/check', () => {
    it('should perform compliance check with valid data', async () => {
      const complianceData = {
        features: ['Test Feature'],
        laws: ['Test Law'],
        use_abbreviations: true,
        use_corrections: true
      };

      const response = await request(app)
        .post('/api/compliance/check')
        .send(complianceData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    it('should handle missing features', async () => {
      const complianceData = {
        laws: ['Test Law'],
        use_abbreviations: true,
        use_corrections: true
      };

      const response = await request(app)
        .post('/api/compliance/check')
        .send(complianceData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle missing laws', async () => {
      const complianceData = {
        features: ['Test Feature'],
        use_abbreviations: true,
        use_corrections: true
      };

      const response = await request(app)
        .post('/api/compliance/check')
        .send(complianceData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/feedback', () => {
    it('should create new feedback', async () => {
      const feedbackData = {
        feature_name: 'Test Feature',
        law_title: 'Test Law',
        feedback_type: 'correction',
        message: 'Test feedback message',
        user_email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/feedback')
        .send(feedbackData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('feedback_id');
    });

    it('should handle missing required fields', async () => {
      const feedbackData = {
        feature_name: 'Test Feature',
        feedback_type: 'correction'
        // Missing message
      };

      const response = await request(app)
        .post('/api/feedback')
        .send(feedbackData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/feedback', () => {
    it('should return all feedback', async () => {
      const response = await request(app).get('/api/feedback');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
