-- Удаляем поле category из таблицы tests
ALTER TABLE tests DROP COLUMN IF EXISTS category;
