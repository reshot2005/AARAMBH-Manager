import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getAuthFromRequest } from "@/lib/emp-auth-middleware"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuthFromRequest(req)
  // Allow super_admin or admin to update employee
  if (!auth || (auth.role !== "super_admin" && auth.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { mentor_id } = body // currently only mapping what we need to assign mentor

    const updates: any = {}
    if (mentor_id !== undefined) updates.mentor_id = mentor_id
    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from("emp_employees")
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
