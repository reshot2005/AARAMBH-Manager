'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from './supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

const TABLES_WITH_UPDATED_AT = new Set([
  'emp_departments',
  'emp_employees',
  'emp_leaves',
  'emp_announcements',
  'emp_mentors',
  'emp_enquiries',
  'emp_access_requests',
  'emp_onboarding_modules',
  'emp_onboarding_progress',
  'emp_assessments',
])

// Generic real-time hook for any emp_ table
export function useRealtimeTable<T extends { id: string }>(
  tableName: string,
  orderBy: string = 'created_at',
  ascending: boolean = false,
  filters?: Record<string, any>
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  let effectiveOrderBy = orderBy
  if (orderBy === 'created_at') {
    if (tableName === 'emp_onboarding_progress') {
      effectiveOrderBy = 'updated_at'
    } else if (tableName === 'emp_onboarding_modules') {
      effectiveOrderBy = 'order_index'
    }
  }

  const fetchData = useCallback(async () => {
    try {
      let query = supabase.from(tableName).select('*').order(effectiveOrderBy, { ascending })

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            query = query.eq(key, value)
          }
        })
      }

      const { data: rows, error: fetchError } = await query
      if (fetchError) throw fetchError
      setData((rows as T[]) || [])
      setError(null)
    } catch (err: any) {
      setError(err.message)
      console.error(`Error fetching ${tableName}:`, err)
    } finally {
      setLoading(false)
    }
  }, [tableName, effectiveOrderBy, ascending, JSON.stringify(filters)])

  useEffect(() => {
    fetchData()

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`realtime-${tableName}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setData((prev) => {
              const newRow = payload.new as T
              // Avoid duplicates
              if (prev.some(item => item.id === newRow.id)) return prev
              return ascending ? [...prev, newRow] : [newRow, ...prev]
            })
          } else if (payload.eventType === 'UPDATE') {
            setData((prev) =>
              prev.map((item) =>
                item.id === (payload.new as T).id ? (payload.new as T) : item
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setData((prev) =>
              prev.filter((item) => item.id !== (payload.old as any).id)
            )
          }
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [fetchData])

  const insert = useCallback(
    async (row: Partial<T>) => {
      const { data: newRow, error } = await supabase
        .from(tableName)
        .insert(row as Record<string, unknown>)
        .select()
        .single()
      if (error) throw error
      return newRow as T
    },
    [tableName]
  )

  const update = useCallback(
    async (id: string, updates: Partial<T>) => {
      const payload: Record<string, unknown> = { ...updates }
      if (TABLES_WITH_UPDATED_AT.has(tableName)) {
        payload.updated_at = new Date().toISOString()
      }
      const { data: updatedRow, error } = await supabase
        .from(tableName)
        .update(payload as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return updatedRow as T
    },
    [tableName]
  )

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase.from(tableName).delete().eq('id', id)
      if (error) throw error
    },
    [tableName]
  )

  return { data, loading, error, refetch: fetchData, insert, update, remove }
}

// Hook for real-time count
export function useRealtimeCount(tableName: string, filters?: Record<string, any>) {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchCount = useCallback(async () => {
    let query = supabase.from(tableName).select('*', { count: 'exact', head: true })
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(key, value)
        }
      })
    }
    const { count: c, error } = await query
    if (!error) setCount(c || 0)
    setLoading(false)
  }, [tableName, JSON.stringify(filters)])

  useEffect(() => {
    fetchCount()

    const channel = supabase
      .channel(`count-${tableName}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        () => { fetchCount() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchCount])

  return { count, loading }
}

// Activity logger
export async function logActivity(
  action: string,
  entityType: string,
  entityId?: string,
  description?: string,
  performedBy?: string
) {
  await supabase.from('emp_activity_log').insert({
    action,
    entity_type: entityType,
    entity_id: entityId,
    description: description || '',
    performed_by: performedBy || 'Admin',
  })
}

// Create notification
export async function createNotification(
  type: string,
  title: string,
  message: string,
  actionUrl?: string
) {
  await supabase.from('emp_notifications').insert({
    type,
    title,
    message,
    action_url: actionUrl || '',
    is_read: false,
  })
}
