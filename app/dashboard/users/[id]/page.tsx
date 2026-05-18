"use client"

import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, Mail, Phone, MapPin, Building2, Calendar, 
  Briefcase, IndianRupee, TrendingUp, CheckCircle2, AlertTriangle, 
  User, GraduationCap, Link as LinkIcon, FileText
} from "lucide-react"
import { useRealtimeTable } from "@/lib/use-realtime"
import type { EmpEmployee, EmpPerformanceDaily, EmpRevenueEntry, EmpMentor, EmpCoordinator } from "@/lib/emp-types"
import { avatarColor, initials } from "@/lib/emp-utils"
import Link from "next/link"

export default function EmployeeProfilePage() {
  const params = useParams()
  const router = useRouter()
  const empId = params.id as string

  const { data: employees, loading: empLoading } = useRealtimeTable<EmpEmployee>("emp_employees")
  const { data: performance } = useRealtimeTable<EmpPerformanceDaily>("emp_performance_daily")
  const { data: revenues } = useRealtimeTable<EmpRevenueEntry>("emp_revenue_entries")
  const { data: mentors } = useRealtimeTable<EmpMentor>("emp_mentors")
  const { data: coordinators } = useRealtimeTable<EmpCoordinator>("emp_coordinators")

  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'revenue'>('overview')

  const employee = useMemo(() => employees.find(e => e.id === empId), [employees, empId])

  const empPerformance = useMemo(() => {
    return performance
      .filter(p => p.employee_id === empId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [performance, empId])

  const empRevenue = useMemo(() => {
    return revenues
      .filter(r => r.employee_id === empId)
      .sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year
        return b.month - a.month
      })
  }, [revenues, empId])

  const mentor = useMemo(() => mentors.find(m => m.id === employee?.mentor_id), [mentors, employee])
  const onbCoord = useMemo(() => coordinators.find(c => c.id === employee?.onboarding_coordinator_id), [coordinators, employee])
  const fieldCoord = useMemo(() => coordinators.find(c => c.id === employee?.field_coordinator_id), [coordinators, employee])
  const buddy = useMemo(() => employees.find(e => e.id === employee?.buddy_partner_id), [employees, employee])

  const metrics = useMemo(() => {
    // Performance metrics
    let totalScore = 0
    let totalTasksAssigned = 0
    let totalTasksCompleted = 0
    
    // Use last 30 days for averages
    const last30Days = empPerformance.slice(0, 30)
    last30Days.forEach(p => {
      totalScore += Number(p.rating || 0)
      totalTasksAssigned += Number(p.tasks_assigned || 0)
      totalTasksCompleted += Number(p.tasks_completed || 0)
    })

    // Revenue metrics
    let ytdDirect = 0
    let ytdIndirect = 0
    const currentYear = new Date().getFullYear()
    
    empRevenue.filter(r => r.year === currentYear).forEach(r => {
      ytdDirect += Number(r.direct_revenue || 0)
      ytdIndirect += Number(r.indirect_revenue || 0)
    })

    return {
      avgRating: last30Days.length > 0 ? (totalScore / last30Days.length).toFixed(1) : 'N/A',
      taskRate: totalTasksAssigned > 0 ? Math.round((totalTasksCompleted / totalTasksAssigned) * 100) : 0,
      ytdRevenue: ytdDirect + ytdIndirect,
      netValue: (ytdDirect + ytdIndirect) - Number(employee?.cost_to_company || 0) // rough estimation, assuming CTC is annual or total YTD
    }
  }, [empPerformance, empRevenue, employee])

  if (empLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF6B35] border-t-transparent" />
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-xl font-bold text-[#1C1917]">Employee Not Found</h2>
        <button onClick={() => router.back()} className="mt-4 text-[#FF6B35] hover:underline">Go Back</button>
      </div>
    )
  }

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Top Header Navigation */}
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-sm text-[#78716C] hover:text-[#1C1917] transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Main Profile Header */}
      <div className="bg-white rounded-2xl border border-[#E8E6E1] p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-6 md:items-center">
        <div className={`h-24 w-24 shrink-0 rounded-full ${avatarColor(employee.id)} flex items-center justify-center text-3xl font-bold text-white shadow-md`}>
          {initials(employee.name)}
        </div>
        
        <div className="flex-1 space-y-3">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1C1917]">{employee.name}</h1>
              <p className="text-sm font-medium text-[#FF6B35] mt-1">{employee.role} • {employee.department}</p>
            </div>
            
            <span className={`inline-flex items-center self-start rounded-full px-3 py-1 text-xs font-bold ${
              employee.status === 'Joined' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              employee.status === 'Rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
              'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {employee.status}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#78716C]">
            <div className="flex items-center gap-1.5"><Mail size={14} /> {employee.email || "No email"}</div>
            <div className="flex items-center gap-1.5"><Phone size={14} /> {employee.phone}</div>
            {employee.location && <div className="flex items-center gap-1.5"><MapPin size={14} /> {employee.location}</div>}
            {employee.date_of_joining && <div className="flex items-center gap-1.5"><Calendar size={14} /> Joined {employee.date_of_joining}</div>}
          </div>
        </div>
      </div>

      {/* Assignment Chain */}
      <div>
        <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider mb-3 px-1">Accountability Chain</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Mentor', name: mentor?.name, role: mentor?.department },
            { label: 'Onboarding Coord', name: onbCoord?.name, role: onbCoord?.department },
            { label: 'Field Coord', name: fieldCoord?.name, role: fieldCoord?.department },
            { label: 'Buddy Partner', name: buddy?.name, role: buddy?.department }
          ].map((chain, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#E8E6E1] p-4 flex flex-col justify-center">
              <p className="text-xs font-medium text-[#78716C] mb-1">{chain.label}</p>
              {chain.name ? (
                <>
                  <p className="text-sm font-bold text-[#1C1917]">{chain.name}</p>
                  <p className="text-[10px] text-[#78716C] mt-0.5">{chain.role || "Unknown Dept"}</p>
                </>
              ) : (
                <p className="text-sm text-gray-400 italic">Not assigned</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E8E6E1] flex gap-6 px-2">
        {(['overview', 'performance', 'revenue'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab 
                ? "border-[#FF6B35] text-[#FF6B35]" 
                : "border-transparent text-[#78716C] hover:text-[#1C1917]"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div className="bg-white rounded-xl border border-[#E8E6E1] p-6 shadow-sm">
                  <h3 className="text-base font-bold text-[#1C1917] flex items-center gap-2 mb-4">
                    <GraduationCap size={18} className="text-[#FF6B35]" /> Academic & Interview Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-[#78716C] uppercase">College / University</p>
                      <p className="text-sm text-[#1C1917] mt-1">{employee.college || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#78716C] uppercase">Interview Notes</p>
                      <p className="text-sm text-[#1C1917] mt-1 bg-gray-50 p-3 rounded-lg border border-gray-100 min-h-[60px]">
                        {employee.interview_notes || "No interview notes recorded."}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#78716C] uppercase">Candidate Preferences</p>
                      <p className="text-sm text-[#1C1917] mt-1 bg-gray-50 p-3 rounded-lg border border-gray-100 min-h-[60px]">
                        {employee.candidate_preferences || "No preferences recorded."}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#78716C] uppercase">Candidate Details</p>
                      <p className="text-sm text-[#1C1917] mt-1 bg-gray-50 p-3 rounded-lg border border-gray-100 min-h-[60px]">
                        {employee.candidate_details || "No candidate details recorded."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-[#E8E6E1] p-6 shadow-sm">
                  <h3 className="text-base font-bold text-[#1C1917] flex items-center gap-2 mb-4">
                    <Briefcase size={18} className="text-[#FF6B35]" /> Training & Onboarding
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-[#78716C] uppercase">Pre-joining Training</p>
                      <p className="text-sm text-[#1C1917] mt-1 font-medium">
                        {employee.pre_joining_training ? 'Yes' : 'No'}
                      </p>
                    </div>
                    {employee.pre_joining_training && (
                      <>
                        <div>
                          <p className="text-xs font-medium text-[#78716C] uppercase">Training Duration</p>
                          <p className="text-sm text-[#1C1917] mt-1">{employee.training_duration_days} days</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-[#78716C] uppercase">Intern Name</p>
                          <p className="text-sm text-[#1C1917] mt-1">{employee.training_intern_name}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-[#78716C] uppercase">Effectiveness (1-10)</p>
                          <p className="text-sm text-[#1C1917] mt-1 font-bold">{employee.training_effectiveness}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs font-medium text-[#78716C] uppercase">Training Notes</p>
                          <p className="text-sm text-[#1C1917] mt-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            {employee.training_notes || "No notes."}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-[#E8E6E1] p-6 shadow-sm">
                  <h3 className="text-base font-bold text-[#1C1917] flex items-center gap-2 mb-4">
                    <FileText size={18} className="text-[#FF6B35]" /> Documents
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <p className="text-xs font-medium text-[#1C1917]">Offer Letter</p>
                        <p className="text-[10px] text-[#78716C] mt-0.5">Status: {employee.offer_letter_status || "Pending"}</p>
                      </div>
                      {employee.offer_letter_url ? (
                        <a href={employee.offer_letter_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs flex items-center gap-1">
                          <LinkIcon size={12} /> View
                        </a>
                      ) : (
                        <span className="text-[10px] text-gray-400">Not uploaded</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-[#E8E6E1] p-5 shadow-sm flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#78716C] uppercase tracking-wider">Avg Rating (30d)</p>
                    <p className="text-2xl font-bold text-[#1C1917]">{metrics.avgRating} <span className="text-sm font-normal text-gray-400">/ 10</span></p>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl border border-[#E8E6E1] p-5 shadow-sm flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#78716C] uppercase tracking-wider">Task Completion</p>
                    <p className="text-2xl font-bold text-[#1C1917]">{metrics.taskRate}%</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-[#E8E6E1] p-5 shadow-sm flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#78716C] uppercase tracking-wider">Current Trajectory</p>
                    <p className="text-lg font-bold text-[#1C1917] capitalize">
                      {empPerformance[0]?.trajectory?.replace('_', ' ') || "Unknown"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[#E8E6E1] bg-[#F9FAFB]">
                  <h3 className="font-bold text-[#1C1917]">Daily History</h3>
                </div>
                <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white sticky top-0 border-b border-[#E8E6E1] z-10 shadow-sm">
                      <tr>
                        <th className="px-6 py-3 text-xs font-semibold text-[#78716C]">Date</th>
                        <th className="px-6 py-3 text-xs font-semibold text-[#78716C]">Rating</th>
                        <th className="px-6 py-3 text-xs font-semibold text-[#78716C]">Tasks</th>
                        <th className="px-6 py-3 text-xs font-semibold text-[#78716C]">Trajectory</th>
                        <th className="px-6 py-3 text-xs font-semibold text-[#78716C] w-1/3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {empPerformance.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-6 py-3 text-sm font-medium text-[#1C1917]">{p.date}</td>
                          <td className="px-6 py-3 text-sm font-bold text-[#1C1917]">{p.rating}</td>
                          <td className="px-6 py-3 text-sm text-[#78716C]">{p.tasks_completed} / {p.tasks_assigned}</td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                              p.trajectory === 'at_risk' ? 'bg-red-50 text-red-700' :
                              p.trajectory === 'exceeding' ? 'bg-emerald-50 text-emerald-700' :
                              p.trajectory === 'needs_improvement' ? 'bg-amber-50 text-amber-700' :
                              'bg-blue-50 text-blue-700'
                            }`}>
                              {p.trajectory?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-sm text-[#78716C] truncate max-w-[200px]">{p.remarks || "—"}</td>
                        </tr>
                      ))}
                      {empPerformance.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-sm text-[#78716C]">No performance data recorded.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'revenue' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-[#E8E6E1] p-5 shadow-sm">
                  <p className="text-xs font-medium text-[#78716C] uppercase tracking-wider mb-1">Cost To Company</p>
                  <p className="text-xl font-bold text-[#1C1917]">{formatINR(Number(employee.cost_to_company || 0))}</p>
                </div>
                <div className="bg-white rounded-xl border border-[#E8E6E1] p-5 shadow-sm">
                  <p className="text-xs font-medium text-[#78716C] uppercase tracking-wider mb-1">YTD Revenue</p>
                  <p className="text-xl font-bold text-emerald-600">{formatINR(metrics.ytdRevenue)}</p>
                </div>
                <div className="bg-white rounded-xl border border-[#E8E6E1] p-5 shadow-sm">
                  <p className="text-xs font-medium text-[#78716C] uppercase tracking-wider mb-1">Net Value</p>
                  <p className={`text-xl font-bold ${metrics.netValue >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {metrics.netValue > 0 ? '+' : ''}{formatINR(metrics.netValue)}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-[#E8E6E1] p-5 shadow-sm">
                  <p className="text-xs font-medium text-[#78716C] uppercase tracking-wider mb-1">Revenue Type</p>
                  <p className="text-sm font-bold text-[#1C1917] mt-1.5">{employee.expected_revenue_type || "None"}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[#E8E6E1] bg-[#F9FAFB]">
                  <h3 className="font-bold text-[#1C1917]">Revenue Entries</h3>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white border-b border-[#E8E6E1]">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold text-[#78716C]">Month / Year</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[#78716C] text-right">Direct Revenue</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[#78716C] text-right">Indirect Revenue</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[#78716C] text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {empRevenue.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-[#1C1917]">{r.month} / {r.year}</td>
                        <td className="px-6 py-3 text-sm text-[#78716C] text-right">{formatINR(Number(r.direct_revenue || 0))}</td>
                        <td className="px-6 py-3 text-sm text-[#78716C] text-right">{formatINR(Number(r.indirect_revenue || 0))}</td>
                        <td className="px-6 py-3 text-sm font-bold text-[#1C1917] text-right">
                          {formatINR(Number(r.direct_revenue || 0) + Number(r.indirect_revenue || 0))}
                        </td>
                      </tr>
                    ))}
                    {empRevenue.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-sm text-[#78716C]">No revenue data recorded.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
