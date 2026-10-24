import assert from 'node:assert/strict'
import {
  isTransportPaymentItemType,
  mapItemTypeToExpenseType,
  normalizePayableItems,
  pickAmountPayableItems,
  pickTransportPayableItem,
  receiptPaymentItemLabel,
  resolveReceiptPaymentUiKind,
} from './payment-items.ts'

assert.equal(resolveReceiptPaymentUiKind('TRANSPORTATION'), 'transport')
assert.equal(resolveReceiptPaymentUiKind('TRANSPORT_STUDENT'), 'transport')
assert.equal(resolveReceiptPaymentUiKind('MEAL'), 'amount_with_receipt')
assert.equal(resolveReceiptPaymentUiKind('ACTIVITY'), 'amount_with_receipt')
assert.equal(resolveReceiptPaymentUiKind('LODGING_GENERAL'), 'amount_with_receipt')
assert.equal(isTransportPaymentItemType('LONG_DISTANCE_TRANSPORTATION'), true)

assert.equal(mapItemTypeToExpenseType('TRANSPORT_STUDENT'), 'TRANSPORTATION')
assert.equal(mapItemTypeToExpenseType('MEAL'), 'MEAL')
assert.equal(mapItemTypeToExpenseType('LODGING_1C1S'), 'LODGING')
assert.equal(mapItemTypeToExpenseType('ACTIVITY'), 'ACTIVITY')
assert.notEqual(mapItemTypeToExpenseType('ACTIVITY'), 'OTHER')

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
assert.equal(withNullEvidence[0]?.evidenceRequired, null)
assert.equal(withNullEvidence[1]?.evidenceRequired, null)
assert.equal(withNullEvidence[0]?.itemName, '식사비')

const payable = normalizePayableItems([
  { itemType: 'MEAL', itemName: '식사비', evidenceRequired: true },
  { itemType: 'meal', evidenceRequired: true },
  { itemType: 'TRANSPORTATION', evidenceRequired: true },
  { itemType: 'ACTIVITY', evidenceRequired: false },
])
assert.deepEqual(
  payable.map(item => item.itemType),
  ['MEAL', 'TRANSPORTATION', 'ACTIVITY'],
)
assert.equal(pickTransportPayableItem(payable)?.itemType, 'TRANSPORTATION')
assert.deepEqual(
  pickAmountPayableItems(payable).map(item => item.itemType),
  ['MEAL', 'ACTIVITY'],
)

console.log('payment-items.selfcheck: ok')
