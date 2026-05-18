"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Building2, Users, AlertTriangle, Loader2 } from "lucide-react"
import { useRealtimeTable } from "@/lib/use-realtime"
import type { EmpEmployee, EmpPerformanceDaily, EmpDepartment } from "@/lib/emp-types"

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const WEEKS = ["W1", "W2", "W3", "W4"]

function getColor(score: number) {
  if (score >= 85) return "bg-emerald-500"
  if (score >= 70) return "bg-emerald-300"
  if (score >= 55) return "bg-amber-300"
  if (score >= 40) return "bg-orange-400"
  return "bg-red-500"
}

function weekIndex(date: Date, start: Date) {
  const diff = Math.floor((date.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000))
  return Math.min(3, Math.max(0, diff))
}

function dayIndex(date: Date) {
  const d = date.getDay()
  if (d === 0 || d === 6) return -1
  return d - 1
}

export default function HeatmapPage() {
  const { data: perfRows, loading: perfLoading } = useRealtimeTable<EmpPerformanceDaily>("emp_performance_daily", "date", false)
  const { data: employees, loading: empLoading } = useRealtimeTable<EmpEmployee>("emp_employees")
  const { data: departments, loading: deptLoading } = useRealtimeTable<EmpDepartment>("emp_departments", "name", true)
  const [selected, setSelected] = useState<string | null>(null)
  const loading = perfLoading || empLoading || deptLoading

  const empDept = useMemo(() => new Map(employees.map((e) => [e.id, e.department])), [employees])

  const heatmapData = useMemo(() => {
    const deptNames =
      departments.length > 0
        ? departments.map((d) => d.name)
        : Array.from(new Set(employees.map((e) => e.department).filter(Boolean)))

    const now = new Date()
    const start = new Date(now)
    start.setDate(start.getDate() - 27)

    const grid: Record<string, number[][]> = {}
    const counts: Record<string, number[][]> = {}

    for (const dept of deptNames) {
      grid[dept] = WEEKS.map(() => DAYS.map(() => 0))
      counts[dept] = WEEKS.map(() => DAYS.map(() => 0))
    }

    for (const row of perfRows) {
      const dept = empDept.get(row.employee_id)
      if (!dept || !grid[dept]) continue
      const d = new Date(row.date)
      const di = dayIndex(d)
      const wi = weekIndex(d, start)
      if (di < 0) continue
      grid[dept][wi][di] += Number(row.score)
      counts[dept][wi][di] += 1
    }

    const result: Record<string, number[][]> = {}
    for (const dept of deptNames) {
      result[dept] = grid[dept].map((week, wi) =>
        week.map((sum, di) => {
          const c = counts[dept][wi][di]
          return c > 0 ? Math.round(sum / c) : 0
        })
      )
    }
    return result
  }, [perfRows, empDept, departments, employees])

  const deptList = useMemo(() => Object.keys(heatmapData), [heatmapData])

  const stats = useMemo(() => {
    const all: number[] = []
    Object.values(heatmapData).forEach((weeks) =>
      weeks.forEach((days) => days.forEach((s) => { if (s > 0) all.push(s) }))
    )
    const avg = all.length ? Math.round(all.reduce((a, b) => a + b, 0) / all.length) : 0
    const low = deptList.filter((d) => {
      const flat = heatmapData[d].flat().filter((s) => s > 0)
      if (!flat.length) return false
      return flat.reduce((a, b) => a + b, 0) / flat.length < 55
    }).length
    return { avg, low, total: deptList.length }
  }, [heatmapData, deptList])

  const filtered = selected ? [selected] : deptList

  if (loading) {
    return (
      <motion.div className="py-16 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Loader2 size={32} className="mx-auto text-gray-300 mb-2 animate-spin" />
        <p className="text-sm text-[#78716C]">Loading heatmap...</p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-[#1C1917]">Performance Heatmap</h1>
        <p className="text-sm text-[#78716C]">Weekly score intensity by department and day (last 4 weeks)</p>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Departments", value: stats.total, icon: Building2, color: "bg-[#FFF1EA] text-[#FF6B35]" },
          { label: "Avg Score", value: stats.avg || "-", icon: Users, color: "bg-emerald-50 text-emerald-600" },
          { label: "Low Perf Depts", value: stats.low, icon: AlertTriangle, color: "bg-red-50 text-red-600" },
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
            <p className="mt-2 text-2xl font-bold text-[#1C1917]">{s.value}</p>
            <p className="text-xs text-[#78716C]">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-[#78716C] font-medium">Score:</span>
        {[
          { label: ">=85", color: "bg-emerald-500" },
          { label: "70-84", color: "bg-emerald-300" },
          { label: "55-69", color: "bg-amber-300" },
          { label: "40-54", color: "bg-orange-400" },
          { label: "<40", color: "bg-red-500" },
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-1 text-xs text-[#78716C]">
            <span className={`inline-block h-3 w-3 rounded-sm ${l.color}`} />
            {l.label}
          </span>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelected(null)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${!selected ? "bg-[#FF6B35] text-white" : "bg-white border border-[#E8E6E1] text-[#78716C] hover:bg-[#F5F3EF]"}`}
        >
          All
        </button>
        {deptList.map((d) => (
          <button
            key={d}
            onClick={() => setSelected(selected === d ? null : d)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${selected === d ? "bg-[#FF6B35] text-white" : "bg-white border border-[#E8E6E1] text-[#78716C] hover:bg-[#F5F3EF]"}`}
          >
            {d}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <motion.div className="py-16 text-center bg-white rounded-xl border border-[#E8E6E1]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Building2 size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-[#78716C]">No performance data to display.</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filtered.map((dept) => (
            <motion.div
              key={dept}
              className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm p-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-sm font-semibold text-[#1C1917] mb-3 flex items-center gap-1.5">
                <Building2 size={13} className="text-[#78716C]" />
                {dept}
              </p>
              <motion.div className="overflow-x-auto" whileHover={{ x: 2 }}>
                <table className="w-full text-xs border-separate" style={{ borderSpacing: "3px" }}>
                  <thead>
                    <tr>
                      <th className="text-left text-[#78716C] font-medium pb-1 pr-2 w-8" />
                      {DAYS.map((d) => (
                        <th key={d} className="text-center text-[#78716C] font-medium pb-1">
                          {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {WEEKS.map((w, wi) => (
                      <tr key={w}>
                        <td className="text-[#78716C] pr-2">{w}</td>
                        {DAYS.map((d, di) => {
                          const score = heatmapData[dept]?.[wi]?.[di] ?? 0
                          return (
                            <td
                              key={d}
                              className={`rounded text-center font-bold ${score > 0 ? getColor(score) : "bg-[#F5F3EF] text-[#78716C]"} ${score > 0 ? "text-white" : ""}`}
                              style={{ width: 44, height: 32 }}
                              title={`${dept} ${w} ${d}: ${score || "no data"}`}
                            >
                              {score > 0 ? score : "-"}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
