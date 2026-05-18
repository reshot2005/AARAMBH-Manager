"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  UserCheck,
  AlertTriangle,
  GraduationCap,
  TrendingUp,
  MessageSquare,
  CheckCheck,
  type LucideIcon,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useRealtimeTable } from "@/lib/use-realtime"
import { mapNotification, timeAgo } from "@/lib/emp-utils"
import { markAllNotificationsRead, markNotificationRead } from "@/lib/emp-actions"
import type { EmpNotification } from "@/lib/emp-types"

type EmpNotifType =
  | "emp_approval"
  | "emp_performance"
  | "emp_onboarding"
  | "emp_alert"
  | "emp_message"

const TYPE_CONFIG: Record<EmpNotifType, { icon: LucideIcon; bg: string; text: string }> = {
  emp_approval: { icon: UserCheck, bg: "bg-[#FFE4D6]", text: "text-[#FF6B35]" },
  emp_performance: { icon: TrendingUp, bg: "bg-rose-100", text: "text-[#EF4444]" },
  emp_onboarding: { icon: GraduationCap, bg: "bg-violet-100", text: "text-[#C8A96E]" },
  emp_alert: { icon: AlertTriangle, bg: "bg-amber-100", text: "text-[#F97316]" },
  emp_message: { icon: MessageSquare, bg: "bg-blue-100", text: "text-[#FF8C5A]" },
}

export function NotificationDropdown() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const { data: rows, loading, update } = useRealtimeTable<EmpNotification>("emp_notifications")

  const items = useMemo(() => rows.map(mapNotification), [rows])
  const unreadCount = items.filter((n) => !n.isRead).length

  const handleMarkAll = async () => {
    await markAllNotificationsRead()
  }

  const handleItemClick = async (notif: ReturnType<typeof mapNotification>) => {
    await markNotificationRead(notif.id)
    await update(notif.id, { is_read: true } as Partial<EmpNotification>)
    setIsOpen(false)
    if (notif.actionUrl) router.push(notif.actionUrl)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E8E6E1] bg-white text-[#78716C] transition-colors hover:bg-[#F5F3EF]"
        aria-label="Open notifications"
      >
        <Bell className="h-4 w-4" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-1 -right-1 inline-flex min-w-[16px] items-center justify-center rounded-full bg-[#F97316] px-1 py-px text-[9px] font-bold text-white ring-2 ring-white"
            >
              {unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-[#E8E6E1] bg-white shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-[#E8E6E1] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[#1C1917]">Notifications</p>
                  <p className="text-xs text-[#78716C]">
                    {loading ? "Loading…" : unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleMarkAll()}
                  disabled={unreadCount === 0}
                  className="flex items-center gap-1 text-xs font-medium text-[#FF6B35] hover:text-[#FF8C5A] disabled:opacity-30"
                >
                  <CheckCheck size={12} />
                  Mark all read
                </button>
              </div>

              {items.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center gap-1">
                  <Bell size={20} className="text-gray-300" />
                  <p className="text-xs text-[#78716C]">No notifications</p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {items.map((notif) => {
                    const cfg = TYPE_CONFIG[notif.type]
                    const Icon = cfg.icon
                    return (
                      <button
                        key={notif.id}
                        type="button"
                        onClick={() => void handleItemClick(notif)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#F5F3EF] ${
                          !notif.isRead ? "bg-[#FFF1EA]/40" : ""
                        }`}
                      >
                        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
                          <Icon size={14} className={cfg.text} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-[#1C1917]">{notif.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-[11px] text-[#78716C]">{notif.message}</p>
                          <p className="mt-1 text-[10px] text-[#78716C]">{timeAgo(notif.createdAt)}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="border-t border-[#E8E6E1] px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => {
                    router.push("/dashboard/enquiries")
                    setIsOpen(false)
                  }}
                  className="text-xs font-medium text-[#FF6B35] hover:text-[#FF8C5A]"
                >
                  View enquiries
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
