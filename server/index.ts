import dotenv from 'dotenv';
// Загружаем переменные окружения из файла .env
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { runMigrations, seedDatabase } from "./migrations";
import { PgStorage } from "./pg-storage";
import { setStorage } from "./storage";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Запускаем миграции базы данных
  await runMigrations();
  
  // Заполняем базу данных начальными данными
  await seedDatabase();
  
  // Создаем экземпляр PgStorage и устанавливаем его как хранилище
  const pgStorage = new PgStorage();
  // Используем функцию setStorage вместо прямого присваивания
  setStorage(pgStorage);
  
  // Initialize admin user if not exists
  try {
    const { storage } = await import("./storage");
    const { hashPassword } = await import("./auth");
    
    const adminUser = await storage.getUserByUsername("admin");
    if (!adminUser) {
      console.log("Creating default admin user...");
      await storage.createUser({
        username: "admin",
        password: await hashPassword("admin123"),
        fullName: "System Administrator",
        role: "admin",
        email: "admin@example.com",
        active: true
      });
      console.log("Default admin user created successfully");
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5004
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5005; // Изменяем порт с 5004 на 5005
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
