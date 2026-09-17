import dayjs from 'dayjs'
import type { SettlementListItemResponse } from '@/shared/api/generated/settlement/schemas'
import { resolveSettlementUiStatus } from '@/features/user/api/map-settlement-to-instructor-member-row'
import type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'
import type { ParticipatingIndividualInstructorLectureProgress } from '@/features/program/general/lib/participating-individual-instructor-lecture-report-types'

export interface ParticipatingInstructorSettlementApiRow {
  id: string
  settlementId: number
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

function formatIsoDateTime(iso?: string): string {
  if (!iso?.trim()) return ''
  const parsed = dayjs(iso)
  if (!parsed.isValid()) return iso.trim()
  return parsed.format('YYYY. MM. DD(ddd) HH:mm')
}

function formatLectureDateOnly(iso?: string): string {
  if (!iso?.trim()) return ''
  const parsed = dayjs(iso.slice(0, 10))
  if (!parsed.isValid()) return iso.trim()
  return parsed.format('YYYY. MM. DD')
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
  const settlementId = item.settlementId
  if (settlementId == null) return null

  const paymentStatementStatus = resolveSettlementUiStatus(item)
  const lectureProgress = inferParticipatingInstructorLectureProgress(item)
  const lectureProgressLabel = lectureProgress === 'completed' ? '진행 완료' : '진행 예정'
  const hasApplication = hasPaymentStatementApplication(paymentStatementStatus, item)
  const scheduledSettlementAmount =
    item.netPaymentAmount ?? item.grossAmount ?? null

  return {
    id: String(settlementId),
    settlementId,
    no: totalCount - index,
    institutionName: item.institutionName?.trim() || '-',
    educationGrade: '-',
    educationScheduleLabel: buildParticipatingInstructorEducationScheduleLabel(item),
    lectureProgressLabel,
    lectureProgress,
    hasPaymentStatementApplication: hasApplication,
    paymentStatementStatus,
    scheduledSettlementAmount,
    canViewPaymentStatement: hasApplication,
    sessionCompleted: item.sessionCompleted,
    sessionTotal: item.sessionTotal,
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

  return sorted
    .map((item, index) =>
      mapSettlementToParticipatingInstructorSettlementRow(item, index, sorted.length)
    )
    .filter((row): row is ParticipatingInstructorSettlementApiRow => row != null)
}

export function summarizeParticipatingInstructorSettlementProgress(
  rows: ParticipatingInstructorSettlementApiRow[]
): { completed: number; total: number } {
  const completed = rows.filter(row => row.lectureProgress === 'completed').length
  const sessionTotals = rows
    .map(row => row.sessionTotal)
    .filter((value): value is number => value != null && value > 0)
  const total = sessionTotals.length > 0 ? Math.max(...sessionTotals) : rows.length
  return { completed, total }
}
