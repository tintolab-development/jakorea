import type { PortalEducationScheduleScopeStatus } from '../../applications/api/activity-client.ts'
import type {
  PortalExpenseReceipt,
  PortalIndividualScheduleSettlement,
  PortalSettlementApplication,
} from '../../applications/api/activity-client.ts'
import type { EducationScheduleItem } from '../../schedules/model/types.ts'
import type { InstructorTransportPreview } from '../lib/instructor-transport-preview.ts'
import type { LectureFeePreview } from '../lib/lecture-fee-preview.ts'
import type { EducationSettlementItem } from '../model/types.ts'
import {
  canSubmitFromAvailableActions,
  compareAssignedSettlementSchedules,
  isAssignedEducationScheduleForSettlement,
  resolveEducationSettlementStatusResult,
  resolveSettlementEducationProgress,
  type SettlementDeadlinePolicy,
} from './settlement-rules.ts'
import {
  individualIneligibleMessage,
  isEvidencePolicyUnconfigured,
} from './individual-settlement-contract.ts'
import { normalizePayableItems } from './payment-items.ts'
import { seoulBusinessEndDeadlineAt } from './seoul-deadline.ts'
import {
  isNewerReceiptRecord,
  isNewerSettlementRecord,
  isResubmittedReceipt,
  isResubmittedSettlement,
  matchesSettlementProgram,
  readAvailableActions,
  readFiniteAmount,
  readPaymentStatus,
  readReceiptDeadlineAt,
  readReceiptScheduleJoinId,
  readScheduleJoinId,
  readSettlementAssignmentJoinId,
  readSettlementDeadlineAt,
  readSettlementScheduleJoinId,
} from './settlement-join.ts'
import { toDisplayEducationScheduleName } from '../../../../../shared/lib/education-schedule-name.ts'
import { isScheduleDateLikeText } from '../../../../../shared/lib/format-display-date.ts'

export type SettlementLectureReportJoin = {
  scheduleId: number
  assignmentId?: number
  reportStatus?: string | null
  lectureStatus?: string | null
  institutionName?: string | null
  grade?: string | null
  startAt?: string | null
  endAt?: string | null
  sessionNo?: number | null
  lectureFeePreview?: LectureFeePreview | null
  instructorTransportPreview?: InstructorTransportPreview | null
}

const COMPLETED_LECTURE = new Set(['COMPLETED', 'DONE', 'HELD', 'FINISHED'])
const UPCOMING_LECTURE = new Set(['UPCOMING', 'SCHEDULED', 'PLANNED', 'READY'])

function readAssignedScheduleJoinId(schedule: EducationScheduleItem): number | null {
  if (schedule.scheduleId != null && Number.isSafeInteger(schedule.scheduleId) && schedule.scheduleId > 0) {
    return schedule.scheduleId
  }
  const fromId = Number(String(schedule.id).trim())
  if (Number.isSafeInteger(fromId) && fromId > 0) return fromId
  return null
}

export function findIndividualScheduleForSession(
  schedules: readonly PortalIndividualScheduleSettlement[] | undefined,
  session: { id?: string; scheduleId?: number | null } | undefined,
): PortalIndividualScheduleSettlement | undefined {
  if (!schedules?.length || !session) return undefined
  const ids = new Set<number>()
  if (session.scheduleId != null && Number.isSafeInteger(session.scheduleId) && session.scheduleId > 0) {
    ids.add(session.scheduleId)
  }
  const fromId = Number(String(session.id ?? '').trim())
  if (Number.isSafeInteger(fromId) && fromId > 0) ids.add(fromId)
  if (ids.size === 0) return undefined
  return schedules.find(row => {
    const joined = readScheduleJoinId(row)
    return joined != null && ids.has(joined)
  })
}

