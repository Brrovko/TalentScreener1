import {
  users, User, InsertUser,
  tests, Test, InsertTest,
  questions, Question, InsertQuestion,
  candidates, Candidate, InsertCandidate,
  testSessions, TestSession, InsertTestSession,
  candidateAnswers, CandidateAnswer, InsertCandidateAnswer,
  organizations, Organization, InsertOrganization
} from "@shared/schema";
import { nanoid } from "nanoid";

export interface IStorage {
  // User operations
  getUser(organizationId: number, id: number): Promise<User | undefined>;
  getUserByUsername(organizationId: number, username: string): Promise<User | undefined>;
  getUserByEmail(organizationId: number, email: string): Promise<User | undefined>;
  getAllUsers(organizationId: number): Promise<User[]>;
  findUserByEmail(email: string): Promise<User | undefined>; // Новый метод поиска по email среди всех организаций
  createUser(organizationId: number, user: InsertUser): Promise<User>;
  updateUser(organizationId: number, id: number, userData: Partial<User>): Promise<User | undefined>;
  updateUserLastLogin(organizationId: number, id: number): Promise<void>;

  // Test operations
  getAllTests(organizationId: number): Promise<Test[]>;
  getTest(organizationId: number, id: number): Promise<Test | undefined>;
  createTest(organizationId: number, test: InsertTest): Promise<Test>;
  updateTest(organizationId: number, id: number, test: Partial<InsertTest>): Promise<Test | undefined>;
  deleteTest(organizationId: number, id: number): Promise<boolean>;

  // Question operations
  getQuestionsByTestId(organizationId: number, testId: number): Promise<Question[]>;
  createQuestion(organizationId: number, question: InsertQuestion): Promise<Question>;
  updateQuestion(organizationId: number, id: number, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(organizationId: number, id: number): Promise<boolean>;
  deleteQuestionsByTestId(organizationId: number, testId: number): Promise<boolean>;
  reorderQuestions(organizationId: number, testId: number, questionIds: number[]): Promise<boolean>;

  // Candidate operations
  getAllCandidates(organizationId: number): Promise<Candidate[]>;
  getCandidate(organizationId: number, id: number): Promise<Candidate | undefined>;
  getCandidateByEmail(organizationId: number, email: string): Promise<Candidate | undefined>;
  createCandidate(organizationId: number, candidate: InsertCandidate): Promise<Candidate>;

  // Test session operations
  getTestSessionsByTestId(organizationId: number, testId: number): Promise<TestSession[]>;
  getTestSessionsByCandidateId(organizationId: number, candidateId: number): Promise<TestSession[]>;
  getTestSession(organizationId: number, id: number): Promise<TestSession | undefined>;
  getTestSessionByToken(token: string): Promise<TestSession | undefined>;
  createTestSession(organizationId: number, session: InsertTestSession): Promise<TestSession>;
  updateTestSession(organizationId: number, id: number, session: Partial<TestSession>): Promise<TestSession | undefined>;

  // Candidate answer operations
  getCandidateAnswersBySessionId(organizationId: number, sessionId: number): Promise<CandidateAnswer[]>;
  createCandidateAnswer(organizationId: number, answer: InsertCandidateAnswer): Promise<CandidateAnswer>;

  // Organization operations
  getOrganization(id: number): Promise<Organization | undefined>;
  createOrganization(data: { name: string }): Promise<Organization>;

  // Dashboard stats
  getTestStats(organizationId: number): Promise<{
    totalTests: number;
    activeTests: number;
    totalCandidates: number;
    pendingSessions: number;
    completedSessions: number;
  }>;
  
  getRecentActivity(organizationId: number): Promise<{
    sessionId: number;
    candidateId: number;
    candidateName: string;
    testName: string;
    status: string;
    date: Date;
  }[]>;
}

export class MemStorage implements IStorage {
  async getTestSessionByToken(token: string): Promise<TestSession | undefined> {
    return Array.from(this.testSessions.values()).find(session => session.token === token);
  }
  async findUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }
  private users: Map<number, User>;
  private tests: Map<number, Test>;
  private questions: Map<number, Question>;
  private candidates: Map<number, Candidate>;
  private testSessions: Map<number, TestSession>;
  private candidateAnswers: Map<string, CandidateAnswer>;
  private organizations: Map<number, Organization>;
  
