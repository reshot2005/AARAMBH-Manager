"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Search, Upload, FileText, File, Image, Download, Trash2, FolderOpen, X, Loader2 } from "lucide-react"
import { useRealtimeTable } from "@/lib/use-realtime"
import type { EmpDocument } from "@/lib/emp-types"
import { fileTypeFromUrl } from "@/lib/emp-utils"

type FileType = "pdf" | "image" | "doc" | "xls" | "other"

interface DocFile {
  id: string
  name: string
  type: FileType
  size: string
  uploadedBy: string
  category: string
  uploadedAt: string
  fileUrl: string
}

const TYPE_ICON: Record<FileType, typeof FileText> = { pdf: FileText, image: Image, doc: File, xls: File, other: FolderOpen }
const TYPE_COLOR: Record<FileType, string> = {
  pdf: "bg-red-50 text-red-600",
  image: "bg-[#E8E6E1] text-[#FF8C5A]",
  doc: "bg-[#FFF1EA] text-[#FF6B35]",
  xls: "bg-emerald-50 text-emerald-600",
  other: "bg-[#F5F3EF] text-[#78716C]",
}

function formatBytes(bytes: number): string {
  if (!bytes) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function toFileType(ext: string): FileType {
  if (ext === "pdf") return "pdf"
  if (ext === "image") return "image"
  if (["doc", "docx"].includes(ext)) return "doc"
  if (["xls", "xlsx", "csv"].includes(ext)) return "xls"
  return "other"
}

export default function FilesPage() {
  const { data: raw, loading } = useRealtimeTable<EmpDocument>("emp_documents", "created_at", false, {
    is_company_doc: false,
  })
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [uploadOpen, setUploadOpen] = useState(false)

  const files = useMemo<DocFile[]>(
    () =>
      raw.map((d) => {
        const ext = fileTypeFromUrl(d.file_url, d.file_type)
        return {
          id: d.id,
          name: d.title,
          type: toFileType(ext),
          size: formatBytes(d.file_size),
          uploadedBy: d.uploaded_by || "Admin",
          category: d.category,
          uploadedAt: new Date(d.created_at).toLocaleDateString(),
          fileUrl: d.file_url,
        }
      }),
    [raw]
  )

  const categories = useMemo(() => ["All", ...Array.from(new Set(files.map((f) => f.category)))], [files])

  const filtered = useMemo(
    () =>
      files.filter((f) => {
        const q = search.toLowerCase()
        return f.name.toLowerCase().includes(q) && (category === "All" || f.category === category)
      }),
    [files, search, category]
  )

  if (loading) {
    return (
      <motion.div className="py-16 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Loader2 size={32} className="mx-auto text-gray-300 mb-2 animate-spin" />
        <p className="text-sm text-[#78716C]">Loading files...</p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1C1917]">Document Library</h1>
          <p className="text-sm text-[#78716C]">Employee and shared documents</p>
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-[#FF6B35] px-3 py-2 text-xs font-medium text-white hover:bg-[#FF8C5A]"
        >
          <Upload size={14} /> Upload
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
        {[
          { label: "All Files", count: files.length, color: "bg-[#FFF1EA] text-[#FF6B35]" },
          { label: "PDFs", count: files.filter((f) => f.type === "pdf").length, color: "bg-red-50 text-red-600" },
          { label: "Documents", count: files.filter((f) => f.type === "doc").length, color: "bg-[#FFF1EA] text-[#FF6B35]" },
          { label: "Spreadsheets", count: files.filter((f) => f.type === "xls").length, color: "bg-emerald-50 text-emerald-600" },
          { label: "Images", count: files.filter((f) => f.type === "image").length, color: "bg-[#E8E6E1] text-[#FF8C5A]" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            className="bg-white rounded-xl border border-[#E8E6E1] p-3 shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <p className="text-xl font-bold text-[#1C1917]">{s.count}</p>
            <p className={`text-[11px] font-medium ${s.color.split(" ")[1]}`}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <motion.div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#E8E6E1] pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FF8C5A]/40"
          />
        </motion.div>
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

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((file, i) => {
          const FIcon = TYPE_ICON[file.type]
          return (
            <motion.div
              key={file.id}
              className="bg-white rounded-xl border border-[#E8E6E1] shadow-sm p-4 flex items-center gap-3 hover:border-indigo-200 group"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TYPE_COLOR[file.type].split(" ")[0]}`}>
                <FIcon size={18} className={TYPE_COLOR[file.type].split(" ")[1]} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1C1917] truncate">{file.name}</p>
                <p className="text-xs text-[#78716C]">
                  {file.size} · {file.category} · {file.uploadedAt}
                </p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {file.fileUrl && (
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg p-1.5 text-[#78716C] hover:bg-[#E8E6E1] hover:text-[#1C1917]"
                  >
                    <Download size={13} />
                  </a>
                )}
              </div>
            </motion.div>
          )
        })}
        {filtered.length === 0 && (
          <motion.div className="col-span-full py-16 text-center bg-white rounded-xl border border-[#E8E6E1]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <FolderOpen size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-[#78716C]">No files found.</p>
          </motion.div>
        )}
      </div>

      {uploadOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setUploadOpen(false)}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            initial={{ scale: 0.95, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E8E6E1] px-5 py-4">
              <h2 className="text-sm font-semibold text-[#1C1917]">Upload Document</h2>
              <button onClick={() => setUploadOpen(false)} className="rounded-lg p-1.5 text-[#78716C] hover:bg-[#E8E6E1]">
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-6">
              <p className="text-sm text-[#78716C] text-center">File upload integration coming soon. Add documents via Supabase for now.</p>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#E8E6E1] px-5 py-3">
              <button onClick={() => setUploadOpen(false)} className="rounded-lg border border-[#E8E6E1] px-4 py-2 text-sm text-[#78716C] hover:bg-[#F5F3EF]">
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
