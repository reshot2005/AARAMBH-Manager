"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Users, TrendingUp, BookOpen, Building2, Mail, Loader2 } from "lucide-react"
import { useRealtimeTable } from "@/lib/use-realtime"
import type { EmpDepartment, EmpEmployee, EmpOnboardingModule, EmpOnboardingProgress, EmpPerformanceDaily } from "@/lib/emp-types"
import { avatarColor, initials } from "@/lib/emp-utils"

export default function DeptDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: departments, loading: deptLoading } = useRealtimeTable<EmpDepartment>("emp_departments")
  const { data: employees, loading: empLoading } = useRealtimeTable<EmpEmployee>("emp_employees")
  const { data: modules } = useRealtimeTable<EmpOnboardingModule>("emp_onboarding_modules", "order_index", true)
  const { data: progress } = useRealtimeTable<EmpOnboardingProgress>("emp_onboarding_progress")
  const { data: perfRows } = useRealtimeTable<EmpPerformanceDaily>("emp_performance_daily", "date", false)

  const loading = deptLoading || empLoading
  const dept = departments.find((d) => d.id === id)

  const deptEmployees = useMemo(
    () => employees.filter((e) => e.department_id === id || e.department === dept?.name),
    [employees, id, dept?.name]
  )

  const latestScore = useMemo(() => {
    const map = new Map<string, number>()
    for (const row of perfRows) {
      const prev = map.get(row.employee_id)
      const score = Number(row.score)
      if (prev === undefined || score > prev) map.set(row.employee_id, score)
    }
    return map
  }, [perfRows])

  const team = useMemo(
    () =>
      deptEmployees.map((e) => ({
        id: e.id,
        name: e.name,
        avatar: initials(e.name),
        role: e.role,
        score: Math.round(latestScore.get(e.id) ?? 0),
        email: e.email || "",
        color: avatarColor(e.id),
      })),
    [deptEmployees, latestScore]
  )

  const deptModules = useMemo(() => {
    if (!dept) return []
    return modules
      .filter((m) => m.department === "All" || m.department === dept.name)
      .map((m) => {
        const rows = progress.filter((p) => p.module_id === m.id)
        const completion = rows.length
          ? Math.round(rows.reduce((s, r) => s + r.percent_complete, 0) / rows.length)
          : 0
        return { title: m.title, completion }
      })
  }, [modules, progress, dept])

  const avgScore = team.length ? Math.round(team.reduce((s, e) => s + e.score, 0) / team.length) : 0

  if (loading) {
    return (
      <motion.div className="py-16 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Loader2 size={32} className="mx-auto text-gray-300 mb-2 animate-spin" />
        <p className="text-sm text-[#78716C]">Loading department...</p>
      </motion.div>
    )
  }

  if (!dept) {
    return (
      <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Link href="/dashboard/categories" className="flex items-center gap-1 text-sm text-[#78716C] hover:text-[#1C1917]">
          <ArrowLeft size={14} /> Back to Departments
        </Link>
        <div className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm p-8 text-center">
          <Building2 size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-[#78716C]">Department not found.</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center gap-3">
        <Link href="/dashboard/categories" className="flex items-center gap-1 text-sm text-[#78716C] hover:text-[#1C1917]">
          <ArrowLeft size={14} /> Departments
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-semibold text-[#1C1917]">{dept.name}</span>
      </div>

      <motion.div className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-xl bg-[#FF6B35] flex items-center justify-center">
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1C1917]">{dept.name}</h1>
            <p className="text-sm text-[#78716C]">Head: {dept.head || "-"}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Employees", value: team.length, icon: Users, color: "bg-[#FFF1EA] text-[#FF6B35]" },
            { label: "Avg Score", value: avgScore, icon: TrendingUp, color: "bg-emerald-50 text-emerald-600" },
            { label: "Modules", value: deptModules.length, icon: BookOpen, color: "bg-[#FFF1EA] text-[#F97316]" },
          ].map((s) => (
            <div key={s.label} className={`rounded-lg p-3 ${s.color.split(" ")[0]}`}>
              <s.icon size={14} className={s.color.split(" ")[1]} />
              <p className="mt-1 text-lg font-bold text-[#1C1917]">{s.value}</p>
              <p className="text-xs text-[#78716C]">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <p className="text-sm font-semibold text-[#1C1917] mb-3">Team Members</p>
        {team.length === 0 ? (
          <p className="text-sm text-[#78716C] py-6 text-center">No employees in this department.</p>
        ) : (
          <div className="space-y-2">
            {team.map((emp) => (
              <motion.div key={emp.id} className="flex items-center justify-between rounded-lg border border-gray-50 p-3 hover:bg-[#F5F3EF]/50" whileHover={{ x: 2 }}>
                <div className="flex items-center gap-2.5">
                  <motion.div className={`h-9 w-9 shrink-0 rounded-full ${emp.color} flex items-center justify-center text-xs font-bold text-white`}>
                    {emp.avatar}
                  </motion.div>
                  <div>
                    <p className="text-sm font-medium text-[#1C1917]">{emp.name}</p>
                    <p className="text-xs text-[#78716C] flex items-center gap-2">
                      <Mail size={9} />
                      {emp.email || "-"}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-bold ${emp.score >= 80 ? "text-emerald-600" : emp.score >= 60 ? "text-[#F97316]" : "text-red-500"}`}>
                  {emp.score || "-"}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <p className="text-sm font-semibold text-[#1C1917] mb-3">Training Modules</p>
        {deptModules.length === 0 ? (
          <p className="text-sm text-[#78716C] py-6 text-center">No modules for this department.</p>
        ) : (
          <div className="space-y-3">
            {deptModules.map((mod) => (
              <div key={mod.title}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#1C1917]">{mod.title}</span>
                  <span className="font-medium text-[#78716C]">{mod.completion}%</span>
                </div>
                <motion.div className="h-1.5 bg-[#E8E6E1] rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${mod.completion >= 70 ? "bg-emerald-500" : mod.completion >= 40 ? "bg-amber-400" : "bg-red-400"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${mod.completion}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </motion.div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
