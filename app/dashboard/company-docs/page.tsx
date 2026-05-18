"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Search, FileText, Download, Eye, BookOpen, Shield, Briefcase, ScrollText, Loader2 } from "lucide-react"
import { useRealtimeTable } from "@/lib/use-realtime"
import type { EmpDocument } from "@/lib/emp-types"

interface Policy {
  id: string
  title: string
  category: string
  version: string
  effectiveDate: string
  summary: string
  icon: "shield" | "briefcase" | "scroll" | "book"
  fileUrl: string
}

const ICON_MAP = { shield: Shield, briefcase: Briefcase, scroll: ScrollText, book: BookOpen }
const ICON_COLOR: Record<Policy["icon"], string> = {
  shield: "bg-red-50 text-red-600",
  briefcase: "bg-[#FFF1EA] text-[#F97316]",
  scroll: "bg-[#F3EBDC] text-[#C8A96E]",
  book: "bg-[#FFF1EA] text-[#FF6B35]",
}

function categoryIcon(cat: string): Policy["icon"] {
  if (cat.includes("HR") || cat.includes("Policy")) return "shield"
  if (cat.includes("Finance")) return "briefcase"
  if (cat.includes("Onboarding")) return "scroll"
  return "book"
}

export default function CompanyDocsPage() {
  const { data: raw, loading } = useRealtimeTable<EmpDocument>("emp_documents", "created_at", false, {
    is_company_doc: true,
  })
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [selected, setSelected] = useState<Policy | null>(null)

  const policies = useMemo<Policy[]>(
    () =>
      raw.map((d) => ({
        id: d.id,
        title: d.title,
        category: d.category,
        version: "v1.0",
        effectiveDate: new Date(d.created_at).toLocaleDateString(),
        summary: d.description || d.title,
        icon: categoryIcon(d.category),
        fileUrl: d.file_url,
      })),
    [raw]
  )

  const categories = useMemo(() => ["All", ...Array.from(new Set(policies.map((p) => p.category)))], [policies])

  const filtered = useMemo(
    () =>
      policies.filter((p) => {
        const q = search.toLowerCase()
        return (
          (p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)) &&
          (category === "All" || p.category === category)
        )
      }),
    [policies, search, category]
  )

  if (loading) {
    return (
      <motion.div className="py-16 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Loader2 size={32} className="mx-auto text-gray-300 mb-2 animate-spin" />
        <p className="text-sm text-[#78716C]">Loading company policies...</p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#1C1917]">Company Policies</h1>
        <p className="text-sm text-[#78716C]">Official Akshara Enterprises policy documents</p>
      </div>

      <motion.div className="grid grid-cols-2 gap-3 md:grid-cols-4" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
        {[
          { label: "Total Policies", value: policies.length, color: "bg-[#FFF1EA] text-[#FF6B35]" },
          { label: "HR Policies", value: policies.filter((p) => p.category === "Policy" || p.category.includes("HR")).length, color: "bg-emerald-50 text-emerald-600" },
          { label: "Categories", value: new Set(policies.map((p) => p.category)).size, color: "bg-[#FFF1EA] text-[#F97316]" },
          { label: "This Year", value: policies.filter((p) => p.effectiveDate.includes(String(new Date().getFullYear()))).length, color: "bg-[#F3EBDC] text-[#C8A96E]" },
        ].map((s) => (
          <motion.div
            key={s.label}
            className="bg-white rounded-xl border border-[#E8E6E1] p-4 shadow-sm"
            variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
          >
            <p className="text-2xl font-bold text-[#1C1917]">{s.value}</p>
            <p className={`text-xs font-medium ${s.color.split(" ")[1]}`}>{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
          <input
            type="text"
            placeholder="Search policies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#E8E6E1] pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FF8C5A]/40"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-[#E8E6E1] px-3 py-2 text-sm text-[#1C1917] outline-none focus:ring-2 focus:ring-[#FF8C5A]/40"
        >
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((policy, i) => {
          const PIcon = ICON_MAP[policy.icon]
          const iconStyle = ICON_COLOR[policy.icon]
          return (
            <motion.div
              key={policy.id}
              className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm p-4 flex gap-3 hover:border-indigo-200 group"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconStyle.split(" ")[0]}`}>
                <PIcon size={18} className={iconStyle.split(" ")[1]} />
              </div>
              <div className="flex-1 min-w-0">
                <motion.div className="flex items-start justify-between gap-2" whileHover={{ x: 2 }}>
                  <p className="text-sm font-semibold text-[#1C1917]">{policy.title}</p>
                  <span className="text-[10px] text-[#78716C] shrink-0">{policy.version}</span>
                </motion.div>
                <p className="text-xs text-[#78716C] mt-0.5">
                  {policy.category} · Effective {policy.effectiveDate}
                </p>
                <p className="text-xs text-[#78716C] mt-1 line-clamp-2">{policy.summary}</p>
                <div className="mt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setSelected(policy)} className="flex items-center gap-1 text-xs text-[#FF6B35] hover:underline">
                    <Eye size={11} /> View
                  </button>
                  {policy.fileUrl && (
                    <a href={policy.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[#78716C] hover:text-[#1C1917]">
                      <Download size={11} /> Download
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
        {filtered.length === 0 && (
          <motion.div className="col-span-full py-16 text-center bg-white rounded-xl border border-[#E8E6E1]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <BookOpen size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-[#78716C]">No policies found.</p>
          </motion.div>
        )}
      </div>

      {selected && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelected(null)}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            initial={{ scale: 0.95, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E8E6E1] px-5 py-4">
              <h2 className="text-sm font-semibold text-[#1C1917]">{selected.title}</h2>
              <button onClick={() => setSelected(null)} className="rounded-lg p-1.5 text-[#78716C] hover:bg-[#E8E6E1]">
                <FileText size={16} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs text-[#78716C]">
                <p>Category: {selected.category}</p>
                <p>Version: {selected.version}</p>
                <p>Effective: {selected.effectiveDate}</p>
              </div>
              <p className="text-sm text-[#1C1917] bg-[#F5F3EF] rounded-lg p-3">{selected.summary}</p>
            </div>
            <div className="flex justify-end border-t border-[#E8E6E1] px-5 py-3">
              {selected.fileUrl ? (
                <a
                  href={selected.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-medium text-white hover:bg-[#FF8C5A]"
                >
                  <Download size={13} /> Download
                </a>
              ) : (
                <button onClick={() => setSelected(null)} className="rounded-lg border border-[#E8E6E1] px-4 py-2 text-sm text-[#78716C]">
                  Close
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
