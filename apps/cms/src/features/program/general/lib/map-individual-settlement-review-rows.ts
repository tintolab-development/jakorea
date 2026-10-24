import dayjs from 'dayjs'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import type { IndividualSettlementReviewListItem } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewListItem'

export type IndividualSettlementReviewRowStatus =
  | 'NOT_SUBMITTED'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'

export type IndividualSettlementReviewRow = {
  id: string
  scheduleId: number
  scheduleLabel: string
  scheduleStartAt?: string | null
  scheduleEndAt?: string | null
  status: IndividualSettlementReviewRowStatus
  settlementApplicationId?: number
  totalAmount: number | null
  latestRevisionNo: number | null
  submittedAt?: string | null
  reviewedAt?: string | null
  rejectionReason?: string | null
}

export const INDIVIDUAL_SETTLEMENT_REVIEW_STATUS_LABELS: Record<
  IndividualSettlementReviewRowStatus,
  string
> = {
  NOT_SUBMITTED: '미신청',
  SUBMITTED: '심사 대기',
  APPROVED: '승인',
  REJECTED: '반려',
}

export function formatIndividualSettlementAmount(value: number | null | undefined): string {
  return value == null ? '-' : `${value.toLocaleString('ko-KR')}원`
}

function normalizeStatus(value?: string | null): IndividualSettlementReviewRowStatus {
  const status = value?.trim().toUpperCase()
  if (status === 'SUBMITTED' || status === 'APPROVED' || status === 'REJECTED') return status
  return 'NOT_SUBMITTED'
}

function formatSessionScheduleLabel(session: ParticipatingSchoolSession): string {
  if (session.scheduleLabel?.trim()) return session.scheduleLabel.trim()
  const date = session.date?.trim() || '-'
  const time = session.timeRange?.trim()
  const format = session.format?.trim()
  const suffix = [time, format && format !== '-' ? format : ''].filter(Boolean).join(' | ')
  return formatCmsScheduleDisplayLabel(suffix ? `${date} ${suffix}` : date)
}

function formatReviewScheduleLabel(item: IndividualSettlementReviewListItem): string {
  const start = item.scheduleStartAt ? dayjs(item.scheduleStartAt) : null
  const date = start?.isValid() ? start.format('YYYY.MM.DD') : ''
  const time = start?.isValid() ? start.format('HH:mm') : ''
  const label = item.scheduleName?.trim() || ''
  return formatCmsScheduleDisplayLabel([date && `${date} ${time}`, label].filter(Boolean).join(' | ') || '-')
}

function fromReview(item: IndividualSettlementReviewListItem): IndividualSettlementReviewRow | null {
  if (item.programScheduleId == null || item.programScheduleId <= 0) return null
  return {
    id: `settlement-${item.programScheduleId}`,
    scheduleId: item.programScheduleId,
    scheduleLabel: formatReviewScheduleLabel(item),
    scheduleStartAt: item.scheduleStartAt,
    scheduleEndAt: item.scheduleEndAt,
    status: normalizeStatus(item.status),
    settlementApplicationId: item.settlementApplicationId,
    totalAmount: item.totalAmount ?? null,
    latestRevisionNo: item.latestRevisionNo ?? null,
    submittedAt: item.submittedAt,
    reviewedAt: item.reviewedAt,
    rejectionReason: item.rejectionReason,
  }
}

export function mapIndividualSettlementReviewRows(input: {
  sessions?: ParticipatingSchoolSession[]
  reviews?: IndividualSettlementReviewListItem[]
}): IndividualSettlementReviewRow[] {
  const reviews = (input.reviews ?? [])
    .map(fromReview)
    .filter((row): row is IndividualSettlementReviewRow => row != null)
  const reviewByScheduleId = new Map(reviews.map(row => [row.scheduleId, row]))
  const rows: IndividualSettlementReviewRow[] = []

  for (const session of input.sessions ?? []) {
    // requestedScheduleId는 희망 일정 PK이며 program_schedule PK가 아니다.
    // 실제 일정으로 확정된 세션만 일정별 정산 행의 기준으로 사용한다.
    const scheduleId = session.resolvedScheduleId
    if (scheduleId == null || scheduleId <= 0) continue
    const review = reviewByScheduleId.get(scheduleId)
    rows.push(
      review ?? {
        id: `schedule-${scheduleId}`,
        scheduleId,
        scheduleLabel: formatSessionScheduleLabel(session),
        scheduleStartAt: session.startAt,
        status: 'NOT_SUBMITTED',
        totalAmount: null,
        latestRevisionNo: null,
      }
    )
  }

  const knownScheduleIds = new Set(rows.map(row => row.scheduleId))
  for (const review of reviews) {
    if (!knownScheduleIds.has(review.scheduleId)) rows.push(review)
  }

  return rows.sort((a, b) => {
    const startDiff = (a.scheduleStartAt ?? '').localeCompare(b.scheduleStartAt ?? '')
    return startDiff || a.scheduleId - b.scheduleId
  })
}

export function summarizeIndividualSettlementReviewRows(rows: IndividualSettlementReviewRow[]): {
  submitted: number
  approved: number
  rejected: number
  total: number
} {
  return {
    submitted: rows.filter(row => row.status === 'SUBMITTED').length,
    approved: rows.filter(row => row.status === 'APPROVED').length,
    rejected: rows.filter(row => row.status === 'REJECTED').length,
    total: rows.length,
  }
}
