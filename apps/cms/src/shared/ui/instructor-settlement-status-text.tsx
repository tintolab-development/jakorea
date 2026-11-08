/** 강사 정산 Text — 공통 renderer + 정산 presentation registry. */
import {
  getInstructorSettlementStatusLabel,
  getInstructorSettlementStatusTextClassName,
  type InstructorSettlementUiStatus,
} from '@/shared/constants/instructor-settlement-status'
import { StatusBadge } from '@/shared/components/status-badge'

export interface InstructorSettlementStatusTextProps {
  status: InstructorSettlementUiStatus
  className?: string
  title?: string
  /** 회원 API 별칭 문구를 보존한다. 값/라벨 정규화 용도가 아니다. */
  label?: string
}

export function InstructorSettlementStatusText({
  status,
  className,
  title,
  label = getInstructorSettlementStatusLabel(status),
}: InstructorSettlementStatusTextProps) {
  return (
    <StatusBadge
      domain="settlement"
      status={status}
      variant="text"
      label={label}
      className={[getInstructorSettlementStatusTextClassName(status), className]
        .filter(Boolean)
        .join(' ')}
      title={title ?? label}
    />
  )
}
