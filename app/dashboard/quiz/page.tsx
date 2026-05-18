"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Search, ClipboardCheck, Users, CheckCircle2, X, TrendingUp, Loader2,
} from "lucide-react"
import { useRealtimeTable } from "@/lib/use-realtime"
import type { EmpAssessment, EmpAssessmentAttempt } from "@/lib/emp-types"

type QuizStatus = "active" | "draft" | "archived"

interface AssessmentRow {
  id: string
  title: string
  department: string
  duration: string
  attempts: number
  avgScore: number
  passRate: number
  status: QuizStatus
  createdAt: string
}

const STATUS_COLOR: Record<QuizStatus, string> = {
  active: "bg-emerald-50 text-emerald-700",
  draft: "bg-[#FFF1EA] text-amber-700",
  archived: "bg-[#E8E6E1] text-[#78716C]",
}

function PassRateBadge({ rate }: { rate: number }) {
  const cls = rate >= 80 ? "text-emerald-600" : rate >= 60 ? "text-[#F97316]" : "text-red-500"
  return <span className={`text-xs font-bold ${cls}`}>{rate}%</span>
}

export default function QuizPage() {
  const { data: assessments, loading: aLoading } = useRealtimeTable<EmpAssessment>("emp_assessments")
  const { data: attempts, loading: tLoading } = useRealtimeTable<EmpAssessmentAttempt>("emp_assessment_attempts", "attempted_at", false)
  const [search, setSearch] = useState("")
  const [deptFilter, setDeptFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState<QuizStatus | "all">("all")
  const [createOpen, setCreateOpen] = useState(false)
  const loading = aLoading || tLoading

  const rows = useMemo<AssessmentRow[]>(
    () =>
      assessments.map((a) => {
        const atts = attempts.filter((t) => t.assessment_id === a.id)
        const avgScore = atts.length ? Math.round(atts.reduce((s, t) => s + t.score, 0) / atts.length) : 0
        const passRate = atts.length ? Math.round((atts.filter((t) => t.passed).length / atts.length) * 100) : 0
        const status: QuizStatus =
          a.status === "archived" ? "archived" : a.status === "draft" ? "draft" : "active"
        return {
          id: a.id,
          title: a.title,
          department: a.department,
          duration: `${a.duration_minutes}m`,
          attempts: atts.length,
          avgScore,
          passRate,
          status,
          createdAt: new Date(a.created_at).toLocaleDateString(),
        }
      }),
    [assessments, attempts]
  )

  const depts = useMemo(
    () => ["All", ...Array.from(new Set(rows.filter((a) => a.department !== "All").map((a) => a.department)))],
    [rows]
  )

  const filtered = useMemo(
    () =>
      rows.filter((a) => {
        const q = search.toLowerCase()
        return (
          a.title.toLowerCase().includes(q) &&
          (deptFilter === "All" || a.department === deptFilter || a.department === "All") &&
          (statusFilter === "all" || a.status === statusFilter)
        )
      }),
    [rows, search, deptFilter, statusFilter]
  )

  const stats = useMemo(() => {
    const active = rows.filter((a) => a.status === "active")
    const totalAttempts = active.reduce((s, a) => s + a.attempts, 0)
    const avgScore = active.length ? Math.round(active.reduce((s, a) => s + a.avgScore, 0) / active.length) : 0
    const avgPass = active.length ? Math.round(active.reduce((s, a) => s + a.passRate, 0) / active.length) : 0
    return { total: rows.length, active: active.length, totalAttempts, avgScore, avgPass }
  }, [rows])

  if (loading) {
    return (
      <motion.div className="py-16 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Loader2 size={32} className="mx-auto text-gray-300 mb-2 animate-spin" />
        <p className="text-sm text-[#78716C]">Loading assessments…</p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-xl font-bold text-[#1C1917]">Assessments</h1>
          <p className="text-sm text-[#78716C]">Manage training quizzes and evaluations</p>
        </motion.div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-[#FF6B35] px-3 py-2 text-xs font-medium text-white hover:bg-[#FF8C5A]"
        >
          <Plus size={14} /> New Assessment
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Total Assessments", value: stats.total, icon: ClipboardCheck, color: "bg-[#FFF1EA] text-[#FF6B35]" },
          { label: "Total Attempts", value: stats.totalAttempts, icon: Users, color: "bg-[#F3EBDC] text-[#C8A96E]" },
          { label: "Avg Score", value: `${stats.avgScore}%`, icon: TrendingUp, color: "bg-emerald-50 text-emerald-600" },
          { label: "Avg Pass Rate", value: `${stats.avgPass}%`, icon: CheckCircle2, color: "bg-[#FFF1EA] text-[#F97316]" },
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

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
          <input
            type="text"
            placeholder="Search assessments…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#E8E6E1] pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FF8C5A]/40"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="rounded-lg border border-[#E8E6E1] px-3 py-2 text-sm text-[#1C1917] outline-none focus:ring-2 focus:ring-[#FF8C5A]/40"
        >
          {depts.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as QuizStatus | "all")}
          className="rounded-lg border border-[#E8E6E1] px-3 py-2 text-sm text-[#1C1917] outline-none focus:ring-2 focus:ring-[#FF8C5A]/40"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#F5F3EF] border-b border-[#E8E6E1]">
            <tr>
              {["Assessment", "Dept", "Duration", "Attempts", "Avg Score", "Pass Rate", "Status"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#78716C] whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, i) => (
              <motion.tr
                key={a.id}
                className="border-b border-gray-50 hover:bg-[#F5F3EF]/50"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-[#1C1917]">{a.title}</p>
                  <p className="text-xs text-[#78716C]">{a.createdAt}</p>
                </td>
                <td className="px-4 py-3 text-xs text-[#78716C]">{a.department}</td>
                <td className="px-4 py-3 text-xs text-[#78716C]">{a.duration}</td>
                <td className="px-4 py-3 text-xs text-[#78716C]">{a.attempts}</td>
                <td className="px-4 py-3 text-xs font-bold text-[#1C1917]">{a.avgScore > 0 ? `${a.avgScore}%` : "—"}</td>
                <td className="px-4 py-3">
                  <PassRateBadge rate={a.passRate} />
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLOR[a.status]}`}>
                    {a.status}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <motion.div className="py-12 text-center text-sm text-[#78716C]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            No assessments found.
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {createOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCreateOpen(false)}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#E8E6E1] px-5 py-4">
                <h2 className="text-sm font-semibold text-[#1C1917]">New Assessment</h2>
                <button onClick={() => setCreateOpen(false)} className="rounded-lg p-1.5 text-[#78716C] hover:bg-[#E8E6E1]">
                  <X size={16} />
                </button>
              </div>
              <motion.div className="px-5 py-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-xs text-[#78716C]">Add assessments via Supabase or your seed scripts.</p>
              </motion.div>
              <div className="flex justify-end gap-2 border-t border-[#E8E6E1] px-5 py-3">
                <button onClick={() => setCreateOpen(false)} className="rounded-lg border border-[#E8E6E1] px-4 py-2 text-sm text-[#78716C] hover:bg-[#F5F3EF]">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
