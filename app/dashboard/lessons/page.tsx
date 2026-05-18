"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Search, BookOpen, Clock, Users, CheckCircle2, X, Grid3X3, List,
  PlayCircle, FileText, Video, Loader2,
} from "lucide-react"
import { useRealtimeTable } from "@/lib/use-realtime"
import type { EmpOnboardingModule, EmpOnboardingProgress } from "@/lib/emp-types"

type ModuleType = "video" | "document" | "interactive"
type ModuleStatus = "active" | "draft" | "archived"

interface TrainingModule {
  id: string
  title: string
  description: string
  department: string
  type: ModuleType
  duration: string
  assignedTo: number
  completionRate: number
  status: ModuleStatus
  createdAt: string
}

const TYPE_ICON = { video: Video, document: FileText, interactive: PlayCircle }
const TYPE_COLOR = { video: "bg-[#E8E6E1] text-[#FF8C5A]", document: "bg-[#F5F3EF] text-[#78716C]", interactive: "bg-[#F3EBDC] text-[#C8A96E]" }
const STATUS_COLOR = { active: "bg-emerald-50 text-emerald-700", draft: "bg-[#FFF1EA] text-amber-700", archived: "bg-[#E8E6E1] text-[#78716C]" }

function inferType(url: string): ModuleType {
  if (/\.(mp4|webm|mov)/i.test(url)) return "video"
  if (/\.(pdf|doc|docx)/i.test(url)) return "document"
  return "interactive"
}

