import express from 'express';
import { registerRoutes } from '../routes';
import { loggedRequest } from './test-helper';

describe('Работа с кандидатами', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.user = {
        id: 1,
        organizationId: 1,
        role: 'admin',
        username: 'test',
        email: 'test@skillchecker.tech',
        active: true,
        password: 'password',
        fullName: 'Test User',
        lastLogin: null
      };
      next();
    });
    await registerRoutes(app);
  });

  it('POST /api/candidates should create a candidate', async () => {
    const candidateRes = await loggedRequest(app, 'POST', '/api/candidates', {
      name: 'Test Candidate',
      email: `candidate_${Date.now()}@test.com`,
      organizationId: 1
    }, 'Создать кандидата');
    expect(candidateRes.status).toBe(201);
    expect(candidateRes.body).toHaveProperty('id');
    expect(candidateRes.body.name).toBe('Test Candidate');
  });
});
