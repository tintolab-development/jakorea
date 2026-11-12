import type { IndividualSettlementReviewListItemView } from '@/features/program/general/api/individual-settlement-review-types'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import {
  formatIndividualSettlementDateTime,
  formatIndividualSettlementWon,
  individualSettlementReviewStatusLabel,
  normalizeIndividualSettlementReviewStatus,
} from '@/features/program/general/lib/individual-settlement-review-status'
import { resolveParticipatingIndividualProgressScheduleSessionsFallback } from '@/features/program/general/lib/participating-individual-progress-schedule-sessions'
import { mapDashboardScheduleDeliveryToEducationProgress } from '@/features/program/general/lib/dashboard-schedule-delivery-status'
import type { ParticipatingIndividualInstructorLectureProgress } from '@/features/program/general/lib/participating-individual-instructor-lecture-report-types'
import { getInstructorSettlementStatusLabel } from '@/shared/constants/instructor-settlement-status'
import {
  buildSettlementScheduleDisplayLabel,
  compareSettlementScheduleLatestFirst,
  mapSettlementLectureProgressStatus,
  toSettlementScheduleSortTime,
} from '@/features/program/general/lib/settlement-schedule-display-label'

export type IndividualSettlementReviewListRow = {
  id: string
  no: number
  programScheduleId: number | null
  educationScheduleLabel: string
  lectureProgress: ParticipatingIndividualInstructorLectureProgress
  status: string
  statusLabel: string
  totalAmount: number | null
  totalAmountLabel: string
  latestRevisionNo: number | null
  latestRevisionNoLabel: string
  submittedAtLabel: string
  settlementApplicationId: number | null
  canOpenDetail: boolean
  orphanApplication: boolean
  /** 정산 현황 응답의 미신청 배정 일정 행(rowType=NOT_APPLIED) */
  isNotApplied: boolean
}

function positiveId(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null
  return Math.trunc(value)
}

function sessionLectureProgress(
  session: ParticipatingSchoolSession | undefined
): ParticipatingIndividualInstructorLectureProgress {
  if (session == null) return 'scheduled'
  return mapDashboardScheduleDeliveryToEducationProgress(
    session.deliveryScheduleStatus ??
      (session.status === 'completed' ? 'COMPLETED' : 'SCHEDULED')
  )
}

function sessionScheduleLabel(session: ParticipatingSchoolSession): string {
  const raw =
    session.scheduleLabel?.trim() ||
    session.educationScheduleLabel?.trim() ||
    [session.date, session.timeRange].filter(Boolean).join(' ').trim()
  if (!raw) return '-'
  return formatCmsScheduleDisplayLabel(raw)
}

function applicationScheduleLabel(item: IndividualSettlementReviewListItemView): string {
  const name = item.scheduleName?.trim()
  if (name) return formatCmsScheduleDisplayLabel(name) || '-'
  return '-'
}

function mapApplicationFields(item: IndividualSettlementReviewListItemView | undefined): Pick<
  IndividualSettlementReviewListRow,
  | 'status'
  | 'statusLabel'
  | 'totalAmount'
  | 'totalAmountLabel'
  | 'latestRevisionNo'
  | 'latestRevisionNoLabel'
  | 'submittedAtLabel'
  | 'settlementApplicationId'
  | 'canOpenDetail'
> {
  if (item == null) {
    return {
      status: 'NONE',
      statusLabel: individualSettlementReviewStatusLabel('NONE'),
      totalAmount: null,
      totalAmountLabel: '-',
      latestRevisionNo: null,
      latestRevisionNoLabel: '-',
      submittedAtLabel: '-',
      settlementApplicationId: null,
      canOpenDetail: false,
    }
  }
  const settlementApplicationId = positiveId(item.settlementApplicationId)
  const status = normalizeIndividualSettlementReviewStatus(item.status) || 'NONE'
  const latestRevisionNo =
    typeof item.latestRevisionNo === 'number' && Number.isFinite(item.latestRevisionNo)
      ? item.latestRevisionNo
      : null
  const totalAmount =
    typeof item.totalAmount === 'number' && Number.isFinite(item.totalAmount)
      ? item.totalAmount
      : null
  return {
    status,
    statusLabel: individualSettlementReviewStatusLabel(status),
    totalAmount,
    totalAmountLabel: formatIndividualSettlementWon(totalAmount),
    latestRevisionNo,
    latestRevisionNoLabel: latestRevisionNo == null ? '-' : String(latestRevisionNo),
    submittedAtLabel: formatIndividualSettlementDateTime(item.submittedAt),
    settlementApplicationId,
    canOpenDetail: settlementApplicationId != null,
  }
}

