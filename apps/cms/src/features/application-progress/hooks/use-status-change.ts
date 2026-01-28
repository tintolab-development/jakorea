/**
 * 신청 진행 상태 변경 훅
 * Phase 4.6: 상태 운영 관리
 */

import { useState, useCallback } from 'react'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  changeApplicationProgressStatus,
  getStatusHistory,
  updateNotificationStatus,
  type StatusChangeLog,
} from '@/entities/application-progress/api/status-change-service'
import type { ApplicationProgressStatus } from '@/types/application-progress'
import { handleError } from '@/shared/utils/error-handler'

interface UseStatusChangeResult {
  loading: boolean
  history: StatusChangeLog[]
  changeStatus: (
    applicationId: string,
    newStatus: ApplicationProgressStatus,
    reason?: string
  ) => Promise<void>
  fetchHistory: (applicationId: string) => Promise<void>
  markNotificationSent: (logId: string) => Promise<void>
}

export function useStatusChange(): UseStatusChangeResult {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<StatusChangeLog[]>([])

  const changeStatus = useCallback(
    async (applicationId: string, newStatus: ApplicationProgressStatus, reason?: string) => {
      if (!user) {
        throw new Error('로그인이 필요합니다')
      }

      setLoading(true)
      try {
        await changeApplicationProgressStatus(applicationId, newStatus, user.id, reason)
        // 이력 새로고침
        await fetchHistory(applicationId)
      } catch (error) {
        handleError(error, { defaultMessage: '상태 변경 중 오류가 발생했습니다' })
        throw error
      } finally {
        setLoading(false)
      }
    },
    [user]
  )

  const fetchHistory = useCallback(async (applicationId: string) => {
    setLoading(true)
    try {
      const logs = await getStatusHistory(applicationId)
      setHistory(logs)
    } catch (error) {
      handleError(error, { defaultMessage: '상태 변경 이력을 불러오는데 실패했습니다' })
    } finally {
      setLoading(false)
    }
  }, [])

  const markNotificationSent = useCallback(async (logId: string) => {
    try {
      await updateNotificationStatus(logId, true)
      setHistory(prev => prev.map(log => (log.id === logId ? { ...log, notificationSent: true } : log)))
    } catch (error) {
      handleError(error, { defaultMessage: '알림 상태 업데이트에 실패했습니다' })
    }
  }, [])

  return {
    loading,
    history,
    changeStatus,
    fetchHistory,
    markNotificationSent,
  }
}
