"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Trophy, Medal, Star, Users, TrendingUp, Building2, Loader2 } from "lucide-react"
import { useRealtimeTable } from "@/lib/use-realtime"
import type { EmpMentor } from "@/lib/emp-types"
import { avatarColor, initials } from "@/lib/emp-utils"

interface LeaderRow {
  id: string
  name: string
  role: string
  department: string
  avatar: string
  assignedCount: number
  avgScore: number
  rating: number
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-[#F97316]"><Trophy size={18} /></span>
  if (rank === 2) return <span className="text-[#78716C]"><Medal size={16} /></span>
  if (rank === 3) return <span className="text-orange-400"><Medal size={16} /></span>
  return <span className="text-xs font-bold text-[#78716C]">#{rank}</span>
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={10} className={n <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"} />
      ))}
      <span className="ml-1 text-[11px] text-[#78716C]">{rating}</span>
    </span>
  )
}

export default function LeaderboardPage() {
  const { data: mentors, loading } = useRealtimeTable<EmpMentor>("emp_mentors", "assigned_count", false)
  const [tab, setTab] = useState<"Mentor" | "Coordinator" | "all">("all")

  const leaders = useMemo<LeaderRow[]>(
    () =>
      mentors.map((m) => {
        const isCoord = m.role?.toLowerCase().includes("coordinator")
        const assigned = m.assigned_count || 0
        return {
          id: m.id,
          name: m.name,
          role: isCoord ? "Coordinator" : "Mentor",
          department: m.role?.split("·")[1]?.trim() || m.role || "—",
          avatar: initials(m.name),
          assignedCount: assigned,
          avgScore: Math.min(100, 70 + assigned * 3),
          rating: Math.min(5, 3.5 + assigned * 0.15),
        }
      }),
    [mentors]
  )

  const sorted = useMemo(() => {
    const list = tab === "all" ? leaders : leaders.filter((l) => l.role === tab)
    return [...list].sort((a, b) => b.assignedCount - a.assignedCount)
  }, [leaders, tab])

  const stats = useMemo(
    () => ({
      totalMentors: leaders.filter((l) => l.role === "Mentor").length,
      totalCoords: leaders.filter((l) => l.role === "Coordinator").length,
      avgScore: leaders.length ? Math.round(leaders.reduce((s, l) => s + l.avgScore, 0) / leaders.length) : 0,
      totalAssigned: leaders.reduce((s, l) => s + l.assignedCount, 0),
    }),
    [leaders]
  )

  if (loading) {
    return (
      <motion.div className="py-16 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Loader2 size={32} className="mx-auto text-gray-300 mb-2 animate-spin" />
        <p className="text-sm text-[#78716C]">Loading mentors...</p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-[#1C1917]">Mentors & Coordinators</h1>
        <p className="text-sm text-[#78716C]">Performance leaderboard for mentors and coordinators</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Mentors", value: stats.totalMentors, icon: Star, color: "bg-[#FFF1EA] text-[#F97316]" },
          { label: "Coordinators", value: stats.totalCoords, icon: Users, color: "bg-[#FFF1EA] text-[#FF6B35]" },
          { label: "Avg Team Score", value: `${stats.avgScore}`, icon: TrendingUp, color: "bg-emerald-50 text-emerald-600" },
          { label: "Total Assigned", value: stats.totalAssigned, icon: Building2, color: "bg-[#F3EBDC] text-[#C8A96E]" },
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

      <div className="flex gap-2">
        {(["all", "Mentor", "Coordinator"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${tab === t ? "bg-[#FF6B35] text-white" : "bg-white border border-[#E8E6E1] text-[#78716C] hover:bg-[#F5F3EF]"}`}
          >
            {t === "all" ? "All" : `${t}s`}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <motion.div className="py-16 text-center bg-white rounded-xl border border-[#E8E6E1]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Star size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-[#78716C]">No mentors or coordinators found.</p>
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {sorted.slice(0, 3).map((leader, i) => (
              <motion.div
                key={leader.id}
                className={`bg-white rounded-xl border p-4 text-center shadow-sm ${i === 0 ? "border-amber-200 ring-1 ring-amber-100" : "border-[#E8E6E1]"}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="flex justify-center mb-2">
                  <RankBadge rank={i + 1} />
                </div>
                <div className={`mx-auto h-12 w-12 rounded-full ${avatarColor(leader.id)} flex items-center justify-center text-sm font-bold text-white mb-2`}>
                  {leader.avatar}
                </div>
                <p className="text-xs font-semibold text-[#1C1917] truncate">{leader.name}</p>
                <p className="text-[10px] text-[#78716C]">
                  {leader.role} · {leader.department}
                </p>
                <p className="mt-1 text-lg font-bold text-[#FF6B35]">{leader.assignedCount}</p>
                <p className="text-[10px] text-[#78716C]">assigned</p>
                <div className="mt-1 flex justify-center">
                  <Stars rating={leader.rating} />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#F5F3EF] border-b border-[#E8E6E1]">
                <tr>
                  {["Rank", "Name", "Role", "Assigned", "Score", "Rating"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#78716C]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((leader, i) => (
                  <motion.tr
                    key={leader.id}
                    className="border-b border-gray-50 hover:bg-[#F5F3EF]/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <td className="px-4 py-3 w-12">
                      <RankBadge rank={i + 1} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <motion.div className={`h-8 w-8 shrink-0 rounded-full ${avatarColor(leader.id)} flex items-center justify-center text-xs font-bold text-white`}>
                          {leader.avatar}
                        </motion.div>
                        <span className="text-sm font-medium text-[#1C1917]">{leader.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${leader.role === "Mentor" ? "bg-[#FFF1EA] text-amber-700" : "bg-[#FFF1EA] text-[#FF8C5A]"}`}
                      >
                        {leader.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#78716C]">{leader.assignedCount}</td>
                    <td className="px-4 py-3 text-xs font-bold text-[#1C1917]">{leader.avgScore}</td>
                    <td className="px-4 py-3">
                      <Stars rating={leader.rating} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
