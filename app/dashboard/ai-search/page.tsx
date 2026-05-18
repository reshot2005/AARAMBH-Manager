"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Sparkles, User, BookOpen, Building2, ArrowRight, Loader2 } from "lucide-react"
import { useRealtimeTable } from "@/lib/use-realtime"
import type { EmpEmployee, EmpDepartment, EmpOnboardingModule } from "@/lib/emp-types"

type ResultType = "employee" | "module" | "department"

interface SearchResult {
  id: string
  type: ResultType
  title: string
  subtitle: string
  meta: string
  href: string
}

const TYPE_ICON = { employee: User, module: BookOpen, department: Building2 }
const TYPE_COLOR = {
  employee: "bg-[#FFF1EA] text-[#FF6B35]",
  module: "bg-[#F3EBDC] text-[#C8A96E]",
  department: "bg-[#FFF1EA] text-[#F97316]",
}
const TYPE_LABEL: Record<ResultType, string> = {
  employee: "Employee",
  module: "Training Module",
  department: "Department",
}

const FILTERS: { key: ResultType | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "employee", label: "Employees" },
  { key: "module", label: "Modules" },
  { key: "department", label: "Departments" },
]

export default function AISearchPage() {
  const { data: employees, loading: eLoading } = useRealtimeTable<EmpEmployee>("emp_employees")
  const { data: departments, loading: dLoading } = useRealtimeTable<EmpDepartment>("emp_departments", "name", true)
  const { data: modules, loading: mLoading } = useRealtimeTable<EmpOnboardingModule>("emp_onboarding_modules", "order_index", true)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<ResultType | "all">("all")
  const [submitted, setSubmitted] = useState(false)
  const loading = eLoading || dLoading || mLoading

  const index = useMemo<SearchResult[]>(() => {
    const empResults: SearchResult[] = employees.map((e) => ({
      id: `emp-${e.id}`,
      type: "employee",
      title: e.name,
      subtitle: `${e.department} · ${e.role}`,
      meta: `Status: ${e.status}`,
      href: "/dashboard/users",
    }))
    const deptResults: SearchResult[] = departments.map((d) => ({
      id: `dept-${d.id}`,
      type: "department",
      title: d.name,
      subtitle: `${d.employee_count} employees`,
      meta: `Head: ${d.head || "—"} · Avg: ${Math.round(Number(d.avg_performance) || 0)}`,
      href: `/dashboard/categories/${d.id}`,
    }))
    const modResults: SearchResult[] = modules.map((m) => ({
      id: `mod-${m.id}`,
      type: "module",
      title: m.title,
      subtitle: m.department,
      meta: m.description?.slice(0, 60) || "Training module",
      href: "/dashboard/lessons",
    }))
    return [...empResults, ...deptResults, ...modResults]
  }, [employees, departments, modules])

  const suggestions = useMemo(() => {
    const names = employees.slice(0, 3).map((e) => e.name)
    const depts = departments.slice(0, 2).map((d) => d.name)
    const mods = modules.slice(0, 2).map((m) => m.title)
    return [...names, ...depts, ...mods].filter(Boolean).slice(0, 6)
  }, [employees, departments, modules])

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return index.filter((r) => {
      const match =
        r.title.toLowerCase().includes(q) ||
        r.subtitle.toLowerCase().includes(q) ||
        r.meta.toLowerCase().includes(q)
      return match && (filter === "all" || r.type === filter)
    })
  }, [query, filter, index])

  const grouped = useMemo(() => {
    const map: Partial<Record<ResultType, SearchResult[]>> = {}
    for (const r of results) {
      if (!map[r.type]) map[r.type] = []
      map[r.type]!.push(r)
    }
    return map
  }, [results])

  if (loading) {
    return (
      <motion.div className="py-16 text-center max-w-2xl mx-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Loader2 size={32} className="mx-auto text-gray-300 mb-2 animate-spin" />
        <p className="text-sm text-[#78716C]">Loading search index...</p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <motion.div className="text-center pt-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex justify-center mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF6B35]">
            <Sparkles size={22} className="text-white" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-[#1C1917]">Smart Search</h1>
        <p className="text-sm text-[#78716C]">Search employees, departments, and training modules</p>
      </motion.div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#78716C]" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSubmitted(true)
          }}
          placeholder="Search anything in the portal..."
          className="w-full rounded-2xl border border-[#E8E6E1] bg-white py-3 pl-11 pr-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-[#FF8C5A]/40"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("")
              setSubmitted(false)
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#78716C] text-lg leading-none"
          >
            x
          </button>
        )}
      </div>

      {!submitted && suggestions.length > 0 && (
        <div>
          <p className="text-xs text-[#78716C] mb-2">Try searching for</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setQuery(s)
                  setSubmitted(true)
                }}
                className="rounded-full border border-[#E8E6E1] bg-white px-3 py-1.5 text-xs text-[#78716C] hover:border-[#FF8C5A] hover:bg-[#FFF1EA] hover:text-[#FF8C5A]"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {submitted && query && (
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${filter === f.key ? "bg-[#FF6B35] text-white" : "bg-white border border-[#E8E6E1] text-[#78716C] hover:bg-[#F5F3EF]"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {submitted && query && results.length === 0 && (
          <motion.div
            className="py-16 text-center bg-white rounded-2xl border border-[#E8E6E1] shadow-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Search size={28} className="mx-auto text-gray-200 mb-2" />
            <p className="text-sm text-[#78716C]">
              No results for &quot;<span className="font-medium">{query}</span>&quot;
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {submitted && query && results.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs text-[#78716C]">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
          {(Object.entries(grouped) as [ResultType, SearchResult[]][]).map(([type, items]) => (
            <div key={type}>
              <p className="text-xs font-semibold text-[#78716C] uppercase tracking-wider mb-2">{TYPE_LABEL[type]}s</p>
              <div className="space-y-2">
                {items.map((r, i) => {
                  const RIcon = TYPE_ICON[r.type]
                  const colorClass = TYPE_COLOR[r.type]
                  return (
                    <motion.a
                      key={r.id}
                      href={r.href}
                      className="flex items-center gap-3 rounded-xl border border-[#E8E6E1] bg-white p-3 shadow-sm hover:border-indigo-200 hover:shadow-md group"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colorClass.split(" ")[0]}`}>
                        <RIcon size={16} className={colorClass.split(" ")[1]} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1C1917] truncate">{r.title}</p>
                        <p className="text-xs text-[#78716C] truncate">
                          {r.subtitle} · {r.meta}
                        </p>
                      </div>
                      <ArrowRight size={14} className="text-gray-300 group-hover:text-[#FF6B35] shrink-0 transition-colors" />
                    </motion.a>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
