-- Run in Supabase SQL Editor after emp-setup.sql
-- Adds auth tables and mentor scoping columns

ALTER TABLE emp_employees
  ADD COLUMN IF NOT EXISTS mentor_id UUID REFERENCES emp_mentors(id) ON DELETE SET NULL;

ALTER TABLE emp_mentors
  ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS department TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS photo TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

CREATE TABLE IF NOT EXISTS emp_auth_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('mentor', 'employee')),
  linked_mentor_id UUID REFERENCES emp_mentors(id) ON DELETE CASCADE,
  linked_employee_id UUID REFERENCES emp_employees(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_login TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS emp_mentor_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  password TEXT NOT NULL,
  department TEXT DEFAULT '',
  role TEXT DEFAULT '',
  photo TEXT DEFAULT '',
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  rejection_reason TEXT DEFAULT '',
  reviewed_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emp_employees_mentor_id ON emp_employees(mentor_id);
CREATE INDEX IF NOT EXISTS idx_emp_auth_users_email ON emp_auth_users(email);
CREATE INDEX IF NOT EXISTS idx_emp_mentor_registrations_status ON emp_mentor_registrations(status);

ALTER TABLE emp_auth_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_mentor_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS emp_auth_users_all ON emp_auth_users;
CREATE POLICY emp_auth_users_all ON emp_auth_users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS emp_mentor_registrations_all ON emp_mentor_registrations;
CREATE POLICY emp_mentor_registrations_all ON emp_mentor_registrations FOR ALL USING (true) WITH CHECK (true);

-- Realtime (safe if already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'emp_auth_users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE emp_auth_users;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'emp_mentor_registrations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE emp_mentor_registrations;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
