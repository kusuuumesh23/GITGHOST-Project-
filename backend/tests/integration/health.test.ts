import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('GET /api/v1/health', () => {
  it('should return health status and service providers info', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBeDefined();
    expect(res.body.services.crawler.provider).toBe('TinyFish');
    expect(res.body.services.textGeneration.provider).toContain('DeepSeek');
  });

  it('should return 404 for unknown endpoints with standard error format', async () => {
    const res = await request(app).get('/api/v1/non-existent-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
