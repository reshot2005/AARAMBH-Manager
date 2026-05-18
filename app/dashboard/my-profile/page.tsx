"use client"

import { useMemo } from "react"
import { useRealtimeTable } from "@/lib/use-realtime"
import type { EmpEmployee, EmpPerformanceDaily } from "@/lib/emp-types"
import { useAuth } from "@/lib/auth-context"
import { avatarColor, initials } from "@/lib/emp-utils"

export default function MyProfilePage() {
  const { user } = useAuth()
  const employeeId = (user as { employeeId?: string } | null)?.employeeId
  const mentorId = (user as { mentorId?: string } | null)?.mentorId
  const empRole = (user as { empRole?: string } | null)?.empRole

  const employeeFilters = useMemo(
    () => (employeeId ? { id: employeeId } : mentorId ? {} : {}),
    [employeeId, mentorId]
  )

  const { data: employees, loading } = useRealtimeTable<EmpEmployee>(
    "emp_employees",
    "created_at",
    false,
    employeeId ? { id: employeeId } : undefined
  )

  const { data: perfRows } = useRealtimeTable<EmpPerformanceDaily>(
    "emp_performance_daily",
    "date",
    false,
    employeeId ? { employee_id: employeeId } : undefined
  )

  const profile = employees[0]

  if (loading) {
    return <p className="text-sm text-[#78716C]">Loading profile…</p>
  }

  if (!profile && empRole === "employee") {
    return <p className="text-sm text-[#78716C]">Profile not found.</p>
  }

  if (empRole === "mentor" && !profile) {
    return (
      <div className="max-w-lg space-y-4">
        <h1 className="text-2xl font-bold text-[#1C1917]">My Profile</h1>
        <div className="rounded-xl border border-[#E8E6E1] bg-white p-6">
          <p className="text-lg font-semibold">{user?.name}</p>
          <p className="text-sm text-[#78716C]">{user?.email}</p>
          <p className="mt-2 text-sm text-[#57534E]">Mentor account — edit details via admin if needed.</p>
        </div>
      </div>
    )
  }

  if (!profile) return null

  const avgRating =
    perfRows.length > 0
      ? (perfRows.reduce((s, p) => s + (Number(p.score) || 0), 0) / perfRows.length).toFixed(1)
      : "—"

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-2xl border border-[#E8E6E1] bg-white p-8 text-center shadow-sm">
        <div
          className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full text-2xl font-bold text-white ${avatarColor(profile.name)}`}
        >
          {profile.image_url ? (
            <img src={profile.image_url} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            initials(profile.name)
          )}
        </div>
        <h1 className="mt-4 text-2xl font-bold text-[#1C1917]">{profile.name}</h1>
        <p className="text-[#78716C]">{profile.role}</p>
        <span className="mt-2 inline-block rounded-full bg-[#FFF1EA] px-3 py-1 text-xs font-medium text-amber-800">
          {profile.status}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InfoCard label="Department" value={profile.department || "—"} />
        <InfoCard label="Location" value={profile.location || "—"} />
        <InfoCard label="Date of joining" value={profile.date_of_joining || "—"} />
        <InfoCard label="Mentor" value={profile.mentor || "—"} />
        <InfoCard label="Onboarding coordinator" value={profile.onboarding_coordinator || "—"} />
        <InfoCard label="Field coordinator" value={profile.field_coordinator || "—"} />
        <InfoCard label="College" value={profile.college || "—"} />
        <InfoCard label="Offer letter" value={profile.offer_letter_status || "—"} />
        <InfoCard label="Avg. performance rating" value={String(avgRating)} />
      </div>

      {profile.candidate_preferences && (
        <div className="rounded-xl border border-[#E8E6E1] bg-white p-5">
          <h2 className="font-semibold text-[#1C1917]">Preferences</h2>
          <p className="mt-2 text-sm text-[#57534E]">{profile.candidate_preferences}</p>
        </div>
      )}

      <div className="rounded-xl border border-[#E8E6E1] bg-white overflow-hidden">
        <h2 className="border-b border-[#E8E6E1] px-5 py-3 font-semibold text-[#1C1917]">Performance history</h2>
        {perfRows.length === 0 ? (
          <p className="p-5 text-sm text-[#78716C]">No performance entries yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#F5F3EF] text-left text-xs text-[#78716C]">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Rating</th>
                <th className="px-4 py-2">Tasks</th>
                <th className="px-4 py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {perfRows.map((p) => (
                <tr key={p.id} className="border-t border-[#E8E6E1]">
                  <td className="px-4 py-2">{p.date}</td>
                  <td className="px-4 py-2">{p.score}</td>
                  <td className="px-4 py-2">{p.tasks_completed ?? "—"}</td>
                  <td className="px-4 py-2 text-[#57534E]">{p.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E8E6E1] bg-white p-4">
      <p className="text-xs font-medium text-[#78716C]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[#1C1917]">{value}</p>
    </div>
  )
}
