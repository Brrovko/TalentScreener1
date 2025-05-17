import { db } from './db';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { hashPassword } from './auth';
import { users, organizations } from '@shared/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

/**
 * Запускает миграции базы данных
 */
export async function runMigrations() {
  try {
    console.log('Running migrations...');
    
    // Проверяем, существует ли директория с миграциями
    const migrationsDir = path.join(process.cwd(), 'drizzle');
    if (!fs.existsSync(migrationsDir)) {
      console.error('Migrations directory not found:', migrationsDir);
      return;
    }
    
    // Выполняем SQL-миграции из файлов в директории drizzle
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (migrationFiles.length === 0) {
      console.warn('No migration files found in:', migrationsDir);
      return;
    }
    
    for (const file of migrationFiles) {
      console.log(`Executing migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await db.execute(sql);
    }
    
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
}

/**
 * Удаляет использованные и истёкшие email verification codes
 */
export async function cleanupEmailVerificationCodes() {
  try {
    const { db } = await import('./db');
    await db.execute(`DELETE FROM email_verification_codes WHERE used = true OR expires_at < NOW() - INTERVAL '1 day'`);
    console.log('Email verification codes cleanup completed');
  } catch (error) {
    console.error('Error cleaning up email verification codes:', error);
    throw error;
  }
}

/**
 * Заполняет базу данных начальными данными
 */
export async function seedDatabase() {
  try {
    console.log('Seeding database...');

    // Найти или создать дефолтную организацию
    let defaultOrg = await db.query.organizations.findFirst({
      where: (org, { eq }) => eq(org.name, 'Default Organization'),
    });
    if (!defaultOrg) {
      [defaultOrg] = await db.insert(organizations).values({ name: 'Default Organization' }).returning();
      console.log('Created Default Organization:', defaultOrg.id);
    } else {
      console.log('Default Organization already exists:', defaultOrg.id);
    }

    // Найти или создать пользователя admin
    let adminUser = await db.query.users.findFirst({
      where: (user, { eq, and }) => and(
        eq(user.username, 'admin'),
        eq(user.organizationId, defaultOrg.id)
      ),
    });
    if (!adminUser) {
      [adminUser] = await db.insert(users).values({
        organizationId: defaultOrg.id,
        username: 'admin',
        password: await hashPassword('admin123'),
        fullName: 'System Administrator',
        role: 'admin',
        email: 'admin@skillchecker.tech',
        active: true
      }).returning();
      console.log('Created admin user:', adminUser.id);
    } else {
      console.log('Admin user already exists:', adminUser.id);
    }

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

