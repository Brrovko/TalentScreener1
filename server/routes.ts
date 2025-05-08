import type { Express, Response } from "express";
import type { Request as ExpressRequest } from "express";
import type { Multer } from "multer";

declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
      files?: {
        [fieldname: string]: Express.Multer.File[];
      } | Express.Multer.File[] | undefined;
    }
  }
}

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
import Papa from 'papaparse';
import multer from 'multer';

const upload = multer();

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  // Tests routes
  /**
   * @swagger
   * tags:
   *   name: Tests
   *   description: Test management
   */

  /**
   * @swagger
   * /api/tests:
   *   get:
   *     summary: Get all tests
   *     tags: [Tests]
   *     responses:
   *       200:
   *         description: List of all tests
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Test'
   *       500:
   *         description: Server error
   */
  app.get("/api/tests", async (req: ExpressRequest, res: Response) => {
    try {
      const tests = await storage.getAllTests();
      res.json(tests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tests" });
    }
  });

  /**
   * @swagger
   * /api/tests/{id}:
   *   get:
   *     summary: Get test by ID
   *     tags: [Tests]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: integer
   *         required: true
   *         description: Test ID
   *     responses:
   *       200:
   *         description: Test details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Test'
   *       404:
   *         description: Test not found
   *       500:
   *         description: Server error
   */
  app.get("/api/tests/:id", async (req: ExpressRequest, res: Response) => {
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

  /**
   * @swagger
   * /api/tests:
   *   post:
   *     summary: Create new test
   *     tags: [Tests]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TestInput'
   *     responses:
   *       201:
   *         description: Created test
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Test'
   *       400:
   *         description: Invalid input data
   *       500:
   *         description: Server error
   */
  app.post("/api/tests", async (req: ExpressRequest, res: Response) => {
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

  /**
 * @swagger
 * /api/tests/{id}:
 *   patch:
 *     summary: Update test by ID
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Test ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               timeLimit:
 *                 type: integer
 *               passingScore:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Updated test
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Test'
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Test not found
 *       500:
 *         description: Server error
 */
app.patch("/api/tests/:id", async (req: ExpressRequest, res: Response) => {
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

  /**
 * @swagger
 * /api/tests/{id}:
 *   delete:
 *     summary: Delete test by ID
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Test ID
 *     responses:
 *       204:
 *         description: Test successfully deleted
 *       404:
 *         description: Test not found
 *       500:
 *         description: Server error
 */
app.delete("/api/tests/:id", async (req: ExpressRequest, res: Response) => {
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
  /**
   * @swagger
   * tags:
   *   name: Questions
   *   description: Question management
   */
  /**
 * @swagger
 * /api/tests/{id}/questions:
 *   get:
 *     summary: Get questions for a test
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Test ID
 *     responses:
 *       200:
 *         description: List of questions for the test
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   testId:
 *                     type: integer
 *                   content:
 *                     type: string
 *                   type:
 *                     type: string
 *                   options:
 *                     type: array
 *                     items:
 *                       type: string
 *                   correctAnswer:
 *                     type: any
 *                   points:
 *                     type: integer
 *                   order:
 *                     type: integer
 *       500:
 *         description: Server error
 */
app.get("/api/tests/:id/questions", async (req: ExpressRequest, res: Response) => {
    try {
      const testId = parseInt(req.params.id);
      const questions = await storage.getQuestionsByTestId(testId);
      
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  /**
 * @swagger
 * /api/questions:
 *   post:
 *     summary: Create a new question
 *     tags: [Questions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - testId
 *               - content
 *               - type
 *             properties:
 *               testId:
 *                 type: integer
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [multiple_choice, checkbox, text, code]
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *               correctAnswer:
 *                 type: any
 *               points:
 *                 type: integer
 *               order:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Created question
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
app.post("/api/questions", async (req: ExpressRequest, res: Response) => {
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

  /**
 * @swagger
 * /api/questions/{id}:
 *   patch:
 *     summary: Update question by ID
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Question ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [multiple_choice, checkbox, text, code]
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *               correctAnswer:
 *                 type: any
 *               points:
 *                 type: integer
 *               order:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Updated question
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Question not found
 *       500:
 *         description: Server error
 */
app.patch("/api/questions/:id", async (req: ExpressRequest, res: Response) => {
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

  /**
 * @swagger
 * /api/questions/{id}:
 *   delete:
 *     summary: Delete question by ID
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Question ID
 *     responses:
 *       204:
 *         description: Question successfully deleted
 *       404:
 *         description: Question not found
 *       500:
 *         description: Server error
 */
app.delete("/api/questions/:id", async (req: ExpressRequest, res: Response) => {
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

  /**
 * @swagger
 * /api/tests/{id}/reorder-questions:
 *   post:
 *     summary: Reorder questions for a test
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Test ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionIds
 *             properties:
 *               questionIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of question IDs in the desired order
 *     responses:
 *       200:
 *         description: Questions successfully reordered
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
app.post("/api/tests/:id/reorder-questions", async (req: ExpressRequest, res: Response) => {
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
  /**
   * @swagger
   * tags:
   *   name: Candidates
   *   description: Candidate management
   */
  /**
 * @swagger
 * /api/candidates:
 *   get:
 *     summary: Get all candidates
 *     tags: [Candidates]
 *     responses:
 *       200:
 *         description: List of all candidates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Server error
 */
app.get("/api/candidates", async (req: ExpressRequest, res: Response) => {
    try {
      const candidates = await storage.getAllCandidates();
      res.json(candidates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch candidates" });
    }
  });

  /**
 * @swagger
 * /api/candidates/{id}:
 *   get:
 *     summary: Get candidate by ID
 *     tags: [Candidates]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Candidate ID
 *     responses:
 *       200:
 *         description: Candidate details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Candidate not found
 *       500:
 *         description: Server error
 */
app.get("/api/candidates/:id", async (req: ExpressRequest, res: Response) => {
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

  /**
 * @swagger
 * /api/candidates:
 *   post:
 *     summary: Create a new candidate
 *     tags: [Candidates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created candidate
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
app.post("/api/candidates", async (req: ExpressRequest, res: Response) => {
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
  /**
   * @swagger
   * tags:
   *   name: Test Sessions
   *   description: Test session management
   */
  /**
 * @swagger
 * /api/tests/{id}/sessions:
 *   get:
 *     summary: Get test sessions for a test
 *     tags: [Test Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Test ID
 *     responses:
 *       200:
 *         description: List of test sessions for the specified test
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   testId:
 *                     type: integer
 *                   candidateId:
 *                     type: integer
 *                   token:
 *                     type: string
 *                   status:
 *                     type: string
 *                   startedAt:
 *                     type: string
 *                     format: date-time
 *                   completedAt:
 *                     type: string
 *                     format: date-time
 *                   expiresAt:
 *                     type: string
 *                     format: date-time
 *                   score:
 *                     type: integer
 *                   percentScore:
 *                     type: integer
 *                   passed:
 *                     type: boolean
 *       500:
 *         description: Server error
 */
app.get("/api/tests/:id/sessions", async (req: ExpressRequest, res: Response) => {
    try {
      const testId = parseInt(req.params.id);
      const sessions = await storage.getTestSessionsByTestId(testId);
      
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch test sessions" });
    }
  });

  /**
 * @swagger
 * /api/candidates/{id}/sessions:
 *   get:
 *     summary: Get test sessions for a candidate
 *     tags: [Test Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Candidate ID
 *     responses:
 *       200:
 *         description: List of test sessions for the candidate
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   testId:
 *                     type: integer
 *                   candidateId:
 *                     type: integer
 *                   token:
 *                     type: string
 *                   status:
 *                     type: string
 *                   startedAt:
 *                     type: string
 *                     format: date-time
 *                   completedAt:
 *                     type: string
 *                     format: date-time
 *                   expiresAt:
 *                     type: string
 *                     format: date-time
 *                   score:
 *                     type: integer
 *                   percentScore:
 *                     type: integer
 *                   passed:
 *                     type: boolean
 *       500:
 *         description: Server error
 */
app.get("/api/candidates/:id/sessions", async (req: ExpressRequest, res: Response) => {
    try {
      const candidateId = parseInt(req.params.id);
      const sessions = await storage.getTestSessionsByCandidateId(candidateId);
      
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch candidate sessions" });
    }
  });

  // Endpoint to get all test sessions
  /**
 * @swagger
 * /api/tests/sessions:
 *   get:
 *     summary: Get all test sessions
 *     tags: [Test Sessions]
 *     responses:
 *       200:
 *         description: List of all test sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   testId:
 *                     type: integer
 *                   candidateId:
 *                     type: integer
 *                   token:
 *                     type: string
 *                   status:
 *                     type: string
 *                   startedAt:
 *                     type: string
 *                     format: date-time
 *                   completedAt:
 *                     type: string
 *                     format: date-time
 *                   expiresAt:
 *                     type: string
 *                     format: date-time
 *                   score:
 *                     type: integer
 *                   percentScore:
 *                     type: integer
 *                   passed:
 *                     type: boolean
 *       500:
 *         description: Server error
 */
app.get("/api/tests/sessions", async (req: ExpressRequest, res: Response) => {
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

  /**
 * @swagger
 * /api/sessions:
 *   post:
 *     summary: Create a new test session
 *     tags: [Test Sessions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - testId
 *               - candidateId
 *             properties:
 *               testId:
 *                 type: integer
 *               candidateId:
 *                 type: integer
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Created test session
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
app.post("/api/sessions", async (req: ExpressRequest, res: Response) => {
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

  /**
 * @swagger
 * /api/sessions/{id}:
 *   patch:
 *     summary: Update test session by ID
 *     tags: [Test Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               startedAt:
 *                 type: string
 *                 format: date-time
 *               completedAt:
 *                 type: string
 *                 format: date-time
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *               score:
 *                 type: integer
 *               percentScore:
 *                 type: integer
 *               passed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated test session
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
app.patch("/api/sessions/:id", async (req: ExpressRequest, res: Response) => {
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

  /**
 * @swagger
 * /api/sessions/{id}:
 *   get:
 *     summary: Get session by ID
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 testId:
 *                   type: integer
 *                 candidateId:
 *                   type: integer
 *                 token:
 *                   type: string
 *                 status:
 *                   type: string
 *                 startedAt:
 *                   type: string
 *                   format: date-time
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *                 test:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
app.get("/api/sessions/:id", async (req: ExpressRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const session = await storage.getTestSession(id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      // enrich with test name
      const test = await storage.getTest(session.testId);
      res.json({ ...session, test });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  // Test session by token endpoint - for candidates to take tests
  /**
 * @swagger
 * /api/sessions/token/{token}:
 *   get:
 *     summary: Get test session by token
 *     tags: [Test Sessions]
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Session token
 *     responses:
 *       200:
 *         description: Session details with test and questions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 session:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     testId:
 *                       type: integer
 *                     candidateId:
 *                       type: integer
 *                     token:
 *                       type: string
 *                     status:
 *                       type: string
 *                     startedAt:
 *                       type: string
 *                       format: date-time
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                 test:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     category:
 *                       type: string
 *                     timeLimit:
 *                       type: integer
 *                 candidate:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       content:
 *                         type: string
 *                       type:
 *                         type: string
 *                       options:
 *                         type: array
 *                         items:
 *                           type: string
 *                       points:
 *                         type: integer
 *                       order:
 *                         type: integer
 *       403:
 *         description: Session expired
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
app.get("/api/sessions/token/:token", async (req: ExpressRequest, res: Response) => {
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
  /**
 * @swagger
 * /api/sessions/{token}/submit:
 *   post:
 *     summary: Submit test answers
 *     tags: [Test Sessions]
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Session token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - answers
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - questionId
 *                     - answer
 *                   properties:
 *                     questionId:
 *                       type: integer
 *                     answer:
 *                       type: any
 *                       description: Can be a string, number, or array depending on question type
 *     responses:
 *       200:
 *         description: Test results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 score:
 *                   type: integer
 *                 totalPossibleScore:
 *                   type: integer
 *                 percentScore:
 *                   type: integer
 *                 passed:
 *                   type: boolean
 *                 passingThreshold:
 *                   type: integer
 *                 session:
 *                   type: object
 *       400:
 *         description: Invalid input data or test already completed
 *       403:
 *         description: Session expired
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
app.post("/api/sessions/:token/submit", async (req: ExpressRequest, res: Response) => {
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
      for (let i = 0; i < answers.length; i++) {
        const answer = answers[i];
        const question = questions.find(q => q.id === answer.questionId);
        
        if (!question) {
          return res.status(400).json({ 
            message: `Question with ID ${answer.questionId} not found` 
          });
        }
        
        let isCorrect = false;
        let normalizedAnswer = answer.answer;
        let answerText: string | string[] | null = null;

        if (question.type === "multiple_choice") {
          let answerIndex = typeof answer.answer === 'number' ? answer.answer :
            (Array.isArray(question.options) ? (question.options as string[]).indexOf(answer.answer) : -1);
          normalizedAnswer = answerIndex;
          answerText = Array.isArray(question.options) && answerIndex >= 0 ? question.options[answerIndex] : null;
          isCorrect = answerIndex === question.correctAnswer;
        } else if (question.type === "checkbox") {
          let answerArray = Array.isArray(answer.answer) ? answer.answer : [];
          let correctArray = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
          if (Array.isArray(question.options)) {
            answerArray = answerArray.map((val: string | number) => typeof val === 'number' ? val : (question.options as string[]).indexOf(val));
            answerText = answerArray.map((idx: number) => (Array.isArray(question.options) && typeof idx === 'number' && idx >= 0) ? question.options[idx] : null);
          } else {
            answerText = answerArray;
          }
          normalizedAnswer = answerArray;
          const answerSet = new Set(answerArray);
          const correctSet = new Set(correctArray);
          isCorrect = answerSet.size === correctSet.size && Array.from(answerSet).every(value => correctSet.has(value));
        } else if (question.type === "text" || question.type === "code") {
          answerText = answer.answer;
          if (question.type === "text") {
            isCorrect = String(answer.answer).toLowerCase() === String(question.correctAnswer).toLowerCase();
          } else {
            isCorrect = String(answer.answer) === String(question.correctAnswer);
          }
        }
        
        const points = isCorrect ? question.points : 0;
        totalScore += points;
        
        const candidateAnswer = {
          sessionId: session.id,
          questionId: question.id,
          answer: normalizedAnswer,
          answerText: answerText,
          isCorrect,
          points,
          answerIndex: i
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
  /**
 * @swagger
 * /api/sessions/{token}/start:
 *   post:
 *     summary: Start a test session
 *     tags: [Test Sessions]
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Session token
 *     responses:
 *       200:
 *         description: Started test session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 testId:
 *                   type: integer
 *                 candidateId:
 *                   type: integer
 *                 token:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [created, in_progress, completed]
 *                 startedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Test already completed
 *       403:
 *         description: Session expired
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
app.post("/api/sessions/:token/start", async (req: ExpressRequest, res: Response) => {
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
  /**
   * @swagger
   * tags:
   *   name: Dashboard
   *   description: Dashboard statistics
   */
  /**
 * @swagger
 * /api/stats:
 *   get:
 *     summary: Get test statistics for dashboard
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Test statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalTests:
 *                   type: integer
 *                 totalCandidates:
 *                   type: integer
 *                 totalSessions:
 *                   type: integer
 *                 completedSessions:
 *                   type: integer
 *                 averageScore:
 *                   type: number
 *                 passRate:
 *                   type: number
 *       500:
 *         description: Server error
 */
app.get("/api/stats", async (req: ExpressRequest, res: Response) => {
    try {
      const stats = await storage.getTestStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });
  
  /**
 * @swagger
 * /api/recent-activity:
 *   get:
 *     summary: Get recent activity for dashboard
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Recent test activity
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   type:
 *                     type: string
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                   details:
 *                     type: object
 *       500:
 *         description: Server error
 */
app.get("/api/recent-activity", async (req: ExpressRequest, res: Response) => {
    try {
      const activity = await storage.getRecentActivity();
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // User management routes - Administrator only
  /**
   * @swagger
   * tags:
   *   name: Users
   *   description: User management
   */
  /**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   username:
 *                     type: string
 *                   fullName:
 *                     type: string
 *                   email:
 *                     type: string
 *                   role:
 *                     type: string
 *                   active:
 *                     type: boolean
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (requires admin role)
 *       500:
 *         description: Server error
 */
app.get("/api/users", requireRole("admin"), async (req: ExpressRequest, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  /**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Update user (admin only)
 *     tags: [Users]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated user
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (requires admin role)
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
app.patch("/api/users/:id", requireRole("admin"), async (req: ExpressRequest, res: Response) => {
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

  /**
 * @swagger
 * /api/users/{id}/reset-password:
 *   post:
 *     summary: Reset user password (admin only)
 *     tags: [Users]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid password
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (requires admin role)
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
app.post("/api/users/:id/reset-password", requireRole("admin"), async (req: ExpressRequest, res: Response) => {
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
  /**
 * @swagger
 * /api/change-password:
 *   post:
 *     summary: Change own password
 *     tags: [Users]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid passwords or current password incorrect
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
app.post("/api/change-password", async (req: ExpressRequest, res: Response) => {
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

  /**
 * @swagger
 * /api/generate-questions:
 *   post:
 *     summary: Generate questions using AI
 *     tags: [Questions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - count
 *               - type
 *               - testId
 *             properties:
 *               count:
 *                 type: integer
 *                 description: Number of questions to generate
 *               type:
 *                 type: string
 *                 enum: [multiple_choice, checkbox, text, code]
 *                 description: Type of questions to generate
 *               testId:
 *                 type: integer
 *                 description: ID of the test to add questions to
 *     responses:
 *       200:
 *         description: Generated questions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Test not found
 *       500:
 *         description: Server error or AI service error
 */
app.post("/api/generate-questions", async (req: ExpressRequest, res: Response) => {
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
Return ONLY a pure JSON array (not objects separated by commas, not markdown, not text, not code block, no explanations, no pre/post text). The response MUST start with [ and end with ]. \
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
        console.log('Trying to extract JSON from Markdown or fix format...');
        // Попытка вытащить из блока ```json ... ```
        let jsonMatch = rawContent.match(/```json\n([\s\S]*?)\n```/);
        if (!jsonMatch) {
          // Попытка вытащить из блока ``` ... ```
          jsonMatch = rawContent.match(/```[\s\S]*?\n([\s\S]*?)\n```/);
        }
        if (jsonMatch) {
          questions = JSON.parse(jsonMatch[1]);
          console.log('Successfully extracted JSON from Markdown');
        } else {
          // Попробуем "починить" ответ: если он начинается с ] и продолжается массивом, уберём лишние скобки
          let fixed = rawContent.trim();
          if (fixed.startsWith("]")) {
            fixed = fixed.replace(/^\]+/, "");
          }
          if (!fixed.startsWith("[")) {
            fixed = "[" + fixed;
          }
          if (!fixed.endsWith("]")) {
            fixed = fixed + "]";
          }
          try {
            questions = JSON.parse(fixed);
            console.log('Fixed and parsed as JSON array (handled leading ] bug)');
          } catch (fixErr) {
            console.error('Failed to parse response:', rawContent);
            throw new Error('Invalid response format from OpenRouter');
          }
        }
      }
      
      const savedQuestions = [];
      for (const q of questions) {
        try {
          // Исправляем тип, если он некорректный (например, multiple-choice -> multiple_choice)
          let normalizedType = q.type;
          if (typeof normalizedType === 'string') {
            normalizedType = normalizedType.replace(/-/g, '_');
          }
          const saved = await storage.createQuestion({
            testId,
            content: q.content,
            type: normalizedType || type,
            options: q.options,
            correctAnswer: q.correctAnswer,
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

  // Экспорт вопросов в CSV
  /**
   * @swagger
   * tags:
   *   name: Import/Export
   *   description: Questions import and export
   */
  /**
 * @swagger
 * /api/tests/{id}/export-questions:
 *   get:
 *     summary: Export questions as CSV
 *     tags: [Import/Export]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Test ID
 *     responses:
 *       200:
 *         description: CSV file with questions
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       500:
 *         description: Server error
 */
app.get("/api/tests/:id/export-questions", async (req: ExpressRequest, res: Response) => {
    try {
      const testId = parseInt(req.params.id);
      const questions = await storage.getQuestionsByTestId(testId);
      
      // Преобразуем вопросы в CSV-формат
      const csvData = questions.map(q => ({
        content: q.content,
        type: q.type,
        options: JSON.stringify(q.options),
        correctAnswer: JSON.stringify(q.correctAnswer)
      }));
      
      const csv = Papa.unparse(csvData);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=questions-test-${testId}.csv`);
      res.send(csv);
    } catch (error) {
      console.error('Error exporting questions:', error);
      res.status(500).json({ message: "Failed to export questions" });
    }
  });

  // Импорт вопросов из CSV
  /**
 * @swagger
 * /api/tests/{id}/import-questions:
 *   post:
 *     summary: Import questions from CSV
 *     tags: [Import/Export]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Test ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file with questions
 *     responses:
 *       200:
 *         description: Imported questions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 importedCount:
 *                   type: integer
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid CSV format or no file uploaded
 *       500:
 *         description: Server error
 */
app.post("/api/tests/:id/import-questions", 
    upload.single('file'),
    async (req: ExpressRequest, res: Response) => {
      try {
        const testId = parseInt(req.params.id);
        const file = req.file;
        
        if (!file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        const csvText = file.buffer.toString();
        const results = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true
        });

        if (results.errors.length > 0) {
          return res.status(400).json({ 
            message: "Invalid CSV format",
            errors: results.errors
          });
        }

        // Получаем существующие вопросы для определения порядка новых вопросов
        const existingQuestions = await storage.getQuestionsByTestId(testId);
        const maxOrder = existingQuestions.length > 0 
          ? Math.max(...existingQuestions.map(q => q.order))
          : 0;

        // Импортируем новые вопросы
        const createdQuestions = [];
        for (const row of results.data as any[]) {
          try {
            const question = await storage.createQuestion({
              testId,
              content: row.content,
              type: row.type || 'multiple_choice',
              options: (() => { try { return JSON.parse(row.options); } catch (e) { console.error('Ошибка парсинга options:', row.options, e); return []; } })(),
              correctAnswer: row.correctAnswer && row.correctAnswer.trim() !== '' ? (isNaN(Number(row.correctAnswer)) ? row.correctAnswer : Number(row.correctAnswer)) : null,
              points: row.points ? parseInt(row.points) : 1,
              order: maxOrder + createdQuestions.length + 1 // Устанавливаем порядок после существующих вопросов
            });
            createdQuestions.push(question);
          } catch (e) {
            console.error('Error parsing question row:', row, e);
          }
        }

        // Обновляем порядок всех вопросов
        if (createdQuestions.length > 0) {
          // Получаем все вопросы теста после импорта
          const allQuestions = await storage.getQuestionsByTestId(testId);
          // Получаем ID всех вопросов в правильном порядке
          const questionIds = allQuestions.map(q => q.id);
          // Обновляем порядок вопросов
          await storage.reorderQuestions(testId, questionIds);
        }

        res.json({
          importedCount: createdQuestions.length,
          questions: createdQuestions
        });
      } catch (error) {
        console.error('Error importing questions:', error);
        res.status(500).json({ message: "Failed to import questions" });
      }
    }
  );

  /**
   * @swagger
   * /api/sessions/{sessionId}/answers:
   *   get:
   *     summary: Get all candidate answers for a session
   *     tags: [Sessions]
   *     parameters:
   *       - in: path
   *         name: sessionId
   *         schema:
   *           type: integer
   *         required: true
   *         description: Session ID
   *     responses:
   *       200:
   *         description: List of candidate answers for the session
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *       404:
   *         description: Session not found
   *       500:
   *         description: Server error
   */
  app.get("/api/sessions/:sessionId/answers", async (req: ExpressRequest, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const session = await storage.getTestSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      const answers = await storage.getCandidateAnswersBySessionId(sessionId);
      // enrich with question text
      const questions = await storage.getQuestionsByTestId(session.testId);
      const answersWithQuestions = answers.map(a => ({
        ...a,
        question: questions.find(q => q.id === a.questionId) || null
      }));
      res.json(answersWithQuestions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch candidate answers" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
