import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { question } = await req.json()
  const q = String(question || '').trim()

  const [{ count: total }, { count: pending }, { data: depts }] = await Promise.all([
    supabaseAdmin.from('emp_employees').select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('emp_employees')
      .select('*', { count: 'exact', head: true })
      .in('status', ['Pending', 'Offer Sent']),
    supabaseAdmin.from('emp_departments').select('name, employee_count, avg_performance'),
  ])

  const context = `Employees: ${total ?? 0} total, ${pending ?? 0} pending approval. Departments: ${
    (depts || []).map((d) => `${d.name} (${d.employee_count})`).join(', ') || 'none'
  }.`

  const groqKey = process.env.GROQ_API_KEY
  if (groqKey && q) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are an HR assistant for Akshara Employee Portal. Use only this data: ${context}. Be concise.`,
            },
            { role: 'user', content: q },
          ],
          stream: true,
          max_tokens: 512,
        }),
      })
      if (res.ok && res.body) {
        const encoder = new TextEncoder()
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        const stream = new ReadableStream({
          async start(controller) {
            let buffer = ''
            try {
              while (true) {
                const { done, value } = await reader.read()
                if (done) break
                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''
                for (const line of lines) {
                  if (!line.startsWith('data: ')) continue
                  const payload = line.slice(6).trim()
                  if (payload === '[DONE]') continue
                  try {
                    const json = JSON.parse(payload)
                    const text = json.choices?.[0]?.delta?.content
                    if (text) controller.enqueue(encoder.encode(text))
                  } catch {
                    /* skip */
                  }
                }
              }
            } finally {
              controller.close()
            }
          },
        })
        return new Response(stream, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      }
    } catch {
      /* fallback */
    }
  }

  const reply = q
    ? `Based on live HR data: ${context}\n\nYou asked: "${q}". Configure GROQ_API_KEY for full AI answers, or check the dashboard charts for details.`
    : 'Ask me about employees, departments, or approvals.'

  return new Response(reply, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
