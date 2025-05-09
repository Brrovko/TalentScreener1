import { pgTable, text, serial, integer, boolean, timestamp, json, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles enum
export const USER_ROLES = [
  "admin",   // Can do everything
  "recruiter", // Can create and manage tests, candidates, and view results
  "interviewer", // Can only view and evaluate tests
] as const;

export type UserRole = typeof USER_ROLES[number];

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role", { enum: USER_ROLES }).notNull().default("recruiter"),
  email: text("email").notNull().unique(),
  active: boolean("active").notNull().default(true),
  lastLogin: timestamp("last_login"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  role: true,
  email: true,
  active: true,
});

// Test schema
export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),

  createdBy: integer("created_by").notNull(),
  timeLimit: integer("time_limit"),
  isActive: boolean("is_active").notNull().default(true),
  passingScore: integer("passing_score").notNull().default(70), // Проходной балл в процентах
});

export const insertTestSchema = createInsertSchema(tests).pick({
  name: true,
  description: true,

  createdBy: true,
  timeLimit: true,
  isActive: true,
  passingScore: true,
});

// Question schema
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().default("multiple_choice"),
  options: json("options").notNull(),
  correctAnswer: json("correct_answer").notNull(),
  points: integer("points").notNull().default(1),
  order: integer("order").notNull(),
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  testId: true,
  content: true,
  type: true,
  options: true,
  correctAnswer: true,
  points: true,
  order: true,
});

// Candidate schema
export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  position: text("position"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCandidateSchema = createInsertSchema(candidates).pick({
  email: true,
  name: true,
  position: true,
});

// Test session schema
export const testSessions = pgTable("test_sessions", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull(),
  candidateId: integer("candidate_id").notNull(),
  token: text("token").notNull().unique(),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  score: integer("score"),
  percentScore: integer("percent_score"), // Процент правильных ответов
  passed: boolean("passed"), // Прошел ли тест (true/false)
  expiresAt: timestamp("expires_at"),
});

export const insertTestSessionSchema = createInsertSchema(testSessions).pick({
  testId: true,
  candidateId: true,
  token: true,
  expiresAt: true,
});

// Candidate answers schema
export const candidateAnswers = pgTable("candidate_answers", {
  sessionId: integer("session_id").notNull(),
  questionId: integer("question_id").notNull(),
  answer: json("answer").notNull(),
  answerText: json("answer_text"),
  isCorrect: boolean("is_correct").notNull(),
  points: integer("points").notNull().default(0),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.sessionId, table.questionId] }),
  };
});

export const insertCandidateAnswerSchema = createInsertSchema(candidateAnswers);

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Test = typeof tests.$inferSelect;
export type InsertTest = z.infer<typeof insertTestSchema>; // category removed

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;

export type TestSession = typeof testSessions.$inferSelect;
export type InsertTestSession = z.infer<typeof insertTestSessionSchema>;

export type CandidateAnswer = typeof candidateAnswers.$inferSelect;
export type InsertCandidateAnswer = z.infer<typeof insertCandidateAnswerSchema>;

// Category enum


// Question type enum
export const QUESTION_TYPES = [
  "multiple_choice",
  "checkbox",
  "text",
  "code",
] as const;

export type QuestionType = typeof QUESTION_TYPES[number];
