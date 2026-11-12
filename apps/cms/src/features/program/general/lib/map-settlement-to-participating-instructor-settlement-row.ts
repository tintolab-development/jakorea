import dayjs from 'dayjs'
import type { SettlementListItemResponse } from '@/shared/api/generated/settlement/schemas'
import { resolveSettlementUiStatus } from '@/features/user/api/map-settlement-to-instructor-member-row'
import type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'
import type { ParticipatingIndividualInstructorLectureProgress } from '@/features/program/general/lib/participating-individual-instructor-lecture-report-types'
import {
  buildSettlementScheduleDisplayLabel,
  compareSettlementScheduleLatestFirst,
  formatIsoDateTime,
  formatLectureDateOnly,
  mapSettlementLectureProgressStatus,
  toSettlementScheduleSortTime,
} from '@/features/program/general/lib/settlement-schedule-display-label'

/** 정산 현황 행 종류 — 서버 rowType, 없으면 ID로 추론 */
export type ParticipatingInstructorSettlementRowType =
  | 'SETTLEMENT'
  | 'SETTLEMENT_APPLICATION'
  | 'NOT_APPLIED'

export type ParticipatingInstructorLectureProgressLabel = '진행 완료' | '진행 예정' | '활동 포기'

export interface ParticipatingInstructorSettlementApiRow {
  /** `${rowType}:${settlementId ?? settlementApplicationId ?? instructorAssignmentId}` */
  id: string
  rowType: ParticipatingInstructorSettlementRowType
  /** 정산 신청 전인 배정 교육 일정 행 — 처리 현황·금액 없음, 지급조서 보기 불가 */
  isNotApplied: boolean
  /** 확정 정산 행 ID. 확정 전 신청서 행이면 null */
  settlementId: number | null
  /** 정산 신청서 ID. 확정 전 신청서 행의 승인·반려·보정 요청은 이 값으로 호출한다 */
  settlementApplicationId: number | null
  /** settlementId === null && settlementApplicationId !== null */
  isPendingApplication: boolean
  /** 서버 availableActions 그대로 (status로 재계산하지 않음) */
  availableActions: string[]
  no: number
  institutionName: string
  educationGrade: string
  educationScheduleLabel: string
  lectureProgressLabel: ParticipatingInstructorLectureProgressLabel
  lectureProgress: ParticipatingIndividualInstructorLectureProgress
  hasPaymentStatementApplication: boolean
  paymentStatementStatus: InstructorSettlementUiStatus
  scheduledSettlementAmount: number | null
  canViewPaymentStatement: boolean
  sessionCompleted?: number
  sessionTotal?: number
}

export function buildParticipatingInstructorEducationScheduleLabel(
  item: SettlementListItemResponse
): string {
  const progressDisplay = item.programSessionProgressDisplay?.trim()
  if (progressDisplay) return progressDisplay

  const datePart = formatIsoDateTime(item.lectureDate) || formatLectureDateOnly(item.lectureDate)
  const sessionPart =
    item.sessionOrdinal != null && item.sessionOrdinal > 0 ? `${item.sessionOrdinal}회차` : ''
  if (datePart && sessionPart) return `${datePart} | ${sessionPart}`
  return datePart || sessionPart || '-'
}

const LECTURE_PROGRESS_LABELS: Record<
  ParticipatingIndividualInstructorLectureProgress,
  ParticipatingInstructorLectureProgressLabel
> = {
  completed: '진행 완료',
  scheduled: '진행 예정',
  activity_withdrawn: '활동 포기',
}

export function toParticipatingInstructorLectureProgressLabel(
  progress: ParticipatingIndividualInstructorLectureProgress
): ParticipatingInstructorLectureProgressLabel {
  return LECTURE_PROGRESS_LABELS[progress]
}

/**
 * 정산 현황 행 「교육 진행 일정」 — `YYYY.MM.DD(요일) | HH:MM~HH:MM | N회차 또는 일정명` (기획 2026-11-12).
 * 행 하나가 배정 일정 1건이라 진행 회차 요약(`programSessionProgressDisplay`)보다 일정 정보를 먼저 쓴다.
 * 시간·회차·일정명이 없으면 있는 부분만, 모두 없으면 기존 라벨 규칙을 쓴다.
 */
export function buildParticipatingInstructorSettlementRowScheduleLabel(
  item: SettlementListItemResponse
): string {
  return buildSettlementScheduleDisplayLabel(item) || buildParticipatingInstructorEducationScheduleLabel(item)
}

/** 서버 lectureProgressStatus 우선, 값이 없을 때만 일정일로 추론한다 */
export function inferParticipatingInstructorLectureProgress(
  item: SettlementListItemResponse
): ParticipatingIndividualInstructorLectureProgress {
  const serverProgress = mapSettlementLectureProgressStatus(item.lectureProgressStatus)
  if (serverProgress) return serverProgress

  const lectureDate = item.lectureDate?.slice(0, 10)
  if (lectureDate) {
    const parsed = dayjs(lectureDate)
    if (parsed.isValid()) {
      return parsed.endOf('day').isBefore(dayjs()) ? 'completed' : 'scheduled'
    }
  }
  const completed = item.sessionCompleted ?? 0
  const total = item.sessionTotal ?? 0
  if (total > 0 && completed >= total) return 'completed'
  return 'scheduled'
}

