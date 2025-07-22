import request from 'supertest';
import app from '../src/index';

describe('Health Endpoints', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('version');
      expect(response.body.data).toHaveProperty('environment');
    });

    it('should include service information', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.data.services).toHaveProperty('whatsapp');
      expect(response.body.data.services).toHaveProperty('rateLimit');
      expect(response.body.data.config).toHaveProperty('messageDelayMs');
      expect(response.body.data.config).toHaveProperty('maxMessagesPerHour');
      expect(response.body.data.config).toHaveProperty('enableAntiBan');
    });
  });

  describe('GET /api/health/rate-limits', () => {
    it('should return rate limit status', async () => {
      const response = await request(app)
        .get('/api/health/rate-limits')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sessions');
      expect(response.body.data).toHaveProperty('global');
    });
  });
});

describe('API Authentication', () => {
  describe('Protected endpoints', () => {
    it('should require API key for session creation', async () => {
      await request(app)
        .post('/api/sessions')
        .send({ sessionId: 'test-session' })
        .expect(401);
    });

    it('should require API key for getting sessions', async () => {
      await request(app)
        .get('/api/sessions')
        .expect(401);
    });

    it('should accept valid API key', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .set('X-API-Key', 'default-dev-key-change-in-production')
        .send({ sessionId: 'test-session' })
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });
});

describe('Rate Limiting', () => {
  it('should limit requests', async () => {
    const requests = Array(150).fill(null).map(() => 
      request(app)
        .get('/api/health')
        .expect(200)
    );

    const responses = await Promise.all(requests);
    const statusCodes = responses.map(res => res.status);
    
    // Should have some 429 responses due to rate limiting
    expect(statusCodes.some(code => code === 429)).toBe(true);
  });
}); 