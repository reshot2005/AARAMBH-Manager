import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const employeeId = formData.get('employee_id') as string | null
    const title = formData.get('title') as string || file.name
    const description = formData.get('description') as string || ''
    const category = formData.get('category') as string || 'General'
    const isCompanyDoc = formData.get('is_company_doc') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Upload to Cloudinary
    const cloudinaryFormData = new FormData()
    cloudinaryFormData.append('file', file)
    cloudinaryFormData.append('upload_preset', 'ml_default')
    cloudinaryFormData.append('folder', 'emp_documents')

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dtnsbbzvv'

    // Use unsigned upload first, if that doesn't work, use signed
    let cloudinaryRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      { method: 'POST', body: cloudinaryFormData }
    )

    let cloudinaryData: any

    if (!cloudinaryRes.ok) {
      // Try signed upload
      const timestamp = Math.round(Date.now() / 1000)
      const crypto = require('crypto')
      const apiSecret = process.env.CLOUDINARY_API_SECRET || ''
      const signature = crypto
        .createHash('sha1')
        .update(`folder=emp_documents&timestamp=${timestamp}${apiSecret}`)
        .digest('hex')

      const signedFormData = new FormData()
      signedFormData.append('file', file)
      signedFormData.append('folder', 'emp_documents')
      signedFormData.append('timestamp', timestamp.toString())
      signedFormData.append('api_key', process.env.CLOUDINARY_API_KEY || '')
      signedFormData.append('signature', signature)

      cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        { method: 'POST', body: signedFormData }
      )

      if (!cloudinaryRes.ok) {
        const errText = await cloudinaryRes.text()
        return NextResponse.json({ error: 'Cloudinary upload failed: ' + errText }, { status: 500 })
      }
    }

    cloudinaryData = await cloudinaryRes.json()

    // Save document record to Supabase
    const docRecord = {
      employee_id: employeeId || null,
      title,
      description,
      file_url: cloudinaryData.secure_url,
      file_type: cloudinaryData.format || file.type,
      file_size: cloudinaryData.bytes || file.size,
      cloudinary_public_id: cloudinaryData.public_id,
      category,
      uploaded_by: 'Admin',
      is_company_doc: isCompanyDoc,
    }

    const { data, error } = await supabaseAdmin
      .from('emp_documents')
      .insert(docRecord)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabaseAdmin.from('emp_notifications').insert({
      type: 'document',
      title: 'Document Uploaded',
      message: `${title} has been uploaded${employeeId ? '' : ' as company document'}`,
      action_url: '/dashboard/documents',
    })

    await supabaseAdmin.from('emp_activity_log').insert({
      action: 'uploaded',
      entity_type: 'document',
      entity_id: data.id,
      description: `Document "${title}" uploaded to Cloudinary`,
      performed_by: 'Admin',
    })

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
