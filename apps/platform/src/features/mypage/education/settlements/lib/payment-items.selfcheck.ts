import assert from 'node:assert/strict'
import {
  isIndividualTransportAlias,
  isReceiptEvidenceRequired,
  isSupportedIndividualExpenseType,
  isTransportPaymentItemType,
  mapItemTypeToExpenseType,
  normalizePayableItems,
  overlayPayableEvidenceRequired,
  payableEvidenceRequired,
  pickAmountPayableItems,
  pickTransportPayableItem,
  readPayableMaxLimitWon,
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
assert.equal(isTransportPaymentItemType('STUDENT_TRANSPORTATION'), true)
assert.equal(isIndividualTransportAlias('STUDENT_TRANSPORTATION'), true)
assert.equal(isIndividualTransportAlias('TRANSPORTATION'), true)
assert.equal(isIndividualTransportAlias('LONG_DISTANCE_TRANSPORTATION'), false)
assert.equal(mapItemTypeToExpenseType('MEAL'), 'MEAL')
assert.equal(mapItemTypeToExpenseType('LODGING_1C1S'), 'LODGING')
assert.equal(mapItemTypeToExpenseType('ACTIVITY'), 'OTHER')
assert.equal(isSupportedIndividualExpenseType('ACTIVITY'), true)
assert.equal(isSupportedIndividualExpenseType('MEAL'), true)

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
assert.equal(
  receiptPaymentItemLabel({ itemType: 'TRANSPORTATION', itemName: 'GASOLINE' }),
  '교통비',
)
assert.equal(receiptPaymentItemLabel({ itemType: 'MEAL', itemName: 'GASOLINE' }), '식사비')

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

const collapsedTransport = normalizePayableItems([
  { itemType: 'STUDENT_TRANSPORTATION', itemName: '학생 교통비', evidenceRequired: true },
  { itemType: 'TRANSPORTATION', itemName: '교통비', evidenceRequired: false },
  { itemType: 'MEAL', itemName: '식사비', evidenceRequired: true },
])
assert.deepEqual(
  collapsedTransport.map(item => item.itemType),
  ['TRANSPORTATION', 'MEAL'],
)
assert.equal(collapsedTransport[0]?.itemName, '교통비')
assert.equal(collapsedTransport[0]?.evidenceRequired, false)
assert.equal(pickTransportPayableItem(collapsedTransport)?.itemType, 'TRANSPORTATION')
assert.deepEqual(
  pickAmountPayableItems(collapsedTransport).map(item => item.itemType),
  ['MEAL'],
)

const studentOnly = normalizePayableItems([
  { itemType: 'STUDENT_TRANSPORTATION', itemName: '학생 교통비', evidenceRequired: true },
])
const withMax = normalizePayableItems([
  { itemType: 'MEAL', itemName: '식사비', maxLimitWon: 30_000 },
  { itemType: 'ACTIVITY', itemName: '활동비', maxAmount: 50_000 },
])
assert.equal(readPayableMaxLimitWon(withMax.find(item => item.itemType === 'MEAL')), 30_000)
assert.equal(readPayableMaxLimitWon(withMax.find(item => item.itemType === 'ACTIVITY')), 50_000)
assert.equal(readPayableMaxLimitWon({ maxLimitWon: 0, maxAmount: -1 }), null)

assert.equal(studentOnly[0]?.itemType, 'STUDENT_TRANSPORTATION')
assert.equal(pickTransportPayableItem(studentOnly)?.itemType, 'STUDENT_TRANSPORTATION')
assert.equal(pickAmountPayableItems(studentOnly).length, 0)

console.log('payment-items.selfcheck: ok')
