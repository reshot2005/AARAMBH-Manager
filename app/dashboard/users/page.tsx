"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useRealtimeTable } from "@/lib/use-realtime"
import type { EmpDepartment, EmpEmployee } from "@/lib/emp-types"
import { avatarColor, dbStatusToUi, initials, uiStatusToDb, type UiEmpStatus } from "@/lib/emp-utils"
import { setEmployeeStatus } from "@/lib/emp-actions"
import { usePermissions } from "@/lib/use-permissions"
import {
  Search,
  UserPlus,
  X,
  ChevronDown,
  MoreVertical,
  Users,
  UserCheck,
  Clock,
  UserX,
  Building2,
  Mail,
  Phone,
  Filter,
} from "lucide-react"

type EmpStatus = UiEmpStatus
type EmpRole = string

interface Employee {
  id: string
  name: string
  email: string
  phone: string
  role: EmpRole
  department: string
  status: EmpStatus
  joined: string
  mentor: string | null
  avatar: string
}

const STATUSES: EmpStatus[] = ["active", "pending", "inactive", "onboarding"]

const STATUS_STYLE: Record<EmpStatus, string> = {
  active: "bg-emerald-50 text-emerald-700",
  pending: "bg-[#FFF1EA] text-amber-700",
  inactive: "bg-[#E8E6E1] text-[#78716C]",
  onboarding: "bg-[#F3EBDC] text-violet-700",
}

interface InviteForm {
  name: string
  email: string
  phone: string
  role: EmpRole
  department: string
  login_email: string
  login_password: string
}
const BLANK_INVITE: InviteForm = {
  name: "",
  email: "",
  phone: "",
  role: "Employee",
  department: "",
  login_email: "",
  login_password: "",
}

