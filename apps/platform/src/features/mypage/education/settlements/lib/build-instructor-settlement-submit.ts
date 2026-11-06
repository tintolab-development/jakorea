import type { SettlementWriteDraft } from '../model/write-draft.ts'
import { parseSettlementAmount } from './format-write-draft.ts'
import { isInstructorTransportBelowMinimum } from './instructor-transport-preview.ts'
import { isReceiptWageItemType, normalizePaymentItemType } from './payment-items.ts'
import { LECTURE_FEE_TYPE_CODES } from './lecture-fee-preview.ts'

export type InstructorSettlementRequestedItem = {
  itemType: string
  requestedAmount: number
  evidenceSubmitted?: boolean
}

export type InstructorSettlementEvidenceAttachment = {
  itemType: string
  fileObjectIds: number[]
}

export type InstructorSettlementCreateRequest = {
  idempotencyKey: string
  assignmentId: number
  programScheduleId: number
  requestedItems: InstructorSettlementRequestedItem[]
  evidenceAttachments: InstructorSettlementEvidenceAttachment[]
}

export type InstructorSettlementResubmitRequest = {
  requestedItems: InstructorSettlementRequestedItem[]
  evidenceAttachments: InstructorSettlementEvidenceAttachment[]
}

const LECTURE_FEE_ITEM_TYPES = new Set<string>([
  ...LECTURE_FEE_TYPE_CODES,
  'INSTRUCTOR_FEE',
  'LECTURE_FEE',
  'TIER1',
  'TIER2',
  'TIER3',
  'SPECIAL_LECTURE',
  'OTHER_LABOR',
  'GEMINI',
  'WAGE',
])

function isLectureFeeRequestedItem(itemType: string, itemName?: string): boolean {
  const type = normalizePaymentItemType(itemType)
  if (LECTURE_FEE_ITEM_TYPES.has(type)) return true
  return isReceiptWageItemType(itemType, itemName)
}

function readPositiveId(value: number | string | null | undefined): number | null {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').trim())
  if (!Number.isSafeInteger(n) || n <= 0) return null
  return n
}

function pushItem(
  items: InstructorSettlementRequestedItem[],
  attachments: InstructorSettlementEvidenceAttachment[],
  input: {
    itemType: string
    itemName?: string
    amount: number
    fileObjectIds: number[]
    evidenceRequired?: boolean
  },
): void {
  if (input.amount <= 0) return
  if (isLectureFeeRequestedItem(input.itemType, input.itemName)) return
  const type = normalizePaymentItemType(input.itemType)
  if (!type) return
  if (items.some(item => normalizePaymentItemType(item.itemType) === type)) return
  const fileObjectIds = [...new Set(input.fileObjectIds.filter(id => Number.isSafeInteger(id) && id > 0))]
  const evidenceRequired = input.evidenceRequired === true
  items.push({
    itemType: input.itemType,
    requestedAmount: input.amount,
    evidenceSubmitted: evidenceRequired ? fileObjectIds.length > 0 : undefined,
  })
  if (fileObjectIds.length > 0) {
    attachments.push({ itemType: input.itemType, fileObjectIds })
  }
}

export function buildInstructorSettlementPayloadParts(draft: SettlementWriteDraft): {
  requestedItems: InstructorSettlementRequestedItem[]
  evidenceAttachments: InstructorSettlementEvidenceAttachment[]
} {
  const requestedItems: InstructorSettlementRequestedItem[] = []
  const evidenceAttachments: InstructorSettlementEvidenceAttachment[] = []

  const transportType = draft.transport.itemType?.trim()
  const autoPreview = draft.transport.autoPreview
  const transportAmount =
    autoPreview?.calculatedTransportAmount ?? autoPreview?.totalTransportFeeWon ?? null
  if (
    transportType &&
    !isInstructorTransportBelowMinimum(autoPreview) &&
    transportAmount != null &&
    transportAmount > 0
  ) {
    pushItem(requestedItems, evidenceAttachments, {
      itemType: transportType,
      itemName: draft.transport.itemName,
      amount: transportAmount,
      fileObjectIds: [],
      evidenceRequired: false,
    })
  }

  for (const extra of draft.extraItems) {
    pushItem(requestedItems, evidenceAttachments, {
      itemType: extra.itemType,
      itemName: extra.itemName,
      amount: parseSettlementAmount(extra.amount),
      fileObjectIds: extra.attachments.map(file => file.fileObjectId),
      evidenceRequired: extra.evidenceRequired,
    })
  }

  pushItem(requestedItems, evidenceAttachments, {
    itemType: 'MEAL',
    amount: parseSettlementAmount(draft.meal.amount),
    fileObjectIds: [],
  })
  pushItem(requestedItems, evidenceAttachments, {
    itemType: 'ACTIVITY',
    amount: parseSettlementAmount(draft.activity.amount),
    fileObjectIds: [],
  })

  return { requestedItems, evidenceAttachments }
}

export function readInstructorAssignmentId(draft: SettlementWriteDraft): number | null {
  return readPositiveId(draft.meta.assignmentId)
}

export function readInstructorProgramScheduleId(draft: SettlementWriteDraft): number | null {
  return readPositiveId(draft.meta.scheduleId) ?? readPositiveId(draft.meta.sessionId)
}

export function buildInstructorSettlementCreateRequest(
  draft: SettlementWriteDraft,
): InstructorSettlementCreateRequest {
  const assignmentId = readInstructorAssignmentId(draft)
  if (assignmentId == null) {
    throw new Error('ASSIGNMENT_ID_REQUIRED')
  }
  const programScheduleId = readInstructorProgramScheduleId(draft)
  if (programScheduleId == null) {
    throw new Error('SCHEDULE_ID_REQUIRED')
  }
  const { requestedItems, evidenceAttachments } = buildInstructorSettlementPayloadParts(draft)
  return {
    idempotencyKey: draft.meta.idempotencyKey,
    assignmentId,
    programScheduleId,
    requestedItems,
    evidenceAttachments,
  }
}

export function buildInstructorSettlementResubmitRequest(
  draft: SettlementWriteDraft,
): InstructorSettlementResubmitRequest {
  return buildInstructorSettlementPayloadParts(draft)
}
