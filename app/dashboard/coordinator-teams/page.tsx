"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Handshake, CheckCircle2, AlertCircle, Search, Users } from "lucide-react"
import { useRealtimeTable } from "@/lib/use-realtime"
import type { EmpEmployee, EmpCoordinator, EmpPerformanceDaily } from "@/lib/emp-types"
import { avatarColor, initials } from "@/lib/emp-utils"

export default function CoordinatorTeamsPage() {
  const { data: coordinators, loading: coordLoading } = useRealtimeTable<EmpCoordinator>("emp_coordinators")
  const { data: employees, loading: empLoading } = useRealtimeTable<EmpEmployee>("emp_employees")
  const { data: performance } = useRealtimeTable<EmpPerformanceDaily>("emp_performance_daily", "date", false)

  const [coordType, setCoordType] = useState<'onboarding' | 'field'>('onboarding')
  const [selectedCoordId, setSelectedCoordId] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const coords = useMemo(() => coordinators.filter(c => c.coordinator_type === coordType), [coordinators, coordType])

  const filteredCoords = useMemo(() => {
    if (!search) return coords
    const q = search.toLowerCase()
    return coords.filter(c => c.name.toLowerCase().includes(q) || c.department.toLowerCase().includes(q))
  }, [coords, search])

  const teamData = useMemo(() => {
    if (!selectedCoordId) return []
    return employees.filter(e =>
      (coordType === 'onboarding' ? e.onboarding_coordinator_id === selectedCoordId : e.field_coordinator_id === selectedCoordId)
      && e.status !== "Rejected"
    )
  }, [employees, selectedCoordId, coordType])

  const selectedCoord = useMemo(() => coords.find(c => c.id === selectedCoordId), [coords, selectedCoordId])

  const handleTabSwitch = (type: 'onboarding' | 'field') => {
    setCoordType(type)
    setSelectedCoordId(null)
    setSearch("")
  }

  if (coordLoading || empLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF6B35] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-4 h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex bg-white rounded-xl border border-[#E8E6E1] p-1.5 shadow-sm self-start">
        <button
          onClick={() => handleTabSwitch('onboarding')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            coordType === 'onboarding' ? 'bg-[#FF6B35] text-white shadow-sm' : 'text-[#78716C] hover:text-[#1C1917] hover:bg-gray-50'
          }`}
        >
          Onboarding Coordinators
        </button>
        <button
          onClick={() => handleTabSwitch('field')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            coordType === 'field' ? 'bg-[#FF6B35] text-white shadow-sm' : 'text-[#78716C] hover:text-[#1C1917] hover:bg-gray-50'
          }`}
        >
          Field Coordinators
        </button>
      </div>

      <div className="flex-1 overflow-hidden bg-white rounded-xl border border-[#E8E6E1] shadow-sm flex">
        {/* Sidebar */}
        <div className="w-1/3 flex flex-col border-r border-[#E8E6E1] bg-[#F9FAFB]">
          <div className="p-4 border-b border-[#E8E6E1]">
            <h2 className="text-lg font-bold text-[#1C1917] flex items-center gap-2">
              <Handshake size={18} className="text-[#FF6B35]"/>
              {coordType === 'onboarding' ? 'Onboarding' : 'Field'} Teams
            </h2>
            <div className="relative mt-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
              <input
                type="text"
                placeholder="Search coordinators..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-[#E8E6E1] pl-8 pr-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#FF8C5A]/40"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredCoords.map(coord => {
              const isSelected = selectedCoordId === coord.id
              const assignedCount = employees.filter(e =>
                (coordType === 'onboarding' ? e.onboarding_coordinator_id === coord.id : e.field_coordinator_id === coord.id)
                && e.status !== "Rejected"
              ).length

              return (
                <button
                  key={coord.id}
                  onClick={() => setSelectedCoordId(coord.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    isSelected ? "bg-[#FFF1EA] border border-[#FF6B35]/20" : "hover:bg-white hover:border-[#E8E6E1] border border-transparent"
                  }`}
                >
                  <div className={`h-10 w-10 shrink-0 rounded-full ${avatarColor(coord.id)} flex items-center justify-center text-sm font-bold text-white`}>
                    {initials(coord.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isSelected ? "text-[#FF6B35]" : "text-[#1C1917]"}`}>
                      {coord.name}
                    </p>
                    <p className="text-xs text-[#78716C] truncate">{coord.department || "No Department"}</p>
                  </div>
                  <span className="text-xs font-semibold text-[#1C1917] bg-white rounded-full px-2 py-0.5 border border-[#E8E6E1]">
                    {assignedCount} <Users size={10} className="inline ml-0.5 text-[#78716C]"/>
                  </span>
                </button>
              )
            })}
            {filteredCoords.length === 0 && (
              <p className="text-center text-sm text-[#78716C] py-8">No coordinators found</p>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="w-2/3 flex flex-col bg-white">
          {selectedCoord ? (
            <>
              <div className="p-6 border-b border-[#E8E6E1]">
                <h1 className="text-2xl font-bold text-[#1C1917]">{selectedCoord.name}&apos;s Candidates</h1>
                <p className="text-sm text-[#78716C] mt-1">{selectedCoord.email} • {selectedCoord.department}</p>
              </div>

              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#F5F3EF] sticky top-0 border-b border-[#E8E6E1] z-10">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold text-[#78716C]">Candidate</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[#78716C]">Role / Dept</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[#78716C]">Status</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[#78716C]">Recent Task Completion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    <AnimatePresence>
                      {teamData.map((emp) => {
                        const empPerfs = performance.filter(p => p.employee_id === emp.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        const latestPerf = empPerfs[0]
                        const taskRate = latestPerf && latestPerf.tasks_assigned > 0
                          ? Math.round((latestPerf.tasks_completed / latestPerf.tasks_assigned) * 100)
                          : null

                        return (
                          <motion.tr
                            key={emp.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="hover:bg-[#F5F3EF]/50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`h-9 w-9 shrink-0 rounded-full ${avatarColor(emp.id)} flex items-center justify-center text-sm font-bold text-white`}>
                                  {initials(emp.name)}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-[#1C1917]">{emp.name}</p>
                                  <p className="text-[11px] text-[#78716C]">{emp.phone}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-[#1C1917]">{emp.role}</p>
                              <p className="text-[11px] text-[#78716C]">{emp.department}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                emp.status === 'Joined' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {emp.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {taskRate !== null ? (
                                <div className="flex items-center gap-2">
                                  {taskRate === 100 ? (
                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                  ) : (
                                    <AlertCircle size={16} className={taskRate < 50 ? "text-red-500" : "text-amber-500"} />
                                  )}
                                  <span className={`text-sm font-medium ${
                                    taskRate === 100 ? "text-emerald-700" :
                                    taskRate < 50 ? "text-red-600" : "text-amber-600"
                                  }`}>
                                    {taskRate}% ({latestPerf.tasks_completed}/{latestPerf.tasks_assigned})
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-[#78716C] italic">No tasks assigned today</span>
                              )}
                            </td>
                          </motion.tr>
                        )
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
                {teamData.length === 0 && (
                  <div className="py-24 text-center">
                    <Handshake size={40} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-sm font-medium text-[#1C1917]">No candidates assigned</p>
                    <p className="text-xs text-[#78716C] mt-1">Assign employees to this coordinator to see them here.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50">
              <div className="bg-white p-6 rounded-2xl border border-[#E8E6E1] shadow-sm text-center max-w-sm">
                <Handshake size={40} className="mx-auto text-[#FF6B35] opacity-50 mb-4" />
                <h3 className="text-lg font-bold text-[#1C1917]">Coordinator Teams</h3>
                <p className="text-sm text-[#78716C] mt-2">
                  Select a coordinator from the sidebar to view their assigned candidates and task completion status.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
