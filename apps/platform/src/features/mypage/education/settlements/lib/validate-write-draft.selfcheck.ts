import assert from 'node:assert/strict'
import { buildSettlementWriteDraft } from './build-write-draft.ts'
import {
  resolveSettlementWriteValidationAlert,
  validateSettlementWriteDraft,
} from './validate-write-draft.ts'

const base = {
  applicationId: '12',
  sessionId: '88',
  scheduleId: 88,
  isInstructor: false,
  documentKind: 'receipt' as const,
  name: '홍길동',
  homeAddress: '서울',
  homeAddressDetail: '1층',
  bank: '국민',
  accountNumber: '123',
  accountHolder: '홍길동',
  tripType: 'one_way' as const,
  departTransit: '',
  departAmount: '',
  returnTransit: '',
  returnAmount: '',
  mealAmount: '',
  mealFiles: [] as string[],
  activityAmount: '',
  activityFiles: [] as string[],
}

const evidenceFalse = buildSettlementWriteDraft({
  ...base,
  extraItems: [
    {
      itemType: 'MEAL',
      itemName: '식사비',
      evidenceRequired: false,
      amount: '12,000',
      attachments: [],
    },
  ],
})
assert.equal(validateSettlementWriteDraft(evidenceFalse), null)

const evidenceTrueMissingFile = buildSettlementWriteDraft({
  ...base,
  extraItems: [
    {
      itemType: 'MEAL',
      itemName: '식사비',
      evidenceRequired: true,
      amount: '12,000',
      attachments: [],
    },
  ],
})
assert.equal(validateSettlementWriteDraft(evidenceTrueMissingFile), 'receipt_required')

const evidenceTrueWithFile = buildSettlementWriteDraft({
  ...base,
  extraItems: [
    {
      itemType: 'MEAL',
      itemName: '식사비',
      evidenceRequired: true,
      amount: '12,000',
      attachments: [{ fileObjectId: 9, fileName: 'meal.jpg' }],
    },
  ],
})
assert.equal(validateSettlementWriteDraft(evidenceTrueWithFile), null)

const transportFalse = buildSettlementWriteDraft({
  ...base,
  transportItemType: 'TRANSPORTATION',
  transportEvidenceRequired: false,
  departTransit: 'bus',
  departAmount: '5,000',
})
assert.equal(validateSettlementWriteDraft(transportFalse), null)

const transportTrueMissingFile = buildSettlementWriteDraft({
  ...base,
  transportItemType: 'TRANSPORTATION',
  transportEvidenceRequired: true,
  departTransit: 'bus',
  departAmount: '5,000',
})
assert.equal(validateSettlementWriteDraft(transportTrueMissingFile), 'receipt_required')

const instructorPaymentMissingReceipt = buildSettlementWriteDraft({
  ...base,
  isInstructor: true,
  documentKind: 'payment_statement',
  transportItemType: 'TRANSPORTATION',
  departTransit: 'bus',
  departAmount: '5,000',
})
assert.equal(validateSettlementWriteDraft(instructorPaymentMissingReceipt), null)
assert.equal(
  resolveSettlementWriteValidationAlert('receipt_required').title,
  '영수증 제출 안내',
)
assert.equal(
  resolveSettlementWriteValidationAlert('required_incomplete').title,
  '입력하지 않은 필수 항목이 있어요.',
)

const instructorPaymentMissingTransit = buildSettlementWriteDraft({
  ...base,
  isInstructor: true,
  documentKind: 'payment_statement',
  transportItemType: 'TRANSPORTATION',
  departTransit: '',
  departAmount: '5,000',
  departFiles: ['receipt.jpg'],
})
assert.equal(validateSettlementWriteDraft(instructorPaymentMissingTransit), null)

const instructorMealMissingReceipt = buildSettlementWriteDraft({
  ...base,
  isInstructor: true,
  documentKind: 'payment_statement',
  mealAmount: '30,000',
})
assert.equal(validateSettlementWriteDraft(instructorMealMissingReceipt), 'receipt_required')

const instructorMealNamesOnly = buildSettlementWriteDraft({
  ...base,
  isInstructor: true,
  documentKind: 'payment_statement',
  mealAmount: '30,000',
  mealFiles: ['주진2.png'],
})
assert.equal(validateSettlementWriteDraft(instructorMealNamesOnly), 'upload_incomplete')

const instructorMealUploaded = buildSettlementWriteDraft({
  ...base,
  isInstructor: true,
  documentKind: 'payment_statement',
  mealAmount: '30,000',
  mealFiles: ['주진2.png'],
  mealAttachments: [{ fileObjectId: 101, fileName: '주진2.png' }],
  activityAmount: '23,000',
  activityFiles: ['act.png'],
  activityAttachments: [{ fileObjectId: 102, fileName: 'act.png' }],
})
assert.equal(validateSettlementWriteDraft(instructorMealUploaded), null)

// 1사1교 숙박비 — 신청하면 영수증 필수
const instructorLodgingBase = {
  ...base,
  isInstructor: true,
  documentKind: 'payment_statement' as const,
  companySchoolLodgingRequested: true,
}
assert.equal(
  validateSettlementWriteDraft(buildSettlementWriteDraft(instructorLodgingBase)),
  'receipt_required'
)
assert.equal(
  validateSettlementWriteDraft(
    buildSettlementWriteDraft({ ...instructorLodgingBase, companySchoolLodgingFiles: ['hotel.jpg'] })
  ),
  'upload_incomplete'
)
assert.equal(
  validateSettlementWriteDraft(
    buildSettlementWriteDraft({
      ...instructorLodgingBase,
      companySchoolLodgingFiles: ['hotel.jpg'],
      companySchoolLodgingAttachments: [{ fileObjectId: 7001, fileName: 'hotel.jpg' }],
    })
  ),
  null
)

console.log('validate-write-draft.selfcheck: ok')
