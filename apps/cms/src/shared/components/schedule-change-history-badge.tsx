/**
 * 일정 변경&취소 이력 배지
 * 참여자·강사·학교명 옆 인라인 표시 (연한 red tint 배경)
 */

import './schedule-change-history-badge.css'

export type ScheduleChangeHistoryBadgeLabelVariant = 'schedule' | 'name'

interface ScheduleChangeHistoryBadgeProps {
  /** 이력 횟수 (1 이상만 배지 표시 권장) */
  count: number
  className?: string
  /** progress 참여자 상세 시안: 이름 변경&취소 / 신청·강사 등: 일정 변경&취소 */
  labelVariant?: ScheduleChangeHistoryBadgeLabelVariant
}

export function ScheduleChangeHistoryBadge({
  count,
  className,
  labelVariant = 'schedule',
}: ScheduleChangeHistoryBadgeProps) {
  const prefix =
    labelVariant === 'name' ? '이름 변경&취소 이력' : '일정 변경&취소 이력'
  const safeCount = Number.isFinite(count) && count > 0 ? count : 0
  const label = `${prefix} ${safeCount}회`
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
