export type EmpEmployeeStatus =
  | 'Joined'
  | 'Pending'
  | 'Offer Sent'
  | 'Rejected'
  | 'On Hold'

export interface EmpDepartment {
  id: string
  name: string
  head: string
  description: string
  employee_count: number
  avg_performance: number
  created_at: string
  updated_at: string
}

export interface EmpEmployee {
  id: string
  name: string
  email: string | null
  phone: string
  role: string
  department_id: string | null
  department: string
  location: string
  date_of_joining: string | null
  status: EmpEmployeeStatus
  mentor: string
  // Legacy/Original fields
  onboarding_coordinator: string
  field_coordinator: string
  college: string
  interview_notes: string
  candidate_preferences: string
  candidate_details: string
  offer_letter_status: string
  follow_up_comment: string
  monthly_upload_status: boolean
  image_url: string
  salary: number
  role_change_requested: boolean

  // Accountability chain
  buddy_partner_id: string | null
  mentor_id: string | null
  onboarding_coordinator_id: string | null  // references emp_coordinators
  field_coordinator_id: string | null       // references emp_coordinators

  // Revenue & Value
  cost_to_company: number
  expected_revenue_type: 'None' | 'Direct' | 'Indirect' | 'Both'
  rate_per_unit: number
  expected_units_per_month: number
  value_notes: string

  // Pre-joining training
  pre_joining_training: boolean
  training_intern_name: string
  training_duration_days: number
  training_notes: string
  training_effectiveness: number

  // Offer letter
  offer_letter_url: string
  offer_letter_terms: string

  created_at: string
  updated_at: string
}

export interface EmpNotification {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
  action_url: string
  created_at: string
}

export interface EmpActivityLog {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  description: string
  performed_by: string
  created_at: string
}

export interface EmpMentor {
  id: string
  name: string
  role: string
  email: string
  assigned_count: number
  is_active: boolean
  phone: string
  department: string
  image_url: string
  created_at: string
  updated_at: string
}

export interface EmpCoordinator {
  id: string
  name: string
  email: string
  phone: string
  department: string
  image_url: string
  coordinator_type: 'onboarding' | 'field'
  linked_mentor_id: string | null
  is_active: boolean
  assigned_count: number
  created_at: string
  updated_at: string
}

export interface EmpEnquiry {
  id: string
  subject: string
  message: string
  employee_id: string | null
  department: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  assigned_to: string
  created_at: string
  updated_at: string
}

export interface EmpAccessRequest {
  id: string
  requester_name: string
  requester_email: string
  requested_role: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by: string
  created_at: string
  updated_at: string
}

export interface EmpRole {
  id: string
  name: string
  permissions: string[]
  created_at: string
}

export interface EmpPerformanceDaily {
  id: string
  employee_id: string
  date: string
  score: number
  tasks_completed: number
  tasks_assigned: number
  tasks_assigned_description: string
  tasks_completed_description: string
  notes: string

  rating: number
  remarks: string
  revenue_impact: 'None' | 'Direct' | 'Indirect'
  revenue_amount: number
  trajectory: 'on_track' | 'at_risk' | 'exceeding' | 'needs_improvement'
  submitted_by: string
  is_locked: boolean

  created_at: string
  emp_employees?: { name: string; department: string; role: string }
}

export interface EmpRevenueEntry {
  id: string
  employee_id: string
  month: number
  year: number
  direct_revenue: number
  indirect_revenue: number
  rate_per_unit: number
  units_delivered: number
  notes: string
  created_at: string
  updated_at: string
  emp_employees?: { name: string }
}

export interface EmpAccountabilityLog {
  id: string
  employee_id: string
  responsible_person_id: string | null
  responsible_type: 'mentor' | 'onboarding_coordinator' | 'field_coordinator' | 'buddy'
  task_description: string
  status: 'pending' | 'completed' | 'overdue' | 'covered_by_buddy'
  due_date: string | null
  completed_at: string | null
  covered_by: string
  created_at: string
  emp_employees?: { name: string }
}

export interface EmpCoordinatorTask {
  id: string
  coordinator_id: string
  employee_id: string
  task_type: 'send_module' | 'upload_material' | 'daily_checkin' | 'complete_onboarding' | 'assign_task' | 'other'
  description: string
  status: 'pending' | 'completed' | 'overdue'
  due_date: string | null
  completed_at: string | null
  proof_url: string
  created_at: string
}

export interface EmpTrainingAssignment {
  id: string
  employee_id: string
  module_id: string
  assigned_by: string | null
  assigned_at: string
  status: 'assigned' | 'in_progress' | 'completed' | 'overdue'
  completed_at: string | null
  score: number
}

export interface EmpBuddyActivation {
  id: string
  employee_id: string
  original_responsible_id: string | null
  original_responsible_type: 'mentor' | 'onboarding_coordinator' | 'field_coordinator'
  buddy_id: string | null
  reason: string
  tasks_covered: string
  activated_at: string
  resolved_at: string | null
  status: 'active' | 'resolved'
}

export interface EmpComplaint {
  id: string
  employee_id: string | null
  category: 'general' | 'role_change_request' | 'hr' | 'payroll' | 'leave' | 'operations' | 'other'
  subject: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'escalated'
  resolution: string
  flagged: boolean
  created_at: string
  resolved_at: string | null
}

export interface EmpVariablePayAssessment {
  id: string
  employee_id: string
  assessment_period: string
  avg_monthly_rating: number
  total_revenue_generated: number
  total_cost_to_company: number
  net_value: number
  task_completion_rate: number
  months_on_track: number
  months_at_risk: number
  mentor_remarks: string
  recommended_pay: 'full' | 'partial' | 'none' | 'bonus'
  recommended_amount: number
  approved_by: string
  approved_at: string | null
  created_at: string
}

export interface EmpMentorRegistration {
  id: string
  name: string
  email: string
  phone: string
  password_hash: string
  department: string
  role: string
  image_url: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string
  reviewed_by: string
  created_at: string
  updated_at: string
}

export interface EmpOnboardingModule {
  id: string
  title: string
  description: string
  department: string
  content_url: string
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EmpOnboardingProgress {
  id: string
  employee_id: string
  module_id: string
  percent_complete: number
  status: 'not_started' | 'in_progress' | 'completed'
  completed_at: string | null
  updated_at: string
  emp_employees?: { name: string; department: string }
  emp_onboarding_modules?: { title: string }
}

export interface EmpAssessment {
  id: string
  title: string
  department: string
  pass_score: number
  duration_minutes: number
  status: 'draft' | 'active' | 'archived'
  created_at: string
  updated_at: string
}

export interface EmpAssessmentAttempt {
  id: string
  assessment_id: string
  employee_id: string
  score: number
  passed: boolean
  attempted_at: string
  emp_employees?: { name: string; department: string }
  emp_assessments?: { title: string }
}

export interface EmpDocument {
  id: string
  employee_id: string | null
  title: string
  description: string
  file_url: string
  file_type: string
  file_size: number
  category: string
  uploaded_by: string
  is_company_doc: boolean
  created_at: string
  emp_employees?: { name: string }
}
