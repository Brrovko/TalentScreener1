import express from 'express';
import { registerRoutes } from '../routes';
import { loggedRequest, assertWithAllure } from './test-helper';

describe('Работа с тестами', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  it('GET /api/tests/:id should return 200 and test object if exists', async () => {
    // Для теста нужен существующий id. Получим список тестов и выберем первый.
    const allRes = await loggedRequest(app, 'GET', '/api/tests', undefined, 'Получить список тестов');
    assertWithAllure('Статус 200 при получении списка тестов', () => expect(allRes.status).toBe(200));
    assertWithAllure('Ответ — массив', () => expect(Array.isArray(allRes.body)).toBe(true));
    assertWithAllure('Массив не пустой', () => expect(allRes.body.length).toBeGreaterThan(0));
    const testId = allRes.body[0].id;

    const res = await loggedRequest(app, 'GET', `/api/tests/${testId}`, undefined, 'Получить тест по id');
    assertWithAllure('Статус 200 при получении теста по id', () => expect(res.status).toBe(200));
    assertWithAllure('id совпадает', () => expect(res.body).toHaveProperty('id', testId));
    assertWithAllure('Есть поле name', () => expect(res.body).toHaveProperty('name'));
    assertWithAllure('Есть поле description', () => expect(res.body).toHaveProperty('description'));
    assertWithAllure('Есть поле category', () => expect(res.body).toHaveProperty('category'));
    assertWithAllure('Есть поле createdBy', () => expect(res.body).toHaveProperty('createdBy'));
    assertWithAllure('Есть поле isActive', () => expect(res.body).toHaveProperty('isActive'));
    assertWithAllure('Есть поле passingScore', () => expect(res.body).toHaveProperty('passingScore'));
    assertWithAllure('Есть поле timeLimit', () => expect(res.body).toHaveProperty('timeLimit'));
  });

  it('GET /api/tests/:id should return 404 for non-existent test', async () => {
    // Выбираем заведомо несуществующий id
    const res = await loggedRequest(app, 'GET', '/api/tests/999999', undefined, 'Получить несуществующий тест');
    assertWithAllure('Статус 404 для несуществующего теста', () => expect(res.status).toBe(404));
    assertWithAllure('Сообщение об ошибке', () => expect(res.body).toHaveProperty('message', 'Test not found'));
  });

  it('PATCH /api/tests/:id should update test and return 200', async () => {
    // Получаем существующий тест
    const allRes = await loggedRequest(app, 'GET', '/api/tests', undefined, 'Получить список тестов');
    assertWithAllure('Статус 200 при получении списка тестов', () => expect(allRes.status).toBe(200));
    const testId = allRes.body[0].id;
    const updateData = { name: 'Updated Name' };
    const res = await loggedRequest(app, 'PATCH', `/api/tests/${testId}`, updateData, 'Обновить тест');
    assertWithAllure('Статус 200 или 204 при обновлении теста', () => expect([200, 204]).toContain(res.status));
    if (res.status === 200) {
      assertWithAllure('id совпадает', () => expect(res.body).toHaveProperty('id', testId));
      assertWithAllure('Имя обновлено', () => expect(res.body).toHaveProperty('name', 'Updated Name'));
    }
  });

  it('PATCH /api/tests/:id should return 404 for non-existent test', async () => {
    const res = await loggedRequest(app, 'PATCH', '/api/tests/999999', { name: 'Should Not Exist' }, 'Обновить несуществующий тест');
    assertWithAllure('Статус 404 при обновлении несуществующего теста', () => expect(res.status).toBe(404));
    assertWithAllure('Сообщение об ошибке', () => expect(res.body).toHaveProperty('message', 'Test not found'));
  });
});
