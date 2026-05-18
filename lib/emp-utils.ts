import type { EmpEmployee, EmpEmployeeStatus, EmpEnquiry, EmpNotification } from './emp-types'

export const STATUS_COLORS: Record<string, string> = {
  Joined: '#10B981',
  Pending: '#F59E0B',
  'Offer Sent': '#6366F1',
  'On Hold': '#94A3B8',
  Rejected: '#EF4444',
}

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return `${Math.max(0, diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(iso).toLocaleDateString()
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const AVATAR_COLORS = ['bg-[#FF6B35]', 'bg-emerald-500', 'bg-[#C8A96E]', 'bg-[#FF8C5A]', 'bg-[#78716C]']

export function avatarColor(id: string): string {
  let n = 0
  for (let i = 0; i < id.length; i++) n += id.charCodeAt(i)
  return AVATAR_COLORS[n % AVATAR_COLORS.length]
}

export type UiEmpStatus = 'active' | 'pending' | 'inactive' | 'onboarding'

export function dbStatusToUi(status: EmpEmployeeStatus): UiEmpStatus {
  if (status === 'Joined') return 'active'
  if (status === 'On Hold') return 'onboarding'
  if (status === 'Rejected') return 'inactive'
  return 'pending'
}

export function uiStatusToDb(status: UiEmpStatus): EmpEmployeeStatus {
  if (status === 'active') return 'Joined'
  if (status === 'onboarding') return 'On Hold'
  if (status === 'inactive') return 'Rejected'
  return 'Pending'
}

export function approvalStatusFromEmployee(emp: EmpEmployee): 'pending' | 'approved' | 'rejected' | 'hold' {
  if (emp.status === 'Joined') return 'approved'
  if (emp.status === 'Rejected') return 'rejected'
  if (emp.status === 'On Hold') return 'hold'
  return 'pending'
}

export function approvalToDbStatus(status: 'pending' | 'approved' | 'rejected' | 'hold'): EmpEmployeeStatus {
  if (status === 'approved') return 'Joined'
  if (status === 'rejected') return 'Rejected'
  if (status === 'hold') return 'On Hold'
  return 'Pending'
}

export function notifTypeToUi(type: string): string {
  const map: Record<string, string> = {
    approval: 'emp_approval',
    performance: 'emp_performance',
    onboarding: 'emp_onboarding',
    access: 'emp_alert',
    risk: 'emp_alert',
    enquiry: 'emp_message',
    info: 'emp_message',
    leave: 'emp_message',
    payroll: 'emp_message',
    document: 'emp_message',
    announcement: 'emp_message',
  }
  return map[type] || 'emp_message'
}

export function mapNotification(row: EmpNotification) {
  return {
    id: row.id,
    type: notifTypeToUi(row.type) as 'emp_approval' | 'emp_performance' | 'emp_onboarding' | 'emp_alert' | 'emp_message',
    title: row.title,
    message: row.message,
    createdAt: row.created_at,
    isRead: row.is_read,
    actionUrl: row.action_url || undefined,
  }
}

export function joiningTrend(employees: EmpEmployee[]) {
  const year = new Date().getFullYear()
  const counts = MONTHS.map((month, i) => {
    const n = employees.filter((e) => {
      if (!e.date_of_joining) return false
      const d = new Date(e.date_of_joining)
      return d.getFullYear() === year && d.getMonth() === i
    }).length
    return { month, employees: n }
  })
  return counts
}

export function statusPie(employees: EmpEmployee[]) {
  const statuses: EmpEmployeeStatus[] = ['Joined', 'Pending', 'Offer Sent', 'On Hold', 'Rejected']
  return statuses.map((name) => ({
    name,
    value: employees.filter((e) => e.status === name).length,
    color: STATUS_COLORS[name] || '#94A3B8',
  })).filter((s) => s.value > 0)
}

export function deptPerformanceChart(departments: { name: string; avg_performance: number }[]) {
  return departments.map((d) => ({
    dept: d.name.length > 8 ? d.name.slice(0, 8) : d.name,
    score: Number(d.avg_performance) || 0,
  }))
}

export function fileTypeFromUrl(url: string, fileType: string): string {
  if (fileType) return fileType.split('/').pop()?.split('.').pop() || 'file'
  const ext = url.split('.').pop()?.toLowerCase() || 'file'
  if (['pdf'].includes(ext)) return 'pdf'
  if (['doc', 'docx'].includes(ext)) return 'doc'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'xls'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'image'
  return ext
}

export function priorityUiToDb(p: 'low' | 'medium' | 'high' | 'urgent'): EmpEnquiry['priority'] {
  if (p === 'medium') return 'normal'
  return p
}

export function priorityDbToUi(p: string): 'low' | 'medium' | 'high' | 'urgent' {
  if (p === 'normal') return 'medium'
  return p as 'low' | 'medium' | 'high' | 'urgent'
}
