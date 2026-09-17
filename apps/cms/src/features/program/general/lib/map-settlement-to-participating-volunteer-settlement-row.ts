import type { SettlementListItemResponse } from '@/shared/api/generated/settlement/schemas'
import type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'
import type { ParticipatingIndividualInstructorLectureProgress } from '@/features/program/general/lib/participating-individual-instructor-lecture-report-types'
import { PARTICIPATING_INDIVIDUAL_INSTRUCTOR_LECTURE_PROGRESS_LABELS } from '@/features/program/general/lib/participating-individual-instructor-lecture-report-display'
import {
  buildParticipatingInstructorEducationScheduleLabel,
  inferParticipatingInstructorLectureProgress,
} from '@/features/program/general/lib/map-settlement-to-participating-instructor-settlement-row'
import { resolveSettlementUiStatus } from '@/features/user/api/map-settlement-to-instructor-member-row'
import type { ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'

/** 봉사자 정산 — 정정 요청·재신청 상태값은 스펙상 없음 → 표시에서 제외 */
const VOLUNTEER_EXCLUDED_PAYMENT_STATEMENT_STATUSES: ReadonlySet<InstructorSettlementUiStatus> =
  new Set(['payment_correction_requested', 'payment_statement_reapplication'])

export type ParticipatingVolunteerProgress = ParticipatingIndividualInstructorLectureProgress

export type ParticipatingVolunteerProgressLabel =
  (typeof PARTICIPATING_INDIVIDUAL_INSTRUCTOR_LECTURE_PROGRESS_LABELS)[ParticipatingVolunteerProgress]

export interface ParticipatingVolunteerSettlementApiRow {
  id: string
  settlementId: number
  no: number
  institutionName: string
  assignedGrade: string
  volunteerScheduleLabel: string
  volunteerProgress: ParticipatingVolunteerProgress
  volunteerProgressLabel: ParticipatingVolunteerProgressLabel
  hasPaymentStatementApplication: boolean
  paymentStatementStatus: InstructorSettlementUiStatus
  scheduledSettlementAmount: number | null
  canViewPaymentStatement: boolean
  sessionCompleted?: number
  sessionTotal?: number
}

function hasPaymentStatementApplication(
  status: InstructorSettlementUiStatus,
  item: SettlementListItemResponse
): boolean {
  if (status === 'none') return false
  if (VOLUNTEER_EXCLUDED_PAYMENT_STATEMENT_STATUSES.has(status)) return false
  const statementStatus = item.statementStatus?.trim().toUpperCase()
  if (statementStatus && statementStatus !== 'NONE') return true
  return true
}

function resolveVolunteerProgress(
  item: SettlementListItemResponse,
  volunteer: ParticipatingVolunteerRow
): ParticipatingVolunteerProgress {
  const base = inferParticipatingInstructorLectureProgress(item)
  if (base === 'completed') return 'completed'
  if (volunteer.activityWithdrawn) return 'activity_withdrawn'
  const sessionKey =
    item.sessionOrdinal != null && item.sessionOrdinal > 0
      ? String(item.sessionOrdinal)
      : item.scheduleId != null
        ? String(item.scheduleId)
        : ''
  if (
    sessionKey &&
    volunteer.performanceExcludedSessionKeys?.some(key => key === sessionKey || key.endsWith(`:${sessionKey}`))
  ) {
    return 'activity_withdrawn'
  }
  return 'scheduled'
}

export function shouldShowVolunteerSettlementDash(row: {
  volunteerProgress: ParticipatingVolunteerProgress
  hasPaymentStatementApplication: boolean
  paymentStatementStatus: InstructorSettlementUiStatus
}): boolean {
  if (row.volunteerProgress !== 'completed') return true
  if (!row.hasPaymentStatementApplication) return true
  if (VOLUNTEER_EXCLUDED_PAYMENT_STATEMENT_STATUSES.has(row.paymentStatementStatus)) return true
  return false
}

export function mapSettlementToParticipatingVolunteerSettlementRow(
  item: SettlementListItemResponse,
  index: number,
  totalCount: number,
  volunteer: ParticipatingVolunteerRow
): ParticipatingVolunteerSettlementApiRow | null {
  const settlementId = item.settlementId
  if (settlementId == null) return null

  const rawStatus = resolveSettlementUiStatus(item)
  const paymentStatementStatus = VOLUNTEER_EXCLUDED_PAYMENT_STATEMENT_STATUSES.has(rawStatus)
    ? 'none'
    : rawStatus
  const volunteerProgress = resolveVolunteerProgress(item, volunteer)
  const volunteerProgressLabel =
    PARTICIPATING_INDIVIDUAL_INSTRUCTOR_LECTURE_PROGRESS_LABELS[volunteerProgress]
  const hasApplication = hasPaymentStatementApplication(paymentStatementStatus, item)
  const scheduledSettlementAmount = item.netPaymentAmount ?? item.grossAmount ?? null
  const canView =
    volunteerProgress === 'completed' &&
    hasApplication &&
    !VOLUNTEER_EXCLUDED_PAYMENT_STATEMENT_STATUSES.has(paymentStatementStatus)

  return {
    id: String(settlementId),
    settlementId,
    no: totalCount - index,
    institutionName: item.institutionName?.trim() || '-',
    assignedGrade: '-',
    volunteerScheduleLabel: buildParticipatingInstructorEducationScheduleLabel(item),
    volunteerProgress,
    volunteerProgressLabel,
    hasPaymentStatementApplication: hasApplication,
    paymentStatementStatus,
    scheduledSettlementAmount,
    canViewPaymentStatement: canView,
    sessionCompleted: item.sessionCompleted,
    sessionTotal: item.sessionTotal,
  }
}

export function mapSettlementsToParticipatingVolunteerSettlementRows(
  items: SettlementListItemResponse[],
  volunteer: ParticipatingVolunteerRow
): ParticipatingVolunteerSettlementApiRow[] {
  const sorted = [...items].sort((a, b) => {
    const dateA = a.lectureDate ?? ''
    const dateB = b.lectureDate ?? ''
    if (dateA !== dateB) return dateB.localeCompare(dateA)
    return (b.sessionOrdinal ?? 0) - (a.sessionOrdinal ?? 0)
  })

  return sorted
    .map((item, index) =>
      mapSettlementToParticipatingVolunteerSettlementRow(item, index, sorted.length, volunteer)
    )
    .filter((row): row is ParticipatingVolunteerSettlementApiRow => row != null)
}

export function summarizeParticipatingVolunteerSettlementProgress(
  rows: ParticipatingVolunteerSettlementApiRow[]
): { completed: number; total: number } {
  const completed = rows.filter(row => row.volunteerProgress === 'completed').length
  const sessionTotals = rows
    .map(row => row.sessionTotal)
    .filter((value): value is number => value != null && value > 0)
  const total = sessionTotals.length > 0 ? Math.max(...sessionTotals) : rows.length
  return { completed, total }
}

/** 요약 카드 — 표시 가능한 지급조서 상태 집계 */
export function summarizeParticipatingVolunteerPaymentStatementStatus(
  rows: ParticipatingVolunteerSettlementApiRow[]
): InstructorSettlementUiStatus {
  const statuses = rows
    .filter(row => !shouldShowVolunteerSettlementDash(row))
    .map(row => row.paymentStatementStatus)
    .filter(status => status !== 'none')

  if (statuses.length === 0) return 'none'
  const unique = new Set(statuses)
  if (unique.size === 1) return statuses[0]!
  return 'partial_confirmation'
}
