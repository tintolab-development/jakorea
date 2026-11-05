import type { SettlementTripLegDraft, SettlementWriteDraft } from '../model/write-draft.ts'
import {
  isSettlementTripLegStarted,
  parseSettlementAmount,
} from './format-write-draft.ts'
import { readTripLegAttachments, readTripLegFileNames } from './empty-trip-leg.ts'

export const SETTLEMENT_WRITE_ALERT_TITLE = '안내'
export const SETTLEMENT_REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE = '필수 항목 미입력 안내'
export const SETTLEMENT_RECEIPT_REQUIRED_ALERT_TITLE = '영수증 제출 안내'
export const SETTLEMENT_REQUIRED_FIELDS_INCOMPLETE_MESSAGE = '필수 항목을 모두 작성해주세요'
export const SETTLEMENT_MIN_EXPENSE_ITEM_MESSAGE =
  '지급조서는 최소 한개 이상의 항목이 작성된 경우에만 제출 가능합니다.'
export const SETTLEMENT_RECEIPT_MIN_EXPENSE_ITEM_MESSAGE =
  '영수증은 최소 한 개 이상의 항목이 작성된 경우에만 제출 가능합니다.'
export const SETTLEMENT_RECEIPT_REQUIRED_MESSAGE = '신청한 항목의 영수증을 제출해 주세요.'
export const SETTLEMENT_RECEIPT_UPLOAD_INCOMPLETE_MESSAGE =
  '업로드가 완료되지 않은 영수증이 있습니다. 잠시 후 다시 시도해 주세요.'

export type SettlementWriteValidationError =
  | 'required_incomplete'
  | 'min_expense_item'
  | 'receipt_required'
  | 'upload_incomplete'

function isBlank(value: string): boolean {
  return value.trim() === ''
}

function hasUploadedReceipts(leg: SettlementTripLegDraft): boolean {
  return readTripLegAttachments(leg).length > 0 || readTripLegFileNames(leg).length > 0
}

function isTripLegFieldsIncomplete(leg: SettlementTripLegDraft): boolean {
  return isBlank(leg.transit) || parseSettlementAmount(leg.amount) <= 0
}

function isTripLegMissingReceipt(leg: SettlementTripLegDraft): boolean {
  return isSettlementTripLegStarted(leg) && !hasUploadedReceipts(leg)
}

function isAmountMissingReceipt(amount: string, fileCount: number): boolean {
  return parseSettlementAmount(amount) > 0 && fileCount === 0
}

function isReceiptDraft(draft: SettlementWriteDraft): boolean {
  return draft.meta.documentKind === 'receipt' || !draft.meta.isInstructor
}

export function validateSettlementWriteDraft(
  draft: SettlementWriteDraft
): SettlementWriteValidationError | null {
  const { basic, transport, meal, activity, extraItems, meta } = draft

  if (isBlank(basic.bank) || isBlank(basic.accountNumber) || isBlank(basic.accountHolder)) {
    return 'required_incomplete'
  }

  if (meta.isInstructor && meta.documentKind !== 'receipt') {
    if (isTripLegFieldsIncomplete(transport.depart)) return 'required_incomplete'
    if (transport.tripType === 'round_trip' && isTripLegFieldsIncomplete(transport.return)) {
      return 'required_incomplete'
    }
    if (!hasUploadedReceipts(transport.depart)) return 'receipt_required'
    if (transport.tripType === 'round_trip' && !hasUploadedReceipts(transport.return)) {
      return 'receipt_required'
    }
    if (isAmountMissingReceipt(meal.amount, meal.fileNames.length)) return 'receipt_required'
    if (isAmountMissingReceipt(activity.amount, activity.fileNames.length)) return 'receipt_required'
    return null
  }

  if (isReceiptDraft(draft) && extraItems.length + (transport.itemType ? 1 : 0) === 0 && draft.enabledItemTypes.length === 0) {
    return 'min_expense_item'
  }

  const transportStarted =
    isSettlementTripLegStarted(transport.depart) ||
    (transport.tripType === 'round_trip' && isSettlementTripLegStarted(transport.return))
  const extraStarted = extraItems.some(
    item => parseSettlementAmount(item.amount) > 0 || item.attachments.length > 0
  )
  const mealStarted = parseSettlementAmount(meal.amount) > 0 || meal.fileNames.length > 0
  const activityStarted =
    parseSettlementAmount(activity.amount) > 0 || activity.fileNames.length > 0

  if (!transportStarted && !extraStarted && !mealStarted && !activityStarted) {
    return 'min_expense_item'
  }

  const transportNeedsEvidence = isReceiptDraft(draft) && transport.evidenceRequired === true
  if (transportNeedsEvidence) {
    if (isTripLegMissingReceipt(transport.depart)) return 'receipt_required'
    if (transport.tripType === 'round_trip' && isTripLegMissingReceipt(transport.return)) {
      return 'receipt_required'
    }
    if (transportStarted) {
      const departIds = readTripLegAttachments(transport.depart)
      if (isSettlementTripLegStarted(transport.depart) && departIds.length === 0) {
        return 'upload_incomplete'
      }
      if (transport.tripType === 'round_trip' && isSettlementTripLegStarted(transport.return)) {
        if (readTripLegAttachments(transport.return).length === 0) return 'upload_incomplete'
      }
    }
  }

  for (const item of extraItems) {
    const amount = parseSettlementAmount(item.amount)
    const started = amount > 0 || item.attachments.length > 0
    if (!started) continue
    if (amount <= 0) return 'required_incomplete'
    if (item.evidenceRequired === true) {
      if (item.attachments.length === 0) return 'receipt_required'
      if (item.attachments.some(file => file.fileObjectId == null || file.fileObjectId <= 0)) {
        return 'upload_incomplete'
      }
    }
  }

  if (!isReceiptDraft(draft)) {
    if (isAmountMissingReceipt(meal.amount, meal.fileNames.length)) return 'receipt_required'
    if (isAmountMissingReceipt(activity.amount, activity.fileNames.length)) return 'receipt_required'
  }

  return null
}

export function resolveSettlementWriteValidationMessage(
  error: SettlementWriteValidationError,
  documentKind: SettlementWriteDraft['meta']['documentKind'] = 'receipt'
): string {
  switch (error) {
    case 'required_incomplete':
      return SETTLEMENT_REQUIRED_FIELDS_INCOMPLETE_MESSAGE
    case 'min_expense_item':
      return documentKind === 'payment_statement'
        ? SETTLEMENT_MIN_EXPENSE_ITEM_MESSAGE
        : SETTLEMENT_RECEIPT_MIN_EXPENSE_ITEM_MESSAGE
    case 'receipt_required':
      return SETTLEMENT_RECEIPT_REQUIRED_MESSAGE
    case 'upload_incomplete':
      return SETTLEMENT_RECEIPT_UPLOAD_INCOMPLETE_MESSAGE
  }
}

export function resolveSettlementWriteValidationAlert(
  error: SettlementWriteValidationError,
  documentKind: SettlementWriteDraft['meta']['documentKind'] = 'receipt',
): { title: string; description: string } {
  const description = resolveSettlementWriteValidationMessage(error, documentKind)
  if (error === 'receipt_required') {
    return { title: SETTLEMENT_RECEIPT_REQUIRED_ALERT_TITLE, description }
  }
  if (error === 'required_incomplete') {
    return { title: SETTLEMENT_REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE, description }
  }
  return { title: SETTLEMENT_WRITE_ALERT_TITLE, description }
}
