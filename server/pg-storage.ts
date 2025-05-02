import { db } from './db';
import { nanoid } from 'nanoid';
import { eq, and, desc, sql } from 'drizzle-orm';
import { IStorage } from './storage';
import {
  users, User, InsertUser,
  tests, Test, InsertTest,
  questions, Question, InsertQuestion,
  candidates, Candidate, InsertCandidate,
  testSessions, TestSession, InsertTestSession,
  candidateAnswers, CandidateAnswer, InsertCandidateAnswer
} from "@shared/schema";

/**
 * Реализация хранилища данных с использованием PostgreSQL
 */
export class PgStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async updateUserLastLogin(id: number): Promise<void> {
    await db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id));
  }

  // Test operations
  async getAllTests(): Promise<Test[]> {
    return await db.select().from(tests);
  }

  async getTest(id: number): Promise<Test | undefined> {
    const result = await db.select().from(tests).where(eq(tests.id, id));
    return result[0];
  }

  async createTest(test: InsertTest): Promise<Test> {
    // Убедимся, что все обязательные поля имеют значения
    const testToInsert = {
      ...test,
      description: test.description || null,
      timeLimit: test.timeLimit || null,
      isActive: test.isActive !== undefined ? test.isActive : true,
      passingScore: test.passingScore || 70
    };
    
    const result = await db.insert(tests).values(testToInsert).returning();
    return result[0];
  }

  async updateTest(id: number, testData: Partial<InsertTest>): Promise<Test | undefined> {
    const result = await db.update(tests)
      .set(testData)
      .where(eq(tests.id, id))
      .returning();
    return result[0];
  }

  async deleteTest(id: number): Promise<boolean> {
    try {
      await db.delete(tests).where(eq(tests.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting test:', error);
      return false;
    }
  }

  // Question operations
  async getQuestionsByTestId(testId: number): Promise<Question[]> {
    return await db.select()
      .from(questions)
      .where(eq(questions.testId, testId))
      .orderBy(questions.order);
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    // Убедимся, что все обязательные поля имеют значения
    const questionToInsert = {
      ...question,
      type: question.type || 'multiple_choice',
      points: question.points || 1
    };
    
    const result = await db.insert(questions).values(questionToInsert).returning();
    return result[0];
  }

  async updateQuestion(id: number, questionData: Partial<InsertQuestion>): Promise<Question | undefined> {
    const result = await db.update(questions)
      .set(questionData)
      .where(eq(questions.id, id))
      .returning();
    return result[0];
  }

  async deleteQuestion(id: number): Promise<boolean> {
    try {
      // Получаем вопрос перед удалением
      const questionResult = await db.select().from(questions).where(eq(questions.id, id));
      const question = questionResult[0];
      
      if (!question) {
        return false;
      }
      
      // Удаляем вопрос
      await db.delete(questions).where(eq(questions.id, id));
      
      return true;
    } catch (error) {
      console.error('Error deleting question:', error);
      return false;
    }
  }

  async deleteQuestionsByTestId(testId: number): Promise<boolean> {
    try {
      // Удаляем вопросы
      await db.delete(questions).where(eq(questions.testId, testId));
      return true;
    } catch (error) {
      console.error('Error deleting questions by test ID:', error);
      return false;
    }
  }

  async reorderQuestions(testId: number, questionIds: number[]): Promise<boolean> {
    try {
      // Обновляем порядок каждого вопроса
      for (let i = 0; i < questionIds.length; i++) {
        await db.update(questions)
          .set({ order: i + 1 })
          .where(eq(questions.id, questionIds[i]));
      }
      
      return true;
    } catch (error) {
      console.error('Error reordering questions:', error);
      return false;
    }
  }

  // Candidate operations
  async getAllCandidates(): Promise<Candidate[]> {
    return await db.select().from(candidates);
  }

  async getCandidate(id: number): Promise<Candidate | undefined> {
    const result = await db.select().from(candidates).where(eq(candidates.id, id));
    return result[0];
  }

  async getCandidateByEmail(email: string): Promise<Candidate | undefined> {
    const result = await db.select().from(candidates).where(eq(candidates.email, email));
    return result[0];
  }

  async createCandidate(candidate: InsertCandidate): Promise<Candidate> {
    // Убедимся, что все обязательные поля имеют значения
    const candidateToInsert = {
      ...candidate,
      position: candidate.position || null
    };
    
    const result = await db.insert(candidates).values(candidateToInsert).returning();
    return result[0];
  }

  // Test session operations
  async getTestSessionsByTestId(testId: number): Promise<TestSession[]> {
    return await db.select()
      .from(testSessions)
      .where(eq(testSessions.testId, testId));
  }

  async getTestSessionsByCandidateId(candidateId: number): Promise<TestSession[]> {
    return await db.select()
      .from(testSessions)
      .where(eq(testSessions.candidateId, candidateId));
  }

  async getTestSession(id: number): Promise<TestSession | undefined> {
    const result = await db.select().from(testSessions).where(eq(testSessions.id, id));
    return result[0];
  }

  async getTestSessionByToken(token: string): Promise<TestSession | undefined> {
    const result = await db.select().from(testSessions).where(eq(testSessions.token, token));
    return result[0];
  }

  async createTestSession(session: InsertTestSession): Promise<TestSession> {
    // Если токен не предоставлен, генерируем его
    if (!session.token) {
      session.token = nanoid(10);
    }
    
    const result = await db.insert(testSessions).values({
      ...session,
      status: "pending",
      startedAt: null,
      completedAt: null,
      score: null,
      percentScore: null,
      passed: null
    }).returning();
    
    return result[0];
  }

  async updateTestSession(id: number, sessionData: Partial<TestSession>): Promise<TestSession | undefined> {
    const result = await db.update(testSessions)
      .set(sessionData)
      .where(eq(testSessions.id, id))
      .returning();
    return result[0];
  }

  // Candidate answer operations
  async getCandidateAnswersBySessionId(sessionId: number): Promise<CandidateAnswer[]> {
    return await db.select()
      .from(candidateAnswers)
      .where(eq(candidateAnswers.sessionId, sessionId));
  }

  async createCandidateAnswer(answer: InsertCandidateAnswer): Promise<CandidateAnswer> {
    const result = await db.insert(candidateAnswers).values(answer).returning();
    return result[0];
  }

  // Dashboard stats
  async getTestStats(): Promise<{
    totalTests: number;
    activeTests: number;
    totalCandidates: number;
    pendingSessions: number;
    completedSessions: number;
  }> {
    // Получаем общее количество тестов
    const testsResult = await db.select({ count: sql<number>`count(*)` }).from(tests);
    const totalTests = testsResult[0]?.count || 0;
    
    // Получаем количество активных тестов
    const activeTestsResult = await db.select({ count: sql<number>`count(*)` })
      .from(tests)
      .where(eq(tests.isActive, true));
    const activeTests = activeTestsResult[0]?.count || 0;
    
    // Получаем общее количество кандидатов
    const candidatesResult = await db.select({ count: sql<number>`count(*)` }).from(candidates);
    const totalCandidates = candidatesResult[0]?.count || 0;
    
    // Получаем количество сессий в ожидании
    const pendingSessionsResult = await db.select({ count: sql<number>`count(*)` })
      .from(testSessions)
      .where(eq(testSessions.status, "pending"));
    const pendingSessions = pendingSessionsResult[0]?.count || 0;
    
    // Получаем количество завершенных сессий
    const completedSessionsResult = await db.select({ count: sql<number>`count(*)` })
      .from(testSessions)
      .where(eq(testSessions.status, "completed"));
    const completedSessions = completedSessionsResult[0]?.count || 0;
    
    return {
      totalTests,
      activeTests,
      totalCandidates,
      pendingSessions,
      completedSessions
    };
  }
  
  async getRecentActivity(): Promise<{
    sessionId: number;
    candidateName: string;
    testName: string;
    status: string;
    date: Date;
  }[]> {
    // Получаем последние 5 сессий с именами кандидатов и тестов
    const result = await db.select({
      sessionId: testSessions.id,
      candidateName: candidates.name,
      testName: tests.name,
      status: testSessions.status,
      date: sql<Date>`COALESCE(${testSessions.completedAt}, ${testSessions.startedAt}, ${testSessions.expiresAt}, CURRENT_TIMESTAMP)`
    })
    .from(testSessions)
    .innerJoin(candidates, eq(testSessions.candidateId, candidates.id))
    .innerJoin(tests, eq(testSessions.testId, tests.id))
    .orderBy(desc(sql`COALESCE(${testSessions.completedAt}, ${testSessions.startedAt}, ${testSessions.expiresAt}, CURRENT_TIMESTAMP)`))
    .limit(5);
    
    return result;
  }
}
