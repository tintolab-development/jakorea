import type { DateValue } from '@/types'
import { DividerVertical } from '@/shared/components/divider-vertical'
import { formatDate } from '@/features/program/shared/lib/program-detail-info-constants'
import './registration-audit-value.css'

export function resolveProgramRegistrationAuditLabels(
  at: DateValue | undefined,
  name?: string | null
): { dateLabel: string; nameLabel: string } {
  return {
    dateLabel: formatDate(at),
    nameLabel: name?.trim() || '-',
  }
}

/** 최초 등록일·마지막 수정일 값: 일시 + DividerVertical + 등록자/수정자 */
export function ProgramRegistrationAuditValue({
  at,
  name,
}: {
  at: DateValue | undefined
  name?: string | null
}) {
  const { dateLabel, nameLabel } = resolveProgramRegistrationAuditLabels(at, name)
  return (
    <span className="program-registration-audit-value">
      <span>{dateLabel}</span>
      <DividerVertical />
      <span>{nameLabel}</span>
    </span>
  )
}
