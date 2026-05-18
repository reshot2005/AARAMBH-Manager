"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Users,
  UserCheck,
  TrendingUp,
  GraduationCap,
  BarChart3,
  Shield,
  Settings,
  ChevronDown,
  Search,
  LogOut,
  Menu,
  X,
  Building2,
  Sparkles,
  MessageSquare,
  FolderOpen,
  BookOpen,
  ClipboardCheck,
  FileText,
  MapPin,
  ScrollText,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react"
import { useAuth } from "../../lib/auth-context"
import { NotificationDropdown } from "../../components/notification-dropdown"
import { useSidebarBadges } from "../../lib/use-sidebar-badges"
import { getDashboardNav } from "../../lib/dashboard-nav"
import { roleBadgeClass, roleDisplayName } from "../../lib/emp-permissions"
import type { EmpRole } from "../../lib/emp-session"

type NavSection = {
  label: string
  icon: LucideIcon
  items: { name: string; href: string; icon: LucideIcon; badge?: number | null }[]
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  isActive,
  badge,
  collapsed,
}: {
  href: string
  icon: LucideIcon
  label: string
  isActive: boolean
  badge?: number | null
  collapsed?: boolean
}) {
  return (
    <Link
      href={href}
      className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
        isActive ? "bg-[#2A2724] text-white" : "text-[#A8A29E] hover:bg-[#2A2724] hover:text-white"
      }`}
      title={collapsed ? label : undefined}
    >
      {isActive && (
        <motion.div
          layoutId="sidebarActiveBar"
          className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[#FF6B35]"
        />
      )}
      <Icon size={16} className={isActive ? "text-[#FDBA74]" : ""} />
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && badge != null && badge > 0 && (
        <span className="ml-auto inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#F97316] px-1.5 py-0.5 text-[10px] font-semibold text-white">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const pathname = usePathname()
  const { user, logout, loading: authLoading } = useAuth()
  const empRole = (user as { empRole?: EmpRole } | null)?.empRole
  const {
    pendingApprovalCount,
    pendingAccessRequestCount,
    newEnquiryCount,
    pendingMentorRegistrations,
  } = useSidebarBadges()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    manage_users: true // default open
  })

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const pageTitle = useMemo(() => {
    const clean = pathname.replace(/^\/dashboard\/?/, "")
    if (!clean) return "Dashboard"
    const segment = clean.split("/").filter(Boolean).slice(-1)[0] || "Dashboard"
    return segment
      .split("-")
      .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ")
  }, [pathname])

  useEffect(() => {
    if (pathname === "/dashboard/enquiries") {
      try { localStorage.setItem("emp_enquiries_last_seen", new Date().toISOString()) } catch { /* ignore */ }
    }
  }, [pathname])

  useEffect(() => { setMobileSidebarOpen(false) }, [pathname])

  const nav = empRole
    ? getDashboardNav(empRole, {
        pendingApprovalCount,
        pendingAccessRequestCount,
        newEnquiryCount,
        pendingMentorRegistrations,
      })
    : { topLinks: [], sections: [], bottomLinks: [] }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF6B35] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed z-50 flex h-full w-[260px] flex-col bg-[#1C1917] transition-transform duration-300 md:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6B35]">
              <Building2 size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">Akshara</p>
              <p className="text-[10px] text-[#A8A29E] leading-tight">Employee Portal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="rounded p-1 text-[#A8A29E] hover:text-white md:hidden"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {nav.topLinks.map((item) => (
            <SidebarLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.name}
              isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
              badge={item.badge}
            />
          ))}

          {nav.sections.map((section) => {
            const isExpanded = expandedSections[section.key] !== false // Default open unless explicitly closed
            
            return (
              <div key={section.key} className="pt-2 pb-1">
                <button 
                  onClick={() => toggleSection(section.key)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-[#A8A29E] hover:text-white hover:bg-[#2A2724] rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <section.icon size={16} className="text-[#A8A29E] group-hover:text-[#FDBA74] transition-colors" />
                    <span>{section.label}</span>
                  </div>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-0.5 pt-1 pl-4">
                        {section.items.map((item) => (
                          <SidebarLink
                            key={item.href}
                            href={item.href}
                            icon={item.icon}
                            label={item.name}
                            isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + "/"))}
                            badge={item.badge}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}

          {nav.bottomLinks.map((item) => (
            <SidebarLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.name}
              isActive={pathname === item.href}
              badge={item.badge}
            />
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-white/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF6B35] text-xs font-bold text-white shrink-0">
              {(user?.name || "A").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">{user?.name || "Admin"}</p>
              <p className="truncate text-[10px] text-[#A8A29E]">
                {empRole ? roleDisplayName(empRole) : "User"}
              </p>
            </div>
            <button
              onClick={() => void logout()}
              className="shrink-0 rounded p-1 text-[#A8A29E] hover:text-[#EF4444] transition-colors"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-[260px] flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E8E6E1] bg-white px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="rounded-lg p-2 text-[#78716C] hover:bg-[#E8E6E1] md:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center gap-2">
              <Building2 size={18} className="text-[#FF6B35]" />
              <span className="font-semibold text-[#1C1917] text-sm">
                Akshara <span className="text-[#78716C] font-normal">— Employee Portal</span>
              </span>
            </div>
            <span className="font-semibold text-[#1C1917] text-sm md:hidden">{pageTitle}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employees, mentors..."
                className="w-56 rounded-lg border border-[#E8E6E1] bg-[#F5F3EF] pl-9 pr-4 py-2 text-sm text-[#1C1917] placeholder:text-[#78716C] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF8C5A]"
              />
            </div>

            <NotificationDropdown />

            <div className="flex items-center gap-2">
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-sm font-medium text-[#1C1917] leading-tight">{user?.name || "Admin"}</span>
                <span
                  className={`text-[10px] font-medium leading-tight rounded-full px-2 py-0.5 ${
                    empRole ? roleBadgeClass(empRole) : "bg-stone-200 text-stone-700"
                  }`}
                >
                  {empRole ? roleDisplayName(empRole) : "User"}
                </span>
              </div>
              <div className="h-8 w-8 rounded-full bg-[#FF6B35] flex items-center justify-center text-xs font-bold text-white">
                {(user?.name || "A").charAt(0).toUpperCase()}
              </div>
              <button
                onClick={() => void logout()}
                className="hidden rounded-lg p-2 text-[#78716C] hover:bg-red-50 hover:text-red-600 transition-colors md:block"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

