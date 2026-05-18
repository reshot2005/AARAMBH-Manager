"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Search, MessageSquare, Clock, CheckCircle2, X, Send, Users, Loader2 } from "lucide-react"
import { useRealtimeTable } from "@/lib/use-realtime"
import type { EmpEnquiry, EmpEmployee } from "@/lib/emp-types"
import { avatarColor, initials, priorityDbToUi } from "@/lib/emp-utils"
import { updateEnquiry, insertEnquiry } from "@/lib/emp-actions"

type TicketStatus = "open" | "in_progress" | "resolved" | "closed"
type TicketPriority = "low" | "medium" | "high" | "urgent"

interface Ticket {
  id: string
  subject: string
  submitter: string
  avatar: string
  department: string
  priority: TicketPriority
  status: TicketStatus
  description: string
  createdAt: string
}

const STATUS_STYLE: Record<TicketStatus, string> = {
  open: "bg-[#FFF1EA] text-amber-700",
  in_progress: "bg-[#E8E6E1] text-blue-700",
  resolved: "bg-emerald-50 text-emerald-700",
  closed: "bg-[#E8E6E1] text-[#78716C]",
}

const PRIORITY_STYLE: Record<TicketPriority, string> = {
  low: "bg-[#E8E6E1] text-[#78716C]",
  medium: "bg-[#FFF1EA] text-amber-700",
  high: "bg-orange-50 text-orange-700",
  urgent: "bg-red-50 text-red-700",
}

