'use client'

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'

export type EmpStatus = 'Joined' | 'Pending' | 'Offer Sent' | 'Rejected' | 'On Hold'
export type TrajectoryStatus = 'On Track' | 'Needs Improvement' | 'Exceeding' | 'At Risk'
export type PortalRole = 'Super Admin' | 'HR Admin' | 'Mentor' | 'Coordinator' | 'Viewer'

export interface EmpEmployee {
  id: string
  name: string
  role: string
  location: string
  doj: string
  status: EmpStatus
  mentor?: string
  onboardingCoordinator?: string
  fieldCoordinator?: string
  college?: string
  interviewNotes?: string
  candidatePreferences?: string
  offerLetterStatus?: 'Not Sent' | 'Sent' | 'Accepted' | 'Signed'
  followUpComment?: string
  monthlyUploadStatus?: boolean
  imageUrl?: string
  department?: string
  createdAt: string
}

export interface EmpMentor {
  id: string
  name: string
  role: string
  assignedCount: number
  employees: string[]
}

export interface EmpCoordinator {
  id: string
  name: string
  isFieldCoordinator: boolean
  mentorId?: string
  mentorName?: string
}

export interface EmpDepartment {
  id: string
  name: string
  head: string
  employeeCount: number
  avgPerformance: number
}

export interface EmpNotification {
  id: string
  type: 'approval' | 'performance' | 'onboarding' | 'access' | 'risk' | 'enquiry' | 'info'
  title: string
  message: string
  is_read: boolean
  created_at: string
  action_url?: string
}

export interface AppState {
  employees: EmpEmployee[]
  mentors: EmpMentor[]
  coordinators: EmpCoordinator[]
  departments: EmpDepartment[]
  notifications: EmpNotification[]
  unreadNotificationCount: number
  selectedDateRange: { from: string; to: string } | null
  activeFilters: Record<string, string>
  pendingApprovalCount: number
  pendingAccessRequestCount: number
  sidebarCollapsed: boolean
}

type AppAction =
  | { type: 'SET_EMPLOYEES'; payload: EmpEmployee[] }
  | { type: 'ADD_EMPLOYEE'; payload: EmpEmployee }
  | { type: 'UPDATE_EMPLOYEE'; payload: { id: string; data: Partial<EmpEmployee> } }
  | { type: 'REMOVE_EMPLOYEE'; payload: string }
  | { type: 'SET_MENTORS'; payload: EmpMentor[] }
  | { type: 'SET_COORDINATORS'; payload: EmpCoordinator[] }
  | { type: 'SET_DEPARTMENTS'; payload: EmpDepartment[] }
  | { type: 'SET_NOTIFICATIONS'; payload: EmpNotification[] }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ' }
  | { type: 'ADD_NOTIFICATION'; payload: EmpNotification }
  | { type: 'SET_DATE_RANGE'; payload: { from: string; to: string } | null }
  | { type: 'SET_FILTER'; payload: { key: string; value: string } }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'SET_PENDING_APPROVAL_COUNT'; payload: number }
  | { type: 'SET_PENDING_ACCESS_COUNT'; payload: number }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_COLLAPSED'; payload: boolean }

const initialState: AppState = {
  employees: [],
  mentors: [],
  coordinators: [],
  departments: [],
  notifications: [],
  unreadNotificationCount: 0,
  selectedDateRange: null,
  activeFilters: {},
  pendingApprovalCount: 0,
  pendingAccessRequestCount: 0,
  sidebarCollapsed: false,
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | undefined>(undefined)

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_EMPLOYEES':
      return { ...state, employees: action.payload }
    case 'ADD_EMPLOYEE':
      return { ...state, employees: [action.payload, ...state.employees] }
    case 'UPDATE_EMPLOYEE':
      return {
        ...state,
        employees: state.employees.map((e) =>
          e.id === action.payload.id ? { ...e, ...action.payload.data } : e
        ),
      }
    case 'REMOVE_EMPLOYEE':
      return { ...state, employees: state.employees.filter((e) => e.id !== action.payload) }
    case 'SET_MENTORS':
      return { ...state, mentors: action.payload }
    case 'SET_COORDINATORS':
      return { ...state, coordinators: action.payload }
    case 'SET_DEPARTMENTS':
      return { ...state, departments: action.payload }
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
        unreadNotificationCount: action.payload.filter((n) => !n.is_read).length,
      }
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, is_read: true } : n
        ),
        unreadNotificationCount: Math.max(0, state.unreadNotificationCount - 1),
      }
    case 'MARK_ALL_NOTIFICATIONS_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        unreadNotificationCount: 0,
      }
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadNotificationCount: state.unreadNotificationCount + (action.payload.is_read ? 0 : 1),
      }
    case 'SET_DATE_RANGE':
      return { ...state, selectedDateRange: action.payload }
    case 'SET_FILTER':
      return { ...state, activeFilters: { ...state.activeFilters, [action.payload.key]: action.payload.value } }
    case 'CLEAR_FILTERS':
      return { ...state, activeFilters: {} }
    case 'SET_PENDING_APPROVAL_COUNT':
      return { ...state, pendingApprovalCount: action.payload }
    case 'SET_PENDING_ACCESS_COUNT':
      return { ...state, pendingAccessRequestCount: action.payload }
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed }
    case 'SET_SIDEBAR_COLLAPSED':
      return { ...state, sidebarCollapsed: action.payload }
    default:
      return state
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  useEffect(() => {
    const collapsed = localStorage.getItem('akshara_sidebar_collapsed')
    if (collapsed === 'true') dispatch({ type: 'SET_SIDEBAR_COLLAPSED', payload: true })
  }, [])

  useEffect(() => {
    localStorage.setItem('akshara_sidebar_collapsed', String(state.sidebarCollapsed))
  }, [state.sidebarCollapsed])

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) throw new Error('useApp must be used within AppProvider')
  return context
}
