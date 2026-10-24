import type { SettlementWriteDraft } from '../model/write-draft.ts'
import {
  computeSettlementTransportTotal,
  isSettlementTripLegStarted,
  parseSettlementAmount,
  resolveSettlementTransitLabel,
  resolveSettlementTripTypeLabel,
} from './format-write-draft.ts'
import {
  isIndividualTransportAlias,
  mapItemTypeToExpenseType,
  normalizePaymentItemType,
} from './payment-items.ts'
import { readTripLegAttachments } from './empty-trip-leg.ts'
import { toSeoulIsoDate } from './seoul-deadline.ts'
import type {
  PortalIndividualSettlementExpenseInput,
  PortalIndividualSettlementItemInput,
  PortalIndividualSettlementResubmitRequest,
  PortalIndividualSettlementSubmitRequest,
} from '../../applications/api/activity-client.ts'

function expenseDateOf(draft: SettlementWriteDraft): string {
  return toSeoulIsoDate(draft.meta.expenseDate) || toSeoulIsoDate(new Date().toISOString())
}

function transportDescription(draft: SettlementWriteDraft): string {
  const trip = resolveSettlementTripTypeLabel(draft.transport.tripType)
  const depart = [
    '가는 편',
    resolveSettlementTransitLabel(draft.transport.depart.transit),
    `${parseSettlementAmount(draft.transport.depart.amount).toLocaleString('ko-KR')}원`,
  ]
    .filter(Boolean)
    .join(' ')
  if (draft.transport.tripType !== 'round_trip') return `${trip}. ${depart}`
  const back = [
    '오는 편',
    resolveSettlementTransitLabel(draft.transport.return.transit),
    `${parseSettlementAmount(draft.transport.return.amount).toLocaleString('ko-KR')}원`,
  ]
    .filter(Boolean)
    .join(' ')
  return `${trip}. ${depart} / ${back}`
}

function buildTransportItem(
  draft: SettlementWriteDraft
): PortalIndividualSettlementItemInput | null {
  if (!draft.transport.itemType) return null
  const total = computeSettlementTransportTotal(draft)
  if (total <= 0) return null
  const date = expenseDateOf(draft)
  const evidenceRequired = draft.transport.evidenceRequired === true
  const expenses: PortalIndividualSettlementExpenseInput[] = []
  if (evidenceRequired && isSettlementTripLegStarted(draft.transport.depart)) {
    expenses.push({
      expenseType: mapItemTypeToExpenseType(draft.transport.itemType),
      expenseDate: date,
      amount: parseSettlementAmount(draft.transport.depart.amount),
      description: '가는 편',
      fileObjectIds: readTripLegAttachments(draft.transport.depart).map(file => file.fileObjectId),
    })
  }
  if (
    evidenceRequired &&
    draft.transport.tripType === 'round_trip' &&
    isSettlementTripLegStarted(draft.transport.return)
  ) {
    expenses.push({
      expenseType: mapItemTypeToExpenseType(draft.transport.itemType),
      expenseDate: date,
      amount: parseSettlementAmount(draft.transport.return.amount),
      description: '오는 편',
      fileObjectIds: readTripLegAttachments(draft.transport.return).map(file => file.fileObjectId),
    })
  }
  return {
    itemType: draft.transport.itemType,
    amount: total,
    description: transportDescription(draft).slice(0, 1000),
    expenses,
  }
}

function isDuplicateIndividualPaymentItem(
  items: readonly PortalIndividualSettlementItemInput[],
  itemType: string,
): boolean {
  const type = normalizePaymentItemType(itemType)
  if (items.some(item => normalizePaymentItemType(item.itemType) === type)) return true
  return (
    isIndividualTransportAlias(type) &&
    items.some(item => isIndividualTransportAlias(item.itemType))
  )
}

export function buildIndividualSettlementItems(
  draft: SettlementWriteDraft
): PortalIndividualSettlementItemInput[] {
  const items: PortalIndividualSettlementItemInput[] = []
  const transport = buildTransportItem(draft)
  if (transport) items.push(transport)

  for (const extra of draft.extraItems) {
    const amount = parseSettlementAmount(extra.amount)
    if (amount <= 0) continue
    if (isDuplicateIndividualPaymentItem(items, extra.itemType)) continue
    items.push({
      itemType: extra.itemType,
      amount,
      expenses:
        extra.evidenceRequired === true
          ? [
              {
                expenseType: mapItemTypeToExpenseType(extra.itemType),
                expenseDate: expenseDateOf(draft),
                amount,
                fileObjectIds: extra.attachments.map(file => file.fileObjectId),
              },
            ]
          : [],
    })
  }
  return items
}

export function buildIndividualSettlementSubmitRequest(
  draft: SettlementWriteDraft
): PortalIndividualSettlementSubmitRequest {
  const scheduleId = draft.meta.scheduleId
  if (scheduleId == null) {
    throw new Error('SCHEDULE_ID_REQUIRED')
  }
  const items = buildIndividualSettlementItems(draft)
  if (items.length === 0) {
    throw new Error('SETTLEMENT_ITEMS_REQUIRED')
  }
  return {
    idempotencyKey: draft.meta.idempotencyKey,
    scheduleId,
    items,
  }
}

export function buildIndividualSettlementResubmitRequest(
  draft: SettlementWriteDraft
): PortalIndividualSettlementResubmitRequest {
  const expectedRevisionNo = draft.meta.currentRevisionNo
  if (expectedRevisionNo == null) {
    throw new Error('REVISION_REQUIRED')
  }
  const items = buildIndividualSettlementItems(draft)
  if (items.length === 0) {
    throw new Error('SETTLEMENT_ITEMS_REQUIRED')
  }
  return {
    idempotencyKey: draft.meta.idempotencyKey,
    expectedRevisionNo,
    items,
  }
}
