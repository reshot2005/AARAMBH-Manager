"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/dashboard")
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center bg-[#F5F3EF]">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-3"></div>
        <p className="text-sm text-[#78716C]">Loading Akshara Employee Portal...</p>
      </div>
    </div>
  )
}

