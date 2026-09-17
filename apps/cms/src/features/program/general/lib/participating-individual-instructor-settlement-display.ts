import { getInstructorSettlementStatusLabel } from '@/shared/constants/instructor-settlement-status'
import { isParticipatingInstructorSettlementEligibleForPaymentStatementDownload } from '@/features/program/general/lib/participating-instructor-payment-statement-issuance-view'
import type { ParticipatingIndividualInstructorLectureProgress } from '@/features/program/general/lib/participating-individual-instructor-lecture-report-types'

export function isIndividualInstructorLectureCompleted(row: {
  lectureProgress: ParticipatingIndividualInstructorLectureProgress
}): boolean {
  return row.lectureProgress === 'completed'
}

export function shouldShowIndividualSettlementDash(row: {
  lectureProgress: ParticipatingIndividualInstructorLectureProgress
  hasPaymentStatementApplication: boolean
}): boolean {
  return !isIndividualInstructorLectureCompleted(row) || !row.hasPaymentStatementApplication
}

export function formatIndividualSettlementAmount(amount: number | null): string {
  if (amount == null) return '-'
  return `${amount.toLocaleString('ko-KR')}원`
}

export function resolveIndividualPaymentStatementExportLabel(row: {
  lectureProgress: ParticipatingIndividualInstructorLectureProgress
  hasPaymentStatementApplication: boolean
  paymentStatementStatus: Parameters<typeof getInstructorSettlementStatusLabel>[0]
}): string {
  if (shouldShowIndividualSettlementDash(row)) return '-'
  return getInstructorSettlementStatusLabel(row.paymentStatementStatus)
}

export function resolveIndividualSettlementExportAmount(row: {
  lectureProgress: ParticipatingIndividualInstructorLectureProgress
  hasPaymentStatementApplication: boolean
  scheduledSettlementAmount: number | null
}): string {
  if (shouldShowIndividualSettlementDash(row)) return '-'
  return formatIndividualSettlementAmount(row.scheduledSettlementAmount)
}

export function isIndividualInstructorSettlementEligibleForPaymentStatementDownload(row: {
  lectureProgress: ParticipatingIndividualInstructorLectureProgress
  hasPaymentStatementApplication: boolean
  paymentStatementStatus: Parameters<
    typeof isParticipatingInstructorSettlementEligibleForPaymentStatementDownload
  >[0]['paymentStatementStatus']
}): boolean {
  return isParticipatingInstructorSettlementEligibleForPaymentStatementDownload({
    lectureProgressLabel: isIndividualInstructorLectureCompleted(row) ? '진행 완료' : '진행 예정',
    hasPaymentStatementApplication: row.hasPaymentStatementApplication,
    paymentStatementStatus: row.paymentStatementStatus,
  })
}
