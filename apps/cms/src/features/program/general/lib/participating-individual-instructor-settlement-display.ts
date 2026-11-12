import { getInstructorSettlementStatusLabel } from '@/shared/constants/instructor-settlement-status'
import { formatNumberDisplay } from '@/shared/utils'
import { isParticipatingInstructorSettlementEligibleForPaymentStatementDownload } from '@/features/program/general/lib/participating-instructor-payment-statement-issuance-view'
import type { ParticipatingIndividualInstructorLectureProgress } from '@/features/program/general/lib/participating-individual-instructor-lecture-report-types'
import { toParticipatingInstructorLectureProgressLabel } from '@/features/program/general/lib/map-settlement-to-participating-instructor-settlement-row'

export function isIndividualInstructorLectureCompleted(row: {
  lectureProgress: ParticipatingIndividualInstructorLectureProgress
}): boolean {
  return row.lectureProgress === 'completed'
}

/** 진행 예정·미신청(지급조서 없음) 행은 처리 현황·금액을 '-'로 표시한다. 활동 포기 행도 제출된 지급조서가 있으면 보여 준다. */
export function shouldShowIndividualSettlementDash(row: {
  lectureProgress: ParticipatingIndividualInstructorLectureProgress
  hasPaymentStatementApplication: boolean
}): boolean {
  return row.lectureProgress === 'scheduled' || !row.hasPaymentStatementApplication
}

/** 미신청 행·진행 예정 행은 [지급조서 보기]를 비활성화한다 */
export function isIndividualInstructorPaymentStatementViewDisabled(row: {
  isNotApplied: boolean
  lectureProgress: ParticipatingIndividualInstructorLectureProgress
}): boolean {
  return row.isNotApplied || row.lectureProgress === 'scheduled'
}

export function formatIndividualSettlementAmount(amount: number | null): string {
  if (amount == null) return '-'
  return `${formatNumberDisplay(amount)}원`
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
    lectureProgressLabel: toParticipatingInstructorLectureProgressLabel(row.lectureProgress),
    hasPaymentStatementApplication: row.hasPaymentStatementApplication,
    paymentStatementStatus: row.paymentStatementStatus,
  })
}
