import type { SettlementTripLegDraft, SettlementWriteDraft } from '../model/write-draft'
import {
  isSettlementTripLegStarted,
  parseSettlementAmount,
} from './format-write-draft'

export const SETTLEMENT_REQUIRED_FIELDS_INCOMPLETE_MESSAGE = '필수 항목을 모두 작성해주세요'
export const SETTLEMENT_MIN_EXPENSE_ITEM_MESSAGE =
  '지급조서는 최소 한개 이상의 항목이 작성된 경우에만 제출 가능합니다.'
export const SETTLEMENT_RECEIPT_REQUIRED_MESSAGE = '신청한 항목의 영수증을 제출해 주세요.'

export type SettlementWriteValidationError =
  | 'required_incomplete'
  | 'min_expense_item'
  | 'receipt_required'

function isBlank(value: string): boolean {
  return value.trim() === ''
}

function isTripLegIncomplete(leg: SettlementTripLegDraft): boolean {
  return (
    isBlank(leg.transit) ||
    parseSettlementAmount(leg.amount) <= 0 ||
    leg.fileNames.length === 0
  )
}

function isTripLegMissingReceipt(leg: SettlementTripLegDraft): boolean {
  return isSettlementTripLegStarted(leg) && leg.fileNames.length === 0
}

function isAmountMissingReceipt(amount: string, fileNames: string[]): boolean {
  return parseSettlementAmount(amount) > 0 && fileNames.length === 0
}

export function validateSettlementWriteDraft(
  draft: SettlementWriteDraft
): SettlementWriteValidationError | null {
  const { basic, transport, meal, activity, meta } = draft

  if (isBlank(basic.bank) || isBlank(basic.accountNumber) || isBlank(basic.accountHolder)) {
    return 'required_incomplete'
  }

  if (meta.isInstructor) {
    if (isTripLegIncomplete(transport.depart)) return 'required_incomplete'
    if (transport.tripType === 'round_trip' && isTripLegIncomplete(transport.return)) {
      return 'required_incomplete'
    }
    return null
  }

  const transportStarted =
    isSettlementTripLegStarted(transport.depart) ||
    (transport.tripType === 'round_trip' && isSettlementTripLegStarted(transport.return))
  const mealStarted = parseSettlementAmount(meal.amount) > 0 || meal.fileNames.length > 0
  const activityStarted =
    parseSettlementAmount(activity.amount) > 0 || activity.fileNames.length > 0

  if (!transportStarted && !mealStarted && !activityStarted) {
    return 'min_expense_item'
  }

  if (isTripLegMissingReceipt(transport.depart)) return 'receipt_required'
  if (transport.tripType === 'round_trip' && isTripLegMissingReceipt(transport.return)) {
    return 'receipt_required'
  }
  if (isAmountMissingReceipt(meal.amount, meal.fileNames)) return 'receipt_required'
  if (isAmountMissingReceipt(activity.amount, activity.fileNames)) return 'receipt_required'

  return null
}

export function resolveSettlementWriteValidationMessage(
  error: SettlementWriteValidationError
): string {
  switch (error) {
    case 'required_incomplete':
      return SETTLEMENT_REQUIRED_FIELDS_INCOMPLETE_MESSAGE
    case 'min_expense_item':
      return SETTLEMENT_MIN_EXPENSE_ITEM_MESSAGE
    case 'receipt_required':
      return SETTLEMENT_RECEIPT_REQUIRED_MESSAGE
  }
}
