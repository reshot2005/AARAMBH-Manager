"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { IndianRupee, TrendingUp, Users, Target, Save, Lock, Edit2, Download } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRealtimeTable } from "@/lib/use-realtime"
import type { EmpEmployee, EmpRevenueEntry } from "@/lib/emp-types"
import { avatarColor, initials } from "@/lib/emp-utils"
import type { EmpRole } from "@/lib/emp-session"

export default function RevenuePage() {
  const { user } = useAuth()
  const empRole = (user as any)?.empRole as EmpRole | undefined
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const { data: employees, loading: empLoading } = useRealtimeTable<EmpEmployee>("emp_employees")
  const { data: revenues, loading: revLoading } = useRealtimeTable<EmpRevenueEntry>("emp_revenue_entries")

  const [localData, setLocalData] = useState<Record<string, { ctc: number, rate: number, type: string }>>({})
  const [saving, setSaving] = useState(false)

  // Super admin only access
  if (empRole !== 'super_admin' && empRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-red-50 p-4 mb-4">
          <Lock className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-[#1C1917]">Access Restricted</h2>
        <p className="mt-2 text-sm text-[#78716C] max-w-sm">
          You do not have permission to view the Revenue & Value dashboard. This area is restricted to administrators.
        </p>
      </div>
    )
  }

  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  // Calculate stats
  const metrics = useMemo(() => {
    let totalDirect = 0
    let totalIndirect = 0
    let totalCtc = 0

    // Current month revenues
    const currentMonthRev = revenues.filter(r => r.month === currentMonth && r.year === currentYear)
    currentMonthRev.forEach(r => {
      totalDirect += Number(r.direct_revenue || 0)
      totalIndirect += Number(r.indirect_revenue || 0)
    })

    employees.forEach(e => {
      if (e.status !== 'Rejected') {
        totalCtc += Number(e.cost_to_company || 0)
      }
    })

    return {
      direct: totalDirect,
      indirect: totalIndirect,
      total: totalDirect + totalIndirect,
      ctc: totalCtc,
      roi: totalCtc > 0 ? ((totalDirect + totalIndirect - totalCtc) / totalCtc) * 100 : 0
    }
  }, [revenues, employees, currentMonth, currentYear])

  // Table rows
  const tableData = useMemo(() => {
    return employees.filter(e => e.status !== 'Rejected').map(emp => {
      const empRevs = revenues.filter(r => r.employee_id === emp.id)
      const currentRev = empRevs.find(r => r.month === currentMonth && r.year === currentYear)
      
      const direct = Number(currentRev?.direct_revenue || 0)
      const indirect = Number(currentRev?.indirect_revenue || 0)
      const ctc = Number(emp.cost_to_company || 0)
      
      let ytdTotal = 0
      empRevs.filter(r => r.year === currentYear).forEach(r => {
        ytdTotal += Number(r.direct_revenue || 0) + Number(r.indirect_revenue || 0)
      })

      return {
        id: emp.id,
        name: emp.name,
        department: emp.department,
        role: emp.role,
        ctc,
        expectedType: emp.expected_revenue_type || 'None',
        rate: Number(emp.rate_per_unit || 0),
        direct,
        indirect,
        total: direct + indirect,
        ytdTotal,
        netValue: (direct + indirect) - ctc
      }
    }).sort((a, b) => b.netValue - a.netValue) // Sort by net value descending
  }, [employees, revenues, currentMonth, currentYear])

  const handleEditInit = (id: string, ctc: number, rate: number, type: string) => {
    setLocalData(prev => ({
      ...prev,
      [id]: { ctc, rate, type }
    }))
    setEditingId(id)
  }

  const handleSave = async (id: string) => {
    const data = localData[id]
    if (!data) return

    setSaving(true)
    try {
      const res = await fetch('/api/emp/employees', {
        method: 'PUT', // Assuming we have a general PUT or we need a specific endpoint
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          cost_to_company: data.ctc,
          rate_per_unit: data.rate,
          expected_revenue_type: data.type
        })
      })
      
      if (!res.ok) throw new Error('Failed to update')
      setEditingId(null)
    } catch (e) {
      console.error(e)
      alert("Failed to save. You may need to ask the system to create the API route for updating CTC.")
    } finally {
      setSaving(false)
    }
  }

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val)
  }

  if (empLoading || revLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF6B35] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1C1917]">Revenue & Value Dashboard</h1>
          <p className="text-sm text-[#78716C]">
            Track employee ROI, direct/indirect revenue contributions, and monthly costs.
          </p>
        </div>
        
        <button className="flex items-center gap-2 rounded-lg border border-[#E8E6E1] bg-white px-4 py-2 text-sm font-medium text-[#1C1917] hover:bg-[#F5F3EF]">
          <Download size={15} /> Export Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="bg-white rounded-xl border border-[#E8E6E1] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#78716C]">Total Revenue (MTD)</p>
              <p className="text-xl font-bold text-[#1C1917]">{formatINR(metrics.total)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E8E6E1] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <IndianRupee className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#78716C]">Direct Revenue</p>
              <p className="text-xl font-bold text-[#1C1917]">{formatINR(metrics.direct)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E8E6E1] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#78716C]">Indirect Revenue</p>
              <p className="text-xl font-bold text-[#1C1917]">{formatINR(metrics.indirect)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E8E6E1] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50">
              <Users className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#78716C]">Monthly CTC Run Rate</p>
              <p className="text-xl font-bold text-[#1C1917]">{formatINR(metrics.ctc)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="bg-[#F5F3EF] border-b border-[#E8E6E1]">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-[#78716C]">Employee</th>
              <th className="px-4 py-3 text-xs font-semibold text-[#78716C] text-right">Cost to Co.</th>
              <th className="px-4 py-3 text-xs font-semibold text-[#78716C] text-center">Rev Type</th>
              <th className="px-4 py-3 text-xs font-semibold text-[#78716C] text-right">Direct (MTD)</th>
              <th className="px-4 py-3 text-xs font-semibold text-[#78716C] text-right">Indirect (MTD)</th>
              <th className="px-4 py-3 text-xs font-semibold text-[#78716C] text-right">Total (MTD)</th>
              <th className="px-4 py-3 text-xs font-semibold text-[#78716C] text-right">Net Value</th>
              <th className="px-4 py-3 text-xs font-semibold text-[#78716C] text-right">YTD Total</th>
              <th className="px-4 py-3 text-xs font-semibold text-[#78716C] w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tableData.map((row) => {
              const isEditing = editingId === row.id
              const editData = localData[row.id]
              
              return (
                <tr key={row.id} className="hover:bg-[#F5F3EF]/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-8 w-8 shrink-0 rounded-full ${avatarColor(row.id)} flex items-center justify-center text-xs font-bold text-white`}>
                        {initials(row.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1C1917] line-clamp-1">{row.name}</p>
                        <p className="text-[10px] text-[#78716C]">{row.department} • {row.role}</p>
                      </div>
                    </div>
                  </td>
                  
                  {/* CTC Edit Mode */}
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <div className="flex justify-end">
                        <input 
                          type="number" 
                          value={editData?.ctc ?? 0}
                          onChange={(e) => setLocalData(p => ({...p, [row.id]: {...p[row.id], ctc: Number(e.target.value)}}))}
                          className="w-24 rounded border border-[#FF6B35] px-2 py-1 text-sm text-right outline-none focus:ring-1 focus:ring-[#FF6B35]"
                        />
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-[#1C1917]">{formatINR(row.ctc)}</span>
                    )}
                  </td>

                  {/* Rev Type Edit Mode */}
                  <td className="px-4 py-3 text-center">
                    {isEditing ? (
                      <select 
                        value={editData?.type ?? 'None'}
                        onChange={(e) => setLocalData(p => ({...p, [row.id]: {...p[row.id], type: e.target.value}}))}
                        className="rounded border border-[#FF6B35] px-1 py-1 text-xs outline-none focus:ring-1 focus:ring-[#FF6B35]"
                      >
                        <option value="None">None</option>
                        <option value="Direct">Direct</option>
                        <option value="Indirect">Indirect</option>
                        <option value="Both">Both</option>
                      </select>
                    ) : (
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        row.expectedType === 'Direct' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        row.expectedType === 'Indirect' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        row.expectedType === 'Both' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {row.expectedType}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right text-sm text-[#78716C]">{formatINR(row.direct)}</td>
                  <td className="px-4 py-3 text-right text-sm text-[#78716C]">{formatINR(row.indirect)}</td>
                  
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-[#1C1917]">{formatINR(row.total)}</span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-bold ${row.netValue >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {row.netValue > 0 ? '+' : ''}{formatINR(row.netValue)}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right text-sm text-[#78716C] font-medium">
                    {formatINR(row.ytdTotal)}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {empRole === 'super_admin' && (
                      isEditing ? (
                        <button 
                          onClick={() => handleSave(row.id)}
                          disabled={saving}
                          className="rounded p-1.5 text-white bg-[#FF6B35] hover:bg-[#FF8C5A] disabled:opacity-50 transition-colors"
                        >
                          <Save size={14} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleEditInit(row.id, row.ctc, row.rate, row.expectedType)}
                          className="rounded p-1.5 text-[#78716C] hover:bg-[#E8E6E1] hover:text-[#1C1917] transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                      )
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