export default function UsersPage() {
  const { can } = usePermissions()
  const { data: rawEmployees, loading } = useRealtimeTable<EmpEmployee>("emp_employees")
  const { data: deptRows } = useRealtimeTable<EmpDepartment>("emp_departments", "name", true)

  const departments = useMemo(() => ["All", ...deptRows.map((d) => d.name)], [deptRows])
  const roles = useMemo(
    () => Array.from(new Set(rawEmployees.map((e) => e.role).filter(Boolean))).sort(),
    [rawEmployees]
  )

  const employees = useMemo<Employee[]>(
    () =>
      rawEmployees.map((e) => ({
        id: e.id,
        name: e.name,
        email: e.email || "",
        phone: e.phone,
        role: e.role,
        department: e.department,
        status: dbStatusToUi(e.status),
        joined: e.date_of_joining || "",
        mentor: e.mentor || null,
        avatar: initials(e.name),
      })),
    [rawEmployees]
  )
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<EmpStatus | "all">("all")
  const [deptFilter, setDeptFilter] = useState("All")
  const [roleFilter, setRoleFilter] = useState<EmpRole | "all">("all")
  const [actionMenu, setActionMenu] = useState<string | null>(null)

  const stats = useMemo(() => ({
    total: employees.length,
    active: employees.filter((e) => e.status === "active").length,
    pending: employees.filter((e) => e.status === "pending").length,
    onboarding: employees.filter((e) => e.status === "onboarding").length,
    inactive: employees.filter((e) => e.status === "inactive").length,
  }), [employees])

  const filtered = useMemo(() => employees.filter((e) => {
    const q = search.toLowerCase()
    const matchSearch = e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || e.department.toLowerCase().includes(q)
    const matchStatus = statusFilter === "all" || e.status === statusFilter
    const matchDept = deptFilter === "All" || e.department === deptFilter
    const matchRole = roleFilter === "all" || e.role === roleFilter
    return matchSearch && matchStatus && matchDept && matchRole
  }), [employees, search, statusFilter, deptFilter, roleFilter])

  const updateStatus = async (id: string, status: EmpStatus) => {
    try {
      await setEmployeeStatus(id, uiStatusToDb(status))
    } catch (err) {
      console.error(err)
    }
    setActionMenu(null)
  }

  const STAT_CARDS = [
    { label: "Total Employees", icon: Users, value: stats.total, color: "bg-[#FFF1EA] text-[#FF6B35]" },
    { label: "Active", icon: UserCheck, value: stats.active, color: "bg-emerald-50 text-emerald-600" },
    { label: "Onboarding", icon: Clock, value: stats.onboarding, color: "bg-[#F3EBDC] text-[#C8A96E]" },
    { label: "Inactive", icon: UserX, value: stats.inactive, color: "bg-[#E8E6E1] text-[#78716C]" },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1C1917]">All Employees</h1>
          <p className="text-sm text-[#78716C]">Manage your organisation's workforce</p>
        </div>
        {can("create") && (
          <Link
            href="/dashboard/add-employee"
            className="flex items-center gap-2 rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-medium text-white hover:bg-[#FF8C5A] transition-colors"
          >
            <UserPlus size={15} /> Add Employee
          </Link>
        )}
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
          <input type="text" placeholder="Search employeesâ€¦" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#E8E6E1] pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FF8C5A]/40" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as EmpStatus | "all")}
          className="rounded-lg border border-[#E8E6E1] px-3 py-2 text-sm text-[#1C1917] outline-none focus:ring-2 focus:ring-[#FF8C5A]/40">
          <option value="all">All Status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
          className="rounded-lg border border-[#E8E6E1] px-3 py-2 text-sm text-[#1C1917] outline-none focus:ring-2 focus:ring-[#FF8C5A]/40">
          {departments.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as EmpRole | "all")}
          className="rounded-lg border border-[#E8E6E1] px-3 py-2 text-sm text-[#1C1917] outline-none focus:ring-2 focus:ring-[#FF8C5A]/40">
          <option value="all">All Roles</option>
          {(roles.length ? roles : ["Employee"]).map((r) => <option key={r}>{r}</option>)}
        </select>
        <button className="flex items-center gap-1.5 rounded-lg border border-[#E8E6E1] px-3 py-2 text-sm text-[#78716C] hover:bg-[#F5F3EF]">
          <Filter size={13} /> Filters
        </button>
      </div>

      {loading && (
        <div className="bg-white rounded-xl border border-[#E8E6E1] p-12 text-center shadow-sm">
          <Users size={28} className="mx-auto text-gray-300 mb-2 animate-pulse" />
          <p className="text-sm text-[#78716C]">Loading employees…</p>
        </div>
      )}

      {!loading && <div className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm overflow-hidden">
        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-50">
          <AnimatePresence>
            {filtered.map((emp, i) => (
              <motion.div key={emp.id} className="p-4 flex items-start gap-3"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                <div className={`h-10 w-10 shrink-0 rounded-full ${avatarColor(emp.id)} flex items-center justify-center text-xs font-bold text-white`}>
                  {emp.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#1C1917]">{emp.name}</p>
                  <p className="text-xs text-[#78716C] flex items-center gap-1"><Mail size={10} />{emp.email}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[emp.status]}`}>
                      {emp.status}
                    </span>
                    <span className="inline-flex rounded-full bg-[#E8E6E1] px-2 py-0.5 text-[10px] text-[#78716C]">{emp.role}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF1EA] px-2 py-0.5 text-[10px] text-[#FF6B35]">
                      <Building2 size={9} />{emp.department}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Desktop Table */}
        <table className="hidden md:table w-full">
          <thead className="bg-[#F5F3EF] border-b border-[#E8E6E1]">
            <tr>
              {["Employee", "Contact", "Role", "Department", "Status", "Joined", "Mentor", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#78716C]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((emp, i) => (
                <motion.tr key={emp.id} className="border-b border-gray-50 hover:bg-[#F5F3EF]/50 group"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  exit={{ opacity: 0 }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <motion.div className={`h-8 w-8 shrink-0 rounded-full ${avatarColor(emp.id)} flex items-center justify-center text-xs font-bold text-white`}>
                        {emp.avatar}
                      </motion.div>
                      <span className="text-sm font-medium text-[#1C1917]">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-[#78716C] flex items-center gap-1"><Mail size={10} />{emp.email}</p>
                    <p className="text-xs text-[#78716C] flex items-center gap-1 mt-0.5"><Phone size={10} />{emp.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#1C1917]">{emp.role}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs text-[#78716C]">
                      <Building2 size={11} className="text-[#78716C]" />{emp.department}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[emp.status]}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#78716C]">{emp.joined}</td>
                  <td className="px-4 py-3 text-xs text-[#78716C]">{emp.mentor || "â€”"}</td>
                  <td className="px-4 py-3 relative">
                    <button onClick={() => setActionMenu(actionMenu === emp.id ? null : emp.id)}
                      className="rounded p-1 text-[#78716C] hover:text-[#1C1917] hover:bg-[#E8E6E1]">
                      <MoreVertical size={14} />
                    </button>
                    <AnimatePresence>
                      {actionMenu === emp.id && (
                        <motion.div className="absolute right-8 top-2 z-20 w-40 rounded-lg border border-[#E8E6E1] bg-white shadow-lg py-1 text-xs"
                          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                          {STATUSES.filter((s) => s !== emp.status).map((s) => (
                            <button key={s} onClick={() => updateStatus(emp.id, s)}
                              className="w-full px-3 py-1.5 text-left text-[#1C1917] hover:bg-[#FFF1EA] hover:text-[#FF8C5A]">
                              Set {s}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <Users size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-[#78716C]">No employees match your filters.</p>
          </div>
        )}
      </div>}

    </div>
  )
}
