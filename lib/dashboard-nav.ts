import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  TrendingUp,
  GraduationCap,
  BarChart3,
  Shield,
  Settings,
  Building2,
  Sparkles,
  MessageSquare,
  FolderOpen,
  BookOpen,
  ClipboardCheck,
  FileText,
  MapPin,
  ScrollText,
  UserPlus,
  User,
  Search,
  IndianRupee,
  ShieldAlert,
  CalendarCheck,
  UsersRound,
  Handshake,
} from 'lucide-react'
import type { EmpRole } from './emp-session'

export type NavItem = {
  name: string
  href: string
  icon: LucideIcon
  badge?: number | null
}

export type NavSection = {
  key: string
  label: string
  icon: LucideIcon
  items: NavItem[]
}

export function getDashboardNav(
  role: EmpRole,
  badges: {
    pendingApprovalCount: number
    pendingAccessRequestCount: number
    newEnquiryCount: number
    pendingMentorRegistrations: number
  }
): {
  topLinks: NavItem[]
  sections: NavSection[]
  bottomLinks: NavItem[]
} {
  const { pendingApprovalCount, pendingAccessRequestCount, newEnquiryCount, pendingMentorRegistrations } =
    badges

  // ─── Employee role: minimal nav ───
  if (role === 'employee') {
    return {
      topLinks: [
        { name: 'My Profile', href: '/dashboard/my-profile', icon: User },
        { name: 'My Training', href: '/dashboard/lessons', icon: BookOpen },
      ],
      sections: [],
      bottomLinks: [],
    }
  }

  // ─── Mentor role: team-focused nav ───
  if (role === 'mentor') {
    return {
      topLinks: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Team', href: '/dashboard/my-team', icon: Users },
        { name: 'Add Employee', href: '/dashboard/add-employee', icon: UserPlus },
        { name: 'Daily Tracking', href: '/dashboard/daily-tracking', icon: CalendarCheck },
        { name: 'Employee Progress', href: '/dashboard/users/progress', icon: TrendingUp },
        { name: 'Training Modules', href: '/dashboard/lessons', icon: BookOpen },
      ],
      sections: [],
      bottomLinks: [
        { name: 'My Profile', href: '/dashboard/my-profile', icon: User },
      ],
    }
  }

  // ─── Admin & Super Admin: Categorized nav ───
  const topLinks: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ]

  const sections: NavSection[] = []

  // 1. Manage Content
  sections.push({
    key: 'manage_content',
    label: 'Manage Content',
    icon: FolderOpen,
    items: [
      { name: 'Categories', href: '/dashboard/categories', icon: LayoutDashboard },
      { name: 'Lessons', href: '/dashboard/lessons', icon: BookOpen },
      { name: 'File Library', href: '/dashboard/files', icon: FolderOpen },
      { name: 'Policies', href: '/dashboard/company-docs', icon: FileText },
    ]
  })

  // 2. Manage Users
  const userItems: NavItem[] = [
    { name: 'All Employees', href: '/dashboard/users', icon: Users },
    {
      name: 'New Approvals',
      href: '/dashboard/users/approval',
      icon: ClipboardCheck,
      badge: pendingApprovalCount,
    },
    { name: 'Employee Progress', href: '/dashboard/users/progress', icon: TrendingUp },
    { name: 'Mentor Teams', href: '/dashboard/mentor-teams', icon: UsersRound },
    { name: 'Coordinator Teams', href: '/dashboard/coordinator-teams', icon: Handshake },
    { name: 'Daily Tracking', href: '/dashboard/daily-tracking', icon: CalendarCheck },
    { name: 'Performance Heatmap', href: '/dashboard/heatmap', icon: MapPin },
    { name: 'Revenue & Value', href: '/dashboard/revenue', icon: IndianRupee },
  ]

  if (role === 'super_admin') {
    userItems.push({
      name: 'Accountability Audit',
      href: '/dashboard/accountability',
      icon: ShieldAlert,
    })
  }

  userItems.push({ name: 'Assessments', href: '/dashboard/quiz', icon: ClipboardCheck })

  sections.push({
    key: 'manage_users',
    label: 'Manage Users',
    icon: Users,
    items: userItems,
  })

  // 3. Access Control
  if (role === 'super_admin' || role === 'admin') {
    const accessItems: NavItem[] = []
    
    if (role === 'super_admin') {
      accessItems.push({ name: 'Audit Logs', href: '/dashboard/audit-logs', icon: ScrollText })
    }
    
    accessItems.push({
      name: 'Mentor Registrations',
      href: '/dashboard/mentor-registrations',
      icon: UserPlus,
      badge: pendingMentorRegistrations,
    })

    if (role === 'super_admin') {
      accessItems.push({ name: 'Access Control', href: '/dashboard/access-control', icon: Shield })
    }

    sections.push({
      key: 'access_control',
      label: 'Access Control',
      icon: Shield,
      items: accessItems,
    })
  }

  // 4. Bottom Links
  const bottomLinks: NavItem[] = []

  if (role === 'super_admin') {
    bottomLinks.push(
      { name: 'AI Search Settings', href: '/dashboard/ai-search', icon: Sparkles },
      { name: 'AI Assistant', href: '/dashboard/ai-generator', icon: Sparkles }
    )
  }

  bottomLinks.push({
    name: 'Enquiries',
    href: '/dashboard/enquiries',
    icon: MessageSquare,
    badge: newEnquiryCount,
  })

  if (role === 'super_admin') {
    bottomLinks.push({ name: 'Settings', href: '/dashboard/settings', icon: Settings })
  }

  bottomLinks.push({ name: 'Reports', href: '/dashboard/reports', icon: BarChart3 })

  return { topLinks, sections, bottomLinks }
}
