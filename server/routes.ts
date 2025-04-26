import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertTestSchema, 
  insertQuestionSchema, 
  insertCandidateSchema,
  insertTestSessionSchema
} from "@shared/schema";
import { nanoid } from "nanoid";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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

  app.post("/api/sessions", async (req: Request, res: Response) => {
    try {
      const sessionData = {
        ...req.body,
        token: nanoid(10), // Generate a unique token for the test session
      };
      
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

  const httpServer = createServer(app);

  return httpServer;
}
