import express from 'express';
import { registerRoutes } from '../routes';
import { loggedRequest } from './test-helper';

describe('Управление вопросами теста', () => {
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

  it('POST /api/questions should add a question to a test', async () => {
    const testRes = await loggedRequest(app, 'POST', '/api/tests', {
      name: 'Questions Test',
      description: 'Test for adding questions',
      organizationId: 1,
      createdBy: 5,
      passingScore: 75,
      timeLimit: 45
    }, 'Создать тест для вопросов');
    expect(testRes.status).toBe(201);
    const testId = testRes.body.id;

    const questionRes = await loggedRequest(app, 'POST', '/api/questions', {
      testId,
      organizationId: 1,
      content: 'What is the capital of France?',
      type: 'multiple_choice',
      options: ['Berlin', 'Paris', 'Rome'],
      correctAnswer: 1,
      order: 1,
      points: 5
    }, 'Добавить вопрос');
    expect(questionRes.status).toBe(201);
    expect(questionRes.body).toHaveProperty('id');
    expect(questionRes.body.content).toBe('What is the capital of France?');
  });
});
