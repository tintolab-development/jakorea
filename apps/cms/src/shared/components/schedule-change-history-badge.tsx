/**
 * 일정 변경&취소 이력 배지
 * 수강 신청 학교 상세 모달 등에서 참여 학교명 옆에 표시 (연한 녹색, 기존 현황 배지 톤)
 */

import './schedule-change-history-badge.css'

interface ScheduleChangeHistoryBadgeProps {
  /** 이력 횟수 (1 이상만 배지 표시 권장) */
  count: number
  className?: string
}

export function ScheduleChangeHistoryBadge({ count, className }: ScheduleChangeHistoryBadgeProps) {
  const label = count <= 0 ? '0회' : `일정 변경&취소 이력 ${count}회`
  return (
    <span
      className={`schedule-change-history-badge ${className ?? ''}`.trim()}
      role="status"
      aria-label={label}
    >
      {label}
    </span>
  )
}
