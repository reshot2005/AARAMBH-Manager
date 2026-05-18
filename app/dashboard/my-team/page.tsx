"use client"

import { useMemo, useState } from "react"
import { useRealtimeTable } from "@/lib/use-realtime"
import type { EmpEmployee } from "@/lib/emp-types"
import { useAuth } from "@/lib/auth-context"
import { avatarColor, dbStatusToUi, initials } from "@/lib/emp-utils"
import { Users, Search } from "lucide-react"

export default function MyTeamPage() {
  const { user } = useAuth()
  const mentorId = (user as { mentorId?: string } | null)?.mentorId
  const filters = useMemo(
    () => (mentorId ? { mentor_id: mentorId } : undefined),
    [mentorId]
  )

  const { data: rawEmployees, loading } = useRealtimeTable<EmpEmployee>(
    "emp_employees",
    "created_at",
    false,
    filters
  )

  const [search, setSearch] = useState("")

  const team = useMemo(() => {
    const q = search.toLowerCase()
    return rawEmployees.filter(
      (e) =>
        !q ||
        e.name.toLowerCase().includes(q) ||
        (e.email || "").toLowerCase().includes(q)
    )
  }, [rawEmployees, search])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1C1917]">My Team</h1>
        <p className="text-sm text-[#78716C]">Employees assigned to you</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" size={16} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search team…"
          className="w-full rounded-lg border border-[#E8E6E1] bg-white py-2 pl-9 pr-4 text-sm"
        />
      </div>

      {loading ? (
        <p className="text-sm text-[#78716C]">Loading team…</p>
      ) : team.length === 0 ? (
        <div className="rounded-xl border border-[#E8E6E1] bg-white p-10 text-center">
          <Users className="mx-auto text-[#A8A29E]" size={32} />
          <p className="mt-2 text-sm text-[#78716C]">No team members yet</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {team.map((e) => (
            <div key={e.id} className="flex items-center gap-4 rounded-xl border border-[#E8E6E1] bg-white p-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(e.name)}`}
              >
                {initials(e.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[#1C1917] truncate">{e.name}</p>
                <p className="text-xs text-[#78716C] truncate">{e.role} · {e.department}</p>
              </div>
              <span className="rounded-full bg-[#FFF1EA] px-2 py-0.5 text-[10px] font-medium text-amber-800">
                {dbStatusToUi(e.status)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
