'use client'

import { useEmpAuth } from './emp-auth-context'
import type { UiAction } from './emp-permissions'

export function usePermissions() {
  const { user, can, isReadOnly, roleLabel } = useEmpAuth()
  return {
    role: user?.role,
    mentorId: user?.mentorId,
    employeeId: user?.employeeId,
    can,
    isReadOnly,
    roleLabel,
    isSuperAdmin: user?.role === 'super_admin',
    isAdmin: user?.role === 'admin',
    isMentor: user?.role === 'mentor',
    isEmployee: user?.role === 'employee',
  }
}

export function useCan(action: UiAction) {
  const { can } = useEmpAuth()
  return can(action)
}
