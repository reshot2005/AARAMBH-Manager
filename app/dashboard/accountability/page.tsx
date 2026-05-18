"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldAlert, AlertTriangle, CheckCircle2, Lock, FileText, Download } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRealtimeTable } from "@/lib/use-realtime"
import type { EmpAccountabilityLog, EmpEmployee, EmpMentor, EmpCoordinator } from "@/lib/emp-types"
import { avatarColor, initials } from "@/lib/emp-utils"
import type { EmpRole } from "@/lib/emp-session"

export default function AccountabilityAuditPage() {
  const { user } = useAuth()
  const empRole = (user as any)?.empRole as EmpRole | undefined

  const { data: logs, loading: logLoading } = useRealtimeTable<EmpAccountabilityLog>("emp_accountability_log")
  const { data: employees, loading: empLoading } = useRealtimeTable<EmpEmployee>("emp_employees")
  const { data: mentors, loading: mentorLoading } = useRealtimeTable<EmpMentor>("emp_mentors")
  const { data: coordinators } = useRealtimeTable<EmpCoordinator>("emp_coordinators")

  const [dateStr, setDateStr] = useState(() => new Date().toISOString().split("T")[0])

  if (empRole !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-red-50 p-4 mb-4">
          <Lock className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-[#1C1917]">Access Restricted</h2>
        <p className="mt-2 text-sm text-[#78716C] max-w-sm">
          The Accountability Audit is restricted to Super Administrators.
        </p>
      </div>
    )
  }

  // Derive today's expected accountability tasks based on employee statuses and assignments
  const auditData = useMemo(() => {
    const todayLogs = logs.filter(l => l.due_date === dateStr)
    const auditItems: any[] = []

    employees.forEach(emp => {
      if (emp.status === "Rejected") return;

      // Mentors should rate daily
      if (emp.mentor_id) {
        const mentor = mentors.find(m => m.id === emp.mentor_id)
        const mentorLog = todayLogs.find(l => l.employee_id === emp.id && l.responsible_type === 'mentor')
        auditItems.push({
          id: `mentor-${emp.id}`,
          empName: emp.name,
          responsiblePerson: mentor?.name || "Unknown Mentor",
          role: 'Mentor',
          task: 'Daily Performance Rating',
          status: mentorLog?.status || 'pending',
          coveredBy: mentorLog?.covered_by || null
        })
      }

      // Onboarding Coordinators should send materials daily for non-joined employees
      if (emp.onboarding_coordinator_id && emp.status !== 'Joined') {
        const coord = coordinators.find(c => c.id === emp.onboarding_coordinator_id)
        const coordLog = todayLogs.find(l => l.employee_id === emp.id && l.responsible_type === 'onboarding_coordinator')
        auditItems.push({
          id: `onboarding-${emp.id}`,
          empName: emp.name,
          responsiblePerson: coord?.name || "Unknown Coordinator",
          role: 'Onboarding Coord',
          task: 'Send Daily Materials',
          status: coordLog?.status || 'pending',
          coveredBy: coordLog?.covered_by || null
        })
      }

      // Field Coordinators should upload updates daily for joined employees
      if (emp.field_coordinator_id && emp.status === 'Joined') {
        const coord = coordinators.find(c => c.id === emp.field_coordinator_id)
        const coordLog = todayLogs.find(l => l.employee_id === emp.id && l.responsible_type === 'field_coordinator')
        auditItems.push({
          id: `field-${emp.id}`,
          empName: emp.name,
          responsiblePerson: coord?.name || "Unknown Coordinator",
          role: 'Field Coord',
          task: 'Daily Field Update',
          status: coordLog?.status || 'pending',
          coveredBy: coordLog?.covered_by || null
        })
      }
    })

    return auditItems
  }, [logs, employees, mentors, coordinators, dateStr])

  const pendingCount = auditData.filter(i => i.status === 'pending' || i.status === 'overdue').length
  const coveredCount = auditData.filter(i => i.status === 'covered_by_buddy').length

  if (logLoading || empLoading || mentorLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF6B35] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1C1917]">Accountability Audit</h1>
          <p className="text-sm text-[#78716C]">
            Detect single-point failures and audit daily responsibilities across the chain.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <input 
            type="date" 
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="rounded-lg border border-[#E8E6E1] bg-white px-3 py-2 text-sm text-[#1C1917] outline-none focus:ring-2 focus:ring-[#FF8C5A]/40"
          />
          <button className="flex items-center gap-2 rounded-lg border border-[#E8E6E1] bg-white px-4 py-2 text-sm font-medium text-[#1C1917] hover:bg-[#F5F3EF]">
            <Download size={15} /> Export Log
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-red-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#78716C]">Pending/Overdue Tasks</p>
              <p className="text-xl font-bold text-[#1C1917]">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <ShieldAlert className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#78716C]">Buddy Stepped In</p>
              <p className="text-xl font-bold text-[#1C1917]">{coveredCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-emerald-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#78716C]">Compliance Rate</p>
              <p className="text-xl font-bold text-[#1C1917]">
                {auditData.length > 0 ? Math.round(((auditData.length - pendingCount) / auditData.length) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E8E6E1] bg-[#F9FAFB] flex items-center justify-between">
          <h2 className="font-semibold text-[#1C1917] flex items-center gap-2">
            <FileText size={16} className="text-[#FF6B35]"/> Daily Accountability Checklist
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F5F3EF] border-b border-[#E8E6E1]">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-[#78716C]">Employee</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#78716C]">Responsible Person</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#78716C]">Role</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#78716C]">Expected Task</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#78716C]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence>
                {auditData.map((item, i) => (
                  <motion.tr 
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-[#F5F3EF]/50"
                  >
                    <td className="px-6 py-3">
                      <span className="text-sm font-medium text-[#1C1917]">{item.empName}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-[#1C1917]">{item.responsiblePerson}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs text-[#78716C] bg-gray-100 px-2 py-1 rounded-md">{item.role}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-[#1C1917]">{item.task}</span>
                    </td>
                    <td className="px-6 py-3">
                      {item.status === 'completed' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={12} /> Completed
                        </span>
                      )}
                      {(item.status === 'pending' || item.status === 'overdue') && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 border border-red-200">
                          <AlertTriangle size={12} /> Pending Action
                        </span>
                      )}
                      {item.status === 'covered_by_buddy' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
                          <ShieldAlert size={12} /> Covered by Buddy: {item.coveredBy}
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {auditData.length === 0 && (
            <div className="py-16 text-center text-sm text-[#78716C]">
              No accountability tasks expected for this date.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
