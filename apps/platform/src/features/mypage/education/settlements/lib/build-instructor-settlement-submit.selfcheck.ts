import assert from 'node:assert/strict'
import { buildSettlementWriteDraft } from './build-write-draft.ts'
import {
  buildInstructorSettlementCreateRequest,
  buildInstructorSettlementPayloadParts,
  buildInstructorSettlementResubmitRequest,
} from './build-instructor-settlement-submit.ts'

const base = {
  applicationId: '12',
  sessionId: '88',
  scheduleId: 88,
  assignmentId: 12345,
  isInstructor: true,
  documentKind: 'payment_statement' as const,
  idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
  enabledItemTypes: ['TRANSPORTATION', 'MEAL'],
  name: '홍길동',
  homeAddress: '서울',
  homeAddressDetail: '1층',
  bank: '국민',
  accountNumber: '123',
  accountHolder: '홍길동',
  transportItemType: 'TRANSPORTATION',
  transportItemName: '교통비',
  transportEvidenceRequired: false,
  transportAutoPreview: {
    oneWayDistanceKm: 30,
    fuelCostWon: 12_000,
    tollFeeWon: 3_000,
    calculatedTransportAmount: 15_000,
    totalTransportFeeWon: 15_000,
  },
  tripType: 'round_trip' as const,
  departTransit: 'bus',
  departAmount: '12,000',
  departAttachments: [{ fileObjectId: 9001, fileName: 'go.jpg' }],
  returnTransit: 'subway',
  returnAmount: '12,000',
  returnAttachments: [{ fileObjectId: 9002, fileName: 'back.jpg' }],
  extraItems: [
    {
      itemType: 'MEAL',
      itemName: '식사비',
      evidenceRequired: true,
      amount: '10,000',
      attachments: [{ fileObjectId: 21, fileName: 'meal.jpg' }],
    },
    {
      itemType: 'LECTURE_FEE',
      itemName: '강사비',
      evidenceRequired: false,
      amount: '480000',
      attachments: [],
    },
  ],
  mealAmount: '',
  mealFiles: [] as string[],
  activityAmount: '',
  activityFiles: [] as string[],
}

const draft = buildSettlementWriteDraft(base)
const created = buildInstructorSettlementCreateRequest(draft)
assert.equal(created.idempotencyKey, '550e8400-e29b-41d4-a716-446655440000')
assert.equal(created.assignmentId, 12345)
assert.equal(created.programScheduleId, 88)
assert.equal(
  created.requestedItems.some(item => item.itemType === 'LECTURE_FEE'),
  false
)
assert.equal(
  created.requestedItems.some(item => item.itemType === 'TRANSPORTATION'),
  true
)
assert.equal(
  created.requestedItems.find(item => item.itemType === 'TRANSPORTATION')?.requestedAmount,
  15_000
)
assert.equal(
  created.evidenceAttachments.some(item => item.itemType === 'TRANSPORTATION'),
  false
)
assert.equal(created.requestedItems.find(item => item.itemType === 'MEAL')?.requestedAmount, 10000)
assert.equal('residentFront' in created, false)
assert.equal('accountNumber' in created, false)

const resubmit = buildInstructorSettlementResubmitRequest(draft)
assert.equal('idempotencyKey' in resubmit, false)
assert.equal('assignmentId' in resubmit, false)
assert.equal(resubmit.requestedItems.length, created.requestedItems.length)

const belowMin = buildSettlementWriteDraft({
  ...base,
  transportAutoPreview: {
    oneWayDistanceKm: 10,
    fuelCostWon: 1,
    tollFeeWon: 1,
    calculatedTransportAmount: 2,
    totalTransportFeeWon: 2,
  },
})
assert.equal(
  buildInstructorSettlementCreateRequest(belowMin).requestedItems.some(
    item => item.itemType === 'TRANSPORTATION'
  ),
  false
)

const withoutAssignment = buildSettlementWriteDraft({ ...base, assignmentId: undefined })
assert.throws(
  () => buildInstructorSettlementCreateRequest(withoutAssignment),
  /ASSIGNMENT_ID_REQUIRED/
)

const mealActivity = buildSettlementWriteDraft({
  ...base,
  extraItems: [],
  mealAmount: '30,000',
  mealFiles: ['주진2.png'],
  mealAttachments: [{ fileObjectId: 101, fileName: '주진2.png' }],
  activityAmount: '23,000',
  activityFiles: ['act.png'],
  activityAttachments: [{ fileObjectId: 102, fileName: 'act.png' }],
})
const mealActivityPayload = buildInstructorSettlementCreateRequest(mealActivity)
assert.deepEqual(
  mealActivityPayload.requestedItems.filter(
    item => item.itemType === 'MEAL' || item.itemType === 'ACTIVITY'
  ),
  [
    { itemType: 'MEAL', requestedAmount: 30000, evidenceSubmitted: true },
    { itemType: 'ACTIVITY', requestedAmount: 23000, evidenceSubmitted: true },
  ]
)
assert.deepEqual(
  mealActivityPayload.evidenceAttachments.filter(
    item => item.itemType === 'MEAL' || item.itemType === 'ACTIVITY'
  ),
  [
    { itemType: 'MEAL', fileObjectIds: [101] },
    { itemType: 'ACTIVITY', fileObjectIds: [102] },
  ]
)

const mealNamesOnly = buildInstructorSettlementCreateRequest(
  buildSettlementWriteDraft({
    ...base,
    extraItems: [],
    mealAmount: '30,000',
    mealFiles: ['주진2.png'],
    mealAttachments: [],
  })
)
assert.equal(mealNamesOnly.requestedItems.find(item => item.itemType === 'MEAL')?.evidenceSubmitted, false)
assert.equal(
  mealNamesOnly.evidenceAttachments.some(item => item.itemType === 'MEAL'),
  false
)

// 1사1교 숙박비 — 금액 없이 LODGING_1C1S 1건 + 영수증(BE 2026-11-09)
const lodgingParts = buildInstructorSettlementPayloadParts(
  buildSettlementWriteDraft({
    ...base,
    extraItems: [],
    mealAmount: '',
    mealFiles: [],
    activityAmount: '',
    activityFiles: [],
    companySchoolLodgingRequested: true,
    companySchoolLodgingAttachments: [{ fileObjectId: 7001, fileName: 'hotel.jpg' }],
  })
)
assert.deepEqual(
  lodgingParts.requestedItems.find(item => item.itemType === 'LODGING_1C1S'),
  { itemType: 'LODGING_1C1S', requestedAmount: null, evidenceSubmitted: true }
)
assert.deepEqual(
  lodgingParts.evidenceAttachments.find(item => item.itemType === 'LODGING_1C1S'),
  { itemType: 'LODGING_1C1S', fileObjectIds: [7001] }
)
const lodgingNotRequested = buildInstructorSettlementPayloadParts(
  buildSettlementWriteDraft({ ...base, extraItems: [], mealAmount: '', mealFiles: [], activityAmount: '', activityFiles: [] })
)
assert.equal(lodgingNotRequested.requestedItems.some(item => item.itemType === 'LODGING_1C1S'), false)

console.log('build-instructor-settlement-submit.selfcheck: ok')
