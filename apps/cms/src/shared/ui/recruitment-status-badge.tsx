/**
 * 모집 상태 배지 컴포넌트
 * 테이블·필터 등에서 모집 기간 기준 상태(모집 예정 / 모집 중 / 모집 마감) 표시
 * 디자인: persona + color-system - 연한 배경 + 진한 텍스트로 가독성 확보
 */

import type { ReactNode } from 'react'
import './recruitment-status-badge.css'

export type RecruitmentStatus = 'scheduled' | 'recruiting' | 'closed'

const LABELS: Record<RecruitmentStatus, string> = {
  scheduled: '모집 예정',
  recruiting: '모집 중',
  closed: '모집 마감',
}

export interface RecruitmentStatusBadgeProps {
  /** 모집 기간 기준 상태 (null이면 미표시) */
  status: RecruitmentStatus | null
  /** 미표시일 때 렌더할 내용 (기본: '-') */
  fallback?: ReactNode
  /** 추가 클래스명 */
  className?: string
}

/**
 * 모집 상태 배지
 * - 모집 중: 연한 하늘색 배경, 진한 파란색 텍스트
 * - 모집 예정: 연한 회색 배경, 진한 회색 텍스트
 * - 모집 마감: 연한 분홍색 배경, 진한 빨간색 텍스트
 */
export function RecruitmentStatusBadge({
  status,
  fallback = '-',
  className = '',
}: RecruitmentStatusBadgeProps) {
  if (status === null) {
    return <>{fallback}</>
  }

  const label = LABELS[status]
  const modifier = `recruitment-status-badge--${status}`

  return (
    <span
      className={`recruitment-status-badge ${modifier} ${className}`.trim()}
      role="status"
      aria-label={label}
    >
      {label}
    </span>
  )
}
