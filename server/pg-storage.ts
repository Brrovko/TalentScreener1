import { db } from './db';
import { nanoid } from 'nanoid';
import { eq, and, desc, sql } from 'drizzle-orm';
import { IStorage } from './storage';
import {
  users, User, InsertUser,
  emailVerificationCodes, EmailVerificationCode,
  tests, Test, InsertTest,
  questions, Question, InsertQuestion,
  candidates, Candidate, InsertCandidate,
  testSessions, TestSession, InsertTestSession,
  candidateAnswers, CandidateAnswer, InsertCandidateAnswer,
  organizations, Organization
} from "@shared/schema";

/**
 * Реализация хранилища данных с использованием PostgreSQL
 */
export class PgStorage implements IStorage {
  async getAllOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations);
  }
  // Email verification code operations
  async createEmailVerificationCode(email: string, code: string, expiresAt: Date): Promise<EmailVerificationCode> {
    // Сначала удаляем старые коды для этого email
    await db.update(emailVerificationCodes).set({ used: true }).where(eq(emailVerificationCodes.email, email));
    const result = await db.insert(emailVerificationCodes).values({
      email,
      code,
      expiresAt,
      createdAt: new Date(),
      attempts: 0,
      used: false,
    }).returning();
    return result[0];
  }

  async findEmailVerificationCode(email: string): Promise<EmailVerificationCode | undefined> {
    const now = new Date();
    const result = await db.select().from(emailVerificationCodes)
      .where(and(eq(emailVerificationCodes.email, email), eq(emailVerificationCodes.used, false), sql`${emailVerificationCodes.expiresAt} > ${now}`))
      .orderBy(desc(emailVerificationCodes.createdAt));
    return result[0];
  }

  async verifyAndConsumeEmailCode(email: string, code: string): Promise<boolean> {
    const now = new Date();
    const result = await db.select().from(emailVerificationCodes)
      .where(and(eq(emailVerificationCodes.email, email), eq(emailVerificationCodes.used, false), sql`${emailVerificationCodes.expiresAt} > ${now}`))
      .orderBy(desc(emailVerificationCodes.createdAt));
    const rec = result[0];
    if (!rec) return false;
    if (rec.code !== code) {
      await db.update(emailVerificationCodes)
        .set({ attempts: rec.attempts + 1 })
        .where(eq(emailVerificationCodes.id, rec.id));
      return false;
    }
    await db.update(emailVerificationCodes)
      .set({ used: true })
      .where(eq(emailVerificationCodes.id, rec.id));
    return true;
  }



  async findUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }
  // User operations
  async getUser(organizationId: number, id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(and(eq(users.id, id), eq(users.organizationId, organizationId)));
    return result[0];
  }

  async getUserByUsername(organizationId: number, username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(and(eq(users.username, username), eq(users.organizationId, organizationId)));
    return result[0];
  }

  async getUserByEmail(organizationId: number, email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(and(eq(users.email, email), eq(users.organizationId, organizationId)));
    return result[0];
  }

  async getAllUsers(organizationId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.organizationId, organizationId));
  }

  async createUser(organizationId: number, user: InsertUser): Promise<User> {
    const result = await db.insert(users).values({ ...user, organizationId }).returning();
    return result[0];
  }

  async updateUser(organizationId: number, id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(userData)
      .where(and(eq(users.id, id), eq(users.organizationId, organizationId)))
      .returning();
    return result[0];
  }

  async updateUserLastLogin(organizationId: number, id: number): Promise<void> {
    await db.update(users)
      .set({ lastLogin: new Date() })
      .where(and(eq(users.id, id), eq(users.organizationId, organizationId)));
  }

  // Test operations
  async getAllTests(organizationId: number): Promise<Test[]> {
    return await db.select().from(tests).where(eq(tests.organizationId, organizationId));
  }

  async getTest(organizationId: number, id: number): Promise<Test | undefined> {
    const result = await db.select().from(tests).where(and(eq(tests.id, id), eq(tests.organizationId, organizationId)));
    return result[0];
  }

  async createTest(organizationId: number, test: InsertTest): Promise<Test> {
    // Убедимся, что все обязательные поля имеют значения
    const testToInsert = {
      ...test,
      organizationId,
      description: test.description || null,
      timeLimit: test.timeLimit || null,
      isActive: test.isActive !== undefined ? test.isActive : true,
      passingScore: test.passingScore || 70
    };
    
    const result = await db.insert(tests).values(testToInsert).returning();
    return result[0];
  }

  async updateTest(organizationId: number, id: number, testData: Partial<InsertTest>): Promise<Test | undefined> {
    // Do not run update if testData is empty (would generate invalid SQL)
    if (!testData || Object.keys(testData).length === 0) {
      return await this.getTest(organizationId, id);
    }
    const result = await db.update(tests)
      .set(testData)
      .where(and(eq(tests.id, id), eq(tests.organizationId, organizationId)))
      .returning();
    return result[0];
  }

  async deleteTest(organizationId: number, id: number): Promise<boolean> {
    try {
      await db.delete(tests).where(and(eq(tests.id, id), eq(tests.organizationId, organizationId)));
      return true;
    } catch (error) {
      console.error('Error deleting test:', error);
      return false;
    }
  }

  // Question operations
  async getQuestionsByTestId(organizationId: number, testId: number): Promise<Question[]> {
    return await db.select()
      .from(questions)
      .where(and(eq(questions.testId, testId), eq(questions.organizationId, organizationId)))
      .orderBy(questions.order);
  }

  async createQuestion(organizationId: number, question: InsertQuestion): Promise<Question> {
    // Убедимся, что все обязательные поля имеют значения
    const questionToInsert = {
      ...question,
      organizationId,
      type: question.type || 'multiple_choice',
      points: question.points || 1
    };
    
    const result = await db.insert(questions).values(questionToInsert).returning();
    return result[0];
  }

  async updateQuestion(organizationId: number, id: number, questionData: Partial<InsertQuestion>): Promise<Question | undefined> {
    const result = await db.update(questions)
      .set(questionData)
      .where(and(eq(questions.id, id), eq(questions.organizationId, organizationId)))
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

  async deleteQuestionsByTestId(organizationId: number, testId: number): Promise<boolean> {
    try {
      // Удаляем вопросы
      await db.delete(questions).where(and(eq(questions.testId, testId), eq(questions.organizationId, organizationId)));
      return true;
    } catch (error) {
      console.error('Error deleting questions by test ID:', error);
      return false;
    }
  }

  async reorderQuestions(organizationId: number, testId: number, questionIds: number[]): Promise<boolean> {
    try {
      // Обновляем порядок каждого вопроса
      for (let i = 0; i < questionIds.length; i++) {
        await db.update(questions)
          .set({ order: i + 1 })
          .where(and(eq(questions.id, questionIds[i]), eq(questions.organizationId, organizationId), eq(questions.testId, testId)));
      }
      
      return true;
    } catch (error) {
      console.error('Error reordering questions:', error);
      return false;
    }
  }

  // Candidate operations
  async getAllCandidates(organizationId: number): Promise<Candidate[]> {
    return await db.select().from(candidates).where(eq(candidates.organizationId, organizationId));
  }

  async getCandidate(organizationId: number, id: number): Promise<Candidate | undefined> {
    const result = await db.select().from(candidates).where(and(eq(candidates.id, id), eq(candidates.organizationId, organizationId)));
    return result[0];
  }

  async getCandidateByEmail(organizationId: number, email: string): Promise<Candidate | undefined> {
    const result = await db.select().from(candidates).where(and(eq(candidates.email, email), eq(candidates.organizationId, organizationId)));
    return result[0];
  }

  async createCandidate(organizationId: number, candidate: InsertCandidate): Promise<Candidate> {
    // Убедимся, что все обязательные поля имеют значения
    const candidateToInsert = {
      ...candidate,
      position: candidate.position || null
    };
    
    const result = await db.insert(candidates).values({ ...candidateToInsert, organizationId }).returning();
    return result[0];
  }

  // Test session operations
  async getTestSessionsByTestId(organizationId: number, testId: number): Promise<TestSession[]> {
    return await db.select().from(testSessions).where(and(eq(testSessions.testId, testId), eq(testSessions.organizationId, organizationId)));
  }

  async getTestSessionsByCandidateId(organizationId: number, candidateId: number): Promise<TestSession[]> {
    return await db.select().from(testSessions).where(and(eq(testSessions.candidateId, candidateId), eq(testSessions.organizationId, organizationId)));
  }

  async getTestSession(organizationId: number, id: number): Promise<TestSession | undefined> {
    const result = await db.select().from(testSessions).where(and(eq(testSessions.id, id), eq(testSessions.organizationId, organizationId)));
    return result[0];
  }


  async getTestSessionByToken(token: string): Promise<TestSession | undefined> {
    const result = await db.select().from(testSessions).where(eq(testSessions.token, token));
    console.log('[DEBUG getTestSessionByToken]', { token, result });
    return result[0];
  }

  async createTestSession(organizationId: number, session: InsertTestSession): Promise<TestSession> {
    // Если токен не предоставлен, генерируем его
    if (!session.token) {
      session.token = nanoid(10);
    }
    
    const result = await db.insert(testSessions).values({
      ...session,
      organizationId,
      status: "pending",
      startedAt: null,
      completedAt: null,
      score: null,
      percentScore: null,
      passed: null
    }).returning();
    
    return result[0];
  }

  async updateTestSession(organizationId: number, id: number, sessionData: Partial<TestSession>): Promise<TestSession | undefined> {
    const result = await db.update(testSessions)
      .set(sessionData)
      .where(and(eq(testSessions.id, id), eq(testSessions.organizationId, organizationId)))
      .returning();
    return result[0];
  }

  // Candidate answer operations
  async getCandidateAnswersBySessionId(organizationId: number, sessionId: number): Promise<CandidateAnswer[]> {
    // Получаем ответы только для сессий, принадлежащих нужной организации
    const sessions = await db.select().from(testSessions).where(and(eq(testSessions.id, sessionId), eq(testSessions.organizationId, organizationId)));
    if (!sessions.length) return [];
    return await db.select().from(candidateAnswers).where(eq(candidateAnswers.sessionId, sessionId));
  }

  async createCandidateAnswer(organizationId: number, answer: InsertCandidateAnswer): Promise<CandidateAnswer> {
    // Проверяем, что сессия принадлежит организации
    const session = await db.select().from(testSessions).where(and(eq(testSessions.id, answer.sessionId), eq(testSessions.organizationId, organizationId)));
    if (!session.length) throw new Error('Session does not belong to organization');
    const result = await db.insert(candidateAnswers).values({ ...answer }).returning();
    return result[0];
  }

  // Organization operations
  async getOrganization(id: number): Promise<Organization | undefined> {
    const result = await db.select().from(organizations).where(eq(organizations.id, id));
    return result[0];
  }

  async createOrganization(data: { name: string }): Promise<Organization> {
    const now = new Date();
    const result = await db.insert(organizations).values({ name: data.name, createdAt: now }).returning();
    return result[0];
  }

  // Dashboard stats
  async getTestStats(organizationId: number): Promise<{
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
  
  async getRecentActivity(organizationId: number): Promise<{
    sessionId: number;
    candidateId: number;
    candidateName: string;
    testName: string;
    status: string;
    passed: boolean | null;
    date: Date;
  }[]> {
    // Получаем последние 5 сессий с именами кандидатов и тестов
    const result = await db.select({
      sessionId: testSessions.id,
      candidateId: candidates.id,
      candidateName: candidates.name,
      testName: tests.name,
      status: testSessions.status,
      passed: testSessions.passed,
      date: sql<Date>`COALESCE(${testSessions.completedAt}, ${testSessions.startedAt}, ${testSessions.expiresAt}, CURRENT_TIMESTAMP)`
    })
    .from(testSessions)
    .innerJoin(candidates, eq(testSessions.candidateId, candidates.id))
    .innerJoin(tests, eq(testSessions.testId, tests.id))
    .where(eq(tests.organizationId, organizationId))
    .orderBy(desc(sql`COALESCE(${testSessions.completedAt}, ${testSessions.startedAt}, ${testSessions.expiresAt}, CURRENT_TIMESTAMP)`))
    .limit(30);
    
    return result;
  }
}
