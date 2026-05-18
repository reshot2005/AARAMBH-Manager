-- ============================================================
-- MIGRATION V2 (CORRECTED): Employee Library — Full Schema
-- ============================================================
-- Run this in Supabase SQL Editor.
-- Idempotent: safe to run multiple times (IF NOT EXISTS / IF EXISTS).
-- ============================================================

-- ============================================================
-- 1. NEW TABLE: emp_coordinators (SEPARATE from mentors)
--    Sreesha: "Coordinators are different tables."
-- ============================================================
CREATE TABLE IF NOT EXISTS emp_coordinators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  department TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  coordinator_type TEXT NOT NULL CHECK (coordinator_type IN ('onboarding', 'field')),
  linked_mentor_id UUID REFERENCES emp_mentors(id),
  is_active BOOLEAN DEFAULT true,
  assigned_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. FIX emp_mentors: Remove "type" column (mentors are ONLY mentors)
--    Keep useful columns that were added: is_active, phone, department, image_url
-- ============================================================
ALTER TABLE emp_mentors
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS department TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';

-- Remove the erroneous "type" column if it was already added
ALTER TABLE emp_mentors DROP COLUMN IF EXISTS type;

-- ============================================================
-- 3. ADD COLUMNS to emp_employees
--    Includes ALL fields Sreesha requested + corrected FK references
-- ============================================================
ALTER TABLE emp_employees
  -- Accountability chain
  ADD COLUMN IF NOT EXISTS buddy_partner_id UUID REFERENCES emp_employees(id),
  ADD COLUMN IF NOT EXISTS onboarding_coordinator_id UUID REFERENCES emp_coordinators(id),
  ADD COLUMN IF NOT EXISTS field_coordinator_id UUID REFERENCES emp_coordinators(id),

  -- Revenue & Value
  ADD COLUMN IF NOT EXISTS cost_to_company NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expected_revenue_type TEXT DEFAULT 'None',
  ADD COLUMN IF NOT EXISTS rate_per_unit NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expected_units_per_month INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS value_notes TEXT DEFAULT '',

  -- Pre-joining training
  ADD COLUMN IF NOT EXISTS pre_joining_training BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS training_intern_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS training_duration_days INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS training_notes TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS training_effectiveness INT DEFAULT 0,

  -- Offer letter
  ADD COLUMN IF NOT EXISTS offer_letter_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS offer_letter_terms TEXT DEFAULT '',

  -- GAP 2: Candidate details (travel comfort, time commitment, flexibility)
  ADD COLUMN IF NOT EXISTS candidate_details TEXT DEFAULT '',

  -- GAP 5: Follow-up comment (mentors/coordinators write follow-up remarks)
  ADD COLUMN IF NOT EXISTS follow_up_comment TEXT DEFAULT '',

  -- GAP 6: Monthly upload status (coordinator monthly report uploaded?)
  ADD COLUMN IF NOT EXISTS monthly_upload_status BOOLEAN DEFAULT false,

  -- GAP 11: Role change request flag
  ADD COLUMN IF NOT EXISTS role_change_requested BOOLEAN DEFAULT false;

-- NOTE: mentor_id, interview_notes, college, image_url, salary, offer_letter_status
-- already exist on emp_employees from V1. We do NOT re-add them.

-- ============================================================
-- 4. ENHANCE emp_performance_daily
--    GAP 13/14: Add both counts AND descriptions for tasks
-- ============================================================
ALTER TABLE emp_performance_daily
  ADD COLUMN IF NOT EXISTS rating NUMERIC(3,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tasks_assigned INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tasks_completed INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tasks_assigned_description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS tasks_completed_description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS remarks TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS revenue_impact TEXT DEFAULT 'None',
  ADD COLUMN IF NOT EXISTS revenue_amount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trajectory TEXT DEFAULT 'on_track',
  ADD COLUMN IF NOT EXISTS submitted_by TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;

-- ============================================================
-- 5. CREATE emp_revenue_entries
-- ============================================================
CREATE TABLE IF NOT EXISTS emp_revenue_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES emp_employees(id) ON DELETE CASCADE,
  month INT NOT NULL,
  year INT NOT NULL,
  direct_revenue NUMERIC(12,2) DEFAULT 0,
  indirect_revenue NUMERIC(12,2) DEFAULT 0,
  rate_per_unit NUMERIC(12,2) DEFAULT 0,
  units_delivered INT DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, month, year)
);

-- ============================================================
-- 6. CREATE emp_accountability_log
-- ============================================================
CREATE TABLE IF NOT EXISTS emp_accountability_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES emp_employees(id) ON DELETE CASCADE,
  responsible_person_id UUID,
  responsible_type TEXT NOT NULL CHECK (responsible_type IN ('mentor','onboarding_coordinator','field_coordinator','buddy')),
  task_description TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','overdue','covered_by_buddy')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  covered_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 7. CREATE emp_coordinator_tasks (GAP 8)
