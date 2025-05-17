import {db} from './db';
import {hashPassword} from './auth';
import {organizations, users} from '@shared/schema';
import {eq} from 'drizzle-orm';
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
 * Заполняет базу данных начальными данными
 */
export async function seedDatabase() {
  try {
    console.log('Seeding database...');
    
    // Проверяем, есть ли уже данные в базе
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      console.log('Database already seeded, skipping...');
      return;
    }

    // Проверяем, есть ли уже организация с таким именем
    let [defaultOrg] = await db.select().from(organizations).where(eq(organizations.name, 'Default Organization'));
    if (!defaultOrg) {
      [defaultOrg] = await db.insert(organizations).values({name: 'Default Organization'}).returning();
    }
    
    // Создаем пользователя admin
    const adminUser = await db.insert(users).values({
      organizationId: defaultOrg.id,
      username: 'admin',
      password: await hashPassword('admin123'),
      fullName: 'System Administrator',
      role: 'admin',
      email: 'admin@skillchecker.tech',
      active: true
    }).returning();
    
    console.log('Created admin user:', adminUser[0].id);
    
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}
