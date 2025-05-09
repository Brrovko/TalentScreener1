import express from 'express';
import { registerRoutes } from '../routes';
import { loggedRequest } from './test-helper';

describe('Процесс прохождения теста кандидатом', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  it('GET /api/sessions/:sessionId/answers should return candidate answers for session', async () => {
    const testRes = await loggedRequest(app, 'POST', '/api/tests', {
      name: 'Session Answers Test',
      description: 'Test for answers route',
      
      createdBy: 3,
      passingScore: 50,
      timeLimit: 20
    }, 'Создать тест для answers');
    expect(testRes.status).toBe(201);
    const testId = testRes.body.id;

    const questionRes = await loggedRequest(app, 'POST', '/api/questions', {
      testId,
      content: '2 + 2?',
      type: 'multiple_choice',
      options: ['3', '4', '5'],
      correctAnswer: 1,
      order: 1,
      points: 2
    }, 'Добавить вопрос для answers');
    expect(questionRes.status).toBe(201);
    const questionId = questionRes.body.id;

    const candidateRes = await loggedRequest(app, 'POST', '/api/candidates', {
      name: 'Answers Candidate',
      email: `answers_candidate_${Date.now()}@test.com`
    }, 'Создать кандидата для answers');
    expect(candidateRes.status).toBe(201);
    const candidateId = candidateRes.body.id;

    const sessionRes = await loggedRequest(app, 'POST', '/api/sessions', {
      testId,
      candidateId
    }, 'Создать сессию для answers');
    expect(sessionRes.status).toBe(201);
    const sessionId = sessionRes.body.id;
    const sessionToken = sessionRes.body.token;

    const submitRes = await loggedRequest(app, 'POST', `/api/sessions/${sessionToken}/submit`, {
      answers: [
        {
          questionId,
          answer: 1
        }
      ]
    }, 'Ответить на вопрос для answers');
    expect(submitRes.status).toBe(200);

    const answersRes = await loggedRequest(app, 'GET', `/api/sessions/${sessionId}/answers`, undefined, 'Получить ответы кандидата');
    expect(answersRes.status).toBe(200);
    expect(Array.isArray(answersRes.body)).toBe(true);
    expect(answersRes.body.length).toBeGreaterThanOrEqual(1);
    expect(answersRes.body[0]).toHaveProperty('question');
    expect(answersRes.body[0]).toHaveProperty('answer');
  });
});
