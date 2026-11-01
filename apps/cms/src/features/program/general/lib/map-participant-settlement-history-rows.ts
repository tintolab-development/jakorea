import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import { mapDashboardScheduleDeliveryToEducationProgress } from '@/features/program/general/lib/dashboard-schedule-delivery-status'
import {
  mapSettlementToParticipatingInstructorSettlementRow,
  type ParticipatingInstructorSettlementApiRow,
} from '@/features/program/general/lib/map-settlement-to-participating-instructor-settlement-row'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import type { SettlementListItemResponse } from '@/shared/api/generated/settlement/schemas'
import type { ParticipatingIndividualInstructorLectureProgress } from '@/features/program/general/lib/participating-individual-instructor-lecture-report-types'
import type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'

export type ParticipatingParticipantSettlementHistoryRow = {
  id: string
  no: number
  educationScheduleLabel: string
  lectureProgress: ParticipatingIndividualInstructorLectureProgress
  lectureProgressLabel: '진행 완료' | '진행 예정'
  hasPaymentStatementApplication: boolean
  paymentStatementStatus: InstructorSettlementUiStatus
  scheduledSettlementAmount: number | null
  canViewPaymentStatement: boolean
  sourceSettlement: ParticipatingInstructorSettlementApiRow | null
}

function positiveId(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null
  return Math.trunc(value)
}

function sessionScheduleLabel(session: ParticipatingSchoolSession): string {
  const raw =
    session.scheduleLabel?.trim() ||
    session.educationScheduleLabel?.trim() ||
    session.scheduleName?.trim() ||
    [session.date, session.timeRange].filter(Boolean).join(' ').trim()
  if (!raw) return '-'
  return formatCmsScheduleDisplayLabel(raw)
}

function sessionLectureProgress(
  session: ParticipatingSchoolSession
): ParticipatingIndividualInstructorLectureProgress {
  return mapDashboardScheduleDeliveryToEducationProgress(
    session.deliveryScheduleStatus ??
      (session.status === 'completed' ? 'COMPLETED' : 'SCHEDULED')
  )
}

function sessionSortKey(session: ParticipatingSchoolSession): string {
  return session.startAt?.trim() || session.date?.trim() || ''
}

function emptyPaymentFields(): Pick<
  ParticipatingParticipantSettlementHistoryRow,
  | 'hasPaymentStatementApplication'
  | 'paymentStatementStatus'
  | 'scheduledSettlementAmount'
  | 'canViewPaymentStatement'
  | 'sourceSettlement'
> {
  return {
    hasPaymentStatementApplication: false,
    paymentStatementStatus: 'none',
    scheduledSettlementAmount: null,
    canViewPaymentStatement: false,
    sourceSettlement: null,
  }
}

function overlaySettlement(
  item: SettlementListItemResponse | undefined,
  index: number,
  totalCount: number
): Pick<
  ParticipatingParticipantSettlementHistoryRow,
  | 'hasPaymentStatementApplication'
  | 'paymentStatementStatus'
  | 'scheduledSettlementAmount'
  | 'canViewPaymentStatement'
  | 'sourceSettlement'
> {
  if (item == null) return emptyPaymentFields()
  const mapped = mapSettlementToParticipatingInstructorSettlementRow(item, index, totalCount)
  if (mapped == null) return emptyPaymentFields()
  return {
    hasPaymentStatementApplication: mapped.hasPaymentStatementApplication,
    paymentStatementStatus: mapped.paymentStatementStatus,
    scheduledSettlementAmount: mapped.scheduledSettlementAmount,
    canViewPaymentStatement: mapped.canViewPaymentStatement,
    sourceSettlement: mapped,
  }
}

/**
 * 참여자 정산 내역 — 배정된 교육 일정이 행 SSOT.
 * 지급조서 값은 scheduleId가 맞는 settlement 목록으로만 붙인다.
 */
export function mapParticipantSettlementHistoryRows(input: {
  assignedSessions: ReadonlyArray<ParticipatingSchoolSession>
  settlementItems: ReadonlyArray<SettlementListItemResponse>
}): ParticipatingParticipantSettlementHistoryRow[] {
  const settlementsByScheduleId = new Map<number, SettlementListItemResponse>()
  for (const item of input.settlementItems) {
    const scheduleId = positiveId(item.scheduleId)
    if (scheduleId == null || settlementsByScheduleId.has(scheduleId)) continue
    settlementsByScheduleId.set(scheduleId, item)
  }

  const sortedSessions = [...input.assignedSessions].sort((a, b) => {
    const dateA = sessionSortKey(a)
    const dateB = sessionSortKey(b)
    if (dateA !== dateB) return dateB.localeCompare(dateA)
    return (b.sessionNo ?? b.round ?? 0) - (a.sessionNo ?? a.round ?? 0)
  })

  return sortedSessions.map((session, index) => {
    const scheduleId = positiveId(session.resolvedScheduleId)
    const lectureProgress = sessionLectureProgress(session)
    const lectureProgressLabel = lectureProgress === 'completed' ? '진행 완료' : '진행 예정'
    const settlement = scheduleId != null ? settlementsByScheduleId.get(scheduleId) : undefined
    return {
      id: scheduleId != null ? `schedule:${scheduleId}` : `session:${index}`,
      no: sortedSessions.length - index,
      educationScheduleLabel: sessionScheduleLabel(session),
      lectureProgress,
      lectureProgressLabel,
      ...overlaySettlement(settlement, index, sortedSessions.length),
    }
  })
}

export function participantSettlementHistoryFromInstructorRows(
  rows: ParticipatingInstructorSettlementApiRow[]
): ParticipatingParticipantSettlementHistoryRow[] {
  return rows.map(row => ({
    id: row.id,
    no: row.no,
    educationScheduleLabel: row.educationScheduleLabel,
    lectureProgress: row.lectureProgress,
    lectureProgressLabel: row.lectureProgressLabel,
    hasPaymentStatementApplication: row.hasPaymentStatementApplication,
    paymentStatementStatus: row.paymentStatementStatus,
    scheduledSettlementAmount: row.scheduledSettlementAmount,
    canViewPaymentStatement: row.canViewPaymentStatement,
    sourceSettlement: row,
  }))
}
