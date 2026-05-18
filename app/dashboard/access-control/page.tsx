"use client"

import { useEffect, useState, useMemo, Fragment } from "react"
import { motion } from "framer-motion"
import { Shield, CheckCircle2, XCircle, Lock, Edit2, Save, Loader2 } from "lucide-react"
import { useRealtimeTable } from "@/lib/use-realtime"
import { supabase } from "@/lib/supabase"
import type { EmpRole } from "@/lib/emp-types"

type RoleName = "Admin" | "Mentor" | "Coordinator" | "Employee"

interface Permission {
  id: string
  label: string
  category: string
}

const PERMISSIONS: Permission[] = [
  { id: "view_employees", label: "View Employees", category: "Employees" },
  { id: "manage_employees", label: "Manage Employees", category: "Employees" },
  { id: "approve_candidates", label: "Approve Candidates", category: "Employees" },
  { id: "view_performance", label: "View Performance", category: "Performance" },
  { id: "manage_performance", label: "Manage Performance", category: "Performance" },
  { id: "view_training", label: "View Training Modules", category: "Training" },
  { id: "manage_training", label: "Manage Training Modules", category: "Training" },
  { id: "view_assessments", label: "View Assessments", category: "Training" },
  { id: "manage_assessments", label: "Manage Assessments", category: "Training" },
  { id: "view_reports", label: "View Reports", category: "Reports" },
  { id: "export_reports", label: "Export Reports", category: "Reports" },
  { id: "manage_departments", label: "Manage Departments", category: "Settings" },
  { id: "manage_roles", label: "Manage Roles", category: "Settings" },
  { id: "manage_settings", label: "Manage Portal Settings", category: "Settings" },
  { id: "view_helpdesk", label: "View Help Desk", category: "Help Desk" },
  { id: "manage_helpdesk", label: "Manage Help Desk", category: "Help Desk" },
]

const DEFAULT_PERMS: Record<RoleName, string[]> = {
  Admin: PERMISSIONS.map((p) => p.id),
  Mentor: ["view_employees", "view_performance", "view_training", "view_assessments", "view_reports", "view_helpdesk"],
  Coordinator: [
    "view_employees",
    "view_performance",
    "manage_performance",
    "view_training",
    "view_assessments",
    "view_reports",
    "view_helpdesk",
    "manage_helpdesk",
  ],
  Employee: ["view_training", "view_assessments"],
}

const ROLE_STYLE: Record<RoleName, string> = {
  Admin: "bg-red-50 text-red-700",
  Mentor: "bg-[#FFF1EA] text-amber-700",
  Coordinator: "bg-[#FFF1EA] text-[#FF8C5A]",
  Employee: "bg-[#F5F3EF] text-[#1C1917]",
}

const ROLES: RoleName[] = ["Admin", "Mentor", "Coordinator", "Employee"]
const CATEGORIES = Array.from(new Set(PERMISSIONS.map((p) => p.category)))

type RolePermissions = Record<RoleName, Record<string, boolean>>

function permsToMap(lists: Record<RoleName, string[]>): RolePermissions {
  const out = {} as RolePermissions
  for (const role of ROLES) {
    out[role] = Object.fromEntries(PERMISSIONS.map((p) => [p.id, lists[role].includes(p.id)]))
  }
  return out
}

function mapFromRoles(roles: EmpRole[]): RolePermissions {
  const lists = { ...DEFAULT_PERMS }
  for (const r of roles) {
    const name = r.name as RoleName
    if (ROLES.includes(name) && Array.isArray(r.permissions)) {
      lists[name] = r.permissions as string[]
    }
  }
  return permsToMap(lists)
}

