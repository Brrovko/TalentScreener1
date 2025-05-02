import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertTestSchema, 
  insertQuestionSchema, 
  insertCandidateSchema,
  insertTestSessionSchema,
  UserRole
} from "@shared/schema";
import { nanoid } from "nanoid";
import { z } from "zod";
import { setupAuth, requireRole, hashPassword } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  // Tests routes
  app.get("/api/tests", async (req: Request, res: Response) => {
    try {
      const tests = await storage.getAllTests();
      res.json(tests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tests" });
    }
  });

  app.get("/api/tests/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const test = await storage.getTest(id);
      
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      res.json(test);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch test" });
    }
  });

  app.post("/api/tests", async (req: Request, res: Response) => {
    try {
      const validatedData = insertTestSchema.parse(req.body);
      const test = await storage.createTest(validatedData);
      
      res.status(201).json(test);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid test data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to create test" });
    }
  });

  app.patch("/api/tests/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTestSchema.partial().parse(req.body);
      
      const updatedTest = await storage.updateTest(id, validatedData);
      
      if (!updatedTest) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      res.json(updatedTest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid test data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to update test" });
    }
  });

  app.delete("/api/tests/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTest(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete test" });
    }
  });

  // Questions routes
  app.get("/api/tests/:id/questions", async (req: Request, res: Response) => {
    try {
      const testId = parseInt(req.params.id);
      const questions = await storage.getQuestionsByTestId(testId);
      
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.post("/api/questions", async (req: Request, res: Response) => {
    try {
      const validatedData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(validatedData);
      
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid question data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  app.patch("/api/questions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertQuestionSchema.partial().parse(req.body);
      
      const updatedQuestion = await storage.updateQuestion(id, validatedData);
      
      if (!updatedQuestion) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      res.json(updatedQuestion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid question data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to update question" });
    }
  });

  app.delete("/api/questions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteQuestion(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  app.post("/api/tests/:id/reorder-questions", async (req: Request, res: Response) => {
    try {
      const testId = parseInt(req.params.id);
      const { questionIds } = req.body;
      
      if (!Array.isArray(questionIds)) {
        return res.status(400).json({ message: "Question IDs must be an array" });
      }
      
      const success = await storage.reorderQuestions(testId, questionIds);
      
      if (!success) {
        return res.status(400).json({ message: "Failed to reorder questions" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to reorder questions" });
    }
  });

  // Candidates routes
  app.get("/api/candidates", async (req: Request, res: Response) => {
    try {
      const candidates = await storage.getAllCandidates();
      res.json(candidates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch candidates" });
    }
  });

  app.get("/api/candidates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const candidate = await storage.getCandidate(id);
      
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      
      res.json(candidate);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch candidate" });
    }
  });

  app.post("/api/candidates", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCandidateSchema.parse(req.body);
      const candidate = await storage.createCandidate(validatedData);
      
      res.status(201).json(candidate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid candidate data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to create candidate" });
    }
  });

  // Test sessions routes
  app.get("/api/tests/:id/sessions", async (req: Request, res: Response) => {
    try {
      const testId = parseInt(req.params.id);
      const sessions = await storage.getTestSessionsByTestId(testId);
      
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch test sessions" });
    }
  });

  app.get("/api/candidates/:id/sessions", async (req: Request, res: Response) => {
    try {
      const candidateId = parseInt(req.params.id);
      const sessions = await storage.getTestSessionsByCandidateId(candidateId);
      
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch candidate sessions" });
    }
  });

  // Endpoint to get all test sessions
  app.get("/api/tests/sessions", async (req: Request, res: Response) => {
    try {
      // Get sessions for all tests
      const sessions = [];
      const tests = await storage.getAllTests();
      
      for (const test of tests) {
        const testSessions = await storage.getTestSessionsByTestId(test.id);
        sessions.push(...testSessions);
      }
      
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch test sessions" });
    }
  });

  app.post("/api/sessions", async (req: Request, res: Response) => {
    try {
      // Конвертируем строку даты в объект Date
      let sessionData = {
        ...req.body,
        token: nanoid(10), // Generate a unique token for the test session
      };
      
      // Если expiresAt пришел как строка, конвертируем в Date
      if (typeof sessionData.expiresAt === 'string') {
        sessionData.expiresAt = new Date(sessionData.expiresAt);
      }
      
      const validatedData = insertTestSessionSchema.parse(sessionData);
      const session = await storage.createTestSession(validatedData);
      
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid session data", 
          errors: error.errors 
        });
      }
      
      console.error("Session creation error:", error);
      res.status(500).json({ message: "Failed to create test session" });
    }
  });

  app.patch("/api/sessions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const session = await storage.getTestSession(id);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      const updatedSession = await storage.updateTestSession(id, req.body);
      
      res.json(updatedSession);
    } catch (error) {
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  // Test session by token endpoint - for candidates to take tests
  app.get("/api/sessions/token/:token", async (req: Request, res: Response) => {
    try {
      const token = req.params.token;
      const session = await storage.getTestSessionByToken(token);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found or expired" });
      }
      
      // Check if session is expired
      if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
        return res.status(403).json({ message: "Test session has expired" });
      }
      
      // Get the test details
      const test = await storage.getTest(session.testId);
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      // Get the candidate details
      const candidate = await storage.getCandidate(session.candidateId);
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      
      // Get the questions - don't include correct answers
      const questionsWithAnswers = await storage.getQuestionsByTestId(test.id);
      const questions = questionsWithAnswers.map(q => ({
        id: q.id,
        content: q.content,
        type: q.type,
        options: q.options,
        points: q.points,
        order: q.order
      }));
      
      res.json({
        session,
        test: {
          id: test.id,
          name: test.name,
          description: test.description,
          category: test.category,
          timeLimit: test.timeLimit
        },
        candidate: {
          id: candidate.id,
          name: candidate.name
        },
        questions
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });
  
  // Submit answers
  app.post("/api/sessions/:token/submit", async (req: Request, res: Response) => {
    try {
      const token = req.params.token;
      const { answers } = req.body;
      
      // Validate answers format
      if (!Array.isArray(answers)) {
        return res.status(400).json({ message: "Answers must be an array" });
      }
      
      const session = await storage.getTestSessionByToken(token);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Check if session is expired
      if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
        return res.status(403).json({ message: "Test session has expired" });
      }
      
      // Check if session is already completed
      if (session.status === "completed") {
        return res.status(400).json({ message: "Test has already been completed" });
      }
      
      // Get questions to validate answers and calculate score
      const questions = await storage.getQuestionsByTestId(session.testId);
      
      let totalScore = 0;
      const processedAnswers = [];
      
      // Process each answer
      for (const answer of answers) {
        const question = questions.find(q => q.id === answer.questionId);
        
        if (!question) {
          return res.status(400).json({ 
            message: `Question with ID ${answer.questionId} not found` 
          });
        }
        
        // Check if the answer is correct and calculate points
        let isCorrect = false;
        
        if (question.type === "multiple_choice") {
          isCorrect = answer.answer === question.correctAnswer;
        } else if (question.type === "checkbox") {
          // For checkbox, both arrays need to have the same values regardless of order
          // Обеспечиваем корректность типов для Set
          const answerArray = Array.isArray(answer.answer) ? answer.answer : [];
          const correctArray = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
          
          const answerSet = new Set(answerArray);
          const correctSet = new Set(correctArray);
          
          isCorrect = answerSet.size === correctSet.size && 
                      Array.from(answerSet).every(value => correctSet.has(value));
        } else if (question.type === "text" || question.type === "code") {
          // For text/code questions, compare with expected answer (case insensitive for text)
          if (question.type === "text") {
            isCorrect = String(answer.answer).toLowerCase() === 
                        String(question.correctAnswer).toLowerCase();
          } else {
            isCorrect = String(answer.answer) === String(question.correctAnswer);
          }
        }
        
        const points = isCorrect ? question.points : 0;
        totalScore += points;
        
        // Save the candidate's answer
        const candidateAnswer = {
          sessionId: session.id,
          questionId: question.id,
          answer: answer.answer,
          isCorrect,
          points
        };
        
        await storage.createCandidateAnswer(candidateAnswer);
        processedAnswers.push(candidateAnswer);
      }
      
      // Get test for passing score threshold
      const test = await storage.getTest(session.testId);
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      // Calculate total possible score and percentage
      const totalPossibleScore = questions.reduce((sum, q) => sum + q.points, 0);
      const percentScore = totalPossibleScore > 0 
        ? Math.round((totalScore / totalPossibleScore) * 100) 
        : 0;
      
      // Check if the candidate passed the test based on the threshold
      const passed = percentScore >= (test.passingScore || 70);
      
      // Update the session with the score, percentage, pass status and mark as completed
      const updatedSession = await storage.updateTestSession(session.id, {
        status: "completed",
        completedAt: new Date(),
        score: totalScore,
        percentScore: percentScore,
        passed: passed
      });
      
      res.json({
        score: totalScore,
        totalPossibleScore: totalPossibleScore,
        percentScore: percentScore,
        passed: passed,
        passingThreshold: test.passingScore || 70,
        session: updatedSession
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to submit answers" });
    }
  });

  // Start a test session
  app.post("/api/sessions/:token/start", async (req: Request, res: Response) => {
    try {
      const token = req.params.token;
      
      const session = await storage.getTestSessionByToken(token);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Check if session is expired
      if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
        return res.status(403).json({ message: "Test session has expired" });
      }
      
      // Check if session is already completed or in progress
      if (session.status === "completed") {
        return res.status(400).json({ message: "Test has already been completed" });
      }
      
      // Update the session status to in_progress and set the start time
      const updatedSession = await storage.updateTestSession(session.id, {
        status: "in_progress",
        startedAt: new Date()
      });
      
      res.json(updatedSession);
    } catch (error) {
      res.status(500).json({ message: "Failed to start session" });
    }
  });
  
  // Dashboard stats
  app.get("/api/stats", async (req: Request, res: Response) => {
    try {
      const stats = await storage.getTestStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });
  
  app.get("/api/recent-activity", async (req: Request, res: Response) => {
    try {
      const activity = await storage.getRecentActivity();
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // User management routes - Administrator only
  app.get("/api/users", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/users/:id", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      // Не разрешаем изменять пароль через этот маршрут
      const { password, ...userData } = req.body;
      
      const updatedUser = await storage.updateUser(id, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.post("/api/users/:id/reset-password", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { newPassword } = req.body;
      
      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
        return res.status(400).json({ 
          message: "New password must be at least 8 characters" 
        });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const hashedPassword = await hashPassword(newPassword);
      const updatedUser = await storage.updateUser(id, { password: hashedPassword });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Failed to reset password" });
      }
      
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Change password route - for users to change their own password
  app.post("/api/change-password", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          message: "Current password and new password are required" 
        });
      }
      
      if (typeof newPassword !== 'string' || newPassword.length < 8) {
        return res.status(400).json({ 
          message: "New password must be at least 8 characters" 
        });
      }
      
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Импортируем функцию сравнения паролей
      const { comparePasswords } = require('./auth');
      
      // Сравниваем текущий пароль
      const passwordsMatch = await comparePasswords(currentPassword, user.password);
      if (!passwordsMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Хешируем новый пароль
      const hashedPassword = await hashPassword(newPassword);
      const updatedUser = await storage.updateUser(userId, { password: hashedPassword });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Failed to update password" });
      }
      
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  app.post("/api/generate-questions", async (req: Request, res: Response) => {
    try {
      const { count, type, testId } = req.body;
      
      if (!count || !type || !testId) {
        return res.status(400).json({ error: "Count, type and testId are required" });
      }

      const test = await storage.getTest(testId);
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: process.env.LLM_MODEL || 'openai/gpt-3.5-turbo',
          messages: [{
            role: 'user',
            content: `Generate ${count} ${type} questions on the test purpose '${test.name}' and the test descriptions '${test.description}'. \
              Return ONLY pure JSON array without any Markdown formatting or additional text. \
              Each question must have between 3 and 5 options. \
              Required fields for each question: \
              - 'content' (string): question text \
              - 'options' (string[]): array of options \
              - 'correctAnswer' (number): index of correct option (0-based) \
              - 'type' (string): question type (${type}) \
              Example format: \
              [{"content":"Question text","options":["Option 1","Option 2","Option 3"],"correctAnswer":0,"type":"${type}"}]`
          }]
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenRouter API error');
      }
      
      const result = await response.json();
      console.log('Full OpenRouter API response:', JSON.stringify(result, null, 2));
      console.log('Message content:', result.choices[0].message.content);
      
      let questions;
      const rawContent = result.choices[0].message.content;
      try {
        // Сначала пробуем распарсить как чистый JSON
        questions = JSON.parse(rawContent);
        console.log('Successfully parsed as raw JSON');
      } catch (e) {
        console.log('Trying to extract JSON from Markdown...');
        const jsonMatch = rawContent.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          questions = JSON.parse(jsonMatch[1]);
          console.log('Successfully extracted JSON from Markdown');
        } else {
          console.error('Failed to parse response:', rawContent);
          throw new Error('Invalid response format from OpenRouter');
        }
      }
      
      const savedQuestions = [];
      for (const q of questions) {
        try {
          const saved = await storage.createQuestion({
            content: q.content,
            options: q.options,
            correctAnswer: q.correctAnswer,
            type: q.type || type,
            testId: parseInt(testId),
            points: q.points || 1,
            order: savedQuestions.length
          });
          savedQuestions.push(saved);
        } catch (dbError) {
          console.error('Full DB error:', dbError);
          console.error('Question data:', {
            content: q.content,
            options: q.options,
            correctAnswer: q.correctAnswer,
            type: q.type || type,
            testId: parseInt(testId),
            points: q.points || 1,
            order: savedQuestions.length
          });
          throw new Error(`Failed to save question: ${(dbError as Error).message}`);
        }
      }
      
      res.json(savedQuestions);
    } catch (error: any) {
      console.error('Generation error:', error);
      res.status(500).json({ 
        error: 'Question generation failed',
        details: error.message 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
