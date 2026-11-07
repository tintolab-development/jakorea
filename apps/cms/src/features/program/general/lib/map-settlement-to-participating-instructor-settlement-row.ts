import dayjs from 'dayjs'
import { formatYmdHmWithKoreanWeekday } from '@/shared/lib/format-date-korean-weekday'
import { formatDateDot, getSeoulCalendarDate } from '@/shared/utils/date'
import type { SettlementListItemResponse } from '@/shared/api/generated/settlement/schemas'
import { resolveSettlementUiStatus } from '@/features/user/api/map-settlement-to-instructor-member-row'
import type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'
import type { ParticipatingIndividualInstructorLectureProgress } from '@/features/program/general/lib/participating-individual-instructor-lecture-report-types'

export interface ParticipatingInstructorSettlementApiRow {
  id: string
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
  lectureProgressLabel: '진행 완료' | '진행 예정'
  lectureProgress: ParticipatingIndividualInstructorLectureProgress
  hasPaymentStatementApplication: boolean
  paymentStatementStatus: InstructorSettlementUiStatus
  scheduledSettlementAmount: number | null
  canViewPaymentStatement: boolean
  sessionCompleted?: number
  sessionTotal?: number
}

function formatIsoDateTime(iso?: string | null): string {
  if (!iso?.trim()) return ''
  const parsed = dayjs(iso)
  if (!parsed.isValid()) return iso.trim()
  return formatYmdHmWithKoreanWeekday(parsed)
}

function formatLectureDateOnly(iso?: string | null): string {
  if (!iso?.trim()) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso.trim()
  const label = formatDateDot(getSeoulCalendarDate(date))
  return label === '-' ? iso.trim() : label
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

export function inferParticipatingInstructorLectureProgress(
  item: SettlementListItemResponse
): ParticipatingIndividualInstructorLectureProgress {
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

export function mapSettlementToParticipatingInstructorSettlementRow(
  item: SettlementListItemResponse,
  index: number,
  totalCount: number
): ParticipatingInstructorSettlementApiRow | null {
  const settlementId = item.settlementId ?? null
  const settlementApplicationId = item.settlementApplicationId ?? null
  const isPendingApplication = settlementId == null && settlementApplicationId != null
  if (settlementId == null && !isPendingApplication) return null

  const paymentStatementStatus = resolveSettlementUiStatus(item)
  const lectureProgress = inferParticipatingInstructorLectureProgress(item)
  const lectureProgressLabel = lectureProgress === 'completed' ? '진행 완료' : '진행 예정'
  const hasApplication = hasPaymentStatementApplication(paymentStatementStatus, item)
  const scheduledSettlementAmount =
    item.netPaymentAmount ?? item.grossAmount ?? null

  return {
    id: settlementId != null ? String(settlementId) : `application:${settlementApplicationId}`,
    settlementId,
    settlementApplicationId,
    isPendingApplication,
    availableActions: item.availableActions ?? [],
    no: totalCount - index,
    institutionName: item.institutionName?.trim() || '-',
    educationGrade: '-',
    educationScheduleLabel: buildParticipatingInstructorEducationScheduleLabel(item),
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
  const sorted = [...items].sort((a, b) => {
    const dateA = a.lectureDate ?? ''
    const dateB = b.lectureDate ?? ''
    if (dateA !== dateB) return dateB.localeCompare(dateA)
    return (b.sessionOrdinal ?? 0) - (a.sessionOrdinal ?? 0)
  })

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

  const rows = deduped
    .map((item, index) => mapSettlementToParticipatingInstructorSettlementRow(item, index, 0))
    .filter((row): row is ParticipatingInstructorSettlementApiRow => row != null)
  return rows.map((row, index) => ({ ...row, no: rows.length - index }))
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
