import express from 'express';
import { registerRoutes } from '../routes';
import { loggedRequest, assertWithAllure } from './test-helper';

describe('Полный сценарий прохождения теста кандидатом', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  it('E2E: create test, add question, create candidate, create session, answer question, check results', async () => {
    const testRes = await loggedRequest(app, 'POST', '/api/tests', {
      name: 'E2E Test',
      description: 'E2E workflow',
      
      createdBy: 1,
      passingScore: 50,
      timeLimit: 60
    }, 'E2E: создать тест');
    assertWithAllure('Статус 201 при создании теста', () => expect(testRes.status).toBe(201));
    const testId = testRes.body.id;

    const questionRes = await loggedRequest(app, 'POST', '/api/questions', {
      testId,
      content: 'What is 2 + 2?',
      type: 'multiple_choice',
      options: ['3', '4', '5'],
      correctAnswer: 1,
      order: 1,
      points: 10
    }, 'E2E: добавить вопрос');
    assertWithAllure('Статус 201 при добавлении вопроса', () => expect(questionRes.status).toBe(201));
    const questionId = questionRes.body.id;

    const candidateRes = await loggedRequest(app, 'POST', '/api/candidates', {
      name: 'Test Candidate',
      email: `e2e_candidate_${Date.now()}@test.com`
    }, 'E2E: создать кандидата');
    assertWithAllure('Статус 201 при создании кандидата', () => expect(candidateRes.status).toBe(201));
    const candidateId = candidateRes.body.id;

    const sessionRes = await loggedRequest(app, 'POST', '/api/sessions', {
      testId,
      candidateId
    }, 'E2E: создать сессию');
    assertWithAllure('Статус 201 при создании сессии', () => expect(sessionRes.status).toBe(201));
    const sessionToken = sessionRes.body.token;

    const submitRes = await loggedRequest(app, 'POST', `/api/sessions/${sessionToken}/submit`, {
      answers: [
        {
          questionId,
          answer: 1
        }
      ]
    }, 'E2E: отправить ответы');
    assertWithAllure('Статус 200 при отправке ответов', () => expect(submitRes.status).toBe(200));

    const resultsRes = await loggedRequest(app, 'GET', `/api/sessions/token/${sessionToken}`, undefined, 'E2E: получить результаты сессии');
    assertWithAllure('Статус 200 при получении результатов', () => expect(resultsRes.status).toBe(200));
    assertWithAllure('Есть поле score', () => expect(resultsRes.body.session).toHaveProperty('score'));
    assertWithAllure('Есть поле passed', () => expect(resultsRes.body.session).toHaveProperty('passed'));
  });
});
