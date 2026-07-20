import type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'
import type { ParticipatingIndividualInstructorLectureProgress } from '@/features/program/general/lib/participating-individual-instructor-lecture-report-types'

export type ParticipatingIndividualInstructorSettlementRow = {
  id: string
  scheduleLabel: string
  lectureProgress: ParticipatingIndividualInstructorLectureProgress
  hasPaymentStatementApplication: boolean
  paymentStatementStatus: InstructorSettlementUiStatus
  scheduledSettlementAmount: number | null
  canViewPaymentStatement: boolean
}
