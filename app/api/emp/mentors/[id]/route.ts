import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getAuthFromRequest } from "@/lib/emp-auth-middleware"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuthFromRequest(req)
  if (!auth || auth.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, email, phone, department, is_active } = body

    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (email !== undefined) updates.email = email
    if (phone !== undefined) updates.phone = phone
    if (department !== undefined) updates.department = department
    if (is_active !== undefined) updates.is_active = is_active
    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from("emp_mentors")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuthFromRequest(req)
  if (!auth || auth.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { error } = await supabaseAdmin
      .from("emp_mentors")
      .delete()
      .eq("id", params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
