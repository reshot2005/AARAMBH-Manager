import { supabase } from './supabase'
import { logActivity, createNotification } from './use-realtime'
import type { EmpEmployeeStatus } from './emp-types'

export async function insertEmployee(row: Record<string, unknown>) {
  const { data, error } = await supabase.from('emp_employees').insert(row).select().single()
  if (error) throw error
  await logActivity('created', 'employee', data.id, `New employee ${data.name} added`)
  await createNotification('onboarding', 'New Employee', `${data.name} was added`, '/dashboard/users')
  return data
}

export async function updateEmployee(id: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('emp_employees')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  await logActivity('updated', 'employee', id, `Employee ${data.name} updated`)
  return data
}

export async function setEmployeeStatus(id: string, status: EmpEmployeeStatus, note?: string) {
  return updateEmployee(id, {
    status,
    ...(note !== undefined ? { follow_up_comment: note } : {}),
  })
}

export async function insertDepartment(row: Record<string, unknown>) {
  const { data, error } = await supabase.from('emp_departments').insert(row).select().single()
  if (error) throw error
  await logActivity('created', 'department', data.id, `Department ${data.name} created`)
  return data
}

export async function insertEnquiry(row: Record<string, unknown>) {
  const { data, error } = await supabase.from('emp_enquiries').insert(row).select().single()
  if (error) throw error
  await createNotification('enquiry', 'New Enquiry', String(row.subject), '/dashboard/enquiries')
  return data
}

export async function updateEnquiry(id: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('emp_enquiries')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateAccessRequest(id: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('emp_access_requests')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from('emp_notifications').update({ is_read: true }).eq('id', id)
  if (error) throw error
}

export async function markAllNotificationsRead() {
  const { error } = await supabase.from('emp_notifications').update({ is_read: true }).eq('is_read', false)
  if (error) throw error
}
