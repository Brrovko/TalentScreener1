import {
  users, User, InsertUser,
  tests, Test, InsertTest,
  questions, Question, InsertQuestion,
  candidates, Candidate, InsertCandidate,
  testSessions, TestSession, InsertTestSession,
  candidateAnswers, CandidateAnswer, InsertCandidateAnswer
} from "@shared/schema";
import { nanoid } from "nanoid";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  updateUserLastLogin(id: number): Promise<void>;

  // Test operations
  getAllTests(): Promise<Test[]>;
  getTest(id: number): Promise<Test | undefined>;
  createTest(test: InsertTest): Promise<Test>;
  updateTest(id: number, test: Partial<InsertTest>): Promise<Test | undefined>;
  deleteTest(id: number): Promise<boolean>;

  // Question operations
  getQuestionsByTestId(testId: number): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: number): Promise<boolean>;
  deleteQuestionsByTestId(testId: number): Promise<boolean>;
  reorderQuestions(testId: number, questionIds: number[]): Promise<boolean>;

  // Candidate operations
  getAllCandidates(): Promise<Candidate[]>;
  getCandidate(id: number): Promise<Candidate | undefined>;
  getCandidateByEmail(email: string): Promise<Candidate | undefined>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;

  // Test session operations
  getTestSessionsByTestId(testId: number): Promise<TestSession[]>;
  getTestSessionsByCandidateId(candidateId: number): Promise<TestSession[]>;
  getTestSession(id: number): Promise<TestSession | undefined>;
  getTestSessionByToken(token: string): Promise<TestSession | undefined>;
  createTestSession(session: InsertTestSession): Promise<TestSession>;
  updateTestSession(id: number, session: Partial<TestSession>): Promise<TestSession | undefined>;

  // Candidate answer operations
  getCandidateAnswersBySessionId(sessionId: number): Promise<CandidateAnswer[]>;
  createCandidateAnswer(answer: InsertCandidateAnswer): Promise<CandidateAnswer>;

  // Dashboard stats
  getTestStats(): Promise<{
    totalTests: number;
    activeTests: number;
    totalCandidates: number;
    pendingSessions: number;
    completedSessions: number;
  }>;
  
  getRecentActivity(): Promise<{
    sessionId: number;
    candidateName: string;
    testName: string;
    status: string;
    date: Date;
  }[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tests: Map<number, Test>;
  private questions: Map<number, Question>;
  private candidates: Map<number, Candidate>;
  private testSessions: Map<number, TestSession>;
  private candidateAnswers: Map<string, CandidateAnswer>;
  
  private userId: number;
  private testId: number;
  private questionId: number;
  private candidateId: number;
  private sessionId: number;

  constructor() {
    this.users = new Map();
    this.tests = new Map();
    this.questions = new Map();
    this.candidates = new Map();
    this.testSessions = new Map();
    this.candidateAnswers = new Map();
    
    this.userId = 1;
    this.testId = 1;
    this.questionId = 1;
    this.candidateId = 1;
    this.sessionId = 1;
    
    // Note: We're not adding the admin user here anymore.
    // It will now be created in server/index.ts with properly hashed password
    
    // Add sample tests
    this.createTest({
      name: "JavaScript Fundamentals",
      description: "Basic JavaScript knowledge test",
      category: "Frontend",
      createdBy: 1,
      isActive: true
    });
    
    this.createTest({
      name: "Frontend Development",
      description: "HTML, CSS, and JavaScript test",
      category: "Frontend",
      createdBy: 1,
      isActive: true
    });
    
    this.createTest({
      name: "Backend Quiz",
      description: "Node.js and API development",
      category: "Backend",
      createdBy: 1,
      isActive: true
    });
    
    this.createTest({
      name: "QA Assessment",
      description: "Testing methodologies and tools",
      category: "QA",
      createdBy: 1,
      isActive: true
    });
    
    // Add sample questions to each test
    this.createQuestion({
      testId: 1,
      content: "What is JavaScript?",
      type: "multiple_choice",
      options: ["Programming language", "Markup language", "Database", "Operating system"],
      correctAnswer: "Programming language",
      points: 1,
      order: 1
    });
    
    // Add more sample questions - Test 1
    for (let i = 2; i <= 15; i++) {
      this.createQuestion({
        testId: 1,
        content: `JavaScript Question ${i}`,
        type: "multiple_choice",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: "Option A",
        points: 1,
        order: i
      });
    }
    
    // Add sample questions - Test 2
    for (let i = 1; i <= 20; i++) {
      this.createQuestion({
        testId: 2,
        content: `Frontend Question ${i}`,
        type: "multiple_choice",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: "Option B",
        points: 1,
        order: i
      });
    }
    
    // Add sample questions - Test 3
    for (let i = 1; i <= 18; i++) {
      this.createQuestion({
        testId: 3,
        content: `Backend Question ${i}`,
        type: "multiple_choice",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: "Option C",
        points: 1,
        order: i
      });
    }
    
    // Add sample questions - Test 4
    for (let i = 1; i <= 25; i++) {
      this.createQuestion({
        testId: 4,
        content: `QA Question ${i}`,
        type: "multiple_choice",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: "Option D",
        points: 1,
        order: i
      });
    }
    
    // Add sample candidates
    this.createCandidate({
      email: "john@example.com",
      name: "John Doe",
      position: "Frontend Developer"
    });
    
    this.createCandidate({
      email: "jane@example.com",
      name: "Jane Smith",
      position: "Backend Developer"
    });
    
    this.createCandidate({
      email: "bob@example.com",
      name: "Bob Johnson",
      position: "QA Engineer"
    });
    
    // Add sample test sessions
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    this.createTestSession({
      testId: 1,
      candidateId: 1,
      token: nanoid(),
      expiresAt: tomorrow
    });
    
    this.createTestSession({
      testId: 2,
      candidateId: 2,
      token: nanoid(),
      expiresAt: tomorrow
    });
    
    this.createTestSession({
      testId: 3,
      candidateId: 3,
      token: nanoid(),
      expiresAt: tomorrow
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const role = insertUser.role || "recruiter";
    const active = insertUser.active !== undefined ? insertUser.active : true;
    
    const user: User = { 
      ...insertUser, 
      id,
      role,
      active,
      lastLogin: null 
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserLastLogin(id: number): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.lastLogin = new Date();
      this.users.set(id, user);
    }
  }

  // Test operations
  async getAllTests(): Promise<Test[]> {
    return Array.from(this.tests.values());
  }

  async getTest(id: number): Promise<Test | undefined> {
    return this.tests.get(id);
  }

  async createTest(insertTest: InsertTest): Promise<Test> {
    const id = this.testId++;
    const test: Test = { 
      ...insertTest, 
      id,
      description: insertTest.description || null,
      timeLimit: insertTest.timeLimit || null,
      isActive: insertTest.isActive !== undefined ? insertTest.isActive : true,
      passingScore: insertTest.passingScore !== undefined ? insertTest.passingScore : 60
    };
    this.tests.set(id, test);
    return test;
  }

  async updateTest(id: number, testUpdate: Partial<InsertTest>): Promise<Test | undefined> {
    const test = this.tests.get(id);
    if (!test) return undefined;
    
    const updatedTest = { ...test, ...testUpdate };
    this.tests.set(id, updatedTest);
    return updatedTest;
  }

  async deleteTest(id: number): Promise<boolean> {
    return this.tests.delete(id);
  }

  // Question operations
  async getQuestionsByTestId(testId: number): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter(q => q.testId === testId)
      .sort((a, b) => a.order - b.order);
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = this.questionId++;
    const question: Question = { 
      ...insertQuestion, 
      id,
      type: insertQuestion.type || 'multiple_choice',
      points: insertQuestion.points || 1
    };
    this.questions.set(id, question);
    
    return question;
  }

  async updateQuestion(id: number, questionUpdate: Partial<InsertQuestion>): Promise<Question | undefined> {
    const question = this.questions.get(id);
    if (!question) return undefined;
    
    const updatedQuestion = { ...question, ...questionUpdate };
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }

  async deleteQuestion(id: number): Promise<boolean> {
    if (!this.questions.has(id)) return false;
    this.questions.delete(id);
    return true;
  }
  
  async deleteQuestionsByTestId(testId: number): Promise<boolean> {
    try {
      const questionsToDelete = Array.from(this.questions.values())
        .filter(q => q.testId === testId)
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

  async reorderQuestions(testId: number, questionIds: number[]): Promise<boolean> {
    const testQuestions = Array.from(this.questions.values())
      .filter(q => q.testId === testId);
    
    if (testQuestions.length !== questionIds.length) return false;
    
    questionIds.forEach((qid, index) => {
      const question = this.questions.get(qid);
      if (question) {
        question.order = index + 1;
        this.questions.set(qid, question);
      }
    });
    
    return true;
  }

  // Candidate operations
  async getAllCandidates(): Promise<Candidate[]> {
    return Array.from(this.candidates.values());
  }

  async getCandidate(id: number): Promise<Candidate | undefined> {
    return this.candidates.get(id);
  }

  async getCandidateByEmail(email: string): Promise<Candidate | undefined> {
    return Array.from(this.candidates.values()).find(
      (candidate) => candidate.email === email,
    );
  }

  async createCandidate(insertCandidate: InsertCandidate): Promise<Candidate> {
    const id = this.candidateId++;
    const now = new Date();
    const candidate: Candidate = { 
      ...insertCandidate, 
      id, 
      createdAt: now,
      position: insertCandidate.position || null
    };
    this.candidates.set(id, candidate);
    return candidate;
  }

  // Test session operations
  async getTestSessionsByTestId(testId: number): Promise<TestSession[]> {
    return Array.from(this.testSessions.values())
      .filter(session => session.testId === testId);
  }

  async getTestSessionsByCandidateId(candidateId: number): Promise<TestSession[]> {
    return Array.from(this.testSessions.values())
      .filter(session => session.candidateId === candidateId);
  }

  async getTestSession(id: number): Promise<TestSession | undefined> {
    return this.testSessions.get(id);
  }

  async getTestSessionByToken(token: string): Promise<TestSession | undefined> {
    return Array.from(this.testSessions.values()).find(
      (session) => session.token === token,
    );
  }

  async createTestSession(insertSession: InsertTestSession): Promise<TestSession> {
    const id = this.sessionId++;
    const session: TestSession = { 
      ...insertSession, 
      id, 
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

  async updateTestSession(id: number, sessionUpdate: Partial<TestSession>): Promise<TestSession | undefined> {
    const session = this.testSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...sessionUpdate };
    this.testSessions.set(id, updatedSession);
    return updatedSession;
  }

  // Candidate answer operations
  async getCandidateAnswersBySessionId(sessionId: number): Promise<CandidateAnswer[]> {
    return Array.from(this.candidateAnswers.values())
      .filter(answer => answer.sessionId === sessionId);
  }

  async createCandidateAnswer(answer: InsertCandidateAnswer): Promise<CandidateAnswer> {
    const key = `${answer.sessionId}-${answer.questionId}`;
    this.candidateAnswers.set(key, answer as CandidateAnswer);
    return answer as CandidateAnswer;
  }

  // Dashboard stats
  async getTestStats(): Promise<{
    totalTests: number;
    activeTests: number;
    totalCandidates: number;
    pendingSessions: number;
    completedSessions: number;
  }> {
    const tests = Array.from(this.tests.values());
    const sessions = Array.from(this.testSessions.values());
    
    return {
      totalTests: tests.length,
      activeTests: tests.filter(t => t.isActive).length,
      totalCandidates: this.candidates.size,
      pendingSessions: sessions.filter(s => s.status === "pending").length,
      completedSessions: sessions.filter(s => s.status === "completed").length,
    };
  }
  
  async getRecentActivity(): Promise<{
    sessionId: number;
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
      
      if (candidate && test) {
        result.push({
          sessionId: session.id,
          candidateName: candidate.name,
          testName: test.name,
          status: session.status,
          date: session.startedAt || session.completedAt || new Date(),
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
