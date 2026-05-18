"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, Clock, Shield, Lock, Eye, X, Users } from "lucide-react"
import { useRealtimeTable } from "@/lib/use-realtime"
import type { EmpAccessRequest } from "@/lib/emp-types"
import { avatarColor, initials, timeAgo } from "@/lib/emp-utils"
import { updateAccessRequest } from "@/lib/emp-actions"

type ReqStatus = "pending" | "approved" | "rejected"

interface AccessRequest {
  id: string
  requester: string
  avatar: string
  department: string
  requestedRole: string
  currentRole: string
  reason: string
  status: ReqStatus
  requestedAt: string
}

const STATUS_STYLE: Record<ReqStatus, string> = {
  pending: "bg-[#FFF1EA] text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
}

export default function AccessRequestsPage() {
  const { data: raw, loading } = useRealtimeTable<EmpAccessRequest>("emp_access_requests")
  const [filter, setFilter] = useState<ReqStatus | "all">("pending")
  const [selected, setSelected] = useState<AccessRequest | null>(null)

  const requests = useMemo<AccessRequest[]>(
    () =>
      raw.map((r) => ({
        id: r.id,
        requester: r.requester_name,
        avatar: initials(r.requester_name),
        department: r.requester_email.split("@")[1]?.split(".")[0] || "—",
        requestedRole: r.requested_role,
        currentRole: "Employee",
        reason: r.reason,
        status: r.status,
        requestedAt: timeAgo(r.created_at),
      })),
    [raw]
  )

  const visible = useMemo(
    () => (filter === "all" ? requests : requests.filter((r) => r.status === filter)),
    [requests, filter]
  )

  const stats = useMemo(
    () => ({
      pending: requests.filter((r) => r.status === "pending").length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
    }),
    [requests]
  )

  const update = async (id: string, status: ReqStatus) => {
    try {
      await updateAccessRequest(id, { status, reviewed_by: "Admin" })
    } catch (err) {
      console.error(err)
    }
    setSelected(null)
  }

  if (loading) {
    return (
      <motion.div className="py-16 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Shield size={32} className="mx-auto text-gray-300 mb-2 animate-pulse" />
        <p className="text-sm text-[#78716C]">Loading access requests…</p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#1C1917]">Access Requests</h1>
        <p className="text-sm text-[#78716C]">Review and manage role elevation requests</p>
      </div>

      <motion.div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pending", value: stats.pending, color: "bg-[#FFF1EA] text-[#F97316]", status: "pending" as const },
          { label: "Approved", value: stats.approved, color: "bg-emerald-50 text-emerald-600", status: "approved" as const },
          { label: "Rejected", value: stats.rejected, color: "bg-red-50 text-red-600", status: "rejected" as const },
        ].map((s, i) => (
          <motion.button
            key={s.label}
            onClick={() => setFilter(s.status)}
            className={`rounded-xl border p-4 text-left shadow-sm transition-all ${filter === s.status ? "border-[#FF8C5A] ring-2 ring-indigo-200 bg-white" : "border-[#E8E6E1] bg-white"}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -2 }}
          >
            <p className="text-2xl font-bold text-[#1C1917]">{s.value}</p>
            <p className={`text-xs font-medium ${s.color.split(" ")[1]}`}>{s.label}</p>
          </motion.button>
        ))}
      </motion.div>

      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${filter === f ? "bg-[#FF6B35] text-white" : "bg-white border border-[#E8E6E1] text-[#78716C] hover:bg-[#F5F3EF]"}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {visible.map((req, i) => (
            <motion.div
              key={req.id}
              className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm p-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <motion.div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`h-10 w-10 shrink-0 rounded-full ${avatarColor(req.id)} flex items-center justify-center text-xs font-bold text-white`}
                  >
                    {req.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1C1917]">{req.requester}</p>
                    <p className="text-xs text-[#78716C]">
                      {req.currentRole} → <span className="font-medium text-[#FF6B35]">{req.requestedRole}</span>
                    </p>
                  </div>
                </div>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[req.status]}`}>
                  {req.status}
                </span>
              </motion.div>
              <p className="mt-2 text-xs text-[#78716C] line-clamp-2">{req.reason}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] text-[#78716C]">{req.requestedAt}</span>
                <motion.div className="flex gap-2">
                  <button
                    onClick={() => setSelected(req)}
                    className="flex items-center gap-1 rounded-lg border border-[#E8E6E1] px-2.5 py-1.5 text-xs text-[#78716C] hover:bg-[#F5F3EF]"
                  >
                    <Eye size={12} /> Details
                  </button>
                  {req.status === "pending" && (
                    <>
                      <button
                        onClick={() => update(req.id, "approved")}
                        className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                      >
                        <CheckCircle2 size={12} /> Approve
                      </button>
                      <button
                        onClick={() => update(req.id, "rejected")}
                        className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                      >
                        <XCircle size={12} /> Reject
                      </button>
                    </>
                  )}
                </motion.div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {visible.length === 0 && (
          <div className="py-16 text-center bg-white rounded-xl border border-[#E8E6E1]">
            <Users size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-[#78716C]">No access requests found.</p>
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
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#E8E6E1] px-5 py-4">
                <h2 className="text-sm font-semibold text-[#1C1917]">Request Details</h2>
                <button onClick={() => setSelected(null)} className="rounded-lg p-1.5 text-[#78716C] hover:bg-[#E8E6E1]">
                  <X size={16} />
                </button>
              </div>
              <div className="px-5 py-4 space-y-3 text-sm">
                <p>
                  <span className="text-[#78716C]">Requester:</span> {selected.requester}
                </p>
                <p>
                  <span className="text-[#78716C]">Role change:</span> {selected.currentRole} → {selected.requestedRole}
                </p>
                <p>
                  <span className="text-[#78716C]">Reason:</span> {selected.reason}
                </p>
                <p className="flex items-center gap-1 text-xs text-[#78716C]">
                  <Lock size={12} /> Requested {selected.requestedAt}
                </p>
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
                    onClick={() => update(selected.id, "rejected")}
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
