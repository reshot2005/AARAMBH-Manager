// Do NOT paste this file into Supabase SQL Editor.
// Use the pure SQL file instead: supabase/emp-setup.sql

export const CREATE_TABLES_SQL = `
-- ============================================================
-- AKSHARA EMPLOYEE PORTAL - Isolated Tables (emp_ prefix)
-- These tables are COMPLETELY SEPARATE from Aarambh tables
-- ============================================================

-- 1. DEPARTMENTS
CREATE TABLE IF NOT EXISTS emp_departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  head TEXT DEFAULT '',
  description TEXT DEFAULT '',
  employee_count INT DEFAULT 0,
  avg_performance NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. EMPLOYEES
CREATE TABLE IF NOT EXISTS emp_employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT DEFAULT '',
  role TEXT DEFAULT '',
  department_id UUID REFERENCES emp_departments(id) ON DELETE SET NULL,
  department TEXT DEFAULT '',
  location TEXT DEFAULT '',
  date_of_joining DATE,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Joined','Pending','Offer Sent','Rejected','On Hold')),
  mentor TEXT DEFAULT '',
  onboarding_coordinator TEXT DEFAULT '',
  field_coordinator TEXT DEFAULT '',
  college TEXT DEFAULT '',
  interview_notes TEXT DEFAULT '',
  candidate_preferences TEXT DEFAULT '',
  offer_letter_status TEXT DEFAULT 'Not Sent' CHECK (offer_letter_status IN ('Not Sent','Sent','Accepted','Signed')),
  follow_up_comment TEXT DEFAULT '',
  monthly_upload_status BOOLEAN DEFAULT false,
  image_url TEXT DEFAULT '',
  salary NUMERIC(12,2) DEFAULT 0,
  bank_account TEXT DEFAULT '',
  pan_number TEXT DEFAULT '',
  aadhar_number TEXT DEFAULT '',
  emergency_contact TEXT DEFAULT '',
  emergency_phone TEXT DEFAULT '',
  blood_group TEXT DEFAULT '',
  address TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ATTENDANCE
CREATE TABLE IF NOT EXISTS emp_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES emp_employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT DEFAULT 'Present' CHECK (status IN ('Present','Absent','Half Day','On Leave','Late','Work From Home')),
  hours_worked NUMERIC(4,2) DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- 4. LEAVES
CREATE TABLE IF NOT EXISTS emp_leaves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES emp_employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('Casual','Sick','Earned','Maternity','Paternity','Unpaid','Compensatory')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INT DEFAULT 1,
  reason TEXT DEFAULT '',
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected','Cancelled')),
  approved_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. PAYROLL
CREATE TABLE IF NOT EXISTS emp_payroll (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES emp_employees(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  year INT NOT NULL,
  basic_salary NUMERIC(12,2) DEFAULT 0,
  hra NUMERIC(12,2) DEFAULT 0,
  da NUMERIC(12,2) DEFAULT 0,
  ta NUMERIC(12,2) DEFAULT 0,
  bonus NUMERIC(12,2) DEFAULT 0,
  deductions NUMERIC(12,2) DEFAULT 0,
  pf NUMERIC(12,2) DEFAULT 0,
  tax NUMERIC(12,2) DEFAULT 0,
  net_salary NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending','Processed','Paid','On Hold')),
  payment_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, month, year)
);

-- 6. DOCUMENTS
CREATE TABLE IF NOT EXISTS emp_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES emp_employees(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  file_url TEXT NOT NULL,
  file_type TEXT DEFAULT '',
  file_size INT DEFAULT 0,
  cloudinary_public_id TEXT DEFAULT '',
  category TEXT DEFAULT 'General' CHECK (category IN ('General','ID Proof','Address Proof','Education','Experience','Offer Letter','Contract','Policy','Other')),
  uploaded_by TEXT DEFAULT '',
  is_company_doc BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS emp_announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'Normal' CHECK (priority IN ('Low','Normal','High','Urgent')),
  author TEXT DEFAULT '',
  department TEXT DEFAULT 'All',
  is_pinned BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS emp_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT DEFAULT 'info' CHECK (type IN ('approval','performance','onboarding','access','risk','enquiry','info','leave','payroll','document','announcement')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  action_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. ACTIVITY LOG
CREATE TABLE IF NOT EXISTS emp_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  description TEXT DEFAULT '',
  performed_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. MENTORS
CREATE TABLE IF NOT EXISTS emp_mentors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT DEFAULT '',
  email TEXT DEFAULT '',
  assigned_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ENABLE REALTIME on all emp_ tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE emp_departments;
ALTER PUBLICATION supabase_realtime ADD TABLE emp_employees;
ALTER PUBLICATION supabase_realtime ADD TABLE emp_attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE emp_leaves;
ALTER PUBLICATION supabase_realtime ADD TABLE emp_payroll;
ALTER PUBLICATION supabase_realtime ADD TABLE emp_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE emp_announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE emp_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE emp_activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE emp_mentors;

-- ============================================================
-- ROW LEVEL SECURITY (permissive for service role, read for anon)
-- ============================================================
ALTER TABLE emp_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_mentors ENABLE ROW LEVEL SECURITY;

-- Allow anon to read and write all emp_ tables (internal portal, no auth needed)
CREATE POLICY IF NOT EXISTS "emp_departments_all" ON emp_departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "emp_employees_all" ON emp_employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "emp_attendance_all" ON emp_attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "emp_leaves_all" ON emp_leaves FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "emp_payroll_all" ON emp_payroll FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "emp_documents_all" ON emp_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "emp_announcements_all" ON emp_announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "emp_notifications_all" ON emp_notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "emp_activity_log_all" ON emp_activity_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "emp_mentors_all" ON emp_mentors FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_emp_employees_dept ON emp_employees(department_id);
CREATE INDEX IF NOT EXISTS idx_emp_employees_status ON emp_employees(status);
CREATE INDEX IF NOT EXISTS idx_emp_attendance_emp ON emp_attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_attendance_date ON emp_attendance(date);
CREATE INDEX IF NOT EXISTS idx_emp_leaves_emp ON emp_leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_leaves_status ON emp_leaves(status);
CREATE INDEX IF NOT EXISTS idx_emp_payroll_emp ON emp_payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_documents_emp ON emp_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_notifications_read ON emp_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_emp_activity_log_created ON emp_activity_log(created_at DESC);
`;