export function assignedSessionsForIndividualSettlementReview(
  sessions: ReadonlyArray<ParticipatingSchoolSession> | null | undefined
): ParticipatingSchoolSession[] {
  return resolveParticipatingIndividualProgressScheduleSessionsFallback(sessions).filter(
    session => positiveId(session.resolvedScheduleId) != null
  )
}

/** 정산 현황 응답인지 — 서버가 행 종류(rowType)를 채웠을 때만 서버 행을 그대로 쓴다 */
export function isIndividualSettlementStatusResponse(
  applications: ReadonlyArray<IndividualSettlementReviewListItemView>
): boolean {
  return applications.some(item => typeof item.rowType === 'string' && item.rowType.trim() !== '')
}

function statusRowLectureProgress(
  item: IndividualSettlementReviewListItemView
): ParticipatingIndividualInstructorLectureProgress {
  const fromServer = mapSettlementLectureProgressStatus(item.lectureProgressStatus)
  if (fromServer) return fromServer
  const endAt = item.scheduleEndAt ?? item.scheduleStartAt
  if (endAt) {
    const end = new Date(endAt)
    if (!Number.isNaN(end.getTime())) return end.getTime() < Date.now() ? 'completed' : 'scheduled'
  }
  return 'scheduled'
}

/**
 * 참여 봉사자 정산 현황 — 서버 행(배정 봉사 일정 1건 = 1행)을 순서 그대로 표 행으로 바꾼다.
 * 미신청 행(NOT_APPLIED)은 신청 정보 없이 일정·진행 여부만 채운다.
 */
export function mapIndividualSettlementStatusRows(
  applications: ReadonlyArray<IndividualSettlementReviewListItemView>
): IndividualSettlementReviewListRow[] {
  return applications.map((item, index) => {
    const isNotApplied = item.rowType?.trim().toUpperCase() === 'NOT_APPLIED'
    const scheduleId = positiveId(item.programScheduleId)
    const settlementApplicationId = isNotApplied ? null : positiveId(item.settlementApplicationId)
    const label = buildSettlementScheduleDisplayLabel(item) || applicationScheduleLabel(item)
    return {
      id:
        settlementApplicationId != null
          ? `SETTLEMENT_APPLICATION:${settlementApplicationId}`
          : `NOT_APPLIED:${scheduleId ?? `index-${index}`}`,
      no: index + 1,
      programScheduleId: scheduleId,
      educationScheduleLabel: label,
      lectureProgress: statusRowLectureProgress(item),
      orphanApplication: false,
      isNotApplied,
      ...mapApplicationFields(isNotApplied ? undefined : item),
    }
  })
}

export function resolveIndividualSettlementReviewRowsForQueryState(input: {
  listReady: boolean
  isError: boolean
  assignedSessions: ReadonlyArray<ParticipatingSchoolSession>
  applications: ReadonlyArray<IndividualSettlementReviewListItemView>
}): IndividualSettlementReviewListRow[] {
  if (!input.listReady || input.isError) return []
  if (isIndividualSettlementStatusResponse(input.applications)) {
    return mapIndividualSettlementStatusRows(input.applications)
  }
  return mapIndividualSettlementReviewListRows({
    assignedSessions: input.assignedSessions,
    applications: input.applications,
  })
}

