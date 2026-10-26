import type { IndividualSettlementReviewListItem } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewListItem'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import {
  formatIndividualSettlementDateTime,
  formatIndividualSettlementWon,
  individualSettlementReviewStatusLabel,
  normalizeIndividualSettlementReviewStatus,
} from '@/features/program/general/lib/individual-settlement-review-status'
import { resolveParticipatingIndividualProgressScheduleSessionsFallback } from '@/features/program/general/lib/participating-individual-progress-schedule-sessions'

export type IndividualSettlementReviewListRow = {
  id: string
  no: number
  programScheduleId: number | null
  educationScheduleLabel: string
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

function sessionScheduleLabel(session: ParticipatingSchoolSession): string {
  const raw =
    session.scheduleLabel?.trim() ||
    session.educationScheduleLabel?.trim() ||
    [session.date, session.timeRange].filter(Boolean).join(' ').trim()
  if (!raw) return '-'
  return formatCmsScheduleDisplayLabel(raw)
}

function applicationScheduleLabel(item: IndividualSettlementReviewListItem): string {
  const name = item.scheduleName?.trim()
  if (name) return formatCmsScheduleDisplayLabel(name)
  return '-'
}

function mapApplicationFields(item: IndividualSettlementReviewListItem | undefined): Pick<
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
  applications: ReadonlyArray<IndividualSettlementReviewListItem>
}): IndividualSettlementReviewListRow[] {
  if (!input.listReady || input.isError) return []
  return mapIndividualSettlementReviewListRows({
    assignedSessions: input.assignedSessions,
    applications: input.applications,
  })
}

export function mapIndividualSettlementReviewListRows(input: {
  assignedSessions: ReadonlyArray<ParticipatingSchoolSession>
  applications: ReadonlyArray<IndividualSettlementReviewListItem>
}): IndividualSettlementReviewListRow[] {
  const applicationsByScheduleId = new Map<number, IndividualSettlementReviewListItem>()
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
