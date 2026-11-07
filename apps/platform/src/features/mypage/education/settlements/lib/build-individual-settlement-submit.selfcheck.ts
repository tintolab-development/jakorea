import assert from 'node:assert/strict'
import { buildSettlementWriteDraft } from './build-write-draft.ts'
import {
  buildIndividualSettlementItems,
  buildIndividualSettlementResubmitRequest,
  buildIndividualSettlementSubmitRequest,
  toIndividualSettlementTripType,
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
// 학생 교통비 왕복/편도 — 작성 화면 선택값만 tripType으로 보낸다
assert.equal(items[0]?.tripType, 'ROUND_TRIP')
assert.equal(toIndividualSettlementTripType('round_trip'), 'ROUND_TRIP')
assert.equal(toIndividualSettlementTripType('one_way'), 'ONE_WAY')
assert.equal(toIndividualSettlementTripType(null), null)
assert.equal(toIndividualSettlementTripType(undefined), null)
assert.equal(items[1]?.tripType, undefined)
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
    transportEvidenceRequired: true,
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

const noEvidenceDraft = buildSettlementWriteDraft({
  applicationId: '12',
  sessionId: '88',
  scheduleId: 88,
  isInstructor: false,
  documentKind: 'receipt',
  expenseDate: '2026-04-20T10:00:00+09:00',
  idempotencyKey: '22222222-2222-2222-2222-222222222222',
  enabledItemTypes: ['TRANSPORTATION', 'MEAL', 'ACTIVITY'],
  name: '홍길동',
  homeAddress: '서울',
  homeAddressDetail: '1층',
  bank: '국민',
  accountNumber: '123',
  accountHolder: '홍길동',
  transportItemType: 'TRANSPORTATION',
  transportItemName: '교통비',
  transportEvidenceRequired: false,
  tripType: 'one_way',
  departTransit: 'bus',
  departAmount: '5,000',
  departAttachments: [],
  returnTransit: '',
  returnAmount: '',
  extraItems: [
    {
      itemType: 'MEAL',
      itemName: '식사비',
      evidenceRequired: false,
      amount: '12,000',
      attachments: [],
    },
    {
      itemType: 'ACTIVITY',
      itemName: '활동비',
      evidenceRequired: true,
      amount: '8,000',
      attachments: [{ fileObjectId: 31, fileName: 'activity.jpg' }],
    },
  ],
  mealAmount: '',
  mealFiles: [],
  activityAmount: '',
  activityFiles: [],
})
const noEvidenceItems = buildIndividualSettlementItems(noEvidenceDraft)
assert.equal(noEvidenceItems[0]?.itemType, 'TRANSPORTATION')
assert.deepEqual(noEvidenceItems[0]?.expenses, [])
assert.equal(noEvidenceItems[1]?.itemType, 'MEAL')
assert.deepEqual(noEvidenceItems[1]?.expenses, [])
assert.equal(noEvidenceItems[2]?.itemType, 'ACTIVITY')
assert.equal(noEvidenceItems[2]?.expenses?.[0]?.expenseType, 'OTHER')
assert.deepEqual(noEvidenceItems[2]?.expenses?.[0]?.fileObjectIds, [31])

const resubmitDraft = buildSettlementWriteDraft({
  applicationId: '12',
  sessionId: '88',
  scheduleId: 88,
  isInstructor: false,
  documentKind: 'receipt',
  expenseDate: '2026-04-20',
  idempotencyKey: '33333333-3333-3333-3333-333333333333',
  settlementApplicationId: 700001,
  currentRevisionNo: 1,
  resubmit: true,
  name: '홍길동',
  homeAddress: '',
  homeAddressDetail: '',
  bank: '국민',
  accountNumber: '123',
  accountHolder: '홍길동',
  extraItems: [
    {
      itemType: 'MEAL',
      itemName: '식사비',
      evidenceRequired: true,
      amount: '12,000',
      attachments: [{ fileObjectId: 41, fileName: 'meal.jpg' }],
    },
  ],
  tripType: 'one_way',
  departTransit: '',
  departAmount: '',
  returnTransit: '',
  returnAmount: '',
  mealAmount: '',
  mealFiles: [],
  activityAmount: '',
  activityFiles: [],
})
const resubmit = buildIndividualSettlementResubmitRequest(resubmitDraft)
assert.equal(resubmit.expectedRevisionNo, 1)
assert.equal(resubmit.idempotencyKey, '33333333-3333-3333-3333-333333333333')
assert.equal(resubmit.items[0]?.itemType, 'MEAL')

const duplicateTransportDraft = buildSettlementWriteDraft({
  applicationId: '12',
  sessionId: '88',
  scheduleId: 88,
  isInstructor: false,
  documentKind: 'receipt',
  expenseDate: '2026-04-20',
  idempotencyKey: '44444444-4444-4444-4444-444444444444',
  name: '홍길동',
  homeAddress: '',
  homeAddressDetail: '',
  bank: '국민',
  accountNumber: '123',
  accountHolder: '홍길동',
  transportItemType: 'TRANSPORTATION',
  transportItemName: '교통비',
  transportEvidenceRequired: false,
  tripType: 'one_way',
  departTransit: 'bus',
  departAmount: '5,000',
  returnTransit: '',
  returnAmount: '',
  extraItems: [
    {
      itemType: 'STUDENT_TRANSPORTATION',
      itemName: '학생 교통비',
      evidenceRequired: false,
      amount: '5,000',
      attachments: [],
    },
  ],
  mealAmount: '',
  mealFiles: [],
  activityAmount: '',
  activityFiles: [],
})
const dedupedTransport = buildIndividualSettlementItems(duplicateTransportDraft)
assert.equal(dedupedTransport.length, 1)
assert.equal(dedupedTransport[0]?.itemType, 'TRANSPORTATION')

const instructorDraft = buildSettlementWriteDraft({
  applicationId: '12',
  sessionId: '1',
  scheduleId: 1,
  isInstructor: true,
  documentKind: 'payment_statement',
  expenseDate: '2026-04-03',
  idempotencyKey: '55555555-5555-5555-5555-555555555555',
  name: '강사',
  homeAddress: '',
  homeAddressDetail: '',
  bank: '국민',
  accountNumber: '123',
  accountHolder: '강사',
  transportItemType: 'TRANSPORTATION',
  tripType: 'one_way',
  departTransit: 'bus',
  departAmount: '8,000',
  returnTransit: '',
  returnAmount: '',
  extraItems: [],
  mealAmount: '30,000',
  mealFiles: [],
  activityAmount: '',
  activityFiles: [],
})
const instructorItems = buildIndividualSettlementItems(instructorDraft)
assert.equal(instructorItems.length, 2)
assert.equal(instructorItems[0]?.itemType, 'TRANSPORTATION')
assert.equal(instructorItems[1]?.itemType, 'MEAL')
assert.equal(instructorItems[1]?.amount, 30000)

console.log('build-individual-settlement-submit.selfcheck: ok')
