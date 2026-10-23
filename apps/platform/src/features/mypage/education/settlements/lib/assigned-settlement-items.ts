import type { PortalEducationScheduleScopeStatus } from '../../applications/api/activity-client.ts'
import type {
  PortalExpenseReceipt,
  PortalIndividualScheduleSettlement,
  PortalSettlementApplication,
} from '../../applications/api/activity-client.ts'
import type { EducationScheduleItem } from '../../schedules/model/types.ts'
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
  readSettlementDeadlineAt,
  readSettlementScheduleJoinId,
} from './settlement-join.ts'

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

function educationItemFromIndividual(
  row: PortalIndividualScheduleSettlement,
): EducationScheduleItem {
  const scheduleId = readScheduleJoinId(row) ?? null
  return {
    id: scheduleId != null ? String(scheduleId) : String(row.scheduleName ?? 'schedule'),
    scheduleId,
    sessionNumber: 0,
    heldAt: row.startAt ?? row.endAt ?? '',
    title: row.scheduleName?.trim() || '-',
    attendanceStatus: mapIndividualAttendance(row.attendanceStatus),
    sessionLabel: row.scheduleName?.trim() || undefined,
  }
}

function formatSettlementSessionMeta(item: EducationScheduleItem): string {
  const time = item.progressTimeLabel?.trim() ?? ''
  const session = item.sessionLabel?.trim() || (item.sessionNumber > 0 ? `${item.sessionNumber}차시` : '')
  return [time, session].filter(Boolean).join(' ')
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
  const assigned =
    input.preferIndividualSchedules === true && input.individualSchedules
      ? input.individualSchedules
          .map(row => {
            const id = readScheduleJoinId(row)
            return (id != null ? educationByScheduleId.get(id) : undefined) ?? educationItemFromIndividual(row)
          })
          .slice()
          .sort(compareAssignedSettlementSchedules)
      : assignedFromEducation

  const settlements = (input.settlements ?? []).filter(item =>
    matchesSettlementProgram(item, input.programId),
  )
  const settlementByScheduleId = indexLatestByScheduleId(
    settlements,
    readSettlementScheduleJoinId,
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

  return assigned.map(schedule => {
    const scheduleId = readAssignedScheduleJoinId(schedule)
    const settlement = scheduleId != null ? settlementByScheduleId.get(scheduleId) : undefined
    const receipt = scheduleId != null ? receiptByScheduleId.get(scheduleId) : undefined
    const individual = scheduleId != null ? individualByScheduleId.get(scheduleId) : undefined
    const progress = resolveSettlementEducationProgress(
      {
        heldAt: schedule.heldAt,
        scheduleStatus: schedule.scheduleStatus,
        attendanceStatus:
          schedule.attendanceStatus ?? mapIndividualAttendance(individual?.attendanceStatus),
      },
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

    return {
      id: scheduleId != null ? String(scheduleId) : schedule.id,
      scheduleId,
      sessionNumber: schedule.sessionNumber,
      heldAt: schedule.heldAt,
      sessionMeta: formatSettlementSessionMeta(schedule),
      progress,
      status,
      ...(deadlineAt ? { deadlineAt } : {}),
      ...(submittedAt ? { submittedAt } : {}),
      ...(amount != null ? { amount } : {}),
      ...(ineligibleMessage
        ? { submitBlockedReason: ineligibleMessage }
        : individual?.ineligibleReason?.trim()
          ? { submitBlockedReason: individual.ineligibleReason.trim() }
          : {}),
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
