/**
 * 감사 로그 이벤트 기록 Hook
 * Phase 0.5.4: 감사 로그 UI
 */

import { useCallback } from 'react'
import { createAuditLog } from '@/entities/audit-log/api/audit-log-service'
import type { CreateAuditLogInput } from '@/types/audit-log'

interface UseLogEventResult {
  logEvent: (input: CreateAuditLogInput) => Promise<void>
}

/**
 * 감사 로그 이벤트 기록 Hook
 */
export function useLogEvent(): UseLogEventResult {
  const logEvent = useCallback(async (input: CreateAuditLogInput) => {
    try {
      await createAuditLog(input)
    } catch (error) {
      // 로그 기록 실패는 조용히 처리 (사용자에게 노출하지 않음)
      console.error('Failed to log audit event:', error)
    }
  }, [])

  return {
    logEvent,
  }
}
