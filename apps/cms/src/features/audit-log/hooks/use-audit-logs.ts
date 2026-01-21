/**
 * 감사 로그 조회 Hook
 * Phase 0.5.4: 감사 로그 UI
 */

import { useState, useEffect, useCallback } from 'react'
import { message } from 'antd'
import { getAuditLogs } from '@/entities/audit-log/api/audit-log-service'
import type { AuditLog, AuditLogFilters, AuditLogQueryResult } from '@/types/audit-log'

interface UseAuditLogsOptions {
  filters?: AuditLogFilters
  autoFetch?: boolean
}

interface UseAuditLogsResult {
  logs: AuditLog[]
  total: number
  page: number
  pageSize: number
  loading: boolean
  error: Error | null
  fetchLogs: (newFilters?: AuditLogFilters) => Promise<void>
  refreshLogs: () => Promise<void>
}

/**
 * 감사 로그 조회 Hook
 */
export function useAuditLogs(options: UseAuditLogsOptions = {}): UseAuditLogsResult {
  const { filters = {}, autoFetch = true } = options
  const [result, setResult] = useState<AuditLogQueryResult>({
    logs: [],
    total: 0,
    page: 1,
    pageSize: 20,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchLogs = useCallback(async (newFilters?: AuditLogFilters) => {
    setLoading(true)
    setError(null)
    try {
      const mergedFilters = { ...filters, ...newFilters }
      const data = await getAuditLogs(mergedFilters)
      setResult(data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('감사 로그 조회에 실패했습니다.')
      setError(error)
      message.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const refreshLogs = useCallback(async () => {
    await fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    if (autoFetch) {
      fetchLogs()
    }
  }, [autoFetch, fetchLogs])

  return {
    logs: result.logs,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    loading,
    error,
    fetchLogs,
    refreshLogs,
  }
}
