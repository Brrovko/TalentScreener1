import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Используем локальное подключение для разработки, если DATABASE_URL не установлен
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/skillchecker';

// Создаем пул подключений к PostgreSQL
export const pool = new pg.Pool({ connectionString: DATABASE_URL });
export const db = drizzle(pool, { schema });
