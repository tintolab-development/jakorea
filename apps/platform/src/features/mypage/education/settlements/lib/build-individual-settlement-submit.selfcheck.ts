import assert from 'node:assert/strict'
import { buildSettlementWriteDraft } from './build-write-draft.ts'
import {
  buildIndividualSettlementItems,
  buildIndividualSettlementSubmitRequest,
} from './build-individual-settlement-submit.ts'

const draft = buildSettlementWriteDraft({
  applicationId: '12',
  sessionId: '88',
  scheduleId: 88,
  isInstructor: false,
  documentKind: 'receipt',
  expenseDate: '2026-04-20T10:00:00+09:00',
  idempotencyKey: '11111111-1111-1111-1111-111111111111',
  enabledItemTypes: ['TRANSPORTATION', 'MEAL'],
  name: '홍길동',
  homeAddress: '서울',
  homeAddressDetail: '1층',
  bank: '국민',
  accountNumber: '123',
  accountHolder: '홍길동',
  transportItemType: 'TRANSPORTATION',
  transportItemName: '교통비',
  transportEvidenceRequired: true,
  tripType: 'round_trip',
  departTransit: 'bus',
  departAmount: '4,000',
  departAttachments: [{ fileObjectId: 11, fileName: 'go.jpg' }],
  returnTransit: 'subway',
  returnAmount: '4,000',
  returnAttachments: [{ fileObjectId: 12, fileName: 'back.jpg' }],
  extraItems: [
    {
      itemType: 'MEAL',
      itemName: '식사비',
      evidenceRequired: true,
      amount: '10,000',
      attachments: [{ fileObjectId: 21, fileName: 'meal.jpg' }],
    },
    {
      itemType: 'ACTIVITY',
      itemName: '활동비',
      evidenceRequired: true,
      amount: '',
      attachments: [],
    },
  ],
  mealAmount: '',
  mealFiles: [],
  activityAmount: '',
  activityFiles: [],
})

const items = buildIndividualSettlementItems(draft)
assert.equal(items.length, 2)
assert.equal(items[0]?.itemType, 'TRANSPORTATION')
assert.equal(items[0]?.amount, 8000)
assert.equal(items[0]?.expenses?.length, 2)
assert.deepEqual(items[0]?.expenses?.[0]?.fileObjectIds, [11])
assert.equal(items[1]?.itemType, 'MEAL')
assert.equal(items[1]?.amount, 10000)
assert.equal(items[1]?.expenses?.[0]?.expenseType, 'MEAL')

const oneWay = buildSettlementWriteDraft({
  ...{
    applicationId: '12',
    sessionId: '88',
    scheduleId: 88,
    isInstructor: false,
    documentKind: 'receipt' as const,
    expenseDate: '2026-04-20',
    name: '홍길동',
    homeAddress: '',
    homeAddressDetail: '',
    bank: '국민',
    accountNumber: '123',
    accountHolder: '홍길동',
    transportItemType: 'TRANSPORTATION',
    tripType: 'one_way' as const,
    departTransit: 'bus',
    departAmount: '3,000',
    departAttachments: [{ fileObjectId: 1, fileName: 'a.jpg' }],
    returnTransit: 'subway',
    returnAmount: '9,999',
    returnAttachments: [{ fileObjectId: 2, fileName: 'b.jpg' }],
    extraItems: [],
    mealAmount: '',
    mealFiles: [],
    activityAmount: '',
    activityFiles: [],
  },
})
const oneWayItems = buildIndividualSettlementItems(oneWay)
assert.equal(oneWayItems[0]?.amount, 3000)
assert.equal(oneWayItems[0]?.expenses?.length, 1)

const request = buildIndividualSettlementSubmitRequest(draft)
assert.equal(request.scheduleId, 88)
assert.equal(request.idempotencyKey, '11111111-1111-1111-1111-111111111111')
assert.equal(request.items.length, 2)

console.log('build-individual-settlement-submit.selfcheck: ok')
