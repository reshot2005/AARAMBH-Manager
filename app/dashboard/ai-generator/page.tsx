"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Send, RefreshCw, Copy, Check, User, Bot, ChevronDown } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

const PROMPTS = [
  "Draft a performance improvement plan for an underperforming sales employee",
  "Write a rejection letter for a job candidate",
  "Create onboarding checklist for a new technology hire",
  "Generate 10 interview questions for a Marketing Manager role",
  "Write an announcement email for a new HR policy",
  "Summarize key KPIs for monthly HR review",
]

const WELCOME =
  "I'm your AI HR Assistant powered by Akshara Enterprises. I can help you draft HR documents, generate interview questions, write policy announcements, create performance plans, and more. Try one of the suggested prompts or type your own request."

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export default function AIGeneratorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: WELCOME,
      timestamp: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [showPrompts, setShowPrompts] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput("")
    setShowPrompts(false)
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: msg,
      timestamp: new Date().toISOString(),
    }
    const assistantId = (Date.now() + 1).toString()
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setLoading(true)
    try {
      const res = await fetch("/api/emp/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: msg }),
      })
      if (!res.ok || !res.body) throw new Error("AI request failed")
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      let acc = ""
      while (!done) {
        const { value, done: rd } = await reader.read()
        done = rd
        acc += decoder.decode(value || new Uint8Array(), { stream: !done })
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m))
        )
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Sorry, I could not reach the AI service. Check your connection or API configuration." }
            : m
        )
      )
    } finally {
      setLoading(false)
    }
  }

  const copy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
  }

  const reset = () => {
    setMessages([{ id: "welcome", role: "assistant", content: WELCOME, timestamp: new Date().toISOString() }])
    setShowPrompts(true)
    setInput("")
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] space-y-4">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6B35]">
            <Sparkles size={15} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1C1917]">AI HR Assistant</h1>
            <p className="text-xs text-[#78716C]">Powered by Akshara AI</p>
          </div>
        </div>
        <button onClick={reset} className="flex items-center gap-1.5 rounded-lg border border-[#E8E6E1] px-3 py-1.5 text-xs text-[#78716C] hover:bg-[#F5F3EF]">
          <RefreshCw size={12} /> New Chat
        </button>
      </div>

      {/* Suggested Prompts */}
      {showPrompts && (
        <motion.div className="shrink-0" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs font-medium text-[#78716C] mb-2">Suggested prompts</p>
          <div className="flex flex-wrap gap-2">
            {PROMPTS.map((p) => (
              <button key={p} onClick={() => send(p)}
                className="rounded-full border border-[#E8E6E1] bg-white px-3 py-1.5 text-xs text-[#78716C] hover:border-[#FF8C5A] hover:bg-[#FFF1EA] hover:text-[#FF8C5A] transition-colors">
                {p}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.role === "assistant" ? "bg-[#FF6B35]" : "bg-gray-200"}`}>
                {msg.role === "assistant" ? <Bot size={14} className="text-white" /> : <User size={14} className="text-[#78716C]" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === "assistant" ? "bg-white border border-[#E8E6E1] shadow-sm" : "bg-[#FF6B35] text-white"}`}>
                <pre className="whitespace-pre-wrap font-sans leading-relaxed">{msg.content}</pre>
                <div className={`mt-2 flex items-center gap-2 ${msg.role === "user" ? "justify-start" : "justify-between"}`}>
                  <span className={`text-[10px] ${msg.role === "user" ? "text-indigo-200" : "text-[#78716C]"}`}>{formatTime(msg.timestamp)}</span>
                  {msg.role === "assistant" && (
                    <button onClick={() => copy(msg.id, msg.content)} className="flex items-center gap-1 text-[10px] text-[#78716C] hover:text-[#78716C]">
                      {copied === msg.id ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                      {copied === msg.id ? "Copied" : "Copy"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <motion.div className="flex gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FF6B35]">
              <Bot size={14} className="text-white" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl border border-[#E8E6E1] bg-white px-4 py-3 shadow-sm">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-indigo-400"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }} />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 flex gap-2">
        <div className="relative flex-1">
          <textarea value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
            rows={1} placeholder="Ask anything HR-related…"
            className="w-full resize-none rounded-xl border border-[#E8E6E1] px-4 py-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-[#FF8C5A]/40" />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF6B35] text-white disabled:opacity-40 hover:bg-[#FF8C5A]">
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

