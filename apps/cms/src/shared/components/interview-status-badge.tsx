/**
 * 면접 상태 배지 컴포넌트
 * Phase 4.3.1: 강사/봉사자 신청 상태 표시
 */

import { Tag } from 'antd'
import type { InterviewStatus } from '@/types/user'

interface InterviewStatusBadgeProps {
  status: InterviewStatus
  size?: 'small' | 'middle' | 'large'
}

/**
 * 면접 상태별 색상 및 라벨
 */
const statusConfig: Record<InterviewStatus, { color: string; label: string }> = {
  NOT_REQUIRED: {
    color: 'green',
    label: '면접 불필요',
  },
  PENDING: {
    color: 'orange',
    label: '면접 필요',
  },
  SCHEDULED: {
    color: 'blue',
    label: '면접 일정 확정',
  },
  COMPLETED: {
    color: 'purple',
    label: '면접 완료',
  },
  APPROVED: {
    color: 'success',
    label: '승인 완료',
  },
  REJECTED: {
    color: 'error',
    label: '반려',
  },
}

/**
 * 면접 상태 배지 컴포넌트
 */
export function InterviewStatusBadge({ status, size = 'middle' }: InterviewStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Tag color={config.color} style={{ fontSize: size === 'small' ? '12px' : '14px' }}>
      {config.label}
    </Tag>
  )
}

