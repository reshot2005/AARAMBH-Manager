import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const employeeId = searchParams.get('employee_id')
  const isCompany = searchParams.get('is_company_doc')
  const category = searchParams.get('category')

  let query = supabaseAdmin.from('emp_documents').select('*, emp_employees(name)').order('created_at', { ascending: false })

  if (employeeId) query = query.eq('employee_id', employeeId)
  if (isCompany) query = query.eq('is_company_doc', isCompany === 'true')
  if (category) query = query.eq('category', category)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  // Get cloudinary public_id before deleting
  const { data: doc } = await supabaseAdmin.from('emp_documents').select('cloudinary_public_id,title').eq('id', id).single()

  // Delete from Cloudinary if we have the public_id
  if (doc?.cloudinary_public_id) {
    try {
      const timestamp = Math.round(Date.now() / 1000)
      const crypto = require('crypto')
      const apiSecret = process.env.CLOUDINARY_API_SECRET || ''
      const signature = crypto
        .createHash('sha1')
        .update(`public_id=${doc.cloudinary_public_id}&timestamp=${timestamp}${apiSecret}`)
        .digest('hex')

      await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/destroy`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            public_id: doc.cloudinary_public_id,
            timestamp,
            api_key: process.env.CLOUDINARY_API_KEY,
            signature,
          }),
        }
      )
    } catch { /* ignore cloudinary errors */ }
  }

  const { error } = await supabaseAdmin.from('emp_documents').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