export type BuildAssignedSettlementItemsInput = {
  schedules: readonly EducationScheduleItem[]
  scopeStatus: PortalEducationScheduleScopeStatus | null | undefined
  receipts?: readonly PortalExpenseReceipt[]
  settlements?: readonly PortalSettlementApplication[]
  individualSchedules?: readonly PortalIndividualScheduleSettlement[]
  programId?: string | null
  now?: Date
  operationEndAt?: string | null
  deadlinePolicy?: SettlementDeadlinePolicy
  /** true이면 일정별 정산 API `schedules`가 카드 목록 SSOT */
  preferIndividualSchedules?: boolean
  lectureReports?: readonly SettlementLectureReportJoin[]
}

function mapIndividualAttendance(
  status: string | null | undefined,
): EducationScheduleItem['attendanceStatus'] {
  switch ((status ?? '').trim().toUpperCase()) {
    case 'PRESENT':
      return 'present'
    case 'LATE':
      return 'late'
    case 'ABSENT':
      return 'absent'
    case 'EXCUSED':
      return 'excused'
    default:
      return null
  }
}

function educationItemFromLecture(row: SettlementLectureReportJoin): EducationScheduleItem {
  const sessionNumber = row.sessionNo != null && row.sessionNo > 0 ? row.sessionNo : 0
  return {
    id: String(row.scheduleId),
    scheduleId: row.scheduleId,
    sessionNumber,
    heldAt: row.startAt ?? row.endAt ?? '',
    title: '-',
    attendanceStatus: null,
    sessionLabel: sessionNumber > 0 ? `${sessionNumber}차시` : undefined,
    progressTimeLabel: formatLectureTimeRange(row.startAt, row.endAt) || undefined,
    locationName: row.institutionName?.trim() || undefined,
  }
}

function educationItemFromIndividual(
  row: PortalIndividualScheduleSettlement,
): EducationScheduleItem {
  const scheduleId = readScheduleJoinId(row) ?? null
  return {
    id: scheduleId != null ? String(scheduleId) : String(row.scheduleName ?? 'schedule'),
    scheduleId,
    sessionNumber: 0,
    heldAt: row.startAt ?? row.endAt ?? '',
    title: toDisplayEducationScheduleName(row.scheduleName) || '-',
    attendanceStatus: mapIndividualAttendance(row.attendanceStatus),
    sessionLabel: toDisplayEducationScheduleName(row.scheduleName),
  }
}

function formatClock(iso: string | null | undefined): string {
  const trimmed = iso?.trim()
  if (!trimmed) return ''
  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const hour = parts.find(part => part.type === 'hour')?.value
  const minute = parts.find(part => part.type === 'minute')?.value
  if (!hour || !minute) return ''
  return `${hour}:${minute}`
}

function formatLectureTimeRange(
  startAt: string | null | undefined,
  endAt: string | null | undefined,
): string {
  const start = formatClock(startAt)
  const end = formatClock(endAt)
  if (start && end) return `${start}~${end}`
  return start || end
}

function formatSettlementSessionMeta(
  item: EducationScheduleItem,
  lecture?: SettlementLectureReportJoin,
): string {
  // 카드 헤더·반려사유 팝업이 날짜를 따로 붙이므로, 날짜로 시작하는 진행 시간 라벨
  // (`2026년 10월 31일(토) 21:20 ~ 21:22` 등)은 쓰지 않고 시간만 만든다.
  const progressTimeLabel = item.progressTimeLabel?.trim()
  const time =
    (progressTimeLabel && !isScheduleDateLikeText(progressTimeLabel) ? progressTimeLabel : '') ||
    formatLectureTimeRange(lecture?.startAt ?? item.heldAt, lecture?.endAt ?? item.endAt)
  const sessionNumber = lecture?.sessionNo && lecture.sessionNo > 0 ? lecture.sessionNo : item.sessionNumber
  const session =
    item.sessionLabel?.trim() || (sessionNumber > 0 ? `${sessionNumber}차시` : '')
  return [time, session].filter(Boolean).join(' ')
}

function formatInstitutionLabel(
  lecture: SettlementLectureReportJoin | undefined,
  schedule: EducationScheduleItem,
): string | undefined {
  const { institutionName, grade } = resolveInstitutionMeta(lecture, schedule)
  const label = [institutionName, grade].filter(Boolean).join(' · ')
  return label || undefined
}

