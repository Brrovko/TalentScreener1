-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "full_name" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'recruiter',
  "email" TEXT NOT NULL UNIQUE,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "last_login" TIMESTAMP
);

-- Создание таблицы тестов
CREATE TABLE IF NOT EXISTS "tests" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL,
  "created_by" INTEGER NOT NULL,
  "time_limit" INTEGER,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "question_count" INTEGER NOT NULL DEFAULT 0,
  "passing_score" INTEGER NOT NULL DEFAULT 70
);

-- Создание таблицы вопросов
CREATE TABLE IF NOT EXISTS "questions" (
  "id" SERIAL PRIMARY KEY,
  "test_id" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'multiple_choice',
  "options" JSONB NOT NULL,
  "correct_answer" JSONB NOT NULL,
  "points" INTEGER NOT NULL DEFAULT 1,
  "order" INTEGER NOT NULL
);

-- Создание таблицы кандидатов
CREATE TABLE IF NOT EXISTS "candidates" (
  "id" SERIAL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "position" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Создание таблицы сессий тестирования
CREATE TABLE IF NOT EXISTS "test_sessions" (
  "id" SERIAL PRIMARY KEY,
  "test_id" INTEGER NOT NULL,
  "candidate_id" INTEGER NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "started_at" TIMESTAMP,
  "completed_at" TIMESTAMP,
  "score" INTEGER,
  "percent_score" INTEGER,
  "passed" BOOLEAN,
  "expires_at" TIMESTAMP
);

-- Создание таблицы ответов кандидатов
CREATE TABLE IF NOT EXISTS "candidate_answers" (
  "session_id" INTEGER NOT NULL,
  "question_id" INTEGER NOT NULL,
  "answer" JSONB NOT NULL,
  "is_correct" BOOLEAN NOT NULL,
  "points" INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY ("session_id", "question_id")
);

-- Добавление внешних ключей с проверкой их существования
DO $$
BEGIN
  -- Проверяем существование ограничения fk_tests_created_by
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_tests_created_by'
  ) THEN
    ALTER TABLE "tests" ADD CONSTRAINT "fk_tests_created_by" 
    FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE CASCADE;
  END IF;

  -- Проверяем существование ограничения fk_questions_test_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_questions_test_id'
  ) THEN
    ALTER TABLE "questions" ADD CONSTRAINT "fk_questions_test_id" 
    FOREIGN KEY ("test_id") REFERENCES "tests" ("id") ON DELETE CASCADE;
  END IF;

  -- Проверяем существование ограничения fk_test_sessions_test_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_test_sessions_test_id'
  ) THEN
    ALTER TABLE "test_sessions" ADD CONSTRAINT "fk_test_sessions_test_id" 
    FOREIGN KEY ("test_id") REFERENCES "tests" ("id") ON DELETE CASCADE;
  END IF;

  -- Проверяем существование ограничения fk_test_sessions_candidate_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_test_sessions_candidate_id'
  ) THEN
    ALTER TABLE "test_sessions" ADD CONSTRAINT "fk_test_sessions_candidate_id" 
    FOREIGN KEY ("candidate_id") REFERENCES "candidates" ("id") ON DELETE CASCADE;
  END IF;

  -- Проверяем существование ограничения fk_candidate_answers_session_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_candidate_answers_session_id'
  ) THEN
    ALTER TABLE "candidate_answers" ADD CONSTRAINT "fk_candidate_answers_session_id" 
    FOREIGN KEY ("session_id") REFERENCES "test_sessions" ("id") ON DELETE CASCADE;
  END IF;
END
$$;
