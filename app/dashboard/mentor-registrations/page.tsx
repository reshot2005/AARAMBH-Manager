"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CheckCircle2, XCircle, Mail, Phone, Building2, Briefcase } from "lucide-react"
import { usePermissions } from "@/lib/use-permissions"

type Registration = {
  id: string
  name: string
  email: string
  phone: string
  department: string
  role: string
  photo: string
  status: "Pending" | "Approved" | "Rejected"
  rejection_reason?: string
  created_at: string
}

type Tab = "Pending" | "Approved" | "Rejected"

export default function MentorRegistrationsPage() {
  const { can, isAdmin, isSuperAdmin } = usePermissions()
  const [tab, setTab] = useState<Tab>("Pending")
  const [rows, setRows] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/emp/mentor-registrations?status=${tab}`, { credentials: "include" })
      if (res.ok) setRows(await res.json())
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    if (isAdmin || isSuperAdmin) void load()
  }, [load, isAdmin, isSuperAdmin])

  const review = async (id: string, action: "approve" | "reject") => {
    const res = await fetch(`/api/emp/mentor-registrations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action, rejectionReason: rejectReason }),
    })
    if (res.ok) {
      setRejectId(null)
      setRejectReason("")
      void load()
    }
  }

  const tabs: Tab[] = ["Pending", "Approved", "Rejected"]

  if (!isAdmin && !isSuperAdmin) {
    return <p className="text-sm text-[#78716C]">You do not have access to this page.</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1C1917]">Mentor Registrations</h1>
        <p className="text-sm text-[#78716C]">Review and approve mentor signup requests</p>
      </div>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === t ? "bg-[#FF6B35] text-white" : "bg-white border border-[#E8E6E1] text-[#78716C]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-[#78716C]">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-[#E8E6E1] bg-white p-8 text-center text-sm text-[#78716C]">
          No {tab.toLowerCase()} registrations
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((r) => (
            <div key={r.id} className="rounded-xl border border-[#E8E6E1] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-[#1C1917]">{r.name}</h3>
                  <p className="text-xs text-[#78716C]">
                    Applied {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    r.status === "Pending"
                      ? "bg-amber-50 text-amber-700"
                      : r.status === "Approved"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                  }`}
                >
                  {r.status}
                </span>
              </div>
              <div className="mt-4 space-y-2 text-sm text-[#57534E]">
                <p className="flex items-center gap-2">
                  <Mail size={14} /> {r.email}
                </p>
                {r.phone && (
                  <p className="flex items-center gap-2">
                    <Phone size={14} /> {r.phone}
                  </p>
                )}
                {r.department && (
                  <p className="flex items-center gap-2">
                    <Building2 size={14} /> {r.department}
                  </p>
                )}
                {r.role && (
                  <p className="flex items-center gap-2">
                    <Briefcase size={14} /> {r.role}
                  </p>
                )}
              </div>
              {tab === "Pending" && can("approve") && (
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void review(r.id, "approve")}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    <CheckCircle2 size={16} /> Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejectId(r.id)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="font-semibold text-[#1C1917]">Reject registration</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Optional rejection reason"
              className="mt-3 w-full rounded-lg border border-[#E8E6E1] p-3 text-sm"
              rows={3}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setRejectId(null)} className="rounded-lg px-4 py-2 text-sm">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void review(rejectId, "reject")}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
              >
                Confirm reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
