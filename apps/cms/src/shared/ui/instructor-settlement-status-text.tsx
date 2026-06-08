/**
 * 강사 정산 현황 — 배지 없이 텍스트만 표시 (테이블 열 등)
 */

import {
  getInstructorSettlementStatusLabel,
  getInstructorSettlementStatusTextClassName,
  type InstructorSettlementUiStatus,
} from '@/shared/constants/instructor-settlement-status'
import './instructor-settlement-status-text.css'

export interface InstructorSettlementStatusTextProps {
  status: InstructorSettlementUiStatus
  className?: string
  title?: string
}

export function InstructorSettlementStatusText({
  status,
  className,
  title,
}: InstructorSettlementStatusTextProps) {
  const label = getInstructorSettlementStatusLabel(status)
  return (
    <span
      role="status"
      className={[getInstructorSettlementStatusTextClassName(status), className]
        .filter(Boolean)
        .join(' ')}
      title={title ?? label}
    >
      {label}
    </span>
  )
}
