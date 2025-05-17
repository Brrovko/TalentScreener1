jest.mock('../services/emailService', () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    sendMail: jest.fn().mockResolvedValue(undefined)
  }))
}));

import express from 'express';
import { registerRoutes } from '../routes';
import { loggedRequest } from './test-helper';
import { MemStorage } from '../storage';
import { EmailVerificationCode } from '@shared/schema';

describe('/api/self-register', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  it('should register new user and organization with valid data', async () => {
    const email = `test${Date.now()}@example.com`;
    // 1. Запросить verification code
    await loggedRequest(app, 'POST', '/api/send-email-code', { email });
    // 2. Получить verification code из MemStorage
    const { storage } = require('../storage');
    const codeObj = await storage.findEmailVerificationCode(email);
    expect(codeObj).toBeDefined();
    const verificationCode = codeObj.code;
    // 3. Зарегистрировать пользователя
    const res = await loggedRequest(app, 'POST', '/api/self-register', {
      email,
      password: 'Password1!',
      username: 'testuser',
      organizationName: 'Test Org',
      fullName: 'Test User',
      code: verificationCode
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email', email);
    expect(res.body).toHaveProperty('username', 'testuser');
    expect(res.body).toHaveProperty('organizationId');
    expect(res.body).toHaveProperty('role', 'admin');
  });

  it('should not allow duplicate email', async () => {
    const email = `dup${Date.now()}@example.com`;
    const code = '123456';
    // Валидный объект для мока
    const dummyCode: EmailVerificationCode = {
      id: 1,
      email,
      code,
      expiresAt: new Date(Date.now() + 600000),
      createdAt: new Date(),
      attempts: 0,
      used: false,
    };
    const createCodeMock = jest.spyOn(MemStorage.prototype, 'createEmailVerificationCode').mockResolvedValue(dummyCode);
    const findCodeMock = jest.spyOn(MemStorage.prototype, 'findEmailVerificationCode')
      .mockImplementation(async (email: string) => ({
        ...dummyCode,
        email,
        code,
      }));
    const verifyCodeMock = jest.spyOn(MemStorage.prototype, 'verifyAndConsumeEmailCode').mockResolvedValue(true);
    // 1. Запросить verification code (мок)
    await loggedRequest(app, 'POST', '/api/send-email-code', { email });
    // 2. Первая регистрация
    const first = await loggedRequest(app, 'POST', '/api/self-register', {
      email,
      password: 'Password1!',
      username: 'user1',
      organizationName: 'Org1',
      fullName: 'User One',
      code
    });
    expect(first.status).toBe(201);
    // 3. Повторно запросить verification code (мок)
    await loggedRequest(app, 'POST', '/api/send-email-code', { email });
    // 4. Попытка повторной регистрации
    const second = await loggedRequest(app, 'POST', '/api/self-register', {
      email,
      password: 'Password1!',
      username: 'user2',
      organizationName: 'Org2',
      fullName: 'User Two',
      code
    });
    expect(second.status).toBe(409);
    expect(second.body).toHaveProperty('message', 'Email already in use');
    // Восстановить оригинальные методы
    createCodeMock.mockRestore();
    findCodeMock.mockRestore();
    verifyCodeMock.mockRestore();
  });

  it('should not allow registration if existing user with same email is inactive', async () => {
    const email = `inactive${Date.now()}@example.com`;
    const code1 = '111111';
    const code2 = '222222';
    // Валидные объекты для мока
    const dummyCode1: EmailVerificationCode = {
      id: 1,
      email,
      code: code1,
      expiresAt: new Date(Date.now() + 600000),
      createdAt: new Date(),
      attempts: 0,
      used: false,
    };
    const dummyCode2: EmailVerificationCode = {
      id: 2,
      email,
      code: code2,
      expiresAt: new Date(Date.now() + 600000),
      createdAt: new Date(),
      attempts: 0,
      used: false,
    };
    const createCodeMock = jest.spyOn(MemStorage.prototype, 'createEmailVerificationCode')
      .mockImplementation(async (emailArg: string, codeArg: string) => {
        if (codeArg === code1) return dummyCode1;
        if (codeArg === code2) return dummyCode2;
        return dummyCode1;
      });
    let codeCall = 0;
    const findCodeMock = jest.spyOn(MemStorage.prototype, 'findEmailVerificationCode').mockImplementation(async (email: string) => {
      codeCall++;
      if (codeCall === 1) {
        return dummyCode1;
      }
      if (codeCall === 2) {
        return dummyCode2;
      }
      return undefined;
    });
    const verifyCodeMock = jest.spyOn(MemStorage.prototype, 'verifyAndConsumeEmailCode').mockResolvedValue(true);
    // 1. Запросить verification code (мок)
    await loggedRequest(app, 'POST', '/api/send-email-code', { email });
    // 2. Первая регистрация
    const first = await loggedRequest(app, 'POST', '/api/self-register', {
      email,
      password: 'Password1!',
      username: 'inactiveuser',
      organizationName: 'Inactive Org',
      fullName: 'Inactive User',
      code: code1
    });
    expect(first.status).toBe(201);
    // 3. Деактивируем пользователя напрямую через storage
    const { storage } = require('../storage');
    const user = await storage.findUserByEmail(email);
    user.isActive = false;
    // 4. Запросить новый verification code (мок)
    await loggedRequest(app, 'POST', '/api/send-email-code', { email });
    // 5. Попытка регистрации с тем же email
    const second = await loggedRequest(app, 'POST', '/api/self-register', {
      email,
      password: 'Password1!',
      username: 'inactiveuser2',
      organizationName: 'Inactive Org',
      fullName: 'Inactive User 2',
      code: code2
    });
    expect(second.status).toBe(409);
    expect(second.body).toHaveProperty('message');
    expect(second.body.message).toMatch(/already in use/i);
    // Восстановить оригинальные методы
    createCodeMock.mockRestore();
    findCodeMock.mockRestore();
    verifyCodeMock.mockRestore();
  });

  it('should validate required fields', async () => {
    const res = await loggedRequest(app, 'POST', '/api/self-register', {
      email: '',
      password: '',
      username: '',
      organizationName: '',
      fullName: '',
      code: ''
    });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should reject weak passwords', async () => {
    const email = `weak${Date.now()}@example.com`;
    await loggedRequest(app, 'POST', '/api/send-email-code', { email });
    const { storage } = require('../storage');
    const codeObj = await storage.findEmailVerificationCode(email);
    expect(codeObj).toBeDefined();
    const verificationCode = codeObj.code;
    const res = await loggedRequest(app, 'POST', '/api/self-register', {
      email,
      password: '12345678',
      username: 'weakuser',
      organizationName: 'Weak Org',
      fullName: 'Weak User',
      code: verificationCode
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Password/);
  });
});
