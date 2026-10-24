import assert from 'node:assert/strict'
import {
  isReceiptEvidenceRequired,
  isSupportedIndividualExpenseType,
  isTransportPaymentItemType,
  mapItemTypeToExpenseType,
  normalizePayableItems,
  overlayPayableEvidenceRequired,
  payableEvidenceRequired,
  payableItemEvidenceCaption,
  pickAmountPayableItems,
  pickTransportPayableItem,
  receiptPaymentItemLabel,
  resolveReceiptPaymentUiKind,
  sortReceiptPayableItems,
} from './payment-items.ts'

assert.equal(resolveReceiptPaymentUiKind('TRANSPORTATION'), 'transport')
assert.equal(resolveReceiptPaymentUiKind('TRANSPORT_STUDENT'), 'transport')
assert.equal(resolveReceiptPaymentUiKind('MEAL'), 'amount_with_receipt')
assert.equal(resolveReceiptPaymentUiKind('ACTIVITY'), 'amount_with_receipt')
assert.equal(resolveReceiptPaymentUiKind('LODGING_GENERAL'), 'amount_with_receipt')
assert.equal(isTransportPaymentItemType('LONG_DISTANCE_TRANSPORTATION'), true)

assert.equal(mapItemTypeToExpenseType('TRANSPORT_STUDENT'), 'TRANSPORTATION')
assert.equal(mapItemTypeToExpenseType('STUDENT_TRANSPORTATION'), 'TRANSPORTATION')
assert.equal(isTransportPaymentItemType('STUDENT_TRANSPORTATION'), false)
assert.equal(mapItemTypeToExpenseType('MEAL'), 'MEAL')
assert.equal(mapItemTypeToExpenseType('LODGING_1C1S'), 'LODGING')
assert.equal(mapItemTypeToExpenseType('ACTIVITY'), 'OTHER')
assert.equal(isSupportedIndividualExpenseType('ACTIVITY'), true)
assert.equal(isSupportedIndividualExpenseType('MEAL'), true)
assert.equal(
  payableItemEvidenceCaption({ itemType: 'MEAL', itemName: '식사비', evidenceRequired: true }),
  '식사비 · 증빙 필수',
)
assert.equal(
  payableItemEvidenceCaption({ itemType: 'TRANSPORTATION', itemName: '교통비', evidenceRequired: false }),
  '교통비',
)
assert.equal(
  payableItemEvidenceCaption({ itemType: 'ACTIVITY', itemName: '활동비', evidenceRequired: null }),
  '활동비 · 증빙 정책을 확인할 수 없어 신청할 수 없습니다',
)

assert.equal(receiptPaymentItemLabel({ itemType: 'MEAL' }), '식사비')
assert.equal(receiptPaymentItemLabel({ itemType: 'ACTIVITY', itemName: '참여자 활동비' }), '참여자 활동비')
assert.equal(
  receiptPaymentItemLabel({ itemType: 'TRANSPORTATION', itemName: '교통비' }),
  '교통비',
)
assert.notEqual(
  receiptPaymentItemLabel({ itemType: 'TRANSPORTATION', itemName: '교통비' }),
  'TRANSPORTATION',
)

const withNullEvidence = normalizePayableItems([
  { itemType: 'MEAL', itemName: '식사비', evidenceRequired: null },
  { itemType: 'ACTIVITY', itemName: '활동비' },
])
assert.equal(withNullEvidence[0]?.itemType, 'ACTIVITY')
assert.equal(withNullEvidence[1]?.itemType, 'MEAL')
assert.equal(withNullEvidence[0]?.evidenceRequired, null)
assert.equal(withNullEvidence[1]?.evidenceRequired, null)
assert.equal(withNullEvidence[1]?.itemName, '식사비')

const payable = normalizePayableItems([
  { itemType: 'MEAL', itemName: '식사비', evidenceRequired: true },
  { itemType: 'meal', evidenceRequired: true },
  { itemType: 'TRANSPORTATION', evidenceRequired: true },
  { itemType: 'ACTIVITY', evidenceRequired: false },
])
assert.deepEqual(
  payable.map(item => item.itemType),
  ['TRANSPORTATION', 'ACTIVITY', 'MEAL'],
)
assert.equal(pickTransportPayableItem(payable)?.itemType, 'TRANSPORTATION')
assert.deepEqual(
  pickAmountPayableItems(payable).map(item => item.itemType),
  ['ACTIVITY', 'MEAL'],
)

assert.deepEqual(
  sortReceiptPayableItems([
    { itemType: 'MEAL', itemName: '식사비' },
    { itemType: 'ACTIVITY', itemName: '활동비' },
    { itemType: 'LODGING', itemName: '숙박비' },
    { itemType: 'TRANSPORTATION', itemName: '교통비' },
    { itemType: 'TIER3', itemName: '3급 강사비' },
  ]).map(item => item.itemType),
  ['TIER3', 'TRANSPORTATION', 'LODGING', 'ACTIVITY', 'MEAL'],
)

assert.deepEqual(
  withNullEvidence.map(item => item.itemType),
  ['ACTIVITY', 'MEAL'],
)

assert.equal(isReceiptEvidenceRequired(true), true)
assert.equal(isReceiptEvidenceRequired(false), false)
assert.equal(isReceiptEvidenceRequired(null), false)
assert.equal(isReceiptEvidenceRequired(undefined), false)
assert.equal(payableEvidenceRequired(payable, 'MEAL'), true)
assert.equal(payableEvidenceRequired(payable, 'ACTIVITY'), false)
assert.equal(payableEvidenceRequired(payable, 'LODGING'), null)

const overlaid = overlayPayableEvidenceRequired(
  [
    { itemType: 'MEAL', evidenceRequired: true, amount: '1000' },
    { itemType: 'ACTIVITY', evidenceRequired: true, amount: '2000' },
  ],
  payable,
)
assert.equal(overlaid[0]?.evidenceRequired, true)
assert.equal(overlaid[1]?.evidenceRequired, false)

console.log('payment-items.selfcheck: ok')
