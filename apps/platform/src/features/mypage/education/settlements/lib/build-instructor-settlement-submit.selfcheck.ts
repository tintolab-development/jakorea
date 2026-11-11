import assert from 'node:assert/strict'
import { buildSettlementWriteDraft } from './build-write-draft.ts'
import {
  buildInstructorSettlementCreateRequest,
  buildInstructorSettlementPayloadParts,
  buildInstructorSettlementResubmitRequest,
} from './build-instructor-settlement-submit.ts'
import {
  findExceededInstructorExpenseLimit,
  instructorPaymentItemLimitExceededAlert,
  instructorPaymentItemLimitMessage,
  readInstructorExpensePolicies,
} from './instructor-expense-items.ts'
import { validateSettlementWriteDraft } from './validate-write-draft.ts'

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

// 강사 식사비·활동비 정책 — 미리보기 payableItems (K14)
{
  // 받기 전(payableItems 없음): 기존 동작
  const unknown = readInstructorExpensePolicies({ canSubmit: true })
  assert.equal(unknown.loaded, false)
  assert.deepEqual(unknown.meal, { allowed: true, maxLimitWon: null, evidenceRequired: true })

  // MEAL만 켜짐(한도 20,000·영수증 불필요), ACTIVITY 꺼짐, 일반 숙박비 켜짐
  const policies = readInstructorExpensePolicies({
    payableItems: [
      { itemType: 'MEAL', itemName: '식사비', maxLimitWon: 20000, evidenceRequired: false },
      { itemType: 'LODGING', itemName: '숙박비', maxLimitWon: 150000, evidenceRequired: true },
    ],
  })
  assert.equal(policies.loaded, true)
  assert.deepEqual(policies.meal, { allowed: true, maxLimitWon: 20000, evidenceRequired: false })
  assert.equal(policies.activity.allowed, false)
  assert.equal(policies.lodgingOffered, true)
  // evidenceRequired 미설정(null)은 필요로 본다
  assert.equal(
    readInstructorExpensePolicies({ payableItems: [{ itemType: 'ACTIVITY', evidenceRequired: null }] })
      .activity.evidenceRequired,
    true,
  )

  const draft = buildSettlementWriteDraft({
    ...base,
    extraItems: [],
    mealAmount: '15,000',
    mealFiles: [],
    mealAttachments: [],
    activityAmount: '23,000',
    activityFiles: [],
    activityAttachments: [],
    mealPolicy: policies.meal,
    activityPolicy: policies.activity,
  })
  // 영수증 불필요 식사비·꺼진 활동비는 영수증 없이도 통과
  assert.equal(validateSettlementWriteDraft(draft), null)
  const payload = buildInstructorSettlementCreateRequest(draft)
  // 꺼진 활동비는 보내지 않고, 식사비는 영수증 불필요(증빙 제출 표시 없음)로 보낸다
  const expenseItems = payload.requestedItems.filter(
    item => item.itemType === 'MEAL' || item.itemType === 'ACTIVITY',
  )
  assert.equal(expenseItems.length, 1)
  assert.equal(expenseItems[0]?.itemType, 'MEAL')
  assert.equal(expenseItems[0]?.requestedAmount, 15000)
  assert.notEqual(expenseItems[0]?.evidenceSubmitted, true)

  // 한도 초과 문구(강사): "신청은 최대 N원까지만 가능합니다."
  assert.equal(instructorPaymentItemLimitMessage(20000), '신청은 최대 20,000원까지만 가능합니다.')
  const over = { ...draft, meal: { ...draft.meal, amount: '25,000' } }
  assert.equal(findExceededInstructorExpenseLimit(over), 20000)
  assert.equal(findExceededInstructorExpenseLimit(draft), null)
  // 서버 400이면 한도를 아는 항목 기준으로 같은 문구
  assert.equal(instructorPaymentItemLimitExceededAlert(draft), '신청은 최대 20,000원까지만 가능합니다.')
}

console.log('build-instructor-settlement-submit.selfcheck: ok')
