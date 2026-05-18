"use client"

import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { EmpRole } from "./emp-session"
import { canShowUiAction, isReadOnlyRole, type UiAction } from "./emp-permissions"
import { roleDisplayName } from "./emp-permissions"

export interface EmpUser {
  role: EmpRole
  email: string
  name: string
  mentorId?: string
  employeeId?: string
}

interface EmpAuthContextValue {
  user: EmpUser | null
  loading: boolean
  refreshSession: () => Promise<void>
  logout: () => Promise<void>
  can: (action: UiAction) => boolean
  isReadOnly: boolean
  roleLabel: string
}

const EmpAuthContext = createContext<EmpAuthContextValue | undefined>(undefined)

export function EmpAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<EmpUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/emp/auth/session", { credentials: "include" })
      if (!res.ok) {
        setUser(null)
        return
      }
      const data = await res.json()
      setUser({
        role: data.role,
        email: data.email,
        name: data.name,
        mentorId: data.mentorId,
        employeeId: data.employeeId,
      })
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    void (async () => {
      setLoading(true)
      await refreshSession()
      setLoading(false)
    })()
  }, [refreshSession])

  // Automatically refresh session when transitioning to dashboard if user is not loaded
  useEffect(() => {
    if (pathname?.startsWith("/dashboard") && !user) {
      void (async () => {
        setLoading(true)
        await refreshSession()
        setLoading(false)
      })()
    }
  }, [pathname, user, refreshSession])

  // If session check finished and user is null while on dashboard, redirect to login
  useEffect(() => {
    if (!loading && !user && pathname?.startsWith("/dashboard")) {
      router.replace("/login")
    }
  }, [loading, user, pathname, router])

  const logout = useCallback(async () => {
    await fetch("/api/emp/auth/logout", { method: "POST", credentials: "include" })
    setUser(null)
    router.replace("/login")
  }, [router])

  const can = useCallback(
    (action: UiAction) => (user ? canShowUiAction(user.role, action) : false),
    [user]
  )

  const value: EmpAuthContextValue = {
    user,
    loading,
    refreshSession,
    logout,
    can,
    isReadOnly: user ? isReadOnlyRole(user.role) : false,
    roleLabel: user ? roleDisplayName(user.role) : "",
  }

  return <EmpAuthContext.Provider value={value}>{children}</EmpAuthContext.Provider>
}

export function useEmpAuth(): EmpAuthContextValue {
  const ctx = useContext(EmpAuthContext)
  if (!ctx) throw new Error("useEmpAuth must be used within EmpAuthProvider")
  return ctx
}