export default function EnquiriesPage() {
  const { data: raw, loading } = useRealtimeTable<EmpEnquiry>("emp_enquiries")
  const { data: employees } = useRealtimeTable<EmpEmployee>("emp_employees")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all")
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [reply, setReply] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [newSubject, setNewSubject] = useState("")
  const [newIssueType, setNewIssueType] = useState("General Support")
  const [newMessage, setNewMessage] = useState("")

  const empMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees])

  const tickets = useMemo<Ticket[]>(
    () =>
      raw.map((t) => {
        const emp = t.employee_id ? empMap.get(t.employee_id) : null
        const name = emp?.name || "Unknown"
        return {
          id: t.id,
          subject: t.subject,
          submitter: name,
          avatar: initials(name),
          department: t.department || emp?.department || "—",
          priority: priorityDbToUi(t.priority),
          status: t.status,
          description: t.message,
          createdAt: new Date(t.created_at).toLocaleDateString(),
        }
      }),
    [raw, empMap]
  )

  const visible = useMemo(
    () =>
      tickets.filter((t) => {
        const q = search.toLowerCase()
        return (
          (t.subject.toLowerCase().includes(q) || t.submitter.toLowerCase().includes(q)) &&
          (statusFilter === "all" || t.status === statusFilter)
        )
      }),
    [tickets, search, statusFilter]
  )

  const stats = useMemo(
    () => ({
      open: tickets.filter((t) => t.status === "open").length,
      inProgress: tickets.filter((t) => t.status === "in_progress").length,
      resolved: tickets.filter((t) => t.status === "resolved").length,
    }),
    [tickets]
  )

  const updateStatus = async (id: string, status: TicketStatus) => {
    await updateEnquiry(id, { status })
    setSelected(null)
  }

  const handleCreate = async () => {
    if (!newSubject.trim() || !newMessage.trim()) return
    await insertEnquiry({
      subject: `[${newIssueType}] ${newSubject.trim()}`,
      message: newMessage.trim(),
      department: newIssueType === 'Operational Failure' ? 'Operations Audit' : '',
      status: "open",
      priority: newIssueType.includes('Failure') || newIssueType === 'Coordinator MIA' ? "high" : "normal",
    })
    setNewSubject("")
    setNewMessage("")
    setNewIssueType("General Support")
    setCreateOpen(false)
  }

  if (loading) {
    return (
      <motion.div className="py-16 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Loader2 size={32} className="mx-auto text-gray-300 mb-2 animate-spin" />
        <p className="text-sm text-[#78716C]">Loading enquiries…</p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1C1917]">Internal Help Desk</h1>
          <p className="text-sm text-[#78716C]">Employee support tickets and inquiries</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-[#FF6B35] px-3 py-2 text-xs font-medium text-white hover:bg-[#FF8C5A]"
        >
          <Plus size={14} /> New Ticket
        </button>
      </div>

      <motion.div className="grid grid-cols-3 gap-3" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
        {[
          { label: "Open", value: stats.open, color: "bg-[#FFF1EA] text-[#F97316]" },
          { label: "In Progress", value: stats.inProgress, color: "bg-[#E8E6E1] text-[#FF8C5A]" },
          { label: "Resolved", value: stats.resolved, color: "bg-emerald-50 text-emerald-600" },
        ].map((s) => (
          <motion.div
            key={s.label}
            className="bg-white rounded-xl border border-[#E8E6E1] p-4 shadow-sm"
            variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
          >
            <p className="text-2xl font-bold text-[#1C1917]">{s.value}</p>
            <p className={`text-xs font-medium ${s.color.split(" ")[1]}`}>{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
          <input
            type="text"
            placeholder="Search tickets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#E8E6E1] pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FF8C5A]/40"
          />
        </div>
        {(["all", "open", "in_progress", "resolved", "closed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === f ? "bg-[#FF6B35] text-white" : "bg-white border border-[#E8E6E1] text-[#78716C] hover:bg-[#F5F3EF]"}`}
          >
            {f === "all" ? "All" : f.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {visible.map((t, i) => (
            <motion.div
              key={t.id}
              className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm p-4 cursor-pointer hover:border-indigo-200"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setSelected(t)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`h-9 w-9 shrink-0 rounded-full ${avatarColor(t.id)} flex items-center justify-center text-xs font-bold text-white`}>
                    {t.avatar}
                  </div>
                  <motion.div whileHover={{ x: 2 }}>
                    <p className="text-sm font-semibold text-[#1C1917]">{t.subject}</p>
                    <p className="text-xs text-[#78716C]">
                      {t.submitter} · {t.department} · {t.createdAt}
                    </p>
                    <p className="text-xs text-[#78716C] mt-0.5 truncate max-w-xs">{t.description}</p>
                  </motion.div>
                </div>
                <motion.div className="flex items-center gap-2 shrink-0" whileHover={{ scale: 1.02 }}>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORITY_STYLE[t.priority]}`}>
                    {t.priority}
                  </span>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[t.status]}`}>
                    {t.status.replace("_", " ")}
                  </span>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {visible.length === 0 && (
          <motion.div className="py-16 text-center bg-white rounded-xl border border-[#E8E6E1]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Users size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-[#78716C]">No tickets found.</p>
          </motion.div>
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
              className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#E8E6E1] px-5 py-4">
                <h2 className="text-sm font-semibold text-[#1C1917]">{selected.subject}</h2>
                <button onClick={() => setSelected(null)} className="rounded-lg p-1.5 text-[#78716C] hover:bg-[#E8E6E1]">
                  <X size={16} />
                </button>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORITY_STYLE[selected.priority]}`}>
                    {selected.priority}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[selected.status]}`}>
                    {selected.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-sm text-[#1C1917] bg-[#F5F3EF] rounded-lg p-3">{selected.description}</p>
                <div className="relative">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={2}
                    placeholder="Type a reply…"
                    className="w-full rounded-lg border border-[#E8E6E1] px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-[#FF8C5A]/40"
                  />
                  <button className="absolute right-2 bottom-2 text-[#FF6B35] hover:text-[#FF8C5A]">
                    <Send size={14} />
                  </button>
                </div>
              </div>
              <div className="flex gap-2 justify-end border-t border-[#E8E6E1] px-5 py-3">
                {selected.status !== "resolved" && (
                  <button
                    onClick={() => updateStatus(selected.id, "resolved")}
                    className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    <CheckCircle2 size={12} /> Resolve
                  </button>
                )}
                {selected.status === "open" && (
                  <button
                    onClick={() => updateStatus(selected.id, "in_progress")}
                    className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    <Clock size={12} /> In Progress
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <motion.div className="flex items-center justify-between border-b border-[#E8E6E1] px-5 py-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-sm font-semibold text-[#1C1917]">New Ticket</h2>
                <button onClick={() => setCreateOpen(false)} className="rounded-lg p-1.5 text-[#78716C] hover:bg-[#E8E6E1]">
                  <X size={16} />
                </button>
              </motion.div>
              <div className="px-5 py-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#78716C] mb-1">Issue Type</label>
                  <select
                    value={newIssueType}
                    onChange={(e) => setNewIssueType(e.target.value)}
                    className="w-full rounded-lg border border-[#E8E6E1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FF8C5A]/40"
                  >
                    <option value="General Support">General Support</option>
                    <option value="Mentor not updating">Mentor not updating daily logs</option>
                    <option value="Coordinator MIA">Coordinator MIA (Missing in Action)</option>
                    <option value="Buddy escalation">Buddy escalation</option>
                    <option value="Access Request">Access Request</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#78716C] mb-1">Subject</label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full rounded-lg border border-[#E8E6E1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FF8C5A]/40"
                    placeholder="Brief subject line"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#78716C] mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="w-full rounded-lg border border-[#E8E6E1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FF8C5A]/40"
                    placeholder="Describe your issue…"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-[#E8E6E1] px-5 py-3">
                <button onClick={() => setCreateOpen(false)} className="rounded-lg border border-[#E8E6E1] px-4 py-2 text-sm text-[#78716C] hover:bg-[#F5F3EF]">
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-medium text-white hover:bg-[#FF8C5A]"
                >
                  Submit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