  private userId: number;
  private testId: number;
  private questionId: number;
  private candidateId: number;
  private sessionId: number;
  private orgIdCounter: number;

  constructor() {
    this.users = new Map();
    this.tests = new Map();
    this.questions = new Map();
    this.candidates = new Map();
    this.testSessions = new Map();
    this.candidateAnswers = new Map();
    this.organizations = new Map();
    
    this.userId = 1;
    this.testId = 1;
    this.questionId = 1;
    this.candidateId = 1;
    this.sessionId = 1;
    this.orgIdCounter = 1;
    
    // Seed default organization and test for initial GET /api/tests
    const defaultOrg = { id: this.orgIdCounter++, name: 'Default Org', createdAt: new Date() };
    this.organizations.set(defaultOrg.id, defaultOrg);
    const defaultTest = {
      id: this.testId++,
      organizationId: defaultOrg.id,
      name: 'Sample Test',
      description: 'Auto-seeded test',
      createdBy: 0,
      timeLimit: null,
      isActive: true,
      passingScore: 70
    };
    this.tests.set(defaultTest.id, defaultTest);
    
    // Note: We're not adding the admin user here anymore.
    // It will now be created in server/index.ts with properly hashed password
  }

  // User operations
  async getUser(organizationId: number, id: number): Promise<User | undefined> {
    const user = this.users.get(id);
    return user && user.organizationId === organizationId ? user : undefined;
  }

