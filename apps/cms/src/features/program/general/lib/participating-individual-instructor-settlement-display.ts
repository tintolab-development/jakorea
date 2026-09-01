import { getInstructorSettlementStatusLabel } from '@/shared/constants/instructor-settlement-status'
import { isParticipatingInstructorSettlementEligibleForPaymentStatementDownload } from '@/features/program/general/lib/participating-instructor-payment-statement-issuance-view'
import type { ParticipatingIndividualInstructorSettlementRow } from '@/features/program/general/lib/participating-individual-instructor-settlement-types'

export function isIndividualInstructorLectureCompleted(
  row: Pick<ParticipatingIndividualInstructorSettlementRow, 'lectureProgress'>
): boolean {
  return row.lectureProgress === 'completed'
}

export function shouldShowIndividualSettlementDash(
  row: Pick<
    ParticipatingIndividualInstructorSettlementRow,
    'lectureProgress' | 'hasPaymentStatementApplication'
  >
): boolean {
  return !isIndividualInstructorLectureCompleted(row) || !row.hasPaymentStatementApplication
}

export function formatIndividualSettlementAmount(amount: number | null): string {
  if (amount == null) return '-'
  return `${amount.toLocaleString('ko-KR')}원`
}

export function resolveIndividualPaymentStatementExportLabel(
  row: ParticipatingIndividualInstructorSettlementRow
): string {
  if (shouldShowIndividualSettlementDash(row)) return '-'
  return getInstructorSettlementStatusLabel(row.paymentStatementStatus)
}

export function resolveIndividualSettlementExportAmount(
  row: ParticipatingIndividualInstructorSettlementRow
): string {
  if (shouldShowIndividualSettlementDash(row)) return '-'
  return formatIndividualSettlementAmount(row.scheduledSettlementAmount)
}

export function isIndividualInstructorSettlementEligibleForPaymentStatementDownload(
  row: ParticipatingIndividualInstructorSettlementRow
): boolean {
  return isParticipatingInstructorSettlementEligibleForPaymentStatementDownload({
    lectureProgressLabel: isIndividualInstructorLectureCompleted(row) ? '진행 완료' : '진행 예정',
    hasPaymentStatementApplication: row.hasPaymentStatementApplication,
    paymentStatementStatus: row.paymentStatementStatus,
  })
}