function hasPaymentStatementApplication(
  status: InstructorSettlementUiStatus,
  item: SettlementListItemResponse
): boolean {
  if (status === 'none') return false
  const statementStatus = item.statementStatus?.trim().toUpperCase()
  if (statementStatus && statementStatus !== 'NONE') return true
  return true
}

export function resolveParticipatingInstructorSettlementRowType(
  item: SettlementListItemResponse
): ParticipatingInstructorSettlementRowType {
  const rowType = item.rowType?.toUpperCase()
  if (rowType === 'SETTLEMENT' || rowType === 'SETTLEMENT_APPLICATION' || rowType === 'NOT_APPLIED') {
    return rowType
  }
  if (item.settlementId != null) return 'SETTLEMENT'
  if (item.settlementApplicationId != null) return 'SETTLEMENT_APPLICATION'
  return 'NOT_APPLIED'
}

function buildRowId(
  rowType: ParticipatingInstructorSettlementRowType,
  item: SettlementListItemResponse,
  index: number
): string {
  const key =
    item.settlementId ?? item.settlementApplicationId ?? item.instructorAssignmentId ?? null
  // 같은 배정에 일정이 여러 건일 수 있어 미신청 행은 scheduleId를 덧붙인다.
  const scheduleSuffix = rowType === 'NOT_APPLIED' && item.scheduleId != null ? `:${item.scheduleId}` : ''
  return `${rowType}:${key ?? `index-${index}`}${scheduleSuffix}`
}

export function mapSettlementToParticipatingInstructorSettlementRow(
  item: SettlementListItemResponse,
  index: number
): ParticipatingInstructorSettlementApiRow {
  const settlementId = item.settlementId ?? null
  const settlementApplicationId = item.settlementApplicationId ?? null
  const rowType = resolveParticipatingInstructorSettlementRowType(item)
  const isNotApplied = rowType === 'NOT_APPLIED'
  const isPendingApplication = settlementId == null && settlementApplicationId != null

  const paymentStatementStatus = isNotApplied ? 'none' : resolveSettlementUiStatus(item)
  const lectureProgress = inferParticipatingInstructorLectureProgress(item)
  const lectureProgressLabel = toParticipatingInstructorLectureProgressLabel(lectureProgress)
  const hasApplication =
    !isNotApplied && hasPaymentStatementApplication(paymentStatementStatus, item)
  const scheduledSettlementAmount = isNotApplied
    ? null
    : (item.netPaymentAmount ?? item.grossAmount ?? null)

  return {
    id: buildRowId(rowType, item, index),
    rowType,
    isNotApplied,
    settlementId,
    settlementApplicationId,
    isPendingApplication,
    availableActions: item.availableActions ?? [],
    no: index + 1,
    institutionName: item.institutionName?.trim() || '-',
    educationGrade: '-',
    educationScheduleLabel: buildParticipatingInstructorSettlementRowScheduleLabel(item),
    lectureProgressLabel,
    lectureProgress,
    hasPaymentStatementApplication: hasApplication,
    paymentStatementStatus,
    scheduledSettlementAmount,
    canViewPaymentStatement: settlementId != null && hasApplication,
    sessionCompleted: item.sessionCompleted ?? undefined,
    sessionTotal: item.sessionTotal ?? undefined,
  }
}

export function mapSettlementsToParticipatingInstructorSettlementRows(
  items: SettlementListItemResponse[]
): ParticipatingInstructorSettlementApiRow[] {
  const sortKey = (item: SettlementListItemResponse) => ({
    time: toSettlementScheduleSortTime(item.scheduleStartAt, item.lectureDate),
    ordinal: item.sessionOrdinal,
  })
  const sorted = [...items].sort((a, b) =>
    compareSettlementScheduleLatestFirst(sortKey(a), sortKey(b))
  )

  // 승인 직후 같은 신청서가 확정 정산 행과 신청서 행으로 동시에 남지 않도록 확정 행을 우선한다.
  const confirmedApplicationIds = new Set(
    sorted
      .filter(item => item.settlementId != null && item.settlementApplicationId != null)
      .map(item => item.settlementApplicationId)
  )
  const deduped = sorted.filter(
    item =>
      item.settlementId != null ||
      item.settlementApplicationId == null ||
      !confirmedApplicationIds.has(item.settlementApplicationId)
  )

  return deduped.map((item, index) => mapSettlementToParticipatingInstructorSettlementRow(item, index))
}

/** 요약 카드 — 표시 가능한 지급조서 상태 집계 */
export function summarizeParticipatingInstructorPaymentStatementStatus(
  rows: Array<
    Pick<
      ParticipatingInstructorSettlementApiRow,
      'lectureProgress' | 'hasPaymentStatementApplication' | 'paymentStatementStatus'
    >
  >
): InstructorSettlementUiStatus {
  const statuses = rows
    .filter(
      row =>
        row.lectureProgress === 'completed' &&
        row.hasPaymentStatementApplication &&
        row.paymentStatementStatus !== 'none'
    )
    .map(row => row.paymentStatementStatus)

  if (statuses.length === 0) return 'none'
  const unique = new Set(statuses)
  if (unique.size === 1) return statuses[0]!
  return 'partial_confirmation'
}
