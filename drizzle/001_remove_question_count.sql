-- Удаляем поле question_count из таблицы tests
ALTER TABLE tests DROP COLUMN IF EXISTS question_count;
