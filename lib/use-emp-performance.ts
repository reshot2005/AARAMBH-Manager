'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'
import type { EmpPerformanceDaily } from './emp-types'

export function useEmpPerformanceWithEmployees() {
  const [data, setData] = useState<EmpPerformanceDaily[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const { data: rows, error } = await supabase
      .from('emp_performance_daily')
      .select('*, emp_employees(name, department, role)')
      .order('date', { ascending: false })
    if (!error) setData((rows as EmpPerformanceDaily[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('emp-performance-join')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emp_performance_daily' }, () => {
        fetchData()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchData])

  return { data, loading, refetch: fetchData }
}
