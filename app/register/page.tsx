"use client"

import { useState } from "react"
import Link from "next/link"
import { Building2, Eye, EyeOff } from "lucide-react"

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    department: "",
    role: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)
    try {
      const res = await fetch("/api/emp/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Registration failed")
        return
      }
      setSuccess(
        data.message ||
          "Registration submitted successfully. You will be able to login once approved by an administrator."
      )
      setForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        department: "",
        role: "",
      })
    } catch {
      setError("Unable to submit registration. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F3EF] px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-[#E8E6E1] bg-white p-8 shadow-sm">
        <RegisterHeader />

        {success ? (
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Field label="Full Name" value={form.name} onChange={(v) => update("name", v)} required />
            <Field label="Email" type="email" value={form.email} onChange={(v) => update("email", v)} required />
            <Field label="Phone" value={form.phone} onChange={(v) => update("phone", v)} />
            <Field label="Department" value={form.department} onChange={(v) => update("department", v)} />
            <Field label="Role / Designation" value={form.role} onChange={(v) => update("role", v)} />
            <PasswordField
              value={form.password}
              onChange={(v) => update("password", v)}
              show={showPassword}
              onToggle={() => setShowPassword((s) => !s)}
            />
            <Field
              label="Confirm Password"
              type="password"
              value={form.confirmPassword}
              onChange={(v) => update("confirmPassword", v)}
              required
            />
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#FF6B35] py-2.5 text-sm font-semibold text-white hover:bg-[#E85A24] disabled:opacity-60"
            >
              {loading ? "Submitting…" : "Submit Registration"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-[#78716C]">
          Already registered?{" "}
          <Link href="/login" className="font-medium text-[#FF6B35] hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  )
}

function RegisterHeader() {
  return (
    <div className="mb-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#FF6B35]">
        <Building2 className="text-white" size={28} />
      </div>
      <h1 className="mt-4 text-2xl font-bold text-[#1C1917]">Mentor Registration</h1>
      <p className="mt-1 text-sm text-[#78716C]">Apply to join as a mentor</p>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-[#1C1917]">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[#E8E6E1] px-4 py-2 text-sm focus:border-[#FF8C5A] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
      />
    </div>
  )
}

function PasswordField({
  value,
  onChange,
  show,
  onToggle,
}: {
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggle: () => void
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-[#1C1917]">Password</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          required
          minLength={6}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-[#E8E6E1] px-4 py-2 pr-10 text-sm focus:border-[#FF8C5A] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
        />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C]">
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  )
}
