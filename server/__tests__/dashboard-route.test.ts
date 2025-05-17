jest.mock('../services/emailService', () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    sendMail: jest.fn().mockResolvedValue(undefined)
  }))
}));

import express from 'express';
import { registerRoutes } from '../routes';
import { loggedRequest } from './test-helper';

describe('/api/recent-activity route', () => {
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

  it('should return 200 and correct activity array', async () => {
    // 1. Создать тест
    const testRes = await loggedRequest(app, 'POST', '/api/tests', {
      name: 'Dashboard Activity Test',
      description: 'Test for dashboard activity',
      organizationId: 1,
      createdBy: 1,
      passingScore: 50,
      timeLimit: 10
    }, 'Создать тест для dashboard activity');
    expect(testRes.status).toBe(201);
    const testId = testRes.body.id;

    // 2. Создать кандидата
    const candidateRes = await loggedRequest(app, 'POST', '/api/candidates', {
      name: 'Dashboard Candidate',
      email: `dashboard_candidate_${Date.now()}@test.com`,
      organizationId: 1
    }, 'Создать кандидата для dashboard activity');
    expect(candidateRes.status).toBe(201);
    const candidateId = candidateRes.body.id;

    // 3. Создать сессию
    const sessionRes = await loggedRequest(app, 'POST', '/api/sessions', {
      candidateId,
      testId,
      organizationId: 1
    }, 'Создать сессию для dashboard activity');
    expect(sessionRes.status).toBe(201);
    const sessionId = sessionRes.body.id;

    // 4. Получить недавнюю активность
    const res = await loggedRequest(app, 'GET', '/api/recent-activity', undefined, 'Получить недавнюю активность');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    // 5. Проверить структуру первой записи
    const activity = res.body.find((a: any) => a.sessionId === sessionId);
    expect(activity).toBeDefined();
    expect(activity).toHaveProperty('sessionId', sessionId);
    expect(activity).toHaveProperty('candidateName', 'Dashboard Candidate');
    expect(activity).toHaveProperty('testName', 'Dashboard Activity Test');
    expect(activity).toHaveProperty('status');
    expect(['pending', 'in_progress', 'completed']).toContain(activity.status);
    expect(activity).toHaveProperty('date');

    // 6. Проверить что самая свежая активность первая (если больше одной)
    if (res.body.length > 1) {
      const dates = res.body.map((a: any) => new Date(a.date).getTime());
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
      }
    }
  });
});
