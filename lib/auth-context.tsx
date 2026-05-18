"use client"

import { EmpAuthProvider, useEmpAuth } from "./emp-auth-context"
import type { EmpRole } from "./emp-session"

export { EmpAuthProvider as AuthProvider }

type LegacyRole = "Admin" | "Mentor" | "Coordinator" | "Employee" | "Super Admin"

function mapRole(role?: EmpRole): LegacyRole {
  switch (role) {
    case "super_admin":
      return "Super Admin"
    case "admin":
      return "Admin"
    case "mentor":
      return "Mentor"
    case "employee":
      return "Employee"
    default:
      return "Admin"
  }
}

export function useAuth() {
  const { user, loading, logout, can, isReadOnly, roleLabel, refreshSession } = useEmpAuth()

  return {
    user: user
      ? {
          id: user.employeeId || user.mentorId || user.email,
          email: user.email,
          name: user.name,
          role: mapRole(user.role),
          avatar: user.name.charAt(0).toUpperCase(),
          empRole: user.role,
          mentorId: user.mentorId,
          employeeId: user.employeeId,
        }
      : null,
    loading,
    login: async () => ({ error: "Use /login page" }),
    logout,
    refreshSession,
    can,
    isReadOnly,
    roleLabel,
    isAdmin: user?.role === "admin" || user?.role === "super_admin",
    isSuperAdmin: user?.role === "super_admin",
    isManager: user?.role === "mentor",
    isEmployee: user?.role === "employee",
  }
}
