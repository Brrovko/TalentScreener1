import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Формируем строку подключения из переменных окружения, если DATABASE_URL не задан
const DATABASE_URL = process.env.DATABASE_URL ||
  (
    process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD && process.env.PGDATABASE && process.env.PGPORT
      ? `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`
      : 'postgresql://postgres:postgres@localhost:5432/skillchecker'
  );

// Создаем пул подключений к PostgreSQL
export const pool = new pg.Pool({ connectionString: DATABASE_URL });
export const db = drizzle(pool, { schema });
