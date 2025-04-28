import { db } from './db';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { hashPassword } from './auth';
import {
  users, tests, questions, candidates, testSessions, candidateAnswers
} from '@shared/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

/**
 * Запускает миграции базы данных
 */
export async function runMigrations() {
  try {
    console.log('Running migrations...');
    
    // Проверяем, существует ли директория с миграциями
    const migrationsDir = path.join(process.cwd(), 'drizzle');
    if (!fs.existsSync(migrationsDir)) {
      console.error('Migrations directory not found:', migrationsDir);
      return;
    }
    
    // Выполняем SQL-миграции из файлов в директории drizzle
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (migrationFiles.length === 0) {
      console.warn('No migration files found in:', migrationsDir);
      return;
    }
    
    for (const file of migrationFiles) {
      console.log(`Executing migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await db.execute(sql);
    }
    
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
}

/**
 * Заполняет базу данных начальными данными
 */
export async function seedDatabase() {
  try {
    console.log('Seeding database...');
    
    // Проверяем, есть ли уже данные в базе
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      console.log('Database already seeded, skipping...');
      return;
    }
    
    // Создаем пользователя admin
    const adminUser = await db.insert(users).values({
      username: 'admin',
      password: await hashPassword('admin123'),
      fullName: 'System Administrator',
      role: 'admin',
      email: 'admin@example.com',
      active: true
    }).returning();
    
    console.log('Created admin user:', adminUser[0].id);
    
    // Создаем пользователя recruiter
    const recruiterUser = await db.insert(users).values({
      username: 'recruiter',
      password: await hashPassword('recruiter123'),
      fullName: 'HR Recruiter',
      role: 'recruiter',
      email: 'recruiter@example.com',
      active: true
    }).returning();
    
    console.log('Created recruiter user:', recruiterUser[0].id);
    
    // Создаем тестовые тесты
    const testIds = await createSampleTests(adminUser[0].id);
    
    // Создаем тестовых кандидатов
    const candidateIds = await createSampleCandidates();
    
    // Создаем тестовые сессии
    await createSampleTestSessions(testIds, candidateIds);
    
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

/**
 * Создает примеры тестов
 */
async function createSampleTests(adminId: number) {
  // Создаем тест по JavaScript
  const jsTest = await db.insert(tests).values({
    name: 'JavaScript Fundamentals',
    description: 'Test basic knowledge of JavaScript language',
    category: 'Frontend',
    createdBy: adminId,
    timeLimit: 30,
    isActive: true,
    questionCount: 0,
    passingScore: 70
  }).returning();
  
  console.log('Created JavaScript test:', jsTest[0].id);
  
  // Создаем вопросы для теста по JavaScript
  const jsQuestions = [
    {
      testId: jsTest[0].id,
      content: 'What is the output of: console.log(typeof null)',
      type: 'single_choice',
      options: JSON.stringify(['object', 'null', 'undefined', 'number']),
      correctAnswer: JSON.stringify('object'),
      points: 1,
      order: 1
    },
    {
      testId: jsTest[0].id,
      content: 'Which of the following is not a JavaScript data type?',
      type: 'single_choice',
      options: JSON.stringify(['string', 'boolean', 'float', 'undefined']),
      correctAnswer: JSON.stringify('float'),
      points: 1,
      order: 2
    },
    {
      testId: jsTest[0].id,
      content: 'What is the correct way to declare a constant in JavaScript?',
      type: 'single_choice',
      options: JSON.stringify(['const x = 5;', 'let x = 5;', 'var x = 5;', 'constant x = 5;']),
      correctAnswer: JSON.stringify('const x = 5;'),
      points: 1,
      order: 3
    }
  ];
  
  for (const question of jsQuestions) {
    await db.insert(questions).values(question);
  }
  
  // Обновляем количество вопросов в тесте
  await db.update(tests)
    .set({ questionCount: jsQuestions.length })
    .where(eq(tests.id, jsTest[0].id));
  
  // Создаем тест по SQL
  const sqlTest = await db.insert(tests).values({
    name: 'SQL Basics',
    description: 'Test basic knowledge of SQL queries',
    category: 'Database',
    createdBy: adminId,
    timeLimit: 20,
    isActive: true,
    questionCount: 0,
    passingScore: 60
  }).returning();
  
  console.log('Created SQL test:', sqlTest[0].id);
  
  // Создаем вопросы для теста по SQL
  const sqlQuestions = [
    {
      testId: sqlTest[0].id,
      content: 'Which SQL statement is used to extract data from a database?',
      type: 'single_choice',
      options: JSON.stringify(['SELECT', 'EXTRACT', 'GET', 'OPEN']),
      correctAnswer: JSON.stringify('SELECT'),
      points: 1,
      order: 1
    },
    {
      testId: sqlTest[0].id,
      content: 'Which SQL clause is used to filter records?',
      type: 'single_choice',
      options: JSON.stringify(['WHERE', 'FILTER', 'HAVING', 'GROUP BY']),
      correctAnswer: JSON.stringify('WHERE'),
      points: 1,
      order: 2
    }
  ];
  
  for (const question of sqlQuestions) {
    await db.insert(questions).values(question);
  }
  
  // Обновляем количество вопросов в тесте
  await db.update(tests)
    .set({ questionCount: sqlQuestions.length })
    .where(eq(tests.id, sqlTest[0].id));
  
  return [jsTest[0].id, sqlTest[0].id];
}

/**
 * Создает примеры кандидатов
 */
async function createSampleCandidates() {
  const candidates1 = await db.insert(candidates).values({
    name: 'John Doe',
    email: 'john.doe@example.com',
    position: 'Frontend Developer',
    createdAt: new Date()
  }).returning();
  
  console.log('Created candidate:', candidates1[0].id);
  
  const candidates2 = await db.insert(candidates).values({
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    position: 'Database Administrator',
    createdAt: new Date()
  }).returning();
  
  console.log('Created candidate:', candidates2[0].id);
  
  return [candidates1[0].id, candidates2[0].id];
}

/**
 * Создает примеры сессий тестирования
 */
async function createSampleTestSessions(testIds: number[], candidateIds: number[]) {
  // Создаем сессию для первого кандидата и первого теста
  const session1 = await db.insert(testSessions).values({
    testId: testIds[0],
    candidateId: candidateIds[0],
    token: 'test-token-1',
    status: 'pending',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Через неделю
  }).returning();
  
  console.log('Created test session:', session1[0].id);
  
  // Создаем сессию для второго кандидата и второго теста
  const session2 = await db.insert(testSessions).values({
    testId: testIds[1],
    candidateId: candidateIds[1],
    token: 'test-token-2',
    status: 'completed',
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 часа назад
    completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 час назад
    score: 80,
    percentScore: 80,
    passed: true
  }).returning();
  
  console.log('Created test session:', session2[0].id);
  
  // Получаем вопросы для второго теста
  const testQuestions = await db.select().from(questions).where(eq(questions.testId, testIds[1]));
  
  // Создаем ответы кандидата на вопросы
  for (const question of testQuestions) {
    await db.insert(candidateAnswers).values({
      sessionId: session2[0].id,
      questionId: question.id,
      answer: question.correctAnswer, // Правильный ответ
      isCorrect: true,
      points: question.points
    });
  }
  
  console.log('Created candidate answers for session:', session2[0].id);
}
