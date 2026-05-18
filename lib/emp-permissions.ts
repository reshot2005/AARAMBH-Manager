import type { EmpRole } from './emp-session'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
export type EmpResource =
  | 'employees'
  | 'departments'
  | 'attendance'
  | 'leaves'
  | 'payroll'
  | 'documents'
  | 'upload'
  | 'performance'
  | 'mentor-registrations'
  | 'mentors'
  | 'ai'
  | 'setup'
  | 'session'
  | 'auth'

export function canPerform(role: EmpRole, method: HttpMethod, resource: EmpResource): boolean {
  if (role === 'super_admin') return true

  if (role === 'admin') {
    if (method === 'GET') return resource !== 'setup'
    if (method === 'PUT' && (resource === 'employees' || resource === 'mentor-registrations')) return true
    return false
  }

  if (role === 'mentor') {
    const readResources: EmpResource[] = [
      'employees',
      'performance',
      'departments',
      'mentors',
      'session',
      'auth',
    ]
    if (method === 'GET' && readResources.includes(resource)) return true
    if (method === 'POST' && (resource === 'employees' || resource === 'performance')) return true
    if (method === 'PUT' && (resource === 'employees' || resource === 'mentors')) return true
    return false
  }

  if (role === 'employee') {
    return method === 'GET' && (resource === 'employees' || resource === 'performance' || resource === 'session')
  }

  return false
}

export type UiAction = 'create' | 'edit' | 'delete' | 'approve' | 'reject' | 'upload' | 'download' | 'export'

export function canShowUiAction(role: EmpRole, action: UiAction): boolean {
  if (role === 'super_admin') return true
  if (role === 'admin') {
    return action === 'approve' || action === 'reject' || action === 'download' || action === 'export'
  }
  if (role === 'mentor') {
    return ['create', 'edit', 'download'].includes(action)
  }
  return false
}

export function isReadOnlyRole(role: EmpRole): boolean {
  return role === 'admin' || role === 'employee'
}

export function roleDisplayName(role: EmpRole): string {
  switch (role) {
    case 'super_admin':
      return 'Super Admin'
    case 'admin':
      return 'Admin'
    case 'mentor':
      return 'Mentor'
    case 'employee':
      return 'Employee'
    default:
      return role
  }
}

export function roleBadgeClass(role: EmpRole): string {
  switch (role) {
    case 'super_admin':
      return 'bg-purple-100 text-purple-800'
    case 'admin':
      return 'bg-blue-100 text-blue-800'
    case 'mentor':
      return 'bg-emerald-100 text-emerald-800'
    case 'employee':
      return 'bg-stone-200 text-stone-700'
    default:
      return 'bg-stone-200 text-stone-700'
  }
}