  async getUserByUsername(organizationId: number, username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.organizationId === organizationId && user.username === username,
    );
  }
  
  async getUserByEmail(organizationId: number, email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.organizationId === organizationId && user.email === email,
    );
  }
  
  async getAllUsers(organizationId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.organizationId === organizationId);
  }

  async createUser(organizationId: number, insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const role = insertUser.role || "recruiter";
    const active = insertUser.active !== undefined ? insertUser.active : true;
    
    const user: User = { 
      ...insertUser, 
      id,
      organizationId,
      role,
      active,
      lastLogin: null 
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(organizationId: number, id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user || user.organizationId !== organizationId) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserLastLogin(organizationId: number, id: number): Promise<void> {
    const user = this.users.get(id);
    if (user && user.organizationId === organizationId) {
      user.lastLogin = new Date();
      this.users.set(id, user);
    }
  }

  // Test operations
  async getAllTests(organizationId: number): Promise<Test[]> {
    return Array.from(this.tests.values()).filter(test => test.organizationId === organizationId);
  }

  async getTest(organizationId: number, id: number): Promise<Test | undefined> {
    const test = this.tests.get(id);
    return test && test.organizationId === organizationId ? test : undefined;
  }

  async createTest(organizationId: number, insertTest: InsertTest): Promise<Test> {
    const id = this.testId++;
    const test: Test = { 
      ...insertTest, 
      id,
      organizationId,
      description: insertTest.description || null,
      timeLimit: insertTest.timeLimit || null,
      isActive: insertTest.isActive !== undefined ? insertTest.isActive : true,
      passingScore: insertTest.passingScore !== undefined ? insertTest.passingScore : 60
    };
    this.tests.set(id, test);
    return test;
  }

  async updateTest(organizationId: number, id: number, testUpdate: Partial<InsertTest>): Promise<Test | undefined> {
    const test = this.tests.get(id);
    if (!test || test.organizationId !== organizationId) return undefined;
    
    const updatedTest = { ...test, ...testUpdate };
    this.tests.set(id, updatedTest);
    return updatedTest;
  }

  async deleteTest(organizationId: number, id: number): Promise<boolean> {
    const test = this.tests.get(id);
    if (!test || test.organizationId !== organizationId) return false;
    return this.tests.delete(id);
  }

  // Question operations
  async getQuestionsByTestId(organizationId: number, testId: number): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter(q => q.testId === testId && q.organizationId === organizationId)
      .sort((a, b) => a.order - b.order);
  }

  async createQuestion(organizationId: number, insertQuestion: InsertQuestion): Promise<Question> {
    const id = this.questionId++;
    const question: Question = { 
      ...insertQuestion, 
      id,
      organizationId,
      type: insertQuestion.type || 'multiple_choice',
      points: insertQuestion.points || 1
    };
    this.questions.set(id, question);
    return question;
  }

  async updateQuestion(organizationId: number, id: number, questionUpdate: Partial<InsertQuestion>): Promise<Question | undefined> {
    const question = this.questions.get(id);
    if (!question || question.organizationId !== organizationId) return undefined;
    
    const updatedQuestion = { ...question, ...questionUpdate };
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }

  async deleteQuestion(organizationId: number, id: number): Promise<boolean> {
    const question = this.questions.get(id);
    if (!question || question.organizationId !== organizationId) return false;
    return this.questions.delete(id);
  }
  
  async deleteQuestionsByTestId(organizationId: number, testId: number): Promise<boolean> {
    try {
      const questionsToDelete = Array.from(this.questions.values())
        .filter(q => q.testId === testId && q.organizationId === organizationId)
        .map(q => q.id);
      
      for (const id of questionsToDelete) {
        this.questions.delete(id);
      }
      return true;
    } catch (error) {
      console.error('Error deleting questions by test ID:', error);
      return false;
    }
  }

  async reorderQuestions(organizationId: number, testId: number, questionIds: number[]): Promise<boolean> {
    const testQuestions = Array.from(this.questions.values())
      .filter(q => q.testId === testId && q.organizationId === organizationId);
    if (testQuestions.length !== questionIds.length) return false;
    questionIds.forEach((qid, index) => {
      const question = this.questions.get(qid);
      if (question && question.organizationId === organizationId) {
        question.order = index + 1;
        this.questions.set(qid, question);
      }
    });
    return true;
  }

  // Candidate operations
  async getAllCandidates(organizationId: number): Promise<Candidate[]> {
    return Array.from(this.candidates.values()).filter(candidate => candidate.organizationId === organizationId);
  }

  async getCandidate(organizationId: number, id: number): Promise<Candidate | undefined> {
    const candidate = this.candidates.get(id);
    return candidate && candidate.organizationId === organizationId ? candidate : undefined;
  }

  async getCandidateByEmail(organizationId: number, email: string): Promise<Candidate | undefined> {
    return Array.from(this.candidates.values()).find(
      (candidate) => candidate.organizationId === organizationId && candidate.email === email,
    );
  }

  async createCandidate(organizationId: number, insertCandidate: InsertCandidate): Promise<Candidate> {
    const id = this.candidateId++;
    const now = new Date();
    const candidate: Candidate = { 
      ...insertCandidate, 
      id, 
      organizationId,
      createdAt: now,
      position: insertCandidate.position || null
    };
    this.candidates.set(id, candidate);
    return candidate;
  }

  // Test session operations
  async getTestSessionsByTestId(organizationId: number, testId: number): Promise<TestSession[]> {
    return Array.from(this.testSessions.values()).filter(session => {
      const test = this.tests.get(session.testId);
      return session.testId === testId && test && test.organizationId === organizationId;
    });
  }

  async getTestSessionsByCandidateId(organizationId: number, candidateId: number): Promise<TestSession[]> {
    return Array.from(this.testSessions.values()).filter(session => {
      const candidate = this.candidates.get(session.candidateId);
      return session.candidateId === candidateId && candidate && candidate.organizationId === organizationId;
    });
  }

  async getTestSession(organizationId: number, id: number): Promise<TestSession | undefined> {
    const session = this.testSessions.get(id);
    if (!session) return undefined;
    const test = this.tests.get(session.testId);
    return test && test.organizationId === organizationId ? session : undefined;
  }



  async createTestSession(organizationId: number, insertSession: InsertTestSession): Promise<TestSession> {
    const id = this.sessionId++;
    const session: TestSession = { 
      ...insertSession, 
      id, 
      organizationId,
      status: "pending",
      startedAt: null,
      completedAt: null,
      score: null,
      percentScore: null,
      passed: null,
      expiresAt: insertSession.expiresAt || null
    };
    this.testSessions.set(id, session);
    return session;
  }

  async updateTestSession(organizationId: number, id: number, sessionUpdate: Partial<TestSession>): Promise<TestSession | undefined> {
    const session = this.testSessions.get(id);
    if (!session || session.organizationId !== organizationId) return undefined;
    const updatedSession = { ...session, ...sessionUpdate };
    this.testSessions.set(id, updatedSession);
    return updatedSession;
  }

  // Candidate answer operations
  async getCandidateAnswersBySessionId(organizationId: number, sessionId: number): Promise<CandidateAnswer[]> {
    return Array.from(this.candidateAnswers.values())
      .filter(answer => {
        const session = this.testSessions.get(answer.sessionId);
        return answer.sessionId === sessionId && session && session.organizationId === organizationId;
      });
  }

  async createCandidateAnswer(organizationId: number, answer: InsertCandidateAnswer): Promise<CandidateAnswer> {
    const key = `${answer.sessionId}-${answer.questionId}`;
    const session = this.testSessions.get(answer.sessionId);
    if (!session || session.organizationId !== organizationId) {
      throw new Error('Session not found or organization mismatch');
    }
    this.candidateAnswers.set(key, answer as CandidateAnswer);
    return answer as CandidateAnswer;
  }

  // Organization operations
  async getOrganization(id: number): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async createOrganization(data: { name: string }): Promise<Organization> {
    const id = this.orgIdCounter++;
    const org: Organization = { id, name: data.name, createdAt: new Date() };
    this.organizations.set(id, org);
    return org;
  }

  // Dashboard stats
  async getTestStats(organizationId: number): Promise<{
    totalTests: number;
    activeTests: number;
    totalCandidates: number;
    pendingSessions: number;
    completedSessions: number;
  }> {
    const tests = Array.from(this.tests.values()).filter(t => t.organizationId === organizationId);
    const sessions = Array.from(this.testSessions.values()).filter(s => s.organizationId === organizationId);
    const candidates = Array.from(this.candidates.values()).filter(c => c.organizationId === organizationId);
    return {
      totalTests: tests.length,
      activeTests: tests.filter(t => t.isActive).length,
      totalCandidates: candidates.length,
      pendingSessions: sessions.filter(s => s.status === "pending").length,
      completedSessions: sessions.filter(s => s.status === "completed").length,
    };
  }
  
  async getRecentActivity(organizationId: number): Promise<{
    sessionId: number;
    candidateId: number;
    candidateName: string;
    testName: string;
    status: string;
    date: Date;
  }[]> {
    const sessions = Array.from(this.testSessions.values());
    const result = [];
    
    for (const session of sessions) {
      const candidate = this.candidates.get(session.candidateId);
      const test = this.tests.get(session.testId);
      
      if (candidate && test && test.organizationId === organizationId) {
        result.push({
          sessionId: session.id,
          candidateId: candidate.id,
          candidateName: candidate.name,
          testName: test.name,
          status: session.status,
          date: session.startedAt || session.completedAt || new Date(),
          passed: session.passed,
        });
      }
    }
    
    // Return most recent first
    return result.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
  }
}

// Создаем переменную для хранения текущего экземпляра хранилища
let currentStorage: IStorage = new MemStorage();

// Экспортируем storage как getter, который всегда возвращает текущее хранилище
export const storage: IStorage = new Proxy({} as IStorage, {
  get: function(target, prop) {
    return currentStorage[prop as keyof IStorage];
  }
});

// Функция для установки хранилища
export function setStorage(newStorage: IStorage): void {
  currentStorage = newStorage;
}
