"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { UsersRound, TrendingUp, UserCheck, Search, Users, Plus, Edit2, Trash2, X, UserPlus } from "lucide-react"
import { useRealtimeTable } from "@/lib/use-realtime"
import type { EmpEmployee, EmpMentor, EmpPerformanceDaily } from "@/lib/emp-types"
import { avatarColor, initials } from "@/lib/emp-utils"
import { useAuth } from "@/lib/auth-context"

export default function MentorTeamsPage() {
  const { user } = useAuth()
  const isSuperAdmin = (user as any)?.empRole === "super_admin"
  const { data: mentors, loading: mentorLoading } = useRealtimeTable<EmpMentor>("emp_mentors")
  const { data: employees, loading: empLoading } = useRealtimeTable<EmpEmployee>("emp_employees")
  const { data: performance } = useRealtimeTable<EmpPerformanceDaily>("emp_performance_daily", "date", false)

  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  // CRUD State
  const [showMentorModal, setShowMentorModal] = useState(false)
  const [editingMentor, setEditingMentor] = useState<EmpMentor | null>(null)
  const [mentorForm, setMentorForm] = useState({ name: "", email: "", phone: "", department: "" })

  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignSelectedEmpId, setAssignSelectedEmpId] = useState("")
  const [assignSearch, setAssignSearch] = useState("")

  const closeAssignModal = () => {
    setShowAssignModal(false)
    setAssignSelectedEmpId("")
    setAssignSearch("")
  }

  const handleSaveMentor = async () => {
    try {
      const url = editingMentor ? `/api/emp/mentors/${editingMentor.id}` : "/api/emp/mentors"
      const method = editingMentor ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mentorForm)
      })
      if (!res.ok) throw new Error("Failed to save mentor")
      setShowMentorModal(false)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteMentor = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to delete this mentor? This action cannot be undone.")) return
    try {
      await fetch(`/api/emp/mentors/${id}`, { method: "DELETE" })
      if (selectedMentorId === id) setSelectedMentorId(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleAssignEmployee = async () => {
    if (!selectedMentorId || !assignSelectedEmpId) return
    try {
      await fetch(`/api/emp/employees/${assignSelectedEmpId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentor_id: selectedMentorId })
      })
      closeAssignModal()
    } catch (err) {
      console.error(err)
    }
  }

  const selectedMentor = useMemo(() => mentors.find(m => m.id === selectedMentorId), [mentors, selectedMentorId])

  const assignFilteredEmployees = useMemo(() => {
    if (!selectedMentor) return []
    let list = employees.filter(e => e.mentor_id !== selectedMentor.id && e.status !== "Rejected")
    if (assignSearch.trim()) {
      const q = assignSearch.toLowerCase()
      list = list.filter(e => 
        (e.name || '').toLowerCase().includes(q) || 
        (e.email || '').toLowerCase().includes(q) || 
        (e.phone || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [employees, selectedMentor, assignSearch])

  // Mentors are now ONLY mentors (no type field needed)
  const filteredMentors = useMemo(() => {
    if (!search) return mentors
    const q = search.toLowerCase()
    return mentors.filter(m => m.name.toLowerCase().includes(q) || m.department.toLowerCase().includes(q))
  }, [mentors, search])

  const teamData = useMemo(() => {
    if (!selectedMentorId) return []
    return employees.filter(e => e.mentor_id === selectedMentorId && e.status !== "Rejected")
  }, [employees, selectedMentorId])

  const teamMetrics = useMemo(() => {
    if (teamData.length === 0) return { avgScore: 0, atRisk: 0 }

    let totalScore = 0
    let count = 0
    let atRisk = 0

    teamData.forEach(emp => {
      const empPerfs = performance.filter(p => p.employee_id === emp.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      if (empPerfs.length > 0) {
        totalScore += Number(empPerfs[0].rating || 0)
        count++
        if (empPerfs[0].trajectory === 'at_risk') atRisk++
      }
    })

    return {
      avgScore: count > 0 ? (totalScore / count).toFixed(1) : "0.0",
      atRisk
    }
  }, [teamData, performance])

  if (mentorLoading || empLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF6B35] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden bg-white rounded-xl border border-[#E8E6E1] shadow-sm">
      {/* Sidebar: Mentor List */}
      <div className="w-1/3 flex flex-col border-r border-[#E8E6E1] bg-[#F9FAFB]">
        <div className="p-4 border-b border-[#E8E6E1]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1C1917] flex items-center gap-2">
              <UsersRound size={18} className="text-[#FF6B35]"/> Mentors
            </h2>
            {isSuperAdmin && (
              <button 
                onClick={() => { setEditingMentor(null); setMentorForm({ name: "", email: "", phone: "", department: "" }); setShowMentorModal(true); }}
                className="flex items-center gap-1 rounded bg-[#FF6B35] px-2 py-1 text-xs font-medium text-white hover:bg-[#FF8C5A] transition-colors"
              >
                <Plus size={12} /> Add
              </button>
            )}
          </div>
          <div className="relative mt-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
            <input
              type="text"
              placeholder="Search mentors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[#E8E6E1] pl-8 pr-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#FF8C5A]/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredMentors.map(mentor => {
            const isSelected = selectedMentorId === mentor.id
            const assignedCount = employees.filter(e => e.mentor_id === mentor.id && e.status !== "Rejected").length

            return (
              <button
                key={mentor.id}
                onClick={() => setSelectedMentorId(mentor.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                  isSelected ? "bg-[#FFF1EA] border border-[#FF6B35]/20" : "hover:bg-white hover:border-[#E8E6E1] border border-transparent"
                }`}
              >
                <div className={`h-10 w-10 shrink-0 rounded-full ${avatarColor(mentor.id)} flex items-center justify-center text-sm font-bold text-white`}>
                  {initials(mentor.name)}
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <p className={`text-sm font-medium truncate ${isSelected ? "text-[#FF6B35]" : "text-[#1C1917]"}`}>
                    {mentor.name}
                  </p>
                  <p className="text-xs text-[#78716C] truncate">{mentor.department || "No Department"}</p>
                </div>
                
                {isSuperAdmin && (
                  <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setEditingMentor(mentor); 
                        setMentorForm({ name: mentor.name, email: mentor.email, phone: mentor.phone || "", department: mentor.department || "" }); 
                        setShowMentorModal(true); 
                      }}
                      className="p-1.5 text-[#78716C] hover:text-[#FF6B35] bg-white rounded shadow-sm border border-[#E8E6E1] transition-colors"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteMentor(mentor.id, e)}
                      className="p-1.5 text-[#78716C] hover:text-red-500 bg-white rounded shadow-sm border border-[#E8E6E1] transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
                
                {(!isSuperAdmin || !isSelected) && (
                  <span className={`text-xs font-semibold shrink-0 bg-white rounded-full px-2 py-0.5 border border-[#E8E6E1] ${isSuperAdmin ? "group-hover:hidden" : ""} text-[#1C1917]`}>
                    {assignedCount} <Users size={10} className="inline ml-0.5 text-[#78716C]"/>
                  </span>
                )}
              </button>
            )
          })}
          {filteredMentors.length === 0 && (
            <p className="text-center text-sm text-[#78716C] py-8">No mentors found</p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-2/3 flex flex-col bg-white">
        {selectedMentor ? (
          <>
            <div className="p-6 border-b border-[#E8E6E1] flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#1C1917] flex items-center gap-3">
                  {selectedMentor.name}&apos;s Team
                  {isSuperAdmin && (
                    <div className="flex items-center gap-2 ml-3">
                      <button 
                        onClick={() => { setAssignSelectedEmpId(""); setShowAssignModal(true); }}
                        className="flex items-center gap-1 rounded-lg border border-[#E8E6E1] px-2.5 py-1 text-xs font-semibold text-[#78716C] hover:bg-gray-50 transition-colors shadow-sm"
                      >
                        <UserPlus size={12} /> Assign Existing
                      </button>
                      <Link 
                        href={`/dashboard/add-employee?mentorId=${selectedMentor.id}`}
                        className="flex items-center gap-1 rounded-lg bg-[#FF6B35] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#FF8C5A] transition-colors shadow-sm"
                      >
                        <Plus size={12} /> Onboard New
                      </Link>
                    </div>
                  )}
                </h1>
                <p className="text-sm text-[#78716C] mt-1">{selectedMentor.email} • {selectedMentor.department}</p>
              </div>
              <div className="flex gap-4">
                <div className="text-right">
                  <p className="text-xs font-medium text-[#78716C] uppercase tracking-wider">Avg Team Rating</p>
                  <p className="text-xl font-bold text-[#1C1917] flex items-center justify-end gap-1">
                    {teamMetrics.avgScore} <TrendingUp size={16} className="text-emerald-500"/>
                  </p>
                </div>
                <div className="w-px bg-[#E8E6E1]"></div>
                <div className="text-right">
                  <p className="text-xs font-medium text-[#78716C] uppercase tracking-wider">At Risk</p>
                  <p className={`text-xl font-bold ${teamMetrics.atRisk > 0 ? "text-red-500" : "text-[#1C1917]"}`}>
                    {teamMetrics.atRisk}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#F5F3EF] sticky top-0 border-b border-[#E8E6E1]">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-[#78716C]">Employee</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[#78716C]">Role</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[#78716C]">Status</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[#78716C]">Latest Rating</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[#78716C]">Trajectory</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence>
                    {teamData.map((emp) => {
                      const empPerfs = performance.filter(p => p.employee_id === emp.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      const latestPerf = empPerfs[0]

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
                            {latestPerf ? (
                              <span className="font-semibold text-[#1C1917]">{latestPerf.rating} <span className="text-xs font-normal text-[#78716C]">/ 10</span></span>
                            ) : (
                              <span className="text-xs text-[#78716C] italic">No data</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {latestPerf?.trajectory ? (
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                latestPerf.trajectory === 'at_risk' ? 'bg-red-50 text-red-700' :
                                latestPerf.trajectory === 'exceeding' ? 'bg-emerald-50 text-emerald-700' :
                                latestPerf.trajectory === 'needs_improvement' ? 'bg-amber-50 text-amber-700' :
                                'bg-blue-50 text-blue-700'
                              }`}>
                                {latestPerf.trajectory.replace('_', ' ')}
                              </span>
                            ) : (
                              <span className="text-xs text-[#78716C]">—</span>
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
                  <UserCheck size={40} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-sm font-medium text-[#1C1917]">No team members assigned</p>
                  <p className="text-xs text-[#78716C] mt-1 mb-4">Assign employees to this mentor to see them here.</p>
                  {isSuperAdmin && (
                    <div className="flex gap-2 justify-center">
                      <button 
                        onClick={() => { setAssignSelectedEmpId(""); setShowAssignModal(true); }}
                        className="flex items-center gap-1 rounded-lg bg-[#FF6B35] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#FF8C5A] shadow-sm transition-colors"
                      >
                        <UserPlus size={13} /> Assign Existing
                      </button>
                      <Link 
                        href={`/dashboard/add-employee?mentorId=${selectedMentor.id}`}
                        className="flex items-center gap-1 rounded-lg border border-[#E8E6E1] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1C1917] hover:bg-gray-50 shadow-sm transition-colors"
                      >
                        <Plus size={13} /> Onboard New Employee
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50">
            <div className="bg-white p-6 rounded-2xl border border-[#E8E6E1] shadow-sm text-center max-w-sm">
              <UsersRound size={40} className="mx-auto text-[#FF6B35] opacity-50 mb-4" />
              <h3 className="text-lg font-bold text-[#1C1917]">Mentor Teams</h3>
              <p className="text-sm text-[#78716C] mt-2">
                Select a mentor from the sidebar to view their assigned team, average ratings, and performance trajectories.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Mentor Modal */}
      <AnimatePresence>
        {showMentorModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowMentorModal(false)}>
            <motion.div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6"
              initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-[#1C1917]">{editingMentor ? "Edit Mentor" : "Add Mentor"}</h2>
                <button onClick={() => setShowMentorModal(false)} className="rounded-lg p-1.5 text-[#78716C] hover:bg-[#E8E6E1]">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-3">
                {(["name", "email", "phone", "department"] as const).map((field) => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-[#78716C] mb-1 capitalize">{field}</label>
                    <input type={field === "email" ? "email" : "text"} value={mentorForm[field]}
                      onChange={(e) => setMentorForm((p) => ({ ...p, [field]: e.target.value }))}
                      className="w-full rounded-lg border border-[#E8E6E1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FF8C5A]/40"
                      placeholder={`Enter ${field}...`} />
                  </div>
                ))}
              </div>
              <div className="mt-5 flex gap-2 justify-end">
                <button onClick={() => setShowMentorModal(false)}
                  className="rounded-lg border border-[#E8E6E1] px-4 py-2 text-sm text-[#78716C] hover:bg-[#F5F3EF]">
                  Cancel
                </button>
                <button onClick={handleSaveMentor}
                  className="rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-medium text-white hover:bg-[#FF8C5A] disabled:opacity-40"
                  disabled={!mentorForm.name || !mentorForm.email}>
                  Save Mentor
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assign Employee Modal */}
      <AnimatePresence>
        {showAssignModal && selectedMentor && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeAssignModal}>
            <motion.div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6"
              initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-[#1C1917]">Assign Employee</h2>
                <button onClick={closeAssignModal} className="rounded-lg p-1.5 text-[#78716C] hover:bg-[#E8E6E1]">
                  <X size={16} />
                </button>
              </div>
              <p className="text-xs text-[#78716C] mb-4">Assigning to: <span className="font-semibold text-[#1C1917]">{selectedMentor.name}</span></p>
              
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" size={15} />
                  <input
                    type="text"
                    value={assignSearch}
                    onChange={(e) => setAssignSearch(e.target.value)}
                    placeholder="Search by name, email, or phone..."
                    className="w-full rounded-lg border border-[#E8E6E1] bg-[#F5F3EF] pl-9 pr-4 py-2 text-sm text-[#1C1917] placeholder:text-[#78716C] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF8C5A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#78716C] mb-1">Select Employee</label>
                  <select value={assignSelectedEmpId} onChange={(e) => setAssignSelectedEmpId(e.target.value)}
                    className="w-full rounded-lg border border-[#E8E6E1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FF8C5A]/40 bg-white">
                    <option value="" disabled>Choose an employee...</option>
                    {assignFilteredEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.department}){emp.phone ? ` - ${emp.phone}` : ''}{emp.email ? ` - ${emp.email}` : ''}
                      </option>
                    ))}
                  </select>
                  {assignFilteredEmployees.length === 0 && (
                    <p className="text-[10px] text-red-500 mt-1">No employees match your search.</p>
                  )}
                </div>
              </div>
              
              <div className="mt-5 flex gap-2 justify-end">
                <button onClick={closeAssignModal}
                  className="rounded-lg border border-[#E8E6E1] px-4 py-2 text-sm text-[#78716C] hover:bg-[#F5F3EF]">
                  Cancel
                </button>
                <button onClick={handleAssignEmployee}
                  className="rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-medium text-white hover:bg-[#FF8C5A] disabled:opacity-40"
                  disabled={!assignSelectedEmpId}>
                  Assign Employee
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
