"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Check, ChevronRight, ChevronLeft, User, BookOpen, Users, FileText, IndianRupee, Save } from "lucide-react"
import { useRealtimeTable } from "@/lib/use-realtime"
import type { EmpDepartment, EmpMentor, EmpCoordinator, EmpEmployee } from "@/lib/emp-types"
import { useAuth } from "@/lib/auth-context"

const STEPS = [
  { id: 1, title: 'Basic Info', icon: User },
  { id: 2, title: 'Academic', icon: BookOpen },
  { id: 3, title: 'Assignments', icon: Users },
  { id: 4, title: 'Training', icon: FileText },
  { id: 5, title: 'Value Setup', icon: IndianRupee },
  { id: 6, title: 'Review', icon: Save },
]

export default function AddEmployeePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const empRole = (user as any)?.empRole

  const { data: deptRows } = useRealtimeTable<EmpDepartment>("emp_departments", "name", true)
  const { data: mentors } = useRealtimeTable<EmpMentor>("emp_mentors")
  const { data: coordinators } = useRealtimeTable<EmpCoordinator>("emp_coordinators")
  const { data: employees } = useRealtimeTable<EmpEmployee>("emp_employees")

  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    // Step 1
    name: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    location: "",
    date_of_joining: new Date().toISOString().split("T")[0],
    login_email: "",
    login_password: "",
    
    // Step 2
    college: "",
    interview_notes: "",
    candidate_preferences: "",
    
    // Step 3
    mentor_id: "",
    onboarding_coordinator_id: "",
    field_coordinator_id: "",
    buddy_partner_id: "",
    
    // Step 4
    offer_letter_url: "",
    offer_letter_terms: "",
    pre_joining_training: false,
    training_intern_name: "",
    training_duration_days: 0,
    training_notes: "",
    training_effectiveness: 0,
    
    // Step 5 (Super Admin only typically, but we'll collect it if provided)
    cost_to_company: 0,
    expected_revenue_type: "None",
    rate_per_unit: 0,
    expected_units_per_month: 0,
    value_notes: ""
  })

  useEffect(() => {
    const mentorId = searchParams.get("mentorId")
    if (mentorId) {
      setForm((f) => ({ ...f, mentor_id: mentorId }))
    }
  }, [searchParams])

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }))

  const validateStep = () => {
    if (step === 1) {
      if (!form.name || !form.role || !form.login_email || !form.login_password || form.login_password.length < 6) {
        setError("Please fill all required fields in Step 1 (password must be at least 6 characters).")
        return false
      }
    }
    setError("")
    return true
  }

  const nextStep = () => {
    if (validateStep()) setStep(s => Math.min(s + 1, 6))
  }
  const prevStep = () => setStep(s => Math.max(s - 1, 1))

  const submit = async () => {
    if (!validateStep()) return
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/emp/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          status: "Pending",
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to add employee")
        return
      }
      router.push("/dashboard/users")
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-[#1C1917]">Onboard New Employee</h1>
        <p className="text-sm text-[#78716C]">Complete the comprehensive onboarding form. They will start as 'Pending' until fully approved.</p>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-xl border border-[#E8E6E1] p-4 shadow-sm mb-6">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const isActive = step === s.id
            const isCompleted = step > s.id
            return (
              <div key={s.id} className="flex flex-col items-center relative z-10 w-full">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  isActive ? "bg-[#FF6B35] text-white ring-4 ring-[#FFF1EA]" : 
                  isCompleted ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400"
                }`}>
                  {isCompleted ? <Check size={14} /> : <s.icon size={14} />}
                </div>
                <p className={`text-[10px] uppercase tracking-wider font-bold mt-2 ${isActive ? "text-[#FF6B35]" : isCompleted ? "text-emerald-600" : "text-gray-400"}`}>
                  {s.title}
                </p>
                {/* Connecting line */}
                {i < STEPS.length - 1 && (
                  <div className={`absolute top-4 left-[50%] right-[-50%] h-[2px] -z-10 ${isCompleted ? "bg-emerald-500" : "bg-gray-100"}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm min-h-[400px] flex flex-col">
        <div className="p-6 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* STEP 1: Basic Info */}
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-[#1C1917] mb-4">Basic Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Full name *" value={form.name} onChange={(v) => update("name", v)} />
                    <Field label="Work email" value={form.email} onChange={(v) => update("email", v)} type="email" />
                    <Field label="Phone" value={form.phone} onChange={(v) => update("phone", v)} />
                    <Field label="Role *" value={form.role} onChange={(v) => update("role", v)} />
                    <div>
                      <label className="mb-1 block text-sm font-medium">Department</label>
                      <select
                        value={form.department}
                        onChange={(e) => update("department", e.target.value)}
                        className="w-full rounded-lg border border-[#E8E6E1] px-4 py-2 text-sm focus:border-[#FF6B35] outline-none"
                      >
                        <option value="">Select department</option>
                        {deptRows.map((d) => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <Field label="Location" value={form.location} onChange={(v) => update("location", v)} />
                    <Field label="Date of Joining" value={form.date_of_joining} onChange={(v) => update("date_of_joining", v)} type="date" />
                  </div>

                  <hr className="my-6 border-[#E8E6E1]" />
                  <h3 className="text-sm font-bold text-[#1C1917] mb-4">Login Credentials</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Login email *" value={form.login_email} onChange={(v) => update("login_email", v)} type="email" />
                    <div>
                      <label className="mb-1 block text-sm font-medium">Login password *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={form.login_password}
                          onChange={(e) => update("login_password", e.target.value)}
                          className="w-full rounded-lg border border-[#E8E6E1] px-4 py-2 pr-10 text-sm focus:border-[#FF6B35] outline-none"
                        />
                        <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C]">
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Academic & Interview */}
              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-[#1C1917] mb-4">Academic & Interview</h2>
                  <Field label="College / University" value={form.college} onChange={(v) => update("college", v)} />
                  
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#1C1917]">Interview Notes</label>
                    <textarea 
                      value={form.interview_notes}
                      onChange={(e) => update("interview_notes", e.target.value)}
                      className="w-full rounded-lg border border-[#E8E6E1] px-4 py-2 text-sm min-h-[100px] focus:border-[#FF6B35] outline-none"
                      placeholder="Feedback from interviewers, strengths, weaknesses..."
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#1C1917]">Candidate Preferences</label>
                    <textarea 
                      value={form.candidate_preferences}
                      onChange={(e) => update("candidate_preferences", e.target.value)}
                      className="w-full rounded-lg border border-[#E8E6E1] px-4 py-2 text-sm min-h-[100px] focus:border-[#FF6B35] outline-none"
                      placeholder="Shift preferences, relocation constraints, etc."
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Assignment Chain */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-[#1C1917]">Accountability Chain</h2>
                    <p className="text-sm text-[#78716C] mb-4">Assign the 4-person support chain for this employee.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[#1C1917]">Mentor</label>
                      <select value={form.mentor_id} onChange={(e) => update("mentor_id", e.target.value)} className="w-full rounded-lg border border-[#E8E6E1] px-4 py-2 text-sm focus:border-[#FF6B35] outline-none">
                        <option value="">None</option>
                        {mentors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-[#1C1917]">Buddy Partner (Peer)</label>
                      <select value={form.buddy_partner_id} onChange={(e) => update("buddy_partner_id", e.target.value)} className="w-full rounded-lg border border-[#E8E6E1] px-4 py-2 text-sm focus:border-[#FF6B35] outline-none">
                        <option value="">None</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
                      </select>
                    </div>

                    <div className="bg-[#F5F3EF] p-4 rounded-lg border border-[#E8E6E1]">
                      <label className="mb-1 block text-sm font-medium text-[#1C1917]">Onboarding Coordinator</label>
                      <p className="text-xs text-[#78716C] mb-2">Responsible for daily materials until joining</p>
                      <select value={form.onboarding_coordinator_id} onChange={(e) => update("onboarding_coordinator_id", e.target.value)} className="w-full rounded-lg border border-[#E8E6E1] px-4 py-2 text-sm focus:border-[#FF6B35] outline-none">
                        <option value="">None</option>
                        {coordinators.filter(c => c.coordinator_type === 'onboarding').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    <div className="bg-[#F5F3EF] p-4 rounded-lg border border-[#E8E6E1]">
                      <label className="mb-1 block text-sm font-medium text-[#1C1917]">Field Coordinator</label>
                      <p className="text-xs text-[#78716C] mb-2">Responsible for daily updates after joining</p>
                      <select value={form.field_coordinator_id} onChange={(e) => update("field_coordinator_id", e.target.value)} className="w-full rounded-lg border border-[#E8E6E1] px-4 py-2 text-sm focus:border-[#FF6B35] outline-none">
                        <option value="">None</option>
                        {coordinators.filter(c => c.coordinator_type === 'field').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Offer & Training */}
              {step === 4 && (
                <div className="space-y-6">
                  <h2 className="text-lg font-bold text-[#1C1917] mb-4">Offer & Pre-joining Training</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Offer Letter URL (Cloudinary)" value={form.offer_letter_url} onChange={(v) => update("offer_letter_url", v)} />
                    <Field label="Offer Letter Terms" value={form.offer_letter_terms} onChange={(v) => update("offer_letter_terms", v)} />
                  </div>

                  <hr className="border-[#E8E6E1]" />
                  
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={form.pre_joining_training}
                        onChange={(e) => update("pre_joining_training", e.target.checked)}
                        className="w-4 h-4 rounded text-[#FF6B35] focus:ring-[#FF6B35]"
                      />
                      <span className="text-sm font-medium text-[#1C1917]">Requires Pre-joining Training</span>
                    </label>
                  </div>

                  {form.pre_joining_training && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#FFF1EA]/50 p-4 rounded-xl border border-[#FF6B35]/20"
                    >
                      <Field label="Intern Name (If different)" value={form.training_intern_name} onChange={(v) => update("training_intern_name", v)} />
                      
                      <div>
                        <label className="mb-1 block text-sm font-medium text-[#1C1917]">Duration (Days)</label>
                        <input type="number" min="0" value={form.training_duration_days} onChange={(e) => update("training_duration_days", parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-[#E8E6E1] px-4 py-2 text-sm focus:border-[#FF6B35] outline-none" />
                      </div>
                      
                      <div className="col-span-2">
                        <label className="mb-1 block text-sm font-medium text-[#1C1917]">Training Notes</label>
                        <textarea value={form.training_notes} onChange={(e) => update("training_notes", e.target.value)} className="w-full rounded-lg border border-[#E8E6E1] px-4 py-2 text-sm min-h-[80px] focus:border-[#FF6B35] outline-none" />
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* STEP 5: Value Setup */}
              {step === 5 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-[#1C1917]">Revenue & Value Setup</h2>
                    <p className="text-sm text-[#78716C] mb-4">Establish the baseline metrics for tracking this employee's ROI.</p>
                  </div>

                  {empRole !== 'super_admin' && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm mb-4">
                      Note: Value and CTC setups are typically managed by Super Admins. You can skip this step or fill in preliminary data if authorized.
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[#1C1917]">Cost to Company (Annual/Monthly)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]">₹</span>
                        <input type="number" min="0" value={form.cost_to_company} onChange={(e) => update("cost_to_company", parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-[#E8E6E1] pl-8 pr-4 py-2 text-sm focus:border-[#FF6B35] outline-none" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-[#1C1917]">Expected Revenue Type</label>
                      <select value={form.expected_revenue_type} onChange={(e) => update("expected_revenue_type", e.target.value)} className="w-full rounded-lg border border-[#E8E6E1] px-4 py-2 text-sm focus:border-[#FF6B35] outline-none">
                        <option value="None">None</option>
                        <option value="Direct">Direct</option>
                        <option value="Indirect">Indirect</option>
                        <option value="Both">Both</option>
                      </select>
                    </div>

                    {(form.expected_revenue_type === 'Indirect' || form.expected_revenue_type === 'Both') && (
                      <>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-[#1C1917]">Rate per Unit (₹)</label>
                          <input type="number" min="0" value={form.rate_per_unit} onChange={(e) => update("rate_per_unit", parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-[#E8E6E1] px-4 py-2 text-sm focus:border-[#FF6B35] outline-none" />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-[#1C1917]">Expected Units / Month</label>
                          <input type="number" min="0" value={form.expected_units_per_month} onChange={(e) => update("expected_units_per_month", parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-[#E8E6E1] px-4 py-2 text-sm focus:border-[#FF6B35] outline-none" />
                        </div>
                      </>
                    )}

                    <div className="col-span-1 md:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-[#1C1917]">Value Notes</label>
                      <textarea value={form.value_notes} onChange={(e) => update("value_notes", e.target.value)} className="w-full rounded-lg border border-[#E8E6E1] px-4 py-2 text-sm min-h-[80px] focus:border-[#FF6B35] outline-none" placeholder="Rationale behind rate or CTC..." />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: Review */}
              {step === 6 && (
                <div className="space-y-6">
                  <h2 className="text-lg font-bold text-[#1C1917]">Review & Submit</h2>
                  
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-[#78716C] block text-xs uppercase">Name</span> <span className="font-medium">{form.name}</span></div>
                    <div><span className="text-[#78716C] block text-xs uppercase">Role & Dept</span> <span className="font-medium">{form.role} • {form.department}</span></div>
                    <div><span className="text-[#78716C] block text-xs uppercase">Email</span> <span className="font-medium">{form.email || 'N/A'}</span></div>
                    <div><span className="text-[#78716C] block text-xs uppercase">DOJ</span> <span className="font-medium">{form.date_of_joining}</span></div>
                    
                    <div className="col-span-2 mt-2 pt-2 border-t border-gray-200">
                      <span className="text-[#78716C] block text-xs uppercase mb-1">Accountability Chain</span>
                      <div className="flex gap-4">
                        <span className="bg-white px-2 py-1 rounded border text-xs">Mentor: {mentors.find(m => m.id === form.mentor_id)?.name || 'None'}</span>
                        <span className="bg-white px-2 py-1 rounded border text-xs">Buddy: {employees.find(e => e.id === form.buddy_partner_id)?.name || 'None'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-[#E8E6E1] bg-gray-50 flex items-center justify-between rounded-b-xl">
          <button 
            onClick={prevStep}
            disabled={step === 1 || loading}
            className="flex items-center gap-1 text-sm font-medium text-[#78716C] hover:text-[#1C1917] disabled:opacity-30 disabled:hover:text-[#78716C] transition-colors px-3 py-2"
          >
            <ChevronLeft size={16} /> Back
          </button>
          
          <div className="flex items-center gap-4">
            {error && <span className="text-sm text-red-600 font-medium">{error}</span>}
            
            {step < 6 ? (
              <button 
                onClick={nextStep}
                className="flex items-center gap-1 rounded-lg bg-[#1C1917] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2A2724] transition-colors"
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button 
                onClick={submit}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-[#FF6B35] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#FF8C5A] disabled:opacity-60 transition-colors"
              >
                {loading ? "Submitting..." : "Complete Onboarding"} <Save size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = "text" }: { label: string, value: string | number, onChange: (v: any) => void, type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-[#1C1917]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[#E8E6E1] px-4 py-2 text-sm focus:border-[#FF6B35] outline-none transition-colors"
      />
    </div>
  )
}
