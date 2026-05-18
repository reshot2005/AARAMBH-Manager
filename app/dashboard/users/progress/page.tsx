"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useRealtimeTable } from "@/lib/use-realtime"
import type { EmpEmployee, EmpOnboardingModule, EmpOnboardingProgress } from "@/lib/emp-types"
import { avatarColor, initials, timeAgo } from "@/lib/emp-utils"
import {
  Search,
  TrendingUp,
  CheckCircle2,
  Clock,
  Users,
  Building2,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

interface ModuleProgress {
  name: string
  status: "completed" | "in_progress" | "pending"
  score: number | null
}

interface EmployeeProgress {
  id: string
  name: string
  department: string
  role: string
  avatar: string
  overallPercent: number
  modules: ModuleProgress[]
  mentor: string | null
  joined: string
  lastActivity: string
}

const MODULE_STATUS_STYLE = {
  completed: "bg-emerald-50 text-emerald-700",
  in_progress: "bg-[#FFF1EA] text-amber-700",
  pending: "bg-[#E8E6E1] text-[#78716C]",
}

function ProgressBar({ percent }: { percent: number }) {
  const color = percent === 100 ? "bg-emerald-500" : percent >= 50 ? "bg-[#FF6B35]" : percent > 0 ? "bg-amber-400" : "bg-gray-200"
  return (
    <div className="h-1.5 w-full rounded-full bg-[#E8E6E1] overflow-hidden">
      <motion.div className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
    </div>
  )
}

export default function EmployeeProgressPage() {
  const { data: employees, loading: empLoading } = useRealtimeTable<EmpEmployee>("emp_employees")
  const { data: progressRows, loading: progLoading } = useRealtimeTable<EmpOnboardingProgress>("emp_onboarding_progress")
  const { data: modules } = useRealtimeTable<EmpOnboardingModule>("emp_onboarding_modules", "order_index", true)

  const [search, setSearch] = useState("")
  const [deptFilter, setDeptFilter] = useState("All")
  const [expanded, setExpanded] = useState<string | null>(null)
  const loading = empLoading || progLoading

  const moduleMap = useMemo(() => new Map(modules.map((m) => [m.id, m])), [modules])

  const progressList = useMemo<EmployeeProgress[]>(() => {
    return employees.map((emp) => {
      const rows = progressRows.filter((p) => p.employee_id === emp.id)
      const moduleProgress: ModuleProgress[] = rows.map((p) => ({
        name: moduleMap.get(p.module_id)?.title || "Module",
        status: p.status === "completed" ? "completed" : p.status === "in_progress" ? "in_progress" : "pending",
        score: p.status === "completed" ? Math.round(p.percent_complete) : null,
      }))
      const overallPercent = rows.length
        ? Math.round(rows.reduce((s, r) => s + r.percent_complete, 0) / rows.length)
        : 0
      const latest = rows.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]
      return {
        id: emp.id,
        name: emp.name,
        department: emp.department,
        role: emp.role,
        avatar: initials(emp.name),
        overallPercent,
        modules: moduleProgress,
        mentor: emp.mentor || null,
        joined: emp.date_of_joining || "",
        lastActivity: latest ? timeAgo(latest.updated_at) : "Not started",
      }
    })
  }, [employees, progressRows, moduleMap])

  const depts = useMemo(() => ["All", ...Array.from(new Set(progressList.map((e) => e.department)))], [progressList])

  const filtered = useMemo(
    () =>
      progressList.filter((e) => {
        const q = search.toLowerCase()
        return (
          (e.name.toLowerCase().includes(q) || e.department.toLowerCase().includes(q)) &&
          (deptFilter === "All" || e.department === deptFilter)
        )
      }),
    [progressList, search, deptFilter]
  )

  const stats = useMemo(() => {
    const total = progressList.length || 1
    const completed = progressList.filter((e) => e.overallPercent === 100).length
    const inProgress = progressList.filter((e) => e.overallPercent > 0 && e.overallPercent < 100).length
    const avg = progressList.length
      ? Math.round(progressList.reduce((s, e) => s + e.overallPercent, 0) / total)
      : 0
    return { total: progressList.length, completed, inProgress, notStarted: progressList.filter((e) => e.overallPercent === 0).length, avg }
  }, [progressList])

  const STAT_CARDS = [
    { label: "Total Tracked", value: stats.total, icon: Users, color: "bg-[#FFF1EA] text-[#FF6B35]" },
    { label: "Fully Completed", value: stats.completed, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
    { label: "In Progress", value: stats.inProgress, icon: TrendingUp, color: "bg-[#FFF1EA] text-[#F97316]" },
    { label: "Avg. Progress", value: `${stats.avg}%`, icon: Clock, color: "bg-[#F3EBDC] text-[#C8A96E]" },
  ]

  if (loading) {
    return (
      <motion.div className="py-16 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Users size={32} className="mx-auto text-gray-300 mb-2 animate-pulse" />
        <p className="text-sm text-[#78716C]">Loading progress data…</p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1C1917]">Employee Progress</h1>
          <p className="text-sm text-[#78716C]">Track onboarding & training completion</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {STAT_CARDS.map((s, i) => (
          <motion.div key={s.label} className="bg-white rounded-xl border border-[#E8E6E1] p-4 shadow-sm"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${s.color.split(" ")[0]}`}>
              <s.icon size={16} className={s.color.split(" ")[1]} />
            </div>
            <p className="mt-2 text-2xl font-bold text-[#1C1917]">{s.value}</p>
            <p className="text-xs text-[#78716C]">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
          <input type="text" placeholder="Search employee…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#E8E6E1] pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FF8C5A]/40" />
        </div>
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
          className="rounded-lg border border-[#E8E6E1] px-3 py-2 text-sm text-[#1C1917] outline-none focus:ring-2 focus:ring-[#FF8C5A]/40">
          {depts.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* Progress List */}
      <div className="space-y-3">
        {filtered.map((emp, i) => (
          <motion.div key={emp.id} className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm overflow-hidden"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <button className="w-full p-4 flex items-center gap-3 text-left hover:bg-[#F5F3EF]/50"
              onClick={() => setExpanded(expanded === emp.id ? null : emp.id)}>
              <div className={`h-10 w-10 shrink-0 rounded-full ${avatarColor(emp.id)} flex items-center justify-center text-xs font-bold text-white`}>
                {emp.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#1C1917] truncate">{emp.name}</p>
                  <span className="text-xs font-bold text-[#1C1917] shrink-0">{emp.overallPercent}%</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-[#78716C] flex items-center gap-1">
                    <Building2 size={10} />{emp.department}
                  </span>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs text-[#78716C]">{emp.lastActivity}</span>
                </div>
                <div className="mt-1.5">
                  <ProgressBar percent={emp.overallPercent} />
                </div>
              </div>
              {expanded === emp.id ? <ChevronUp size={14} className="text-[#78716C] shrink-0" /> : <ChevronDown size={14} className="text-[#78716C] shrink-0" />}
            </button>

            {expanded === emp.id && (
              <motion.div className="border-t border-gray-50 px-4 pb-4 pt-3"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.2 }}>
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-[#78716C]">
                  <span>Role: <span className="text-[#1C1917]">{emp.role}</span></span>
                  <span>Joined: <span className="text-[#1C1917]">{emp.joined}</span></span>
                  <span>Mentor: <span className="text-[#1C1917]">{emp.mentor || "Unassigned"}</span></span>
                </div>
                <p className="text-xs font-semibold text-[#78716C] mb-2">Module Breakdown</p>
                <div className="space-y-2">
                  {emp.modules.map((mod) => (
                    <div key={mod.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${mod.status === "completed" ? "bg-emerald-500" : mod.status === "in_progress" ? "bg-amber-400" : "bg-gray-300"}`} />
                        <span className="text-xs text-[#1C1917] truncate">{mod.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {mod.score !== null && (
                          <span className="text-xs font-medium text-[#78716C]">{mod.score}%</span>
                        )}
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${MODULE_STATUS_STYLE[mod.status]}`}>
                          {mod.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="py-16 text-center bg-white rounded-xl border border-[#E8E6E1]">
            <Users size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-[#78716C]">No employees match your search.</p>
          </div>
        )}
      </div>
    </div>
  )
}

