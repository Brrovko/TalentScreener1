import express from 'express';
import { registerRoutes } from '../routes';
import { loggedRequest, assertWithAllure } from './test-helper';

describe('API /api/tests', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  it('GET /api/tests should return 200 and array with expected structure', async () => {
    const res = await loggedRequest(app, 'GET', '/api/tests', undefined, 'Получить все тесты');
    
    assertWithAllure('Статус 200', () => expect(res.status).toBe(200));
    assertWithAllure('Ответ — массив', () => expect(Array.isArray(res.body)).toBe(true));
    assertWithAllure('Массив не пустой', () => expect(res.body.length).toBeGreaterThan(0));
    // Проверяем структуру первого элемента
    const test = res.body[0];
    assertWithAllure('Есть поле id', () => expect(test).toHaveProperty('id'));
    assertWithAllure('id — число', () => expect(typeof test.id).toBe('number'));
    assertWithAllure('Есть поле name', () => expect(test).toHaveProperty('name'));
    assertWithAllure('name — строка', () => expect(typeof test.name).toBe('string'));
    assertWithAllure('Есть поле description', () => expect(test).toHaveProperty('description'));
    assertWithAllure('description — строка', () => expect(typeof test.description).toBe('string'));
    assertWithAllure('Есть поле category', () => expect(test).toHaveProperty('category'));
    assertWithAllure('category — строка', () => expect(typeof test.category).toBe('string'));
    assertWithAllure('Есть поле createdBy', () => expect(test).toHaveProperty('createdBy'));
    assertWithAllure('createdBy — число', () => expect(typeof test.createdBy).toBe('number'));
    assertWithAllure('Есть поле isActive', () => expect(test).toHaveProperty('isActive'));
    assertWithAllure('isActive — boolean', () => expect(typeof test.isActive).toBe('boolean'));
    assertWithAllure('Есть поле passingScore', () => expect(test).toHaveProperty('passingScore'));
    assertWithAllure('passingScore — число', () => expect(typeof test.passingScore).toBe('number'));
    // timeLimit может быть null или number
    assertWithAllure('Есть поле timeLimit', () => expect(test).toHaveProperty('timeLimit'));
    assertWithAllure('timeLimit — null или число', () => expect(test.timeLimit === null || typeof test.timeLimit === 'number').toBe(true));
  });

  it('GET /api/tests should return 404 for unknown route', async () => {
    const res = await loggedRequest(app, 'GET', '/api/tests/unknown', undefined, 'GET /api/tests/unknown');
    assertWithAllure('Статус 404', () => expect(res.status).toBe(404));
    // Можно добавить проверку на структуру ошибки, если есть стандарт
  });

  it('POST /api/tests should create a new test and return 201', async () => {
    const newTest = {
      name: 'Integration Test',
      description: 'Test for POST endpoint',
      category: 'Backend',
      createdBy: 999,
      isActive: true,
      passingScore: 70,
      timeLimit: 60
    };
    const res = await loggedRequest(app, 'POST', '/api/tests', newTest, 'Создать тест');
    assertWithAllure('Статус 201', () => expect(res.status).toBe(201));
    assertWithAllure('Есть поле id', () => expect(res.body).toHaveProperty('id'));
    assertWithAllure('name совпадает', () => expect(res.body.name).toBe(newTest.name));
    assertWithAllure('category совпадает', () => expect(res.body.category).toBe(newTest.category));
    assertWithAllure('createdBy совпадает', () => expect(res.body.createdBy).toBe(newTest.createdBy));
    assertWithAllure('isActive совпадает', () => expect(res.body.isActive).toBe(newTest.isActive));
    assertWithAllure('passingScore совпадает', () => expect(res.body.passingScore).toBe(newTest.passingScore));
    assertWithAllure('timeLimit совпадает', () => expect(res.body.timeLimit).toBe(newTest.timeLimit));
  });

  it('POST /api/tests should create a new test and this test should exist in the database', async () => {
    const newTest = {
      name: 'DB Existence Test',
      description: 'Test for DB existence after POST',
      category: 'Integration',
      createdBy: 12345,
      isActive: true,
      passingScore: 75,
      timeLimit: 90
    };
    // 1. Создать тест через API
    const res = await loggedRequest(app, 'POST', '/api/tests', newTest, 'Создать тест');
    assertWithAllure('Статус 201', () => expect(res.status).toBe(201));
    assertWithAllure('Есть поле id', () => expect(res.body).toHaveProperty('id'));
    const createdId = res.body.id;
    // 2. Получить тест по id через API
    const getRes = await loggedRequest(app, 'GET', `/api/tests/${createdId}`, undefined, 'Проверить тест в БД');
    assertWithAllure('Статус 200 при получении по id', () => expect(getRes.status).toBe(200));
    assertWithAllure('id совпадает', () => expect(getRes.body).toHaveProperty('id', createdId));
    assertWithAllure('name совпадает', () => expect(getRes.body.name).toBe(newTest.name));
    assertWithAllure('category совпадает', () => expect(getRes.body.category).toBe(newTest.category));
    assertWithAllure('createdBy совпадает', () => expect(getRes.body.createdBy).toBe(newTest.createdBy));
    assertWithAllure('isActive совпадает', () => expect(getRes.body.isActive).toBe(newTest.isActive));
    assertWithAllure('passingScore совпадает', () => expect(getRes.body.passingScore).toBe(newTest.passingScore));
    assertWithAllure('timeLimit совпадает', () => expect(getRes.body.timeLimit).toBe(newTest.timeLimit));
  });

  it('POST /api/tests should create a new test and this test should exist in the list of all tests', async () => {
    const newTest = {
      name: 'All Tests List Check',
      description: 'Test for presence in all tests after POST',
      category: 'Integration',
      createdBy: 54321,
      isActive: true,
      passingScore: 80,
      timeLimit: 120
    };
    // 1. Создать тест через API
    const res = await loggedRequest(app, 'POST', '/api/tests', newTest, 'Создать тест');
    assertWithAllure('Статус 201', () => expect(res.status).toBe(201));
    assertWithAllure('Есть поле id', () => expect(res.body).toHaveProperty('id'));
    const createdId = res.body.id;
    // 2. Получить все тесты через API
    const getAllRes = await loggedRequest(app, 'GET', '/api/tests', undefined, 'Получить все тесты');
    assertWithAllure('Статус 200 при получении всех тестов', () => expect(getAllRes.status).toBe(200));
    assertWithAllure('Ответ — массив', () => expect(Array.isArray(getAllRes.body)).toBe(true));
    // 3. Проверить, что среди всех тестов есть только что созданный
    const found = getAllRes.body.find((t: any) => t.id === createdId);
    assertWithAllure('Тест найден в списке', () => expect(found).toBeDefined());
    assertWithAllure('name совпадает', () => expect(found.name).toBe(newTest.name));
    assertWithAllure('category совпадает', () => expect(found.category).toBe(newTest.category));
    assertWithAllure('createdBy совпадает', () => expect(found.createdBy).toBe(newTest.createdBy));
    assertWithAllure('isActive совпадает', () => expect(found.isActive).toBe(newTest.isActive));
    assertWithAllure('passingScore совпадает', () => expect(found.passingScore).toBe(newTest.passingScore));
    assertWithAllure('timeLimit совпадает', () => expect(found.timeLimit).toBe(newTest.timeLimit));
  });

  it('E2E: create test, add question, create candidate, create session, answer question, check results', async () => {
    // 1. Создать тест
    const testRes = await loggedRequest(app, 'POST', '/api/tests', {
      name: 'E2E Test',
      description: 'E2E workflow',
      category: 'E2E',
      createdBy: 1,
      passingScore: 50,
      timeLimit: 60
    }, 'E2E: создать тест');
    assertWithAllure('Статус 201 при создании теста', () => expect(testRes.status).toBe(201));
    const testId = testRes.body.id;

    // 2. Добавить вопрос к тесту
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

    // 3. Создать кандидата
    const candidateRes = await loggedRequest(app, 'POST', '/api/candidates', {
      name: 'Test Candidate',
      email: `e2e_candidate_${Date.now()}@test.com`
    }, 'E2E: создать кандидата');
    assertWithAllure('Статус 201 при создании кандидата', () => expect(candidateRes.status).toBe(201));
    const candidateId = candidateRes.body.id;

    // 4. Создать сессию тестирования
    const sessionRes = await loggedRequest(app, 'POST', '/api/sessions', {
      testId,
      candidateId
    }, 'E2E: создать сессию');
    assertWithAllure('Статус 201 при создании сессии', () => expect(sessionRes.status).toBe(201));
    const sessionToken = sessionRes.body.token;

    // 5. Ответить на вопрос (submit answers через token)
    const submitRes = await loggedRequest(app, 'POST', `/api/sessions/${sessionToken}/submit`, {
      answers: [
        {
          questionId,
          answer: 1
        }
      ]
    }, 'E2E: отправить ответы');
    assertWithAllure('Статус 200 при отправке ответов', () => expect(submitRes.status).toBe(200));

    // 6. Получить результаты сессии
    const resultsRes = await loggedRequest(app, 'GET', `/api/sessions/token/${sessionToken}`, undefined, 'E2E: получить результаты сессии');
    assertWithAllure('Статус 200 при получении результатов', () => expect(resultsRes.status).toBe(200));
    assertWithAllure('Есть поле score', () => expect(resultsRes.body.session).toHaveProperty('score'));
    assertWithAllure('Есть поле passed', () => expect(resultsRes.body.session).toHaveProperty('passed'));
  });
});
