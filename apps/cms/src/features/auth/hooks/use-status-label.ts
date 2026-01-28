/**
 * 상태 라벨 Hook
 * Phase 0.1.4: 상태값/기본 모델 정의
 */

import { useMemo } from 'react'
import type { ApplicationProgressStatus } from '@/types/application-progress'
import type { InterviewStatus } from '@/types/user'
import {
  getApplicationStatusLabel,
  getApplicationStatusColor,
  getApplicationStatusOrder,
} from '@/shared/constants/application-status'
import { getInterviewStatusLabel, getInterviewStatusColor } from '@/shared/constants/interview-status'

// useStatusTimeline re-export
export { useStatusTimeline } from './use-status-timeline'
export type { StatusTimelineItem } from './use-status-timeline'

/**
 * 신청 진행 상태 라벨/색상 반환
 */
export function useStatusLabel(status: ApplicationProgressStatus) {
  return useMemo(
    () => ({
      label: getApplicationStatusLabel(status),
      color: getApplicationStatusColor(status),
      order: getApplicationStatusOrder(status),
    }),
    [status]
  )
}

/**
 * 면접 상태 라벨/색상 반환
 */
export function useInterviewStatusLabel(status: InterviewStatus) {
  return useMemo(
    () => ({
      label: getInterviewStatusLabel(status),
      color: getInterviewStatusColor(status),
    }),
    [status]
  )
}
