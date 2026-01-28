/**
 * 상태 타임라인 Hook
 * Phase 0.1.4: 상태값/기본 모델 정의
 * 
 * 신청 진행 상태의 타임라인 데이터를 조회하고 관리
 */

import { useState, useEffect, useCallback } from 'react'
import { getStatusHistory } from '@/entities/application-progress/api/status-change-service'
import { getApplicationStatusLabel, getApplicationStatusColor } from '@/shared/constants/application-status'
import type { ApplicationProgressStatus } from '@/types/application-progress'

export interface StatusTimelineItem {
  id: string
  status: ApplicationProgressStatus
  statusLabel: string
  statusColor: string
  timestamp: string
  changedBy: string
  description?: string
  notificationSent: boolean
  reason?: string
}

interface UseStatusTimelineReturn {
  timeline: StatusTimelineItem[]
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

/**
 * 신청 진행 상태 타임라인 데이터 조회 Hook
 * @param applicationId 신청 ID
 */
export function useStatusTimeline(applicationId: string | null): UseStatusTimelineReturn {
  const [timeline, setTimeline] = useState<StatusTimelineItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchTimeline = useCallback(async () => {
    if (!applicationId) {
      setTimeline([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const history = await getStatusHistory(applicationId)

      // StatusChangeLog를 StatusTimelineItem으로 변환
      const timelineItems: StatusTimelineItem[] = history.map(log => ({
        id: log.id,
        status: log.toStatus,
        statusLabel: getApplicationStatusLabel(log.toStatus),
        statusColor: getApplicationStatusColor(log.toStatus),
        timestamp: log.changedAt,
        changedBy: log.changedBy,
        description: log.reason,
        notificationSent: log.notificationSent,
        reason: log.reason,
      }))

      // 시간순으로 정렬 (최신순)
      timelineItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setTimeline(timelineItems)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('상태 타임라인을 불러오는데 실패했습니다.')
      setError(error)
      setTimeline([])
    } finally {
      setLoading(false)
    }
  }, [applicationId])

  useEffect(() => {
    fetchTimeline()
  }, [fetchTimeline])

  return {
    timeline,
    loading,
    error,
    refresh: fetchTimeline,
  }
}