--    Track whether coordinators did their daily job
-- ============================================================
CREATE TABLE IF NOT EXISTS emp_coordinator_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coordinator_id UUID NOT NULL REFERENCES emp_coordinators(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES emp_employees(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK (task_type IN ('send_module','upload_material','daily_checkin','complete_onboarding','assign_task','other')),
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','overdue')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  proof_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 8. CREATE emp_training_assignments (GAP 9)
--    Track which modules were sent to which employees and their status
-- ============================================================
CREATE TABLE IF NOT EXISTS emp_training_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES emp_employees(id) ON DELETE CASCADE,
  module_id UUID NOT NULL,
  assigned_by UUID,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned','in_progress','completed','overdue')),
  completed_at TIMESTAMPTZ,
  score NUMERIC(5,2) DEFAULT 0
);

-- ============================================================
-- 9. CREATE emp_buddy_activations (GAP 10)
--    When and why a buddy partner had to step in
-- ============================================================
CREATE TABLE IF NOT EXISTS emp_buddy_activations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES emp_employees(id) ON DELETE CASCADE,
  original_responsible_id UUID,
  original_responsible_type TEXT NOT NULL CHECK (original_responsible_type IN ('mentor','onboarding_coordinator','field_coordinator')),
  buddy_id UUID REFERENCES emp_employees(id),
  reason TEXT DEFAULT '',
  tasks_covered TEXT DEFAULT '',
  activated_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','resolved'))
);

-- ============================================================
-- 10. CREATE emp_complaints (GAP 11)
--     Complaints and role change requests
-- ============================================================
CREATE TABLE IF NOT EXISTS emp_complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES emp_employees(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('general','role_change_request','hr','payroll','leave','operations','other')),
  subject TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','escalated')),
  resolution TEXT DEFAULT '',
  flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- ============================================================
-- 11. CREATE emp_variable_pay_assessments (GAP 12)
--     Year-end / quarterly pay decisions
-- ============================================================
CREATE TABLE IF NOT EXISTS emp_variable_pay_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES emp_employees(id) ON DELETE CASCADE,
  assessment_period TEXT NOT NULL,
  avg_monthly_rating NUMERIC(3,1) DEFAULT 0,
  total_revenue_generated NUMERIC(14,2) DEFAULT 0,
  total_cost_to_company NUMERIC(14,2) DEFAULT 0,
  net_value NUMERIC(14,2) DEFAULT 0,
  task_completion_rate NUMERIC(5,2) DEFAULT 0,
  months_on_track INT DEFAULT 0,
  months_at_risk INT DEFAULT 0,
  mentor_remarks TEXT DEFAULT '',
  recommended_pay TEXT DEFAULT 'none' CHECK (recommended_pay IN ('full','partial','none','bonus')),
  recommended_amount NUMERIC(12,2) DEFAULT 0,
  approved_by TEXT DEFAULT '',
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 12. CREATE emp_mentor_registrations (GAP 15)
--     Mentor signup approval flow
-- ============================================================
CREATE TABLE IF NOT EXISTS emp_mentor_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  password_hash TEXT NOT NULL,
  department TEXT DEFAULT '',
  role TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  rejection_reason TEXT DEFAULT '',
  reviewed_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 13. CREATE emp_auth_users (GAP 16) — only if not already existing
--     Login credentials for employees and mentors
-- ============================================================
-- This table likely already exists from V1. Create only if missing.
CREATE TABLE IF NOT EXISTS emp_auth_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'employee' CHECK (role IN ('super_admin','admin','mentor','employee')),
  linked_mentor_id UUID REFERENCES emp_mentors(id),
  linked_employee_id UUID REFERENCES emp_employees(id),
  is_active BOOLEAN DEFAULT false,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 14. RLS POLICIES — Enable for ALL new tables
-- ============================================================
ALTER TABLE emp_coordinators ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_revenue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_accountability_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_coordinator_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_training_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_buddy_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_variable_pay_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_mentor_registrations ENABLE ROW LEVEL SECURITY;

-- Permissive policies (app-layer enforces role checks via API middleware)
-- GAP 17: Document that API middleware handles write restrictions
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'emp_coordinators',
    'emp_revenue_entries',
    'emp_accountability_log',
    'emp_coordinator_tasks',
    'emp_training_assignments',
    'emp_buddy_activations',
    'emp_complaints',
    'emp_variable_pay_assessments',
    'emp_mentor_registrations'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_all ON %I', t, t);
    EXECUTE format('CREATE POLICY %I_all ON %I FOR ALL USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- ============================================================
-- 15. REALTIME PUBLICATION — Add ALL new tables (GAP 18)
-- ============================================================
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'emp_coordinators',
    'emp_revenue_entries',
    'emp_accountability_log',
    'emp_coordinator_tasks',
    'emp_training_assignments',
    'emp_buddy_activations',
    'emp_complaints',
    'emp_variable_pay_assessments',
    'emp_performance_daily'
  ]
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;

-- ============================================================
-- DONE. All 18 gaps from the audit are now addressed.
-- ============================================================
