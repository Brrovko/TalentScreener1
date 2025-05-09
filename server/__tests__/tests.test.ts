import express from 'express';
import { registerRoutes } from '../routes';
import { loggedRequest, assertWithAllure } from './test-helper';

describe('Работа с тестами: создание, импорт, просмотр', () => {
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
    const test = res.body[0];
    assertWithAllure('Есть поле id', () => expect(test).toHaveProperty('id'));
    assertWithAllure('id — число', () => expect(typeof test.id).toBe('number'));
    assertWithAllure('Есть поле name', () => expect(test).toHaveProperty('name'));
    assertWithAllure('name — строка', () => expect(typeof test.name).toBe('string'));
    assertWithAllure('Есть поле description', () => expect(test).toHaveProperty('description'));
    assertWithAllure('description — строка', () => expect(typeof test.description).toBe('string'));
    assertWithAllure('Нет поля category', () => expect(test).not.toHaveProperty('category'));
    // assertWithAllure('category — строка', () => expect(typeof test.category).toBe('string')); // category больше не ожидается
    assertWithAllure('Есть поле createdBy', () => expect(test).toHaveProperty('createdBy'));
    assertWithAllure('createdBy — число', () => expect(typeof test.createdBy).toBe('number'));
    assertWithAllure('Есть поле isActive', () => expect(test).toHaveProperty('isActive'));
    assertWithAllure('isActive — boolean', () => expect(typeof test.isActive).toBe('boolean'));
    assertWithAllure('Есть поле passingScore', () => expect(test).toHaveProperty('passingScore'));
    assertWithAllure('passingScore — число', () => expect(typeof test.passingScore).toBe('number'));
    assertWithAllure('Есть поле timeLimit', () => expect(test).toHaveProperty('timeLimit'));
    assertWithAllure('timeLimit — null или число', () => expect(test.timeLimit === null || typeof test.timeLimit === 'number').toBe(true));
  });


});
