import assert from 'node:assert/strict'
import { buildSettlementWriteDraft } from './build-write-draft.ts'
import { validateSettlementWriteDraft } from './validate-write-draft.ts'

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

console.log('validate-write-draft.selfcheck: ok')