function resolveInstitutionMeta(
  lecture: SettlementLectureReportJoin | undefined,
  schedule: EducationScheduleItem,
): { institutionName?: string; grade?: string } {
  if (lecture) {
    const institutionName = lecture.institutionName?.trim() || ''
    const grade = lecture.grade?.trim() || ''
    return {
      ...(institutionName ? { institutionName } : {}),
      ...(grade ? { grade } : {}),
    }
  }
  const institutionName = schedule.locationName?.trim() || ''
  return institutionName ? { institutionName } : {}
}

function isLectureReportSubmitted(status: string | null | undefined): boolean | null {
  const normalized = (status ?? '').trim().toUpperCase()
  if (!normalized) return null
  if (normalized === 'SUBMITTED') return true
  return false
}

function resolveProgressWithLecture(
  schedule: EducationScheduleItem,
  lecture: SettlementLectureReportJoin | undefined,
  now: Date,
): EducationSettlementItem['progress'] {
  const lectureStatus = (lecture?.lectureStatus ?? '').trim().toUpperCase()
  if (UPCOMING_LECTURE.has(lectureStatus)) return 'upcoming'
  if (COMPLETED_LECTURE.has(lectureStatus)) return 'completed'
  return resolveSettlementEducationProgress(
    {
      heldAt: schedule.heldAt || lecture?.startAt || '',
      scheduleStatus: schedule.scheduleStatus,
      attendanceStatus: schedule.attendanceStatus,
    },
    now,
  )
}

function indexLatestByScheduleId<T>(
  items: readonly T[],
  readId: (item: T) => number | undefined,
  isNewer: (next: T, current: T) => boolean,
): Map<number, T> {
  const indexed = new Map<number, T>()
  for (const item of items) {
    const scheduleId = readId(item)
    if (scheduleId == null) continue
    const current = indexed.get(scheduleId)
    if (!current || isNewer(item, current)) indexed.set(scheduleId, item)
  }
  return indexed
}

function hasKnownSubmission(
  receipt: PortalExpenseReceipt | undefined,
  settlement: PortalSettlementApplication | undefined,
): boolean {
  if (settlement?.submittedAt || settlement?.applicationId != null) {
    const status = (settlement.status ?? '').trim().toUpperCase()
    return status !== 'DRAFT' && status !== 'NOT_SUBMITTED'
  }
  if (receipt?.submittedAt || receipt?.receiptId != null) {
    const status = (receipt.receiptStatus ?? '').trim().toUpperCase()
    return status !== 'DRAFT' && status !== 'NOT_SUBMITTED' && status !== ''
  }
  return false
}

