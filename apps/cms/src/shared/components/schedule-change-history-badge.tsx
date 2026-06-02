/**
 * 일정 변경&취소 이력 배지
 * 참여자·강사·학교명 옆 인라인 표시 (연한 red tint 배경)
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