export function mapIndividualSettlementReviewListRows(input: {
  assignedSessions: ReadonlyArray<ParticipatingSchoolSession>
  applications: ReadonlyArray<IndividualSettlementReviewListItemView>
}): IndividualSettlementReviewListRow[] {
  const applicationsByScheduleId = new Map<number, IndividualSettlementReviewListItemView>()
  for (const item of input.applications) {
    const scheduleId = positiveId(item.programScheduleId)
    if (scheduleId == null) continue
    if (!applicationsByScheduleId.has(scheduleId)) {
      applicationsByScheduleId.set(scheduleId, item)
    }
  }

  const assignedScheduleIds = new Set<number>()
  const rows: IndividualSettlementReviewListRow[] = []
  /** 행 id → 정렬 키(일정 시작 일시·회차 번호) */
  const sortKeys = new Map<string, { time: number | null; ordinal: number | null }>()

  for (const session of input.assignedSessions) {
    const scheduleId = positiveId(session.resolvedScheduleId)
    if (scheduleId == null) continue
    assignedScheduleIds.add(scheduleId)
    const application = applicationsByScheduleId.get(scheduleId)
    sortKeys.set(`schedule:${scheduleId}`, {
      time: toSettlementScheduleSortTime(
        session.startAt,
        application?.scheduleStartAt,
        session.date
      ),
      ordinal: session.sessionNo ?? null,
    })
    rows.push({
      id: `schedule:${scheduleId}`,
      no: rows.length + 1,
      programScheduleId: scheduleId,
      educationScheduleLabel: sessionScheduleLabel(session),
      lectureProgress: sessionLectureProgress(session),
      orphanApplication: false,
      isNotApplied: false,
      ...mapApplicationFields(application),
    })
  }

  for (const item of input.applications) {
    const scheduleId = positiveId(item.programScheduleId)
    if (scheduleId != null && assignedScheduleIds.has(scheduleId)) continue
    const settlementApplicationId = positiveId(item.settlementApplicationId)
    const orphanId =
      settlementApplicationId != null
        ? `application:${settlementApplicationId}`
        : `orphan:${rows.length + 1}`
    sortKeys.set(orphanId, {
      time: toSettlementScheduleSortTime(item.scheduleStartAt),
      ordinal: null,
    })
    rows.push({
      id: orphanId,
      no: rows.length + 1,
      programScheduleId: scheduleId,
      educationScheduleLabel: applicationScheduleLabel(item),
      lectureProgress: 'scheduled',
      orphanApplication: true,
      isNotApplied: false,
      ...mapApplicationFields(item),
    })
  }

  // 신청 여부와 무관하게 일정 시작 일시 최신순, 같으면 회차 번호 큰 순 (기획 2026-11-12 2차 2번)
  const noKey = { time: null, ordinal: null }
  return rows
    .map((row, index) => ({ row, index }))
    .sort(
      (a, b) =>
        compareSettlementScheduleLatestFirst(
          sortKeys.get(a.row.id) ?? noKey,
          sortKeys.get(b.row.id) ?? noKey
        ) || a.index - b.index
    )
    .map(({ row }, index) => ({ ...row, no: index + 1 }))
}

/**
 * 미신청(신청 없음·NOT_APPLIED)·미진행(진행 예정) 행 — 처리 현황·금액 '-', [상세 보기] 비활성
 * (기획 2026-11-12, CMS-FUNC-0248·0252)
 */
export function isIndividualSettlementRowNotApplicable(
  row: Pick<IndividualSettlementReviewListRow, 'isNotApplied' | 'settlementApplicationId' | 'lectureProgress'>
): boolean {
  return (
    row.isNotApplied || row.settlementApplicationId == null || row.lectureProgress === 'scheduled'
  )
}

export function summarizeIndividualSettlementReviewRows(
  rows: ReadonlyArray<IndividualSettlementReviewListRow>
): { submitted: number; approved: number; rejected: number; none: number; total: number } {
  let submitted = 0
  let approved = 0
  let rejected = 0
  let none = 0
  for (const row of rows) {
    if (row.status === 'SUBMITTED') submitted += 1
    else if (row.status === 'APPROVED') approved += 1
    else if (row.status === 'REJECTED') rejected += 1
    else if (row.status === 'NONE') none += 1
  }
  return { submitted, approved, rejected, none, total: rows.length }
}

/** 정산 현황 요약 「지급조서 처리 현황」 — 참여자 정산 현황 탭과 같은 판정 */
export function resolveIndividualSettlementReviewSummaryLabel(
  summary: { submitted: number; approved: number; rejected: number; total: number },
  isError: boolean
): string {
  if (isError) return '조회 실패'
  if (summary.submitted > 0 && (summary.approved > 0 || summary.rejected > 0)) return '확인 진행 중'
  if (summary.submitted > 0) return '확인 대기 중'
  if (summary.approved > 0) return getInstructorSettlementStatusLabel('payment_statement_verified')
  if (summary.rejected > 0) return '신청 반려'
  // 미신청은 상태값이 아니라 집계하지 않는다. 신청 건이 없으면 '-' (기획 2026-11-12 2차 4-2)
  return '-'
}
