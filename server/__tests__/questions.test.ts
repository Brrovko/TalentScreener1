import express from 'express';
import { registerRoutes } from '../routes';
import { loggedRequest } from './test-helper';

describe('Управление вопросами теста', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  it('POST /api/questions should add a question to a test', async () => {
    const testRes = await loggedRequest(app, 'POST', '/api/tests', {
      name: 'Questions Test',
      description: 'Test for adding questions',
      category: 'Questions',
      createdBy: 5,
      passingScore: 75,
      timeLimit: 45
    }, 'Создать тест для вопросов');
    expect(testRes.status).toBe(201);
    const testId = testRes.body.id;

    const questionRes = await loggedRequest(app, 'POST', '/api/questions', {
      testId,
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
