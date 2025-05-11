import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, UserRole } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  try {
    // Verify that stored password has the correct format (hash.salt)
    if (!stored || !stored.includes(".")) {
      console.error("Invalid password format: no salt delimiter found");
      return false;
    }
    
    const [hashed, salt] = stored.split(".");
    
    // Verify that both hash and salt are present
    if (!hashed || !salt) {
      console.error("Invalid password format: missing hash or salt");
      return false;
    }
    
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const PostgresSessionStore = connectPg(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "secret-key-needs-to-be-changed",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
    },
  };

  // Use Postgres session store outside of test environment
  if (process.env.NODE_ENV !== 'test') {
    sessionSettings.store = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Поиск пользователя по email среди всех организаций
        const user = await storage.findUserByEmail(username);
        if (!user || !(await comparePasswords(password, user.password)) || !user.active) {
          return done(null, false);
        } else {
          // Update last login time
          await storage.updateUserLastLogin(user.organizationId, user.id);
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      // id comes from session, so we need to lookup user by id for all orgs
let user: SelectUser | undefined;
for (let orgId = 1; ; orgId++) { // replace with real orgId enumeration
  user = await storage.getUser(orgId, id);
  if (user) break;
}

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if user is authenticated and has admin role
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Only administrators can register new users" });
      }

      const existingUser = await storage.getUserByUsername(req.user.organizationId, req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(req.user.organizationId, {
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      res.status(201).json({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        email: user.email,
        active: user.active,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: SelectUser | false, info: { message: string }) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Don't send the password hash to the client
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    // Don't send the password hash to the client
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  // Admin only endpoint to get all users
  app.get("/api/users", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Only administrators can view all users" });
      }
      
      const users = await storage.getAllUsers(req.user.organizationId);
      // Don't send the password hashes to the client
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(usersWithoutPasswords);
    } catch (error) {
      next(error);
    }
  });

  // Admin only endpoint to update user (activate/deactivate or change role)
  app.patch("/api/users/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Only administrators can update users" });
      }
      
      const userId = parseInt(req.params.id);
      
      // Prevent admin from updating themselves (to avoid locking themselves out)
      if (userId === req.user.id) {
        return res.status(400).json({ message: "Cannot update your own account" });
      }
      
      const user = await storage.updateUser(req.user.organizationId, userId, req.body);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send the password hash to the client
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  // Admin only endpoint to reset a user's password
  app.post("/api/users/:id/reset-password", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Only administrators can reset passwords" });
      }
      
      const userId = parseInt(req.params.id);
      const { newPassword } = req.body;
      
      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }
      
      const user = await storage.updateUser(req.user.organizationId, userId, {
        password: await hashPassword(newPassword)
      });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
      next(error);
    }
  });

  // Update current user's password
  app.post("/api/change-password", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters" });
      }
      
      // Verify current password
      const user = await storage.getUser(req.user.organizationId, req.user.id);
      if (!user || !(await comparePasswords(currentPassword, user.password))) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      await storage.updateUser(req.user.organizationId, req.user.id, {
        password: await hashPassword(newPassword)
      });
      
      res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      next(error);
    }
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

export function requireRole(role: UserRole | UserRole[]) {
  const roles = Array.isArray(role) ? role : [role];
  
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!roles.includes(req.user!.role as UserRole)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    
    next();
  };
}