export default function AccessControlPage() {
  const { data: roles, loading, refetch } = useRealtimeTable<EmpRole>("emp_roles", "name", true)
  const [perms, setPerms] = useState<RolePermissions>(() => permsToMap(DEFAULT_PERMS))
  const [editRole, setEditRole] = useState<RoleName | null>(null)
  const [saved, setSaved] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const roleIds = useMemo(() => {
    const map: Partial<Record<RoleName, string>> = {}
    for (const r of roles) {
      if (ROLES.includes(r.name as RoleName)) map[r.name as RoleName] = r.id
    }
    return map
  }, [roles])

  useEffect(() => {
    if (!loading && roles.length > 0) {
      setPerms(mapFromRoles(roles))
    }
  }, [roles, loading])

  useEffect(() => {
    if (loading || seeding || roles.length > 0) return
    let cancelled = false
    ;(async () => {
      setSeeding(true)
      const rows = ROLES.map((name) => ({
        name,
        permissions: DEFAULT_PERMS[name],
      }))
      await supabase.from("emp_roles").insert(rows)
      if (!cancelled) {
        await refetch()
        setSeeding(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loading, roles.length, seeding, refetch])

  const toggle = (role: RoleName, permId: string) => {
    if (role === "Admin") return
    setPerms((prev) => ({
      ...prev,
      [role]: { ...prev[role], [permId]: !prev[role][permId] },
    }))
    setSaved(false)
  }

  const handleSave = async () => {
    for (const role of ROLES) {
      const id = roleIds[role]
      const permissionList = PERMISSIONS.filter((p) => perms[role][p.id]).map((p) => p.id)
      if (id) {
        await supabase.from("emp_roles").update({ permissions: permissionList }).eq("id", id)
      }
    }
    setSaved(true)
    setEditRole(null)
    setTimeout(() => setSaved(false), 2000)
    refetch()
  }

  if (loading || seeding) {
    return (
      <motion.div className="py-16 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Loader2 size={32} className="mx-auto text-gray-300 mb-2 animate-spin" />
        <p className="text-sm text-[#78716C]">{seeding ? "Seeding default roles..." : "Loading roles..."}</p>
      </motion.div>
    )
  }

  return (
    <motion.div className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-[#1C1917]">Roles & Permissions</h1>
          <p className="text-sm text-[#78716C]">Configure access rights per role</p>
        </div>
        {saved && (
          <motion.span
            className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CheckCircle2 size={12} /> Changes saved
          </motion.span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {ROLES.map((role, i) => {
          const count = Object.values(perms[role]).filter(Boolean).length
          return (
            <motion.div
              key={role}
              className={`rounded-xl border p-4 shadow-sm cursor-pointer transition-all ${editRole === role ? "border-[#FF8C5A] ring-2 ring-indigo-200 bg-white" : "border-[#E8E6E1] bg-white"}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setEditRole(editRole === role ? null : role)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${ROLE_STYLE[role]}`}>{role}</span>
                <Shield size={14} className="text-gray-300" />
              </div>
              <p className="text-2xl font-bold text-[#1C1917]">{count}</p>
              <p className="text-xs text-[#78716C]">of {PERMISSIONS.length} permissions</p>
            </motion.div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <p className="text-sm font-semibold text-[#1C1917]">Permission Matrix</p>
          <div className="flex items-center gap-2">
            {editRole && (
              <span className="text-xs text-[#78716C]">
                Editing: <span className={`font-bold ${ROLE_STYLE[editRole].split(" ")[1]}`}>{editRole}</span>
              </span>
            )}
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-lg bg-[#FF6B35] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#FF8C5A]"
            >
              <Save size={12} /> Save
            </button>
          </div>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-[#F5F3EF] border-b border-[#E8E6E1]">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-[#78716C] w-40">Permission</th>
              {ROLES.map((role) => (
                <th key={role} className="px-4 py-3 text-center">
                  <button
                    onClick={() => setEditRole(editRole === role ? null : role)}
                    className={`flex items-center gap-1 mx-auto rounded-lg px-2 py-1 text-[11px] font-bold transition-colors ${editRole === role ? ROLE_STYLE[role] : "text-[#78716C] hover:bg-[#E8E6E1]"}`}
                  >
                    <Edit2 size={9} />
                    {role}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((cat) => (
              <Fragment key={cat}>
                <tr className="bg-[#F5F3EF]/50">
                  <td colSpan={5} className="px-4 py-2 text-[10px] font-bold text-[#78716C] uppercase tracking-wider">
                    {cat}
                  </td>
                </tr>
                {PERMISSIONS.filter((p) => p.category === cat).map((perm) => (
                  <tr key={perm.id} className="border-b border-gray-50 hover:bg-[#F5F3EF]/30">
                    <td className="px-4 py-2.5 text-[#1C1917]">
                      <span className="flex items-center gap-1.5">
                        <Lock size={10} className="text-gray-300 shrink-0" />
                        {perm.label}
                      </span>
                    </td>
                    {ROLES.map((role) => (
                      <td key={role} className="px-4 py-2.5 text-center">
                        <button
                          disabled={role === "Admin"}
                          onClick={() => toggle(role, perm.id)}
                          className={`mx-auto flex h-5 w-5 items-center justify-center rounded-full transition-colors ${perms[role][perm.id] ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200" : "bg-[#E8E6E1] text-gray-300 hover:bg-gray-200"} disabled:cursor-default`}
                        >
                          {perms[role][perm.id] ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
