"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/emp/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Invalid credentials")
        return
      }
      if (data.role === "employee") {
        router.replace("/dashboard/my-profile")
      } else {
        router.replace("/dashboard")
      }
      router.refresh()
    } catch {
      setError("Unable to sign in. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F3EF] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#E8E6E1] bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#FF6B35]">
            <Building2 className="text-white" size={28} />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-[#1C1917]">Employee Portal</h1>
          <p className="mt-1 text-sm text-[#78716C]">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1C1917]">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[#E8E6E1] bg-white px-4 py-2.5 text-sm focus:border-[#FF8C5A] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
              placeholder="you@akshara.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#1C1917]">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#E8E6E1] bg-white px-4 py-2.5 pr-10 text-sm focus:border-[#FF8C5A] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#FF6B35] py-2.5 text-sm font-semibold text-white transition hover:bg-[#E85A24] disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#78716C]">
          Are you a mentor?{" "}
          <Link href="/register" className="font-medium text-[#FF6B35] hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}
