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

CREATE TABLE IF NOT EXISTS emp_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT DEFAULT 'info' CHECK (type IN ('approval','performance','onboarding','access','risk','enquiry','info','leave','payroll','document','announcement')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  action_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emp_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  description TEXT DEFAULT '',
  performed_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emp_mentors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT DEFAULT '',
  email TEXT DEFAULT '',
  assigned_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emp_enquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  employee_id UUID REFERENCES emp_employees(id) ON DELETE SET NULL,
  department TEXT DEFAULT '',
  status TEXT DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  assigned_to TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emp_access_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  requested_role TEXT NOT NULL,
  reason TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emp_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emp_role_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES emp_employees(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES emp_roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, role_id)
);

CREATE TABLE IF NOT EXISTS emp_performance_daily (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES emp_employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  score NUMERIC(5,2) DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  tasks_completed INT DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, date)
);

CREATE TABLE IF NOT EXISTS emp_onboarding_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  department TEXT DEFAULT 'All',
  content_url TEXT DEFAULT '',
  order_index INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emp_onboarding_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES emp_employees(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES emp_onboarding_modules(id) ON DELETE CASCADE,
  percent_complete INT DEFAULT 0 CHECK (percent_complete >= 0 AND percent_complete <= 100),
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed')),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, module_id)
);

CREATE TABLE IF NOT EXISTS emp_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT DEFAULT 'All',
  pass_score INT DEFAULT 70,
  duration_minutes INT DEFAULT 30,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','active','archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emp_assessment_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES emp_assessments(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES emp_employees(id) ON DELETE CASCADE,
  score INT DEFAULT 0,
  passed BOOLEAN DEFAULT false,
  attempted_at TIMESTAMPTZ DEFAULT now()
);

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
ALTER TABLE emp_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_performance_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_onboarding_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_assessment_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS emp_departments_all ON emp_departments;
CREATE POLICY emp_departments_all ON emp_departments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS emp_employees_all ON emp_employees;
CREATE POLICY emp_employees_all ON emp_employees FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS emp_attendance_all ON emp_attendance;
CREATE POLICY emp_attendance_all ON emp_attendance FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS emp_leaves_all ON emp_leaves;
CREATE POLICY emp_leaves_all ON emp_leaves FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS emp_payroll_all ON emp_payroll;
CREATE POLICY emp_payroll_all ON emp_payroll FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS emp_documents_all ON emp_documents;
CREATE POLICY emp_documents_all ON emp_documents FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS emp_announcements_all ON emp_announcements;
CREATE POLICY emp_announcements_all ON emp_announcements FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS emp_notifications_all ON emp_notifications;
CREATE POLICY emp_notifications_all ON emp_notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS emp_activity_log_all ON emp_activity_log;
CREATE POLICY emp_activity_log_all ON emp_activity_log FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS emp_mentors_all ON emp_mentors;
CREATE POLICY emp_mentors_all ON emp_mentors FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS emp_enquiries_all ON emp_enquiries;
CREATE POLICY emp_enquiries_all ON emp_enquiries FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS emp_access_requests_all ON emp_access_requests;
CREATE POLICY emp_access_requests_all ON emp_access_requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS emp_roles_all ON emp_roles;
CREATE POLICY emp_roles_all ON emp_roles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS emp_role_assignments_all ON emp_role_assignments;
CREATE POLICY emp_role_assignments_all ON emp_role_assignments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS emp_performance_daily_all ON emp_performance_daily;
CREATE POLICY emp_performance_daily_all ON emp_performance_daily FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS emp_onboarding_modules_all ON emp_onboarding_modules;
CREATE POLICY emp_onboarding_modules_all ON emp_onboarding_modules FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS emp_onboarding_progress_all ON emp_onboarding_progress;
CREATE POLICY emp_onboarding_progress_all ON emp_onboarding_progress FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS emp_assessments_all ON emp_assessments;
CREATE POLICY emp_assessments_all ON emp_assessments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS emp_assessment_attempts_all ON emp_assessment_attempts;
CREATE POLICY emp_assessment_attempts_all ON emp_assessment_attempts FOR ALL USING (true) WITH CHECK (true);

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
CREATE INDEX IF NOT EXISTS idx_emp_enquiries_status ON emp_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_emp_access_requests_status ON emp_access_requests(status);
CREATE INDEX IF NOT EXISTS idx_emp_performance_daily_date ON emp_performance_daily(date);
CREATE INDEX IF NOT EXISTS idx_emp_onboarding_progress_emp ON emp_onboarding_progress(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_assessment_attempts_score ON emp_assessment_attempts(score DESC);

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'emp_departments',
    'emp_employees',
    'emp_attendance',
    'emp_leaves',
    'emp_payroll',
    'emp_documents',
    'emp_announcements',
    'emp_notifications',
    'emp_activity_log',
    'emp_mentors',
    'emp_enquiries',
    'emp_access_requests',
    'emp_roles',
    'emp_role_assignments',
    'emp_performance_daily',
    'emp_onboarding_modules',
    'emp_onboarding_progress',
    'emp_assessments',
    'emp_assessment_attempts'
  ]
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    EXCEPTION
      WHEN OTHERS THEN
        NULL;
    END;
  END LOOP;
END $$;
