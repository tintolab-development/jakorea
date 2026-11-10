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

export function resolveIndividualSettlementReviewRowsForQueryState(input: {
  listReady: boolean
  isError: boolean
  assignedSessions: ReadonlyArray<ParticipatingSchoolSession>
  applications: ReadonlyArray<IndividualSettlementReviewListItemView>
}): IndividualSettlementReviewListRow[] {
  if (!input.listReady || input.isError) return []
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

  for (const session of input.assignedSessions) {
    const scheduleId = positiveId(session.resolvedScheduleId)
    if (scheduleId == null) continue
    assignedScheduleIds.add(scheduleId)
    const application = applicationsByScheduleId.get(scheduleId)
    rows.push({
      id: `schedule:${scheduleId}`,
      no: rows.length + 1,
      programScheduleId: scheduleId,
      educationScheduleLabel: sessionScheduleLabel(session),
      lectureProgress: sessionLectureProgress(session),
      orphanApplication: false,
      ...mapApplicationFields(application),
    })
  }

  for (const item of input.applications) {
    const scheduleId = positiveId(item.programScheduleId)
    if (scheduleId != null && assignedScheduleIds.has(scheduleId)) continue
    const settlementApplicationId = positiveId(item.settlementApplicationId)
    rows.push({
      id:
        settlementApplicationId != null
          ? `application:${settlementApplicationId}`
          : `orphan:${rows.length + 1}`,
      no: rows.length + 1,
      programScheduleId: scheduleId,
      educationScheduleLabel: applicationScheduleLabel(item),
      lectureProgress: 'scheduled',
      orphanApplication: true,
      ...mapApplicationFields(item),
    })
  }

  return rows
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
