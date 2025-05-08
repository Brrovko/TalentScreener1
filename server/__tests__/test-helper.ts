import request from 'supertest';
import type { Express } from 'express';

/**
 * Обёртка для expect/assert с логированием шага в Allure.
 */
export function assertWithAllure<T>(desc: string, fn: () => T): T {
  allure.step
  return allure.step(desc, fn);
}

/**
 * Логирует шаги, запрос и ответ в Allure-отчёт через allure-js-commons.
 */
export interface LoggedRequestResult {
  status: number;
  body: any;
  headers: Record<string, unknown>;
  cookies?: string[] | string | null;
  durationMs: number;
}

export async function loggedRequest(
  app: Express,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  url: string,
  body?: any,
  stepName?: string,
  logToConsole = false
): Promise<LoggedRequestResult> {
  return allure.step(stepName || `${method} ${url}`, async () => {
    const start = Date.now();
    // Формируем подробный лог запроса
    const reqHeaders = (body && body.headers) || {};
    const reqCookies = (body && body.cookies) || {};
    const reqQuery = (body && body.query) || {};
    const reqLogObj = {
      method,
      url,
      body,
      headers: reqHeaders,
      cookies: reqCookies,
      query: reqQuery
    };
    const reqLog = JSON.stringify(reqLogObj, null, 2);
    await allure.attachment('Request', reqLog, { contentType: 'application/json' });
    if (logToConsole) {
      // eslint-disable-next-line no-console
      console.log('--- REQUEST:', reqLog);
    }
    let req = (request(app) as any)[method.toLowerCase()](url);
    if (body) req = req.send(body);
    // Пробрасываем заголовки, куки и query если есть
    if (body && body.headers) req = req.set(body.headers);
    if (body && body.cookies) req = req.set('Cookie', body.cookies);
    if (body && body.query) req = req.query(body.query);
    const res = await req;
    const durationMs = Date.now() - start;
    // Формируем подробный лог ответа
    const resLogObj = {
      status: res.status,
      body: res.body,
      headers: res.headers,
      cookies: res.headers['set-cookie'] || res.headers['cookie'] || null
    };
    const resLog = JSON.stringify(resLogObj, null, 2);
    await allure.attachment('Response', resLog, { contentType: 'application/json' });
    if (logToConsole) {
      // eslint-disable-next-line no-console
      console.log('--- RESPONSE:', resLog);
    }
    return {
      status: res.status,
      body: res.body,
      headers: res.headers,
      cookies: res.headers['set-cookie'] || res.headers['cookie'] || null,
      durationMs
    };
  });
}