export function buildAssignedSettlementItems(
  input: BuildAssignedSettlementItemsInput,
): EducationSettlementItem[] {
  const now = input.now ?? new Date()
  const assignedFromEducation = input.schedules
    .filter(item => isAssignedEducationScheduleForSettlement(item, input.scopeStatus))
    .slice()
    .sort(compareAssignedSettlementSchedules)
  const educationByScheduleId = new Map<number, EducationScheduleItem>()
  for (const item of assignedFromEducation) {
    const id = readAssignedScheduleJoinId(item)
    if (id == null) continue
    educationByScheduleId.set(id, item)
  }
  const lectureByScheduleIdEarly = new Map<number, SettlementLectureReportJoin>()
  for (const row of input.lectureReports ?? []) {
    if (!Number.isSafeInteger(row.scheduleId) || row.scheduleId <= 0) continue
    lectureByScheduleIdEarly.set(row.scheduleId, row)
  }
  const assignedFromLecture = [...lectureByScheduleIdEarly.values()]
    .map(educationItemFromLecture)
    .sort(compareAssignedSettlementSchedules)
  const assigned =
    input.preferIndividualSchedules === true && input.individualSchedules
      ? input.individualSchedules
          .map(row => {
            const id = readScheduleJoinId(row)
            return (
              (id != null ? educationByScheduleId.get(id) : undefined) ??
              (id != null ? assignedFromLecture.find(item => item.scheduleId === id) : undefined) ??
              educationItemFromIndividual(row)
            )
          })
          .slice()
          .sort(compareAssignedSettlementSchedules)
      : assignedFromEducation.length > 0
        ? assignedFromEducation
        : assignedFromLecture

  const settlements = (input.settlements ?? []).filter(item =>
    matchesSettlementProgram(item, input.programId),
  )
  const settlementByScheduleId = indexLatestByScheduleId(
    settlements,
    readSettlementScheduleJoinId,
    isNewerSettlementRecord,
  )
  const settlementByAssignmentId = indexLatestByScheduleId(
    settlements,
    readSettlementAssignmentJoinId,
    isNewerSettlementRecord,
  )
  const receiptByScheduleId = indexLatestByScheduleId(
    input.receipts ?? [],
    readReceiptScheduleJoinId,
    isNewerReceiptRecord,
  )
  const individualByScheduleId = new Map<number, PortalIndividualScheduleSettlement>()
  for (const row of input.individualSchedules ?? []) {
    const joinedId = readScheduleJoinId(row)
    if (joinedId == null) continue
    individualByScheduleId.set(joinedId, row)
  }
  const lectureByScheduleId = lectureByScheduleIdEarly

  return assigned.map(schedule => {
    const scheduleId = readAssignedScheduleJoinId(schedule)
    const lecture = scheduleId != null ? lectureByScheduleId.get(scheduleId) : undefined
    const settlement =
      (scheduleId != null ? settlementByScheduleId.get(scheduleId) : undefined) ??
      (lecture?.assignmentId != null ? settlementByAssignmentId.get(lecture.assignmentId) : undefined)
    const receipt = scheduleId != null ? receiptByScheduleId.get(scheduleId) : undefined
    const individual = scheduleId != null ? individualByScheduleId.get(scheduleId) : undefined
    const progress = resolveProgressWithLecture(
      {
        ...schedule,
        attendanceStatus:
          schedule.attendanceStatus ?? mapIndividualAttendance(individual?.attendanceStatus),
      },
      lecture,
      now,
    )
    const reviewStatus =
      individual?.status ?? settlement?.status ?? receipt?.receiptStatus
    const statementStatus = settlement?.statementStatus ?? settlement?.status
    const paymentStatus = readPaymentStatus(settlement) ?? readPaymentStatus(receipt)
    const deadlineAt =
      seoulBusinessEndDeadlineAt(individual?.businessEndDate) ??
      readSettlementDeadlineAt(settlement) ??
      readReceiptDeadlineAt(receipt)
    const submitted = hasKnownSubmission(receipt, settlement) || individual?.settlementApplicationId != null
    const actions = readAvailableActions(settlement) ?? readAvailableActions(receipt)
    const submitAllowed = canSubmitFromAvailableActions(actions)
    const resolved = resolveEducationSettlementStatusResult({
      educationProgress: progress,
      reviewStatus,
      statementStatus,
      paymentStatus,
      correctionStatus: settlement?.correctionStatus,
      receiptDeadlineAt: deadlineAt,
      operationEndAt: seoulBusinessEndDeadlineAt(input.operationEndAt) ?? input.operationEndAt,
      canSubmit: submitAllowed,
      deadlinePolicy: input.deadlinePolicy,
      isResubmitted: isResubmittedSettlement(settlement) || isResubmittedReceipt(receipt),
      hasSubmission: submitted,
      lectureReportSubmitted: lecture ? isLectureReportSubmitted(lecture.reportStatus) : null,
      now,
    })
    const status = resolved.status
    const amount = readFiniteAmount(
      settlement?.netPaymentAmount,
      settlement?.grossAmount,
      receipt?.amount,
    )
    const previousAmount = readFiniteAmount(
      settlement?.previousNetPaymentAmount,
      settlement?.originalNetPaymentAmount,
    )
    const payableItems = normalizePayableItems(individual?.payableItems)
    const hasPayableItems = individual ? payableItems.length > 0 : undefined
    const evidencePolicyUnconfigured = individual
      ? isEvidencePolicyUnconfigured(individual.ineligibleReason, individual.payableItems)
      : false
    const canSubmitReceipt = individual
      ? individual.canSubmit === true
      : (status === 'pending_submit' || status === 'overdue' || status === 'report_pending') &&
        submitAllowed !== false &&
        hasPayableItems !== false
    const submittedAt = settlement?.submittedAt ?? receipt?.submittedAt
    const ineligibleMessage = individualIneligibleMessage(individual?.ineligibleReason)
    const institutionMeta = resolveInstitutionMeta(lecture, schedule)
    const institutionLabel = formatInstitutionLabel(lecture, schedule)

    return {
      id: scheduleId != null ? String(scheduleId) : schedule.id,
      scheduleId,
      ...(lecture?.assignmentId != null ? { assignmentId: lecture.assignmentId } : {}),
      sessionNumber:
        lecture?.sessionNo && lecture.sessionNo > 0 ? lecture.sessionNo : schedule.sessionNumber,
      heldAt: schedule.heldAt,
      sessionMeta: formatSettlementSessionMeta(schedule, lecture),
      ...institutionMeta,
      ...(institutionLabel ? { institutionLabel } : {}),
      ...(lecture?.startAt != null ? { lectureStartAt: lecture.startAt } : {}),
      ...(lecture?.endAt != null ? { lectureEndAt: lecture.endAt } : {}),
      ...(lecture ? { lectureFeePreview: lecture.lectureFeePreview ?? null } : {}),
      ...(lecture ? { instructorTransportPreview: lecture.instructorTransportPreview ?? null } : {}),
      progress,
      status,
      ...(deadlineAt ? { deadlineAt } : {}),
      ...(submittedAt ? { submittedAt } : {}),
      ...(amount != null ? { amount } : {}),
      ...(ineligibleMessage ? { submitBlockedReason: ineligibleMessage } : {}),
      ...(individual?.eligible != null ? { eligible: individual.eligible } : {}),
      ...(evidencePolicyUnconfigured ? { evidencePolicyUnconfigured: true } : {}),
      ...(individual?.submittedItems?.length ? { submittedItems: [...individual.submittedItems] } : {}),
      ...(receipt?.rejectReason?.trim()
        ? { rejectReason: receipt.rejectReason.trim() }
        : settlement?.rejectedReason?.trim()
          ? { rejectReason: settlement.rejectedReason.trim() }
          : {}),
      ...(individual?.settlementApplicationId != null
        ? { settlementApplicationId: individual.settlementApplicationId }
        : settlement?.applicationId != null
          ? { settlementApplicationId: settlement.applicationId }
          : {}),
      ...(individual?.currentRevisionNo != null
        ? { currentRevisionNo: individual.currentRevisionNo }
        : settlement?.revisionNo != null
          ? { currentRevisionNo: settlement.revisionNo }
          : {}),
      ...(receipt?.receiptId != null ? { receiptId: receipt.receiptId } : {}),
      ...(payableItems.length > 0 ? { payableItems } : {}),
      ...(hasPayableItems != null ? { hasPayableItems } : {}),
      ...(canSubmitReceipt ? { canSubmitReceipt: true } : { canSubmitReceipt: false }),
      ...(individual ? { canResubmitReceipt: individual.canResubmit === true } : {}),
      ...(resolved.deadlineNotice ? { deadlineNotice: resolved.deadlineNotice } : {}),
      ...(previousAmount != null ? { previousAmount } : {}),
    }
  })
}

export function paginateAssignedSettlementItems(
  items: readonly EducationSettlementItem[],
  page: number,
  pageSize: number,
): EducationSettlementItem[] {
  const start = (Math.max(1, page) - 1) * pageSize
  return items.slice(start, start + pageSize)
}
