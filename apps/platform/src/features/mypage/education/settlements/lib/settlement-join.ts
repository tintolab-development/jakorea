import type { PortalExpenseReceipt, PortalSettlementApplication } from '../../applications/api/activity-client.ts'

function readOptionalInteger(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim())
    if (Number.isSafeInteger(parsed) && parsed > 0) return parsed
  }
  return undefined
}

function readOptionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function readRecord(value: object): Record<string, unknown> {
  return value as Record<string, unknown>
}

/** 일정 연결 키. 날짜·배열 순번은 사용하지 않는다. */
export function readScheduleJoinId(record: object): number | undefined {
  const row = readRecord(record)
  return (
    readOptionalInteger(row.programScheduleId) ??
    readOptionalInteger(row.educationScheduleId) ??
    readOptionalInteger(row.scheduleId)
  )
}

export function readReceiptScheduleJoinId(receipt: PortalExpenseReceipt): number | undefined {
  return readScheduleJoinId(receipt)
}

export function readSettlementScheduleJoinId(
  settlement: PortalSettlementApplication,
): number | undefined {
  return readOptionalInteger(settlement.programScheduleId) ?? readScheduleJoinId(settlement)
}

export function readSettlementAssignmentJoinId(
  settlement: PortalSettlementApplication,
): number | undefined {
  return readOptionalInteger(settlement.assignmentId)
}

export function readOptionalIsoTimestamp(record: object, keys: readonly string[]): string | undefined {
  const row = readRecord(record)
  for (const key of keys) {
    const value = readOptionalText(row[key])
    if (!value) continue
    const time = Date.parse(value)
    if (!Number.isNaN(time)) return value
  }
  return undefined
}

export function readReceiptDeadlineAt(
  receipt: PortalExpenseReceipt | undefined,
): string | undefined {
  if (!receipt) return undefined
  return readOptionalIsoTimestamp(receipt, [
    'receiptDeadlineAt',
    'submitDeadlineAt',
    'submissionDeadlineAt',
    'deadlineAt',
    'dueAt',
  ])
}

export function readSettlementDeadlineAt(
  settlement: PortalSettlementApplication | undefined,
): string | undefined {
  if (!settlement) return undefined
  return readOptionalIsoTimestamp(settlement, [
    'receiptDeadlineAt',
    'submitDeadlineAt',
    'submissionDeadlineAt',
    'deadlineAt',
    'dueAt',
  ])
}

export function readPaymentStatus(record: object | undefined): string | undefined {
  if (!record) return undefined
  return readOptionalText(readRecord(record).paymentStatus)
}

export function readAvailableActions(record: object | undefined): string[] | undefined {
  if (!record) return undefined
  const value = readRecord(record).availableActions
  if (!Array.isArray(value)) return undefined
  const actions = value
    .map(item => (typeof item === 'string' ? item.trim().toUpperCase() : ''))
    .filter(item => item.length > 0)
  return actions.length > 0 ? [...new Set(actions)] : undefined
}

export function isNewerSettlementRecord(
  next: PortalSettlementApplication,
  current: PortalSettlementApplication,
): boolean {
  const nextRevision = next.revisionNo ?? 0
  const currentRevision = current.revisionNo ?? 0
  if (nextRevision !== currentRevision) return nextRevision > currentRevision
  const nextSubmitted = Date.parse(next.submittedAt ?? next.createdAt ?? '')
  const currentSubmitted = Date.parse(current.submittedAt ?? current.createdAt ?? '')
  const nextTime = Number.isNaN(nextSubmitted) ? 0 : nextSubmitted
  const currentTime = Number.isNaN(currentSubmitted) ? 0 : currentSubmitted
  if (nextTime !== currentTime) return nextTime > currentTime
  return (next.applicationId ?? 0) > (current.applicationId ?? 0)
}

export function isNewerReceiptRecord(
  next: PortalExpenseReceipt,
  current: PortalExpenseReceipt,
): boolean {
  if (next.latestRevision === true && current.latestRevision !== true) return true
  if (current.latestRevision === true && next.latestRevision !== true) return false
  const nextRevision = next.revisionNo ?? 0
  const currentRevision = current.revisionNo ?? 0
  if (nextRevision !== currentRevision) return nextRevision > currentRevision
  const nextSubmitted = Date.parse(next.submittedAt ?? '')
  const currentSubmitted = Date.parse(current.submittedAt ?? '')
  const nextTime = Number.isNaN(nextSubmitted) ? 0 : nextSubmitted
  const currentTime = Number.isNaN(currentSubmitted) ? 0 : currentSubmitted
  if (nextTime !== currentTime) return nextTime > currentTime
  return (next.receiptId ?? 0) > (current.receiptId ?? 0)
}

export function isResubmittedReceipt(receipt: PortalExpenseReceipt | undefined): boolean {
  if (!receipt) return false
  const status = (receipt.receiptStatus ?? '').trim().toUpperCase()
  if (status === 'RESUBMITTED' || status === 'REAPPLICATION' || status === 'REAPPLIED') return true
  if (receipt.revisionNo != null && receipt.revisionNo > 1) return true
  return (
    receipt.originalReceiptId != null &&
    receipt.receiptId != null &&
    receipt.originalReceiptId !== receipt.receiptId
  )
}

export function isResubmittedSettlement(
  settlement: PortalSettlementApplication | undefined,
): boolean {
  if (!settlement) return false
  const status = (settlement.status ?? '').trim().toUpperCase()
  if (status === 'RESUBMITTED' || status === 'REAPPLICATION' || status === 'REAPPLIED') return true
  if (settlement.revisionNo != null && settlement.revisionNo > 1) return true
  return (
    settlement.originalApplicationId != null &&
    settlement.applicationId != null &&
    settlement.originalApplicationId !== settlement.applicationId
  )
}

/** DRAFT/NOT_SUBMITTED가 아닌 지급조서 신청이 있으면 제출된 것으로 본다. */
export function isKnownSettlementApplicationSubmitted(
  settlement: PortalSettlementApplication | undefined,
): boolean {
  if (!settlement) return false
  if (settlement.submittedAt || settlement.applicationId != null) {
    const status = (settlement.status ?? '').trim().toUpperCase()
    return status !== 'DRAFT' && status !== 'NOT_SUBMITTED'
  }
  return false
}

export function findSettlementApplicationForLectureAssignment(
  settlements: readonly PortalSettlementApplication[] | undefined,
  input: { assignmentId: number; scheduleId: number; programId?: number | string | null },
): PortalSettlementApplication | undefined {
  if (!settlements?.length) return undefined
  const programKey =
    input.programId == null || String(input.programId).trim() === ''
      ? null
      : String(input.programId)
  const scoped = settlements.filter(row => {
    if (programKey == null || row.programId == null) return true
    return matchesSettlementProgram(row, programKey)
  })
  const byAssignment = scoped.filter(
    row => readSettlementAssignmentJoinId(row) === input.assignmentId,
  )
  const pool =
    byAssignment.length > 0
      ? byAssignment
      : scoped.filter(row => readSettlementScheduleJoinId(row) === input.scheduleId)
  if (pool.length === 0) return undefined
  return pool.reduce((latest, row) => (isNewerSettlementRecord(row, latest) ? row : latest))
}

export function matchesSettlementProgram(
  settlement: PortalSettlementApplication,
  programId: string | null | undefined,
): boolean {
  if (programId == null || programId.trim() === '') return false
  if (settlement.programId == null) return false
  return String(settlement.programId) === programId
}

export function readFiniteAmount(...values: Array<number | null | undefined>): number | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
  }
  return undefined
}
