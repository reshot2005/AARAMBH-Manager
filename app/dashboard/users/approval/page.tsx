"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Eye,
  X,
  Mail,
  Phone,
  Building2,
  Briefcase,
  CalendarDays,
} from "lucide-react"
import { useRealtimeTable } from "@/lib/use-realtime"
import type { EmpEmployee } from "@/lib/emp-types"
import { approvalStatusFromEmployee, approvalToDbStatus, avatarColor, initials } from "@/lib/emp-utils"
import { usePermissions } from "@/lib/use-permissions"

type ApprovalStatus = "pending" | "approved" | "rejected" | "hold"

const CANDIDATE_STATUSES = ["Pending", "Offer Sent", "On Hold", "Rejected"] as const

interface Candidate {
  id: string
  name: string
  email: string
  phone: string
  department: string
  roleApplied: string
  status: ApprovalStatus
  appliedAt: string
  note: string
  avatar: string
}

const STATUS_STYLE: Record<ApprovalStatus, string> = {
  pending: "bg-[#FFF1EA] text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  hold: "bg-[#E8E6E1] text-blue-700",
}

const STATUS_ICON: Record<ApprovalStatus, typeof Clock> = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
  hold: Clock,
}

export default function UserApprovalPage() {
  const { can } = usePermissions()
  const { data: rawEmployees, loading } = useRealtimeTable<EmpEmployee>("emp_employees")
  const [filter, setFilter] = useState<ApprovalStatus | "all">("pending")
  const [selected, setSelected] = useState<Candidate | null>(null)
  const [rejectNote, setRejectNote] = useState("")

  const candidates = useMemo<Candidate[]>(
    () =>
      rawEmployees
        .filter((e) => CANDIDATE_STATUSES.includes(e.status as (typeof CANDIDATE_STATUSES)[number]))
        .map((e) => ({
          id: e.id,
          name: e.name,
          email: e.email || "",
          phone: e.phone,
          department: e.department,
          roleApplied: e.role,
          status: approvalStatusFromEmployee(e),
          appliedAt: e.created_at ? new Date(e.created_at).toLocaleDateString() : "—",
          note: e.follow_up_comment || "",
          avatar: initials(e.name),
        })),
    [rawEmployees]
  )

  const stats = useMemo(
    () => ({
      pending: candidates.filter((c) => c.status === "pending").length,
      approved: candidates.filter((c) => c.status === "approved").length,
      rejected: candidates.filter((c) => c.status === "rejected").length,
      hold: candidates.filter((c) => c.status === "hold").length,
    }),
    [candidates]
  )

  const visible = useMemo(
    () => (filter === "all" ? candidates : candidates.filter((c) => c.status === filter)),
    [candidates, filter]
  )

  const update = async (id: string, status: ApprovalStatus, note = "") => {
    try {
      await fetch("/api/emp/employees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id,
          status: approvalToDbStatus(status),
          follow_up_comment: note,
        }),
      })
    } catch (err) {
      console.error(err)
    }
    setSelected(null)
    setRejectNote("")
  }

  const STAT_CARDS = [
    { label: "Pending", value: stats.pending, color: "bg-[#FFF1EA] text-[#F97316]", status: "pending" as const },
    { label: "Approved", value: stats.approved, color: "bg-emerald-50 text-emerald-600", status: "approved" as const },
    { label: "On Hold", value: stats.hold, color: "bg-[#E8E6E1] text-[#FF8C5A]", status: "hold" as const },
    { label: "Rejected", value: stats.rejected, color: "bg-red-50 text-red-600", status: "rejected" as const },
  ]

  if (loading) {
    return (
      <motion.div className="py-16 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Users size={32} className="mx-auto text-gray-300 mb-2 animate-pulse" />
        <p className="text-sm text-[#78716C]">Loading candidates…</p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-5">
      <motion.div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1C1917]">Candidate Approvals</h1>
          <p className="text-sm text-[#78716C]">Review and approve new employee applications</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {STAT_CARDS.map((s, i) => (
          <motion.button
            key={s.label}
            onClick={() => setFilter(s.status)}
            className={`rounded-xl border p-4 text-left shadow-sm transition-all ${filter === s.status ? "border-[#FF8C5A] ring-2 ring-indigo-200" : "border-[#E8E6E1] bg-white"}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <p className="text-2xl font-bold text-[#1C1917]">{s.value}</p>
            <p className={`text-xs font-medium mt-0.5 ${s.color.split(" ")[1]}`}>{s.label}</p>
          </motion.button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "approved", "hold", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${filter === f ? "bg-[#FF6B35] text-white" : "bg-white border border-[#E8E6E1] text-[#78716C] hover:bg-[#F5F3EF]"}`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence>
          {visible.map((c, i) => {
            const SIcon = STATUS_ICON[c.status]
            return (
              <motion.div
                key={c.id}
                className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm p-4 flex flex-col gap-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`h-10 w-10 shrink-0 rounded-full ${avatarColor(c.id)} flex items-center justify-center text-xs font-bold text-white`}
                    >
                      {c.avatar}
                    </div>
                    <motion.div>
                      <p className="text-sm font-semibold text-[#1C1917]">{c.name}</p>
                      <p className="text-xs text-[#78716C] flex items-center gap-1">
                        <Briefcase size={10} />
                        {c.roleApplied}
                      </p>
                    </motion.div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[c.status]}`}
                  >
                    <SIcon size={10} />
                    {c.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-xs text-[#78716C]">
                  <span className="flex items-center gap-1">
                    <Mail size={10} />
                    {c.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone size={10} />
                    {c.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 size={10} />
                    {c.department}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays size={10} />
                    {c.appliedAt}
                  </span>
                </div>

                {c.note && <p className="text-[11px] text-[#78716C] italic">Note: {c.note}</p>}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setSelected(c)}
                    className="flex items-center gap-1 rounded-lg border border-[#E8E6E1] px-2.5 py-1.5 text-xs text-[#78716C] hover:bg-[#F5F3EF]"
                  >
                    <Eye size={12} /> View
                  </button>
                  {c.status === "pending" && (
                    <>
                      <button
                        onClick={() => update(c.id, "approved")}
                        className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                      >
                        <CheckCircle2 size={12} /> Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelected(c)
                          setRejectNote("")
                        }}
                        className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                      >
                        <XCircle size={12} /> Reject
                      </button>
                      <button
                        onClick={() => update(c.id, "hold")}
                        className="flex items-center gap-1 rounded-lg bg-[#E8E6E1] px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                      >
                        <Clock size={12} /> Hold
                      </button>
                    </>
                  )}
                  {c.status === "rejected" && (
                    <button
                      onClick={() => update(c.id, "pending")}
                      className="flex items-center gap-1 rounded-lg bg-[#FFF1EA] px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
                    >
                      Reconsider
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        {visible.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <Users size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-[#78716C]">No candidates in this category.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#E8E6E1] px-5 py-4">
                <h2 className="text-sm font-semibold text-[#1C1917]">Candidate Detail</h2>
                <button onClick={() => setSelected(null)} className="rounded-lg p-1.5 text-[#78716C] hover:bg-[#E8E6E1]">
                  <X size={16} />
                </button>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center gap-3">
                  <motion.div
                    className={`h-12 w-12 shrink-0 rounded-full ${avatarColor(selected.id)} flex items-center justify-center text-sm font-bold text-white`}
                  >
                    {selected.avatar}
                  </motion.div>
                  <div>
                    <p className="font-semibold text-[#1C1917]">{selected.name}</p>
                    <p className="text-xs text-[#78716C]">{selected.roleApplied}</p>
                  </div>
                </div>
                <motion.div className="grid grid-cols-2 gap-2 text-xs text-[#78716C]">
                  <p>Email: {selected.email}</p>
                  <p>Phone: {selected.phone}</p>
                  <p>Dept: {selected.department}</p>
                  <p>Applied: {selected.appliedAt}</p>
                </motion.div>
                {selected.status === "pending" && (
                  <div>
                    <label className="block text-xs font-medium text-[#78716C] mb-1">Rejection reason (optional)</label>
                    <textarea
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-[#E8E6E1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FF8C5A]/40"
                      placeholder="e.g. Position filled, incomplete profile…"
                    />
                  </div>
                )}
              </div>
              {selected.status === "pending" && (
                <div className="flex gap-2 justify-end border-t border-[#E8E6E1] px-5 py-3">
                  <button
                    onClick={() => update(selected.id, "approved")}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => update(selected.id, "rejected", rejectNote)}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

