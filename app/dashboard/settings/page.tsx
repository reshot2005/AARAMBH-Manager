"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Building2, User, Bell, Shield, Palette, Save, CheckCircle2,
  Sun, Moon, Monitor, Mail, Smartphone, Lock, Key, Eye, EyeOff,
  Users, BookOpen, ClipboardCheck, Loader2,
  type LucideIcon,
} from "lucide-react"
import { useRealtimeCount, useRealtimeTable } from "@/lib/use-realtime"
import type { EmpDepartment, EmpEmployee } from "@/lib/emp-types"

type Tab = "company" | "profile" | "notifications" | "security" | "appearance"

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "company", label: "Company", icon: Building2 },
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
]

function SaveBar({ onSave, saved }: { onSave: () => void; saved: boolean }) {
  return (
    <div className="flex justify-end pt-4">
      <button
        onClick={onSave}
        className="flex items-center gap-2 rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-medium text-white hover:bg-[#FF8C5A]"
      >
        {saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
        {saved ? "Saved!" : "Save Changes"}
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("company")
  const [saved, setSaved] = useState(false)

  const { count: empCount, loading: c1 } = useRealtimeCount("emp_employees")
  const { count: deptCount, loading: c2 } = useRealtimeCount("emp_departments")
  const { count: moduleCount, loading: c3 } = useRealtimeCount("emp_onboarding_modules")
  const { count: assessmentCount, loading: c4 } = useRealtimeCount("emp_assessments")
  const { data: employees } = useRealtimeTable<EmpEmployee>("emp_employees")
  const { data: departments } = useRealtimeTable<EmpDepartment>("emp_departments", "name", true)

  const countsLoading = c1 || c2 || c3 || c4
  const joinedCount = employees.filter((e) => e.status === "Joined").length

  const [company, setCompany] = useState({
    name: "Akshara Enterprises",
    email: "hr@akshara.in",
    phone: "+91 98765 00000",
    address: "Bengaluru, Karnataka",
    website: "https://akshara.in",
  })
  const [profile, setProfile] = useState({ name: "Admin User", email: "admin@akshara.in", phone: "+91 98765 00001", role: "Admin" })
  const [notifs, setNotifs] = useState({
    emailApproval: true,
    emailPerformance: true,
    emailOnboarding: true,
    smsAlert: false,
    smsOnboarding: false,
  })
  const [security, setSecurity] = useState({ twoFactor: false, sessionTimeout: "30" })
  const [showPass, setShowPass] = useState(false)
  const [appearance, setAppearance] = useState({ theme: "light", primaryColor: "#6366f1", density: "comfortable" })

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#1C1917]">Portal Settings</h1>
        <p className="text-sm text-[#78716C]">Manage company and portal preferences</p>
      </div>

      <motion.div
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      >
        {[
          { label: "Employees", value: countsLoading ? "..." : empCount, icon: Users, color: "bg-[#FFF1EA] text-[#FF6B35]" },
          { label: "Active (Joined)", value: countsLoading ? "..." : joinedCount, icon: User, color: "bg-emerald-50 text-emerald-600" },
          { label: "Departments", value: countsLoading ? "..." : deptCount, icon: Building2, color: "bg-[#F3EBDC] text-[#C8A96E]" },
          { label: "Modules / Quizzes", value: countsLoading ? "..." : `${moduleCount} / ${assessmentCount}`, icon: BookOpen, color: "bg-[#FFF1EA] text-[#F97316]" },
        ].map((s) => (
          <motion.div
            key={s.label}
            className="bg-white rounded-xl border border-[#E8E6E1] p-4 shadow-sm"
            variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
          >
            {countsLoading ? (
              <Loader2 size={16} className="text-gray-300 animate-spin" />
            ) : (
              <s.icon size={16} className={s.color.split(" ")[1]} />
            )}
            <p className="mt-2 text-xl font-bold text-[#1C1917]">{s.value}</p>
            <p className="text-xs text-[#78716C]">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {!countsLoading && departments.length > 0 && (
        <p className="text-xs text-[#78716C]">
          Live portal: {empCount} employees across {departments.map((d) => d.name).join(", ")}
        </p>
      )}

      <div className="flex gap-4 flex-col md:flex-row">
        <div className="w-full md:w-44 shrink-0">
          <div className="flex md:flex-col gap-1 flex-wrap">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium w-full text-left transition-colors ${tab === t.id ? "bg-[#FF6B35] text-white" : "text-[#78716C] hover:bg-[#E8E6E1]"}`}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <motion.div
          className="flex-1 bg-white rounded-xl border border-[#E8E6E1] shadow-sm p-5 min-h-[360px]"
          key={tab}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "company" && (
            <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-sm font-semibold text-[#1C1917]">Company Information</p>
              {(["name", "email", "phone", "address", "website"] as const).map((field) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-[#78716C] mb-1 capitalize">{field}</label>
                  <input
                    type="text"
                    value={company[field]}
                    onChange={(e) => setCompany({ ...company, [field]: e.target.value })}
                    className="w-full rounded-lg border border-[#E8E6E1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FF8C5A]/40"
                  />
                </div>
              ))}
              <SaveBar onSave={handleSave} saved={saved} />
            </motion.div>
          )}

          {tab === "profile" && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-[#1C1917]">Your Profile</p>
              {(["name", "email", "phone"] as const).map((field) => (
                <motion.div key={field} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="block text-xs font-medium text-[#78716C] mb-1 capitalize">{field}</label>
                  <input
                    type="text"
                    value={profile[field]}
                    onChange={(e) => setProfile({ ...profile, [field]: e.target.value })}
                    className="w-full rounded-lg border border-[#E8E6E1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FF8C5A]/40"
                  />
                </motion.div>
              ))}
              <div>
                <label className="block text-xs font-medium text-[#78716C] mb-1">Role</label>
                <input
                  type="text"
                  value={profile.role}
                  disabled
                  className="w-full rounded-lg border border-[#E8E6E1] bg-[#F5F3EF] px-3 py-2 text-sm text-[#78716C] cursor-not-allowed"
                />
              </div>
              <SaveBar onSave={handleSave} saved={saved} />
            </div>
          )}

          {tab === "notifications" && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-[#1C1917]">Notification Preferences</p>
              <div className="space-y-3">
                {[
                  { key: "emailApproval", label: "Email: Candidate Approvals", icon: Mail },
                  { key: "emailPerformance", label: "Email: Performance Alerts", icon: Mail },
                  { key: "emailOnboarding", label: "Email: Onboarding Updates", icon: Mail },
                  { key: "smsAlert", label: "SMS: Critical Alerts", icon: Smartphone },
                  { key: "smsOnboarding", label: "SMS: Onboarding Reminders", icon: Smartphone },
                ].map((n) => (
                  <label
                    key={n.key}
                    className="flex items-center justify-between rounded-lg border border-[#E8E6E1] p-3 cursor-pointer hover:bg-[#F5F3EF]"
                  >
                    <span className="flex items-center gap-2 text-sm text-[#1C1917]">
                      <n.icon size={14} className="text-[#78716C]" />
                      {n.label}
                    </span>
                    <input
                      type="checkbox"
                      checked={notifs[n.key as keyof typeof notifs]}
                      onChange={() => setNotifs({ ...notifs, [n.key]: !notifs[n.key as keyof typeof notifs] })}
                      className="h-4 w-4 rounded accent-indigo-600"
                    />
                  </label>
                ))}
              </div>
              <SaveBar onSave={handleSave} saved={saved} />
            </div>
          )}

          {tab === "security" && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-[#1C1917]">Security Settings</p>
              <div>
                <label className="block text-xs font-medium text-[#78716C] mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="********"
                    className="w-full rounded-lg border border-[#E8E6E1] px-3 py-2 pr-9 text-sm outline-none focus:ring-2 focus:ring-[#FF8C5A]/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C]"
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <label className="flex items-center justify-between rounded-lg border border-[#E8E6E1] p-3 cursor-pointer hover:bg-[#F5F3EF]">
                <span className="flex items-center gap-2 text-sm text-[#1C1917]">
                  <Key size={14} className="text-[#78716C]" />
                  Two-Factor Authentication
                </span>
                <input
                  type="checkbox"
                  checked={security.twoFactor}
                  onChange={() => setSecurity({ ...security, twoFactor: !security.twoFactor })}
                  className="h-4 w-4 rounded accent-indigo-600"
                />
              </label>
              <div>
                <label className="block text-xs font-medium text-[#78716C] mb-1">Session Timeout (minutes)</label>
                <select
                  value={security.sessionTimeout}
                  onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })}
                  className="rounded-lg border border-[#E8E6E1] px-3 py-2 text-sm text-[#1C1917] outline-none focus:ring-2 focus:ring-[#FF8C5A]/40"
                >
                  {["15", "30", "60", "120"].map((v) => (
                    <option key={v} value={v}>
                      {v} min
                    </option>
                  ))}
                </select>
              </div>
              <SaveBar onSave={handleSave} saved={saved} />
            </div>
          )}

          {tab === "appearance" && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-[#1C1917]">Appearance</p>
              <div>
                <label className="block text-xs font-medium text-[#78716C] mb-2">Theme</label>
                <div className="flex gap-2">
                  {[
                    { val: "light", icon: Sun, label: "Light" },
                    { val: "dark", icon: Moon, label: "Dark" },
                    { val: "system", icon: Monitor, label: "System" },
                  ].map((t) => (
                    <button
                      key={t.val}
                      onClick={() => setAppearance({ ...appearance, theme: t.val })}
                      className={`flex flex-col items-center gap-1 rounded-lg border px-4 py-3 text-xs transition-all ${appearance.theme === t.val ? "border-[#FF8C5A] bg-[#FFF1EA] text-[#FF8C5A] ring-1 ring-indigo-200" : "border-[#E8E6E1] text-[#78716C] hover:bg-[#F5F3EF]"}`}
                    >
                      <t.icon size={16} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <SaveBar onSave={handleSave} saved={saved} />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
