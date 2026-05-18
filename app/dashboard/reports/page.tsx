"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts"
import { Download, FileText, TrendingUp, Users, BookOpen, ClipboardCheck, Loader2 } from "lucide-react"
import { useRealtimeTable } from "@/lib/use-realtime"
import type { EmpEmployee, EmpDepartment, EmpPerformanceDaily, EmpOnboardingProgress } from "@/lib/emp-types"
import { MONTHS, statusPie, joiningTrend } from "@/lib/emp-utils"

const REPORT_ITEMS = [
  { label: "Employee Summary Report", icon: Users, desc: "Full list with status, dept & role" },
  { label: "Performance Report", icon: TrendingUp, desc: "Scores & trends by employee" },
  { label: "Training Completion Report", icon: BookOpen, desc: "Module completion per employee" },
  { label: "Assessment Results Report", icon: ClipboardCheck, desc: "Quiz scores and pass rates" },
  { label: "Variable Pay Assessment", icon: FileText, desc: "Revenue & value metrics for payroll" },
]

export default function ReportsPage() {
  const { data: employees, loading: eLoading } = useRealtimeTable<EmpEmployee>("emp_employees")
  const { data: departments, loading: dLoading } = useRealtimeTable<EmpDepartment>("emp_departments", "name", true)
  const { data: perfRows, loading: pLoading } = useRealtimeTable<EmpPerformanceDaily>("emp_performance_daily", "date", false)
  const { data: progress, loading: prLoading } = useRealtimeTable<EmpOnboardingProgress>("emp_onboarding_progress")
  const [period, setPeriod] = useState("6m")
  const loading = eLoading || dLoading || pLoading || prLoading

  const hiringData = useMemo(() => joiningTrend(employees), [employees])

  const deptHeadcount = useMemo(
    () =>
      departments.map((d) => ({
        dept: d.name.length > 10 ? d.name.slice(0, 10) : d.name,
        count: d.employee_count || employees.filter((e) => e.department_id === d.id).length,
      })),
    [departments, employees]
  )

  const scoreTrend = useMemo(() => {
    const byMonth: Record<string, { sum: number; count: number }> = {}
    for (const row of perfRows) {
      const d = new Date(row.date)
      const key = MONTHS[d.getMonth()]
      if (!byMonth[key]) byMonth[key] = { sum: 0, count: 0 }
      byMonth[key].sum += Number(row.score)
      byMonth[key].count += 1
    }
    return MONTHS.map((month) => ({
      month,
      avg: byMonth[month] ? Math.round(byMonth[month].sum / byMonth[month].count) : 0,
    })).filter((_, i) => {
      if (period === "3m") return i >= 9
      if (period === "1y") return true
      return i >= 6
    })
  }, [perfRows, period])

  const statusPieData = useMemo(() => statusPie(employees), [employees])

  const trainingByDept = useMemo(() => {
    const deptNames = departments.map((d) => d.name)
    return deptNames.map((dept) => {
      const empIds = employees.filter((e) => e.department === dept).map((e) => e.id)
      const rows = progress.filter((p) => empIds.includes(p.employee_id))
      const rate = rows.length ? Math.round(rows.reduce((s, r) => s + r.percent_complete, 0) / rows.length) : 0
      return { dept: dept.length > 8 ? dept.slice(0, 8) : dept, rate }
    })
  }, [departments, employees, progress])

  const kpis = useMemo(() => {
    const joined = employees.filter((e) => e.status === "Joined").length
    const thisMonth = employees.filter((e) => {
      if (!e.date_of_joining) return false
      const d = new Date(e.date_of_joining)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
    const scores = perfRows.map((r) => Number(r.score)).filter((s) => s > 0)
    const avgPerf = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    const trainRate = progress.length
      ? Math.round(progress.reduce((s, r) => s + r.percent_complete, 0) / progress.length)
      : 0
    return { total: employees.length, joined, thisMonth, avgPerf, trainRate }
  }, [employees, perfRows, progress])

  if (loading) {
    return (
      <motion.div className="py-16 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Loader2 size={32} className="mx-auto text-gray-300 mb-2 animate-spin" />
        <p className="text-sm text-[#78716C]">Loading reports...</p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-[#1C1917]">Reports & Analytics</h1>
          <p className="text-sm text-[#78716C]">Organizational insights from live data</p>
        </div>
        <div className="flex gap-2">
          {["3m", "6m", "1y"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${period === p ? "bg-[#FF6B35] text-white" : "bg-white border border-[#E8E6E1] text-[#78716C] hover:bg-[#F5F3EF]"}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Total Employees", value: String(kpis.total), icon: Users, color: "bg-[#FFF1EA] text-[#FF6B35]" },
          { label: "New This Month", value: String(kpis.thisMonth), icon: TrendingUp, color: "bg-emerald-50 text-emerald-600" },
          { label: "Avg Performance", value: String(kpis.avgPerf), icon: ClipboardCheck, color: "bg-[#FFF1EA] text-[#F97316]" },
          { label: "Training Rate", value: `${kpis.trainRate}%`, icon: BookOpen, color: "bg-[#F3EBDC] text-[#C8A96E]" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            className="bg-white rounded-xl border border-[#E8E6E1] p-4 shadow-sm"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <motion.div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${s.color.split(" ")[0]}`} whileHover={{ scale: 1.05 }}>
              <s.icon size={16} className={s.color.split(" ")[1]} />
            </motion.div>
            <p className="mt-2 text-2xl font-bold text-[#1C1917]">{s.value}</p>
            <p className="text-xs text-[#78716C]">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 bg-white rounded-xl border border-[#E8E6E1] shadow-sm p-4">
          <p className="text-sm font-semibold text-[#1C1917] mb-3">Monthly Hires ({new Date().getFullYear()})</p>
          {hiringData.every((h) => h.employees === 0) ? (
            <p className="text-sm text-[#78716C] py-12 text-center">No hiring data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hiringData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="employees" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm p-4">
          <p className="text-sm font-semibold text-[#1C1917] mb-3">Employee Status</p>
          {statusPieData.length === 0 ? (
            <p className="text-sm text-[#78716C] py-12 text-center">No employees yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} paddingAngle={3}>
                  {statusPieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm p-4">
          <p className="text-sm font-semibold text-[#1C1917] mb-3">Dept Headcount</p>
          {deptHeadcount.length === 0 ? (
            <p className="text-sm text-[#78716C] py-12 text-center">No departments yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deptHeadcount} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="dept" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm p-4">
          <p className="text-sm font-semibold text-[#1C1917] mb-3">Avg Performance Trend</p>
          {scoreTrend.every((s) => s.avg === 0) ? (
            <p className="text-sm text-[#78716C] py-12 text-center">No performance data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={scoreTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="avg" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {trainingByDept.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm p-4">
          <p className="text-sm font-semibold text-[#1C1917] mb-3">Training Completion by Department</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={trainingByDept} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dept" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="rate" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm p-4">
        <p className="text-sm font-semibold text-[#1C1917] mb-3">Export Reports</p>
        <div className="grid gap-2 md:grid-cols-2">
          {REPORT_ITEMS.map((r, i) => (
            <motion.button
              key={r.label}
              className="flex items-center justify-between rounded-lg border border-[#E8E6E1] p-3 hover:bg-[#F5F3EF] text-left"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ x: 2 }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF1EA]">
                  <r.icon size={14} className="text-[#FF6B35]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#1C1917]">{r.label}</p>
                  <p className="text-[11px] text-[#78716C]">{r.desc}</p>
                </div>
              </div>
              <Download size={14} className="text-[#78716C] shrink-0" />
            </motion.button>
          ))}
        </div>
        <p className="text-[11px] text-[#78716C] mt-3 flex items-center gap-1">
          <FileText size={11} /> Export uses live counts: {kpis.joined} active, {departments.length} departments
        </p>
      </div>
    </div>
  )
}

