"use client"

import { useRealtimeTable } from "@/lib/use-realtime"
import type { EmpActivityLog } from "@/lib/emp-types"
import { usePermissions } from "@/lib/use-permissions"
import { timeAgo } from "@/lib/emp-utils"

export default function AuditLogsPage() {
  const { isSuperAdmin } = usePermissions()
  const { data: logs, loading } = useRealtimeTable<EmpActivityLog>("emp_activity_log", "created_at", false)

  if (!isSuperAdmin) {
    return <p className="text-sm text-[#78716C]">Audit logs are only available to Super Admin.</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1C1917]">Audit Logs</h1>
        <p className="text-sm text-[#78716C]">Full history of actions across the portal</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#E8E6E1] bg-white">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F3EF] text-left text-xs font-medium text-[#78716C]">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Performed by</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#78716C]">
                  Loading…
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#78716C]">
                  No audit entries yet
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-t border-[#E8E6E1]">
                  <td className="px-4 py-3 text-[#78716C] whitespace-nowrap">
                    {log.created_at ? timeAgo(log.created_at) : "—"}
                  </td>
                  <td className="px-4 py-3 font-medium capitalize">{log.action}</td>
                  <td className="px-4 py-3">{log.entity_type}</td>
                  <td className="px-4 py-3 text-[#57534E]">{log.description}</td>
                  <td className="px-4 py-3">{log.performed_by}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
