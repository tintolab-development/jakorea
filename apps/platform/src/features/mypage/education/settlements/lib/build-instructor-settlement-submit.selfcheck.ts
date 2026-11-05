import assert from 'node:assert/strict'
import { buildSettlementWriteDraft } from './build-write-draft.ts'
import {
  buildInstructorSettlementCreateRequest,
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
  transportEvidenceRequired: true,
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
      itemName: '강의비',
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
assert.equal(created.requestedItems.some(item => item.itemType === 'LECTURE_FEE'), false)
assert.equal(created.requestedItems.some(item => item.itemType === 'TRANSPORTATION'), true)
assert.equal(
  created.requestedItems.find(item => item.itemType === 'TRANSPORTATION')?.requestedAmount,
  24000,
)
assert.deepEqual(
  created.evidenceAttachments.find(item => item.itemType === 'TRANSPORTATION')?.fileObjectIds,
  [9001, 9002],
)
assert.equal(created.requestedItems.find(item => item.itemType === 'MEAL')?.requestedAmount, 10000)
assert.equal('residentFront' in created, false)
assert.equal('accountNumber' in created, false)

const resubmit = buildInstructorSettlementResubmitRequest(draft)
assert.equal('idempotencyKey' in resubmit, false)
assert.equal('assignmentId' in resubmit, false)
assert.equal(resubmit.requestedItems.length, created.requestedItems.length)

const withoutAssignment = buildSettlementWriteDraft({ ...base, assignmentId: undefined })
assert.throws(
  () => buildInstructorSettlementCreateRequest(withoutAssignment),
  /ASSIGNMENT_ID_REQUIRED/,
)

console.log('build-instructor-settlement-submit.selfcheck: ok')
