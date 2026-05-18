"use client"

import { useState, useMemo, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Calendar, Save, Search, Lock, Unlock, AlertTriangle, Users, Target, ShieldAlert
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { usePermissions } from "@/lib/use-permissions"
import { useRealtimeTable } from "@/lib/use-realtime"
import type { EmpEmployee, EmpPerformanceDaily, EmpMentor } from "@/lib/emp-types"
import { avatarColor, initials } from "@/lib/emp-utils"
import type { EmpRole } from "@/lib/emp-session"

export default function DailyTrackingPage() {
  const { user } = useAuth()
  const { can } = usePermissions()
  const empRole = (user as any)?.empRole as EmpRole | undefined

  const [dateStr, setDateStr] = useState(() => new Date().toISOString().split("T")[0])
  const [search, setSearch] = useState("")
  
  const { data: employees, loading: empLoading } = useRealtimeTable<EmpEmployee>("emp_employees")
  const { data: performance, loading: perfLoading } = useRealtimeTable<EmpPerformanceDaily>("emp_performance_daily")
  const { data: mentors } = useRealtimeTable<EmpMentor>("emp_mentors")

  const [localData, setLocalData] = useState<Record<string, Partial<EmpPerformanceDaily>>>({})
  const [saving, setSaving] = useState(false)

  // Find mentor ID for the current user if they are a mentor
  const currentUserMentor = useMemo(() => {
    if (empRole !== 'mentor') return null
    return mentors.find(m => m.email === user?.email)
  }, [mentors, user, empRole])

  // Get daily records for the selected date
  const todayRecords = useMemo(() => {
    return performance.filter(p => p.date === dateStr)
  }, [performance, dateStr])

  // Initialize local state when data changes
  useEffect(() => {
    const newData: Record<string, Partial<EmpPerformanceDaily>> = {}
    todayRecords.forEach(p => {
      newData[p.employee_id] = { ...p }
    })
    setLocalData(newData)
  }, [todayRecords, dateStr])

  // Filter employees based on role and search
  const visibleEmployees = useMemo(() => {
    let list = employees.filter(e => e.status !== "Rejected")
    
    // Mentors only see their team
    if (empRole === 'mentor' && currentUserMentor) {
      list = list.filter(e => e.mentor_id === currentUserMentor.id)
    }

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(e => 
        e.name.toLowerCase().includes(q) || 
        e.department.toLowerCase().includes(q)
      )
    }
    
    return list
  }, [employees, empRole, currentUserMentor, search])

  const handleUpdate = (empId: string, field: keyof EmpPerformanceDaily, value: any) => {
    setLocalData(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [field]: value
      }
    }))
  }

  const saveRow = async (empId: string) => {
    const data = localData[empId]
    if (!data) return
    
    setSaving(true)
    try {
      const res = await fetch('/api/emp/daily-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: empId,
          date: dateStr,
          score: data.score || 0,
          tasks_assigned: data.tasks_assigned || 0,
          tasks_completed: data.tasks_completed || 0,
          rating: data.rating || 0,
          remarks: data.remarks || '',
          revenue_impact: data.revenue_impact || 'None',
          revenue_amount: data.revenue_amount || 0,
          trajectory: data.trajectory || 'on_track'
        })
      })
      if (!res.ok) throw new Error('Failed to save')
      // Let realtime subscription handle the UI update
    } catch (e) {
      console.error(e)
      alert("Failed to save row")
    } finally {
      setSaving(false)
    }
  }

  const toggleLock = async (empId: string, currentLockState: boolean) => {
    if (empRole !== 'super_admin') return
    
    setSaving(true)
    try {
      await fetch('/api/emp/daily-tracking', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: empId,
          date: dateStr,
          is_locked: !currentLockState
        })
      })
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const isLocked = (empId: string) => {
    if (empRole === 'super_admin') return false // super admin can always edit
    return localData[empId]?.is_locked === true || new Date(dateStr) < new Date(new Date().toISOString().split("T")[0])
  }

  if (empLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF6B35] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1C1917]">Daily Sprint Board</h1>
          <p className="text-sm text-[#78716C]">
            Track daily task completion, performance ratings, and revenue impact.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
            <input 
              type="date" 
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="rounded-lg border border-[#E8E6E1] bg-white pl-9 pr-3 py-2 text-sm text-[#1C1917] outline-none focus:ring-2 focus:ring-[#FF8C5A]/40"
            />
          </div>
          
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
            <input 
              type="text" 
              placeholder="Search team..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 rounded-lg border border-[#E8E6E1] pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FF8C5A]/40"
            />
          </div>
        </div>
      </div>

      {new Date(dateStr) < new Date(new Date().toISOString().split("T")[0]) && empRole !== 'super_admin' && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
          <Lock size={16} />
          <span>Past dates are locked for editing. Contact Super Admin to request changes.</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="bg-[#F5F3EF] border-b border-[#E8E6E1]">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-[#78716C] w-64">Employee</th>
              <th className="px-4 py-3 text-xs font-semibold text-[#78716C] w-32">Tasks (Done/Total)</th>
              <th className="px-4 py-3 text-xs font-semibold text-[#78716C] w-32">Rating (0-10)</th>
              <th className="px-4 py-3 text-xs font-semibold text-[#78716C] w-48">Remarks</th>
              <th className="px-4 py-3 text-xs font-semibold text-[#78716C] w-36">Trajectory</th>
              <th className="px-4 py-3 text-xs font-semibold text-[#78716C] w-48">Revenue Impact</th>
              <th className="px-4 py-3 text-xs font-semibold text-[#78716C] w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {visibleEmployees.map((emp) => {
              const data = localData[emp.id] || {}
              const locked = isLocked(emp.id)
              
              return (
                <tr key={emp.id} className={`hover:bg-[#F5F3EF]/30 ${data.is_locked ? 'bg-gray-50/50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-8 w-8 shrink-0 rounded-full ${avatarColor(emp.id)} flex items-center justify-center text-xs font-bold text-white`}>
                        {initials(emp.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1C1917] line-clamp-1">{emp.name}</p>
                        <p className="text-[10px] text-[#78716C]">{emp.department} • {emp.role}</p>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <input 
                        type="number" 
                        min={0}
                        value={data.tasks_completed || 0}
                        onChange={(e) => handleUpdate(emp.id, 'tasks_completed', parseInt(e.target.value) || 0)}
                        disabled={locked}
                        className="w-12 rounded border border-[#E8E6E1] px-1.5 py-1 text-sm text-center disabled:bg-gray-50 disabled:text-gray-500 outline-none focus:border-[#FF6B35]"
                      />
                      <span className="text-gray-400">/</span>
                      <input 
                        type="number" 
                        min={0}
                        value={data.tasks_assigned || 0}
                        onChange={(e) => handleUpdate(emp.id, 'tasks_assigned', parseInt(e.target.value) || 0)}
                        disabled={locked}
                        className="w-12 rounded border border-[#E8E6E1] px-1.5 py-1 text-sm text-center disabled:bg-gray-50 disabled:text-gray-500 outline-none focus:border-[#FF6B35]"
                      />
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        min={0} max={10} step={0.5}
                        value={data.rating || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          handleUpdate(emp.id, 'rating', val);
                          handleUpdate(emp.id, 'score', val * 10); // Sync legacy score field (0-100)
                        }}
                        disabled={locked}
                        className={`w-14 rounded border px-1.5 py-1 text-sm font-medium text-center disabled:bg-gray-50 outline-none focus:border-[#FF6B35] ${
                          (data.rating || 0) < 5 ? 'border-red-200 text-red-600' : 
                          (data.rating || 0) >= 8 ? 'border-emerald-200 text-emerald-600' : 
                          'border-[#E8E6E1] text-[#1C1917]'
                        }`}
                      />
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <input 
                      type="text" 
                      value={data.remarks || ''}
                      onChange={(e) => handleUpdate(emp.id, 'remarks', e.target.value)}
                      disabled={locked}
                      placeholder="Daily feedback..."
                      className="w-full rounded border border-[#E8E6E1] px-2 py-1 text-sm disabled:bg-gray-50 disabled:text-gray-500 outline-none focus:border-[#FF6B35]"
                    />
                  </td>
                  
                  <td className="px-4 py-3">
                    <select
                      value={data.trajectory || 'on_track'}
                      onChange={(e) => handleUpdate(emp.id, 'trajectory', e.target.value)}
                      disabled={locked}
                      className={`w-full rounded border px-2 py-1 text-xs font-medium disabled:bg-gray-50 disabled:opacity-70 outline-none focus:border-[#FF6B35] ${
                        data.trajectory === 'at_risk' ? 'bg-red-50 text-red-700 border-red-200' :
                        data.trajectory === 'exceeding' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        data.trajectory === 'needs_improvement' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      <option value="exceeding">Exceeding</option>
                      <option value="on_track">On Track</option>
                      <option value="needs_improvement">Needs Improvement</option>
                      <option value="at_risk">At Risk</option>
                    </select>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-1 items-center">
                      <select
                        value={data.revenue_impact || 'None'}
                        onChange={(e) => handleUpdate(emp.id, 'revenue_impact', e.target.value)}
                        disabled={locked}
                        className="w-20 rounded border border-[#E8E6E1] px-1 py-1 text-xs disabled:bg-gray-50 outline-none focus:border-[#FF6B35]"
                      >
                        <option value="None">None</option>
                        <option value="Direct">Direct</option>
                        <option value="Indirect">Indirect</option>
                      </select>
                      {data.revenue_impact && data.revenue_impact !== 'None' && (
                        <div className="relative flex-1">
                          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">₹</span>
                          <input 
                            type="number"
                            value={data.revenue_amount || 0}
                            onChange={(e) => handleUpdate(emp.id, 'revenue_amount', parseFloat(e.target.value) || 0)}
                            disabled={locked}
                            className="w-full rounded border border-[#E8E6E1] pl-4 pr-1 py-1 text-xs disabled:bg-gray-50 outline-none focus:border-[#FF6B35]"
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => saveRow(emp.id)}
                        disabled={locked || saving}
                        className="rounded p-1.5 text-[#FF6B35] hover:bg-[#FFF1EA] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        title="Save row"
                      >
                        <Save size={16} />
                      </button>
                      
                      {empRole === 'super_admin' && (
                        <button 
                          onClick={() => toggleLock(emp.id, !!data.is_locked)}
                          disabled={saving}
                          className={`rounded p-1.5 transition-colors disabled:opacity-30 ${
                            data.is_locked 
                              ? 'text-amber-600 hover:bg-amber-50' 
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={data.is_locked ? "Unlock row" : "Lock row"}
                        >
                          {data.is_locked ? <Lock size={14} /> : <Unlock size={14} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        
        {visibleEmployees.length === 0 && (
          <div className="py-16 text-center">
            <Target size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-[#78716C]">No employees found for daily tracking.</p>
          </div>
        )}
      </div>
    </div>
  )
}
