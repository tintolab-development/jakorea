/**
 * 면접 상태값 정의
 * Phase 0.1.4: 상태값/기본 모델 정의
 * 
 * 강사 인터뷰 상태 (신규 강사용)
 */

import type { InterviewStatus } from '@/types/user'

/**
 * 강사 인터뷰 상태 (신규 강사용)
 */
export const INTERVIEW_STATUS = {
  NOT_REQUIRED: { label: '면접 불필요', color: 'default' },
  PENDING: { label: '면접 대기', color: 'warning' },
  SCHEDULED: { label: '면접 예정', color: 'processing' },
  COMPLETED: { label: '면접 완료', color: 'success' },
  APPROVED: { label: '승인', color: 'success' },
  REJECTED: { label: '불합격', color: 'error' },
} as const

/**
 * 면접 상태 라벨 가져오기
 */
export function getInterviewStatusLabel(status: InterviewStatus): string {
  return INTERVIEW_STATUS[status]?.label || status
}

/**
 * 면접 상태 색상 가져오기
 */
export function getInterviewStatusColor(status: InterviewStatus): string {
  return INTERVIEW_STATUS[status]?.color || 'default'
}
