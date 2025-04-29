import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Используем только DATABASE_URL или дефолт для локальной базы
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/skillchecker';

console.log("DATABASE_URL:", DATABASE_URL);

// Создаем пул подключений к PostgreSQL
export const pool = new pg.Pool({ connectionString: DATABASE_URL });
export const db = drizzle(pool, { schema });
