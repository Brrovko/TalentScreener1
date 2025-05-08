import express from 'express';
import { registerRoutes } from '../routes';
import { loggedRequest } from './test-helper';

describe('Работа с кандидатами', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  it('POST /api/candidates should create a candidate', async () => {
    const candidateRes = await loggedRequest(app, 'POST', '/api/candidates', {
      name: 'Test Candidate',
      email: `candidate_${Date.now()}@test.com`
    }, 'Создать кандидата');
    expect(candidateRes.status).toBe(201);
    expect(candidateRes.body).toHaveProperty('id');
    expect(candidateRes.body.name).toBe('Test Candidate');
  });
});
