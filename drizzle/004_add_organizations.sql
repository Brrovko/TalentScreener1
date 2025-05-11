-- 004_add_organizations.sql
BEGIN;

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Insert default organization for existing records
INSERT INTO organizations (name) VALUES ('Default Organization') ON CONFLICT (name) DO NOTHING;

-- Add organization_id columns to key tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id INTEGER NOT NULL DEFAULT 1 REFERENCES organizations(id);
ALTER TABLE tests ADD COLUMN IF NOT EXISTS organization_id INTEGER NOT NULL DEFAULT 1 REFERENCES organizations(id);
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS organization_id INTEGER NOT NULL DEFAULT 1 REFERENCES organizations(id);
ALTER TABLE test_sessions ADD COLUMN IF NOT EXISTS organization_id INTEGER NOT NULL DEFAULT 1 REFERENCES organizations(id);
ALTER TABLE questions ADD COLUMN IF NOT EXISTS organization_id INTEGER NOT NULL DEFAULT 1 REFERENCES organizations(id);

COMMIT;
