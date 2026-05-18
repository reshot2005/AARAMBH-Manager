"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line
} from "recharts"
import {
  TrendingUp, TrendingDown, Users, Star, AlertTriangle, ChevronDown, Building2, Search, Loader2,
} from "lucide-react"
import { useRealtimeTable } from "@/lib/use-realtime"
import type { EmpEmployee, EmpPerformanceDaily, EmpDepartment } from "@/lib/emp-types"
import { avatarColor, initials, deptPerformanceChart } from "@/lib/emp-utils"

interface DailyRecord {
  date: string
  score: number
}

interface EmployeePerf {
  id: string
  name: string
  department: string
  role: string
  avatar: string
  score: number
  trend: number
  tasksDone: number
  history: DailyRecord[]
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 80 ? "bg-emerald-50 text-emerald-700" : score >= 60 ? "bg-[#FFF1EA] text-amber-700" : "bg-red-50 text-red-700"
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${cls}`}>{score}</span>
}

export default function PerformancePage() {
  const { data: employees, loading: empLoading } = useRealtimeTable<EmpEmployee>("emp_employees")
  const { data: perfRows, loading: perfLoading } = useRealtimeTable<EmpPerformanceDaily>("emp_performance_daily", "date", false)
  const { data: departments } = useRealtimeTable<EmpDepartment>("emp_departments", "name", true)
  const [search, setSearch] = useState("")
  const [deptFilter, setDeptFilter] = useState("All")
  const [selected, setSelected] = useState<EmployeePerf | null>(null)
  const loading = empLoading || perfLoading

  const perfList = useMemo<EmployeePerf[]>(() => {
    const byEmp = new Map<string, EmpPerformanceDaily[]>()
    for (const row of perfRows) {
      const list = byEmp.get(row.employee_id) || []
      list.push(row)
      byEmp.set(row.employee_id, list)
    }

    return employees
      .map((emp) => {
        const rows = (byEmp.get(emp.id) || []).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )
        const latest = rows[rows.length - 1]
        const prev = rows[rows.length - 2]
        const score = Math.round(Number(latest?.score) || 0)
        const trend = prev ? score - Math.round(Number(prev.score)) : 0
        const history = rows.slice(-5).map((r) => ({
          date: DAY_LABELS[new Date(r.date).getDay()] || r.date.slice(5),
          score: Math.round(Number(r.score)),
        }))
        return {
          id: emp.id,
          name: emp.name,
          department: emp.department,
          role: emp.role,
          avatar: initials(emp.name),
          score,
          trend,
          tasksDone: latest?.tasks_completed ?? 0,
          history,
        }
      })
      .filter((e) => e.score > 0 || perfRows.some((p) => p.employee_id === e.id))
  }, [employees, perfRows])

  const depts = useMemo(
    () => ["All", ...Array.from(new Set(perfList.map((e) => e.department).filter(Boolean)))],
    [perfList]
  )

  const filtered = useMemo(
    () =>
      perfList.filter((e) => {
        const q = search.toLowerCase()
        return (
          (e.name.toLowerCase().includes(q) || e.department.toLowerCase().includes(q)) &&
          (deptFilter === "All" || e.department === deptFilter)
        )
      }),
    [perfList, search, deptFilter]
  )

  const stats = useMemo(() => {
    const withScore = perfList.filter((e) => e.score > 0)
    const avg = withScore.length ? Math.round(withScore.reduce((s, e) => s + e.score, 0) / withScore.length) : 0
    const top = [...withScore].sort((a, b) => b.score - a.score)[0]
    const atRisk = withScore.filter((e) => e.score < 50).length
    return { avg, top, atRisk, tracked: withScore.length }
  }, [perfList])

  const deptAvg = useMemo(() => deptPerformanceChart(departments), [departments])

  if (loading) {
    return (
      <motion.div className="py-16 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Loader2 size={32} className="mx-auto text-gray-300 mb-2 animate-spin" />
        <p className="text-sm text-[#78716C]">Loading performance data…</p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#1C1917]">Daily Performance</h1>
        <p className="text-sm text-[#78716C]">Track employee performance scores and trends</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Team Average", value: `${stats.avg}`, icon: TrendingUp, color: "bg-[#FFF1EA] text-[#FF6B35]" },
          { label: "Top Performer", value: stats.top?.name.split(" ")[0] || "—", icon: Star, color: "bg-emerald-50 text-emerald-600" },
          { label: "At Risk (<50)", value: String(stats.atRisk), icon: AlertTriangle, color: "bg-red-50 text-red-600" },
          { label: "Tracked Today", value: String(stats.tracked), icon: Users, color: "bg-[#F3EBDC] text-[#C8A96E]" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            className="bg-white rounded-xl border border-[#E8E6E1] p-4 shadow-sm"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${s.color.split(" ")[0]}`}>
              <s.icon size={16} className={s.color.split(" ")[1]} />
            </div>
            <p className="mt-2 text-xl font-bold text-[#1C1917] truncate">{s.value}</p>
            <p className="text-xs text-[#78716C]">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm p-4">
          <p className="text-sm font-semibold text-[#1C1917] mb-3">Avg Score by Department</p>
          {deptAvg.length === 0 ? (
            <p className="text-sm text-[#78716C] py-12 text-center">No department scores yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deptAvg} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="dept" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <motion.div className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm p-4" whileHover={{ y: -1 }}>
          <p className="text-sm font-semibold text-[#1C1917] mb-1">Top Performer Weekly Trend</p>
          <p className="text-xs text-[#78716C] mb-3">{stats.top?.name || "—"}</p>
          {stats.top?.history.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.top.history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[#78716C] py-12 text-center">No trend data yet.</p>
          )}
        </motion.div>
      </div>

      <motion.div className="flex flex-wrap gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <motion.div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
          <input
            type="text"
            placeholder="Search employee…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#E8E6E1] pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FF8C5A]/40"
          />
        </motion.div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="rounded-lg border border-[#E8E6E1] px-3 py-2 text-sm text-[#1C1917] outline-none focus:ring-2 focus:ring-[#FF8C5A]/40"
        >
          {depts.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </motion.div>

      <div className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#F5F3EF] border-b border-[#E8E6E1]">
            <tr>
              {["Employee", "Dept", "Score", "Trend", "Tasks Done", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#78716C]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp, i) => (
              <motion.tr
                key={emp.id}
                className="border-b border-gray-50 hover:bg-[#F5F3EF]/50"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <motion.div className={`h-8 w-8 shrink-0 rounded-full ${avatarColor(emp.id)} flex items-center justify-center text-xs font-bold text-white`}>
                      {emp.avatar}
                    </motion.div>
                    <div>
                      <p className="text-sm font-medium text-[#1C1917]">{emp.name}</p>
                      <p className="text-xs text-[#78716C]">{emp.role}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-xs text-[#78716C]">
                    <Building2 size={10} className="text-[#78716C]" />
                    {emp.department}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <ScoreBadge score={emp.score} />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`flex items-center gap-0.5 text-xs font-medium ${emp.trend > 0 ? "text-emerald-600" : emp.trend < 0 ? "text-red-500" : "text-[#78716C]"}`}
                  >
                    {emp.trend > 0 ? <TrendingUp size={12} /> : emp.trend < 0 ? <TrendingDown size={12} /> : null}
                    {emp.trend > 0 ? `+${emp.trend}` : emp.trend}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[#78716C]">{emp.tasksDone}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelected(emp === selected ? null : emp)}
                    className="text-xs text-[#FF6B35] hover:underline flex items-center gap-1"
                  >
                    Trend <ChevronDown size={11} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-[#78716C]">No performance records found.</div>
        )}
      </div>

      {selected && (
        <motion.div
          className="bg-white rounded-xl border border-indigo-200 shadow-sm p-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm font-semibold text-[#1C1917] mb-3">{selected.name} — Score Trend</p>
          {selected.history.length ? (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={selected.history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[#78716C] text-center py-8">No history for this employee.</p>
          )}
        </motion.div>
      )}
    </div>
  )
}