export default function LessonsPage() {
  const { data: rawModules, loading: modLoading } = useRealtimeTable<EmpOnboardingModule>("emp_onboarding_modules", "order_index", true)
  const { data: progress, loading: progLoading } = useRealtimeTable<EmpOnboardingProgress>("emp_onboarding_progress")
  const [search, setSearch] = useState("")
  const [deptFilter, setDeptFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState<ModuleStatus | "all">("all")
  const [view, setView] = useState<"grid" | "list">("grid")
  const [createOpen, setCreateOpen] = useState(false)
  const loading = modLoading || progLoading

  const modules = useMemo<TrainingModule[]>(
    () =>
      rawModules.map((m) => {
        const rows = progress.filter((p) => p.module_id === m.id)
        const completionRate = rows.length
          ? Math.round(rows.reduce((s, r) => s + r.percent_complete, 0) / rows.length)
          : 0
        return {
          id: m.id,
          title: m.title,
          description: m.description,
          department: m.department,
          type: inferType(m.content_url),
          duration: "—",
          assignedTo: rows.length,
          completionRate,
          status: m.is_active ? "active" : "draft",
          createdAt: new Date(m.created_at).toLocaleDateString(),
        }
      }),
    [rawModules, progress]
  )

  const depts = useMemo(
    () => ["All", ...Array.from(new Set(modules.filter((m) => m.department !== "All").map((m) => m.department)))],
    [modules]
  )

  const filtered = useMemo(
    () =>
      modules.filter((m) => {
        const q = search.toLowerCase()
        const matchSearch = m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)
        const matchDept = deptFilter === "All" || m.department === deptFilter || m.department === "All"
        const matchStatus = statusFilter === "all" || m.status === statusFilter
        return matchSearch && matchDept && matchStatus
      }),
    [modules, search, deptFilter, statusFilter]
  )

  const stats = useMemo(() => {
    const active = modules.filter((m) => m.status === "active")
    return {
      total: modules.length,
      active: active.length,
      avgCompletion: active.length
        ? Math.round(active.reduce((s, m) => s + m.completionRate, 0) / active.length)
        : 0,
      totalAssigned: modules.reduce((s, m) => s + m.assignedTo, 0),
    }
  }, [modules])

  if (loading) {
    return (
      <motion.div className="py-16 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Loader2 size={32} className="mx-auto text-gray-300 mb-2 animate-spin" />
        <p className="text-sm text-[#78716C]">Loading training modules…</p>
      </motion.div>
    )
  }

  return (
    <motion.div className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1C1917]">Training Modules</h1>
          <p className="text-sm text-[#78716C]">Manage employee learning content</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-[#FF6B35] px-3 py-2 text-xs font-medium text-white hover:bg-[#FF8C5A]"
        >
          <Plus size={14} /> New Module
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Total Modules", value: stats.total, icon: BookOpen, color: "bg-[#FFF1EA] text-[#FF6B35]" },
          { label: "Active", value: stats.active, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
          { label: "Avg Completion", value: `${stats.avgCompletion}%`, icon: Clock, color: "bg-[#FFF1EA] text-[#F97316]" },
          { label: "Total Assigned", value: stats.totalAssigned, icon: Users, color: "bg-[#F3EBDC] text-[#C8A96E]" },
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

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
          <input
            type="text"
            placeholder="Search modules…"
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
          onChange={(e) => setStatusFilter(e.target.value as ModuleStatus | "all")}
          className="rounded-lg border border-[#E8E6E1] px-3 py-2 text-sm text-[#1C1917] outline-none focus:ring-2 focus:ring-[#FF8C5A]/40"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
        </select>
        <div className="flex rounded-lg border border-[#E8E6E1] overflow-hidden">
          <button
            onClick={() => setView("grid")}
            className={`p-2 ${view === "grid" ? "bg-[#FF6B35] text-white" : "text-[#78716C] hover:bg-[#F5F3EF]"}`}
          >
            <Grid3X3 size={14} />
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-2 ${view === "list" ? "bg-[#FF6B35] text-white" : "text-[#78716C] hover:bg-[#F5F3EF]"}`}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {filtered.map((mod, i) => {
              const TIcon = TYPE_ICON[mod.type]
              return (
                <motion.div
                  key={mod.id}
                  className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm p-4 flex flex-col gap-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <motion.div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${TYPE_COLOR[mod.type].split(" ")[0]}`} whileHover={{ scale: 1.05 }}>
                      <TIcon size={16} className={TYPE_COLOR[mod.type].split(" ")[1]} />
                    </motion.div>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLOR[mod.status]}`}>
                      {mod.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1C1917]">{mod.title}</p>
                    <p className="text-xs text-[#78716C] mt-0.5 line-clamp-2">{mod.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-[#78716C]">
                    <span className="flex items-center gap-1">
                      <Users size={10} />
                      {mod.assignedTo}
                    </span>
                    <span>{mod.department}</span>
                  </div>
                  <div>
                    <motion.div className="flex items-center justify-between text-xs mb-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <span className="text-[#78716C]">Completion</span>
                      <span className="font-medium text-[#1C1917]">{mod.completionRate}%</span>
                    </motion.div>
                    <div className="h-1.5 bg-[#E8E6E1] rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${mod.completionRate >= 70 ? "bg-emerald-500" : mod.completionRate >= 40 ? "bg-amber-400" : "bg-red-400"}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${mod.completionRate}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white rounded-xl border border-[#E8E6E1]">
              <BookOpen size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-[#78716C]">No modules found.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F5F3EF] border-b border-[#E8E6E1]">
              <tr>
                {["Module", "Dept", "Type", "Assigned", "Completion", "Status"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#78716C]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((mod, i) => {
                const TIcon = TYPE_ICON[mod.type]
                return (
                  <motion.tr
                    key={mod.id}
                    className="border-b border-gray-50 hover:bg-[#F5F3EF]/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-[#1C1917]">{mod.title}</p>
                      <p className="text-xs text-[#78716C] truncate max-w-[200px]">{mod.description}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#78716C]">{mod.department}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_COLOR[mod.type]}`}>
                        <TIcon size={10} />
                        {mod.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#78716C]">{mod.assignedTo}</td>
                    <td className="px-4 py-3 text-xs font-medium text-[#1C1917]">{mod.completionRate}%</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLOR[mod.status]}`}>
                        {mod.status}
                      </span>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <motion.div className="py-12 text-center text-sm text-[#78716C]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              No modules found.
            </motion.div>
          )}
        </div>
      )}

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
                <h2 className="text-sm font-semibold text-[#1C1917]">New Training Module</h2>
                <button onClick={() => setCreateOpen(false)} className="rounded-lg p-1.5 text-[#78716C] hover:bg-[#E8E6E1]">
                  <X size={16} />
                </button>
              </div>
              <div className="px-5 py-4">
                <p className="text-xs text-[#78716C]">Module creation is available from the admin setup. Use Supabase or seed scripts to add modules.</p>
              </div>
              <motion.div className="flex justify-end gap-2 border-t border-[#E8E6E1] px-5 py-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <button onClick={() => setCreateOpen(false)} className="rounded-lg border border-[#E8E6E1] px-4 py-2 text-sm text-[#78716C] hover:bg-[#F5F3EF]">
                  Close
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
