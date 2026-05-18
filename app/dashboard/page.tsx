"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users,
  UserCheck,
  TrendingUp,
  GraduationCap,
  MoreHorizontal,
  X,
  Send,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserPlus,
  Building2,
  Sparkles,
  Activity,
  Star,
  type LucideIcon,
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { useAuth } from "@/lib/auth-context"
import { useRealtimeTable } from "@/lib/use-realtime"
import type { EmpActivityLog, EmpDepartment, EmpEmployee, EmpMentor, EmpOnboardingProgress } from "@/lib/emp-types"
import { deptPerformanceChart, joiningTrend, statusPie, timeAgo } from "@/lib/emp-utils"

type AiMsg = { role: "user" | "assistant"; content: string }

const ACTIVITY_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  created: { icon: UserPlus, color: "text-emerald-500 bg-emerald-50" },
  updated: { icon: CheckCircle2, color: "text-[#FF6B35] bg-[#FFF1EA]" },
  deleted: { icon: AlertTriangle, color: "text-[#F97316] bg-[#FFF1EA]" },
  default: { icon: Activity, color: "text-[#FF8C5A] bg-[#E8E6E1]" },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { data: employees, loading: empLoading } = useRealtimeTable<EmpEmployee>("emp_employees")
  const { data: departments } = useRealtimeTable<EmpDepartment>("emp_departments")
  const { data: mentors } = useRealtimeTable<EmpMentor>("emp_mentors")
  const { data: activity } = useRealtimeTable<EmpActivityLog>("emp_activity_log", "created_at", false)
  const { data: progress } = useRealtimeTable<EmpOnboardingProgress>("emp_onboarding_progress")

  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessage, setChatMessage] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState<AiMsg[]>([
    { role: "assistant", content: "Hi! I'm your AI HR assistant. Ask me anything about your employees, performance, or onboarding." },
  ])
  const chatContentRef = useRef<HTMLDivElement | null>(null)

  const joiningData = useMemo(() => joiningTrend(employees), [employees])
  const statusData = useMemo(() => statusPie(employees), [employees])
  const perfData = useMemo(() => deptPerformanceChart(departments), [departments])

  const stats = useMemo(() => {
    const pending = employees.filter((e) => e.status === "Pending" || e.status === "Offer Sent").length
    const onboarding =
      employees.filter((e) => e.status === "On Hold").length +
      progress.filter((p) => p.status === "in_progress").length
    const avgPerf =
      departments.length > 0
        ? Math.round(departments.reduce((s, d) => s + Number(d.avg_performance), 0) / departments.length)
        : 0
    return {
      total: employees.length,
      pending,
      onboarding,
      mentors: mentors.length,
      avgPerf,
      depts: departments.length,
    }
  }, [employees, departments, mentors, progress])

  const statCards = useMemo(
    () => [
      { label: "Total Employees", icon: Users, color: "bg-[#FFF1EA] text-[#FF6B35]", key: "total", value: stats.total },
      { label: "Pending Approvals", icon: Clock, color: "bg-[#FFF1EA] text-[#F97316]", key: "pending", value: stats.pending },
      { label: "Active Onboardings", icon: GraduationCap, color: "bg-[#F3EBDC] text-[#C8A96E]", key: "onboarding", value: stats.onboarding },
      { label: "Active Mentors", icon: UserCheck, color: "bg-[#E8E6E1] text-[#1C1917]", key: "mentors", value: stats.mentors },
      { label: "Avg Performance", icon: TrendingUp, color: "bg-[#FFE4D6] text-[#FF8C5A]", key: "perf", value: `${stats.avgPerf}%` },
      { label: "Departments", icon: Building2, color: "bg-[#F5F3EF] text-[#78716C]", key: "depts", value: stats.depts },
    ],
    [stats]
  )

  const recentActivity = useMemo(
    () =>
      activity.slice(0, 6).map((a) => {
        const cfg = ACTIVITY_ICONS[a.action] || ACTIVITY_ICONS.default
        return {
          id: a.id,
          icon: cfg.icon,
          color: cfg.color,
          text: a.description || `${a.action} ${a.entity_type}`,
          time: timeAgo(a.created_at),
        }
      }),
    [activity]
  )

  useEffect(() => {
    if (chatContentRef.current)
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight
  }, [chatMessages.length, chatLoading])

  async function handleChatSend() {
    const q = chatMessage.trim()
    if (!q || chatLoading) return
    setChatMessage("")
    setChatLoading(true)
    const userMsg: AiMsg = { role: "user", content: q }
    const assistantMsg: AiMsg = { role: "assistant", content: "" }
    setChatMessages((prev) => [...prev, userMsg, assistantMsg])
    try {
      const res = await fetch("/api/emp/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      })
      if (!res.ok || !res.body) throw new Error("AI request failed")
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      let acc = ""
      while (!done) {
        const { value, done: rd } = await reader.read()
        done = rd
        acc += decoder.decode(value || new Uint8Array(), { stream: !done })
        setChatMessages((prev) => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: "assistant", content: acc }
          return copy
        })
      }
    } catch {
      setChatMessages((prev) => {
        const copy = [...prev]
        copy[copy.length - 1] = { role: "assistant", content: "Sorry, I couldn't get a response right now." }
        return copy
      })
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1917]">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
            {user?.name?.split(" ")[0] || "Admin"}
          </h1>
          <p className="text-sm text-[#78716C] mt-0.5">Here&apos;s what&apos;s happening at Akshara today.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-[#78716C] bg-white border border-[#E8E6E1] rounded-lg px-3 py-2">
          <Activity size={14} className="text-[#FF6B35]" />
          {empLoading ? "Syncing..." : "Live data"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map((card, i) => (
          <motion.div
            key={card.key}
            className="bg-white rounded-xl border border-[#E8E6E1] p-4 shadow-sm"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${card.color.split(" ")[0]}`}>
              <card.icon size={18} className={card.color.split(" ")[1]} />
            </div>
            <p className="mt-3 text-2xl font-bold text-[#1C1917]">{card.value}</p>
            <p className="text-xs text-[#78716C] mt-0.5">{card.label}</p>
          </motion.div>
        ))}
      </div>

      <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          className="lg:col-span-2 bg-white rounded-xl border border-[#E8E6E1] p-5 shadow-sm"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#1C1917]">Employee Joining Trend</h2>
            <span className="text-xs text-[#78716C]">This Year</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={joiningData.length ? joiningData : [{ month: "�", employees: 0 }]} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E6E1" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#78716C" }} />
              <YAxis tick={{ fontSize: 11, fill: "#78716C" }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E8E6E1", fontSize: 12 }} />
              <Line type="monotone" dataKey="employees" stroke="#FF6B35" strokeWidth={2} dot={{ r: 3, fill: "#FF6B35" }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          className="bg-white rounded-xl border border-[#E8E6E1] p-5 shadow-sm"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h2 className="text-sm font-semibold text-[#1C1917] mb-4">Employee Status</h2>
          {statusData.length === 0 ? (
            <p className="text-xs text-[#78716C] py-8 text-center">No employees yet</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={2}>
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1">
                {statusData.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-[#78716C]">{s.name}</span>
                    </span>
                    <span className="font-medium text-[#1C1917]">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>

      <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          className="lg:col-span-2 bg-white rounded-xl border border-[#E8E6E1] p-5 shadow-sm"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#1C1917]">Avg Performance by Department</h2>
            <span className="text-xs text-[#FF6B35] font-medium">Live</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={perfData.length ? perfData : [{ dept: "�", score: 0 }]} margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E6E1" />
              <XAxis dataKey="dept" tick={{ fontSize: 11, fill: "#78716C" }} />
              <YAxis tick={{ fontSize: 11, fill: "#78716C" }} domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E8E6E1", fontSize: 12 }} />
              <Bar dataKey="score" fill="#FF6B35" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          className="bg-white rounded-xl border border-[#E8E6E1] p-5 shadow-sm"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#1C1917]">Recent Activity</h2>
          </div>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-xs text-[#78716C]">No activity yet</p>
            ) : (
              recentActivity.map((item) => (
                <div key={item.id} className="flex items-start gap-2.5">
                  <div className={`mt-0.5 shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${item.color}`}>
                    <item.icon size={11} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-[#1C1917] leading-snug">{item.text}</p>
                    <p className="text-[10px] text-[#78716C] mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {chatOpen && (
          <motion.div
            className="fixed bottom-4 right-4 z-50 w-80 h-[480px] flex flex-col rounded-2xl border border-[#E8E6E1] bg-white shadow-2xl"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
          >
            <div className="flex items-center justify-between border-b border-[#E8E6E1] px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-semibold text-[#1C1917]">HR AI Assistant</span>
                <Sparkles size={12} className="text-[#FF6B35]" />
              </div>
              <button onClick={() => setChatOpen(false)} className="rounded p-1 text-[#78716C] hover:text-[#1C1917]">
                <X size={14} />
              </button>
            </div>
            <div ref={chatContentRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((m, i) => (
                <motion.div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "assistant" && (
                    <div className="h-6 w-6 rounded-full bg-[#FF6B35] flex items-center justify-center shrink-0 text-[10px] font-bold text-white">
                      AI
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-snug ${
                      m.role === "user" ? "bg-[#FF6B35] text-white" : "bg-[#E8E6E1] text-[#1C1917]"
                    }`}
                  >
                    {m.content || "�"}
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="border-t border-[#E8E6E1] px-3 py-2">
              <div className="flex items-center gap-2 rounded-lg bg-[#E8E6E1] px-3 py-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void handleChatSend()}
                  placeholder="Ask about employees�"
                  disabled={chatLoading}
                  className="flex-1 bg-transparent text-sm text-[#1C1917] placeholder:text-[#78716C] outline-none"
                />
                <button
                  onClick={() => void handleChatSend()}
                  disabled={chatLoading || !chatMessage.trim()}
                  className="h-7 w-7 rounded-full bg-[#FF6B35] flex items-center justify-center text-white disabled:opacity-40"
                >
                  <Send size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!chatOpen && (
        <motion.button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full bg-[#FF6B35] text-white shadow-lg flex items-center justify-center hover:bg-[#FF8C5A]"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Open AI HR Assistant"
        >
          <Sparkles size={20} />
        </motion.button>
      )}
    </div>
  )
}

