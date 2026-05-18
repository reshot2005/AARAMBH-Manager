"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Plus, Search, Building2, Users, TrendingUp, X, ChevronRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRealtimeTable } from "@/lib/use-realtime"
import type { EmpDepartment, EmpEmployee, EmpMentor } from "@/lib/emp-types"
import { initials } from "@/lib/emp-utils"
import { insertDepartment } from "@/lib/emp-actions"

const DEPT_COLORS = ["bg-[#FF6B35]", "bg-emerald-500", "bg-[#C8A96E]", "bg-[#FF8C5A]", "bg-[#78716C]", "bg-[#E8E6E1]"]

interface DepartmentCard {
  id: string
  name: string
  head: string
  employeeCount: number
  avgScore: number
  activeMentors: number
  color: string
}

export default function CategoriesPage() {
  const { data: departments, loading: deptLoading } = useRealtimeTable<EmpDepartment>("emp_departments", "name", true)
  const { data: employees } = useRealtimeTable<EmpEmployee>("emp_employees")
  const { data: mentors } = useRealtimeTable<EmpMentor>("emp_mentors")
  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newHead, setNewHead] = useState("")
  const [saving, setSaving] = useState(false)

  const deptCards = useMemo<DepartmentCard[]>(
    () =>
      departments.map((d, i) => ({
        id: d.id,
        name: d.name,
        head: d.head || "-",
        employeeCount: d.employee_count || employees.filter((e) => e.department_id === d.id).length,
        avgScore: Math.round(Number(d.avg_performance) || 0),
        activeMentors: mentors.filter((m) => m.role?.toLowerCase().includes("mentor")).length,
        color: DEPT_COLORS[i % DEPT_COLORS.length],
      })),
    [departments, employees, mentors]
  )

  const filtered = useMemo(
    () => deptCards.filter((d) => d.name.toLowerCase().includes(search.toLowerCase())),
    [deptCards, search]
  )

  const stats = useMemo(
    () => ({
      total: deptCards.length,
      totalEmployees: deptCards.reduce((s, d) => s + d.employeeCount, 0),
      avgScore: deptCards.length
        ? Math.round(deptCards.reduce((s, d) => s + d.avgScore, 0) / deptCards.length)
        : 0,
    }),
    [deptCards]
  )

  const handleCreate = async () => {
    if (!newName.trim()) return
    setSaving(true)
    try {
      await insertDepartment({
        name: newName.trim(),
        head: newHead.trim(),
        description: "",
        employee_count: 0,
        avg_performance: 0,
      })
      setNewName("")
      setNewHead("")
      setCreateOpen(false)
    } finally {
      setSaving(false)
    }
  }

  if (deptLoading) {
    return (
      <motion.div className="py-16 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Loader2 size={32} className="mx-auto text-gray-300 mb-2 animate-spin" />
        <p className="text-sm text-[#78716C]">Loading departments...</p>
      </motion.div>
    )
  }

  return (
    <motion.div className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1C1917]">Departments</h1>
          <p className="text-sm text-[#78716C]">Manage organizational departments</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-[#FF6B35] px-3 py-2 text-xs font-medium text-white hover:bg-[#FF8C5A]"
        >
          <Plus size={14} /> Add Department
        </button>
      </div>

      <motion.div className="grid grid-cols-3 gap-3" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
        {[
          { label: "Departments", value: stats.total, icon: Building2, color: "bg-[#FFF1EA] text-[#FF6B35]" },
          { label: "Total Employees", value: stats.totalEmployees, icon: Users, color: "bg-emerald-50 text-emerald-600" },
          { label: "Avg Score", value: stats.avgScore, icon: TrendingUp, color: "bg-[#FFF1EA] text-[#F97316]" },
        ].map((s) => (
          <motion.div
            key={s.label}
            className="bg-white rounded-xl border border-[#E8E6E1] p-4 shadow-sm"
            variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
          >
            <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${s.color.split(" ")[0]}`}>
              <s.icon size={16} className={s.color.split(" ")[1]} />
            </div>
            <p className="mt-2 text-2xl font-bold text-[#1C1917]">{s.value}</p>
            <p className="text-xs text-[#78716C]">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
        <input
          type="text"
          placeholder="Search departments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-[#E8E6E1] pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FF8C5A]/40"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((dept, i) => (
          <motion.div
            key={dept.id}
            className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -2 }}
          >
            <div className={`h-1.5 w-full ${dept.color}`} />
            <div className="p-4">
              <motion.div className="flex items-center justify-between mb-3" whileHover={{ x: 2 }}>
                <div className="flex items-center gap-2.5">
                  <div className={`h-9 w-9 rounded-lg ${dept.color} flex items-center justify-center`}>
                    <Building2 size={16} className="text-white" />
                  </div>
                  <p className="text-sm font-bold text-[#1C1917]">{dept.name}</p>
                </div>
                <Link
                  href={`/dashboard/categories/${dept.id}`}
                  className="flex items-center gap-0.5 text-xs text-[#FF6B35] hover:underline"
                >
                  View <ChevronRight size={11} />
                </Link>
              </motion.div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-[#1C1917]">{dept.employeeCount}</p>
                  <p className="text-[10px] text-[#78716C]">Employees</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#1C1917]">{dept.avgScore}</p>
                  <p className="text-[10px] text-[#78716C]">Avg Score</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#1C1917]">{dept.activeMentors}</p>
                  <p className="text-[10px] text-[#78716C]">Mentors</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-[#78716C]">
                Head: <span className="text-[#1C1917] font-medium">{dept.head}</span>
              </div>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-xl border border-[#E8E6E1]">
            <Building2 size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-[#78716C]">No departments found.</p>
          </div>
        )}
      </div>

      {createOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setCreateOpen(false)}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            initial={{ scale: 0.95, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div className="flex items-center justify-between border-b border-[#E8E6E1] px-5 py-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-sm font-semibold text-[#1C1917]">Add Department</h2>
              <button onClick={() => setCreateOpen(false)} className="rounded-lg p-1.5 text-[#78716C] hover:bg-[#E8E6E1]">
                <X size={16} />
              </button>
            </motion.div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#78716C] mb-1">Department Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-lg border border-[#E8E6E1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FF8C5A]/40"
                  placeholder="e.g. Legal"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#78716C] mb-1">Department Head</label>
                <input
                  type="text"
                  value={newHead}
                  onChange={(e) => setNewHead(e.target.value)}
                  className="w-full rounded-lg border border-[#E8E6E1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FF8C5A]/40"
                  placeholder="Name"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#E8E6E1] px-5 py-3">
              <button onClick={() => setCreateOpen(false)} className="rounded-lg border border-[#E8E6E1] px-4 py-2 text-sm text-[#78716C] hover:bg-[#F5F3EF]">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !newName.trim()}
                className="rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-medium text-white hover:bg-[#FF8C5A] disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}
