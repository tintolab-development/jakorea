import assert from 'node:assert/strict'
import { buildSettlementWriteDraft, createEmptyAmountItemDraft } from './build-write-draft.ts'
import {
  findExceededReceiptItemLimit,
  isOverPaymentItemLimit,
  paymentItemLimitError,
  paymentItemLimitExceededMessage,
} from './payment-item-limit.ts'
import { receiptPayableDisplayRank } from './payment-items.ts'

assert.equal(paymentItemLimitExceededMessage(20000), '최대 20,000원까지 신청할 수 있어요.')

// 한도와 같은 금액은 통과, 넘으면 차단, null은 한도 없음
assert.equal(isOverPaymentItemLimit(20000, 20000), false)
assert.equal(isOverPaymentItemLimit(20001, 20000), true)
assert.equal(isOverPaymentItemLimit(999999, null), false)
assert.equal(paymentItemLimitError(20000, 20000), null)
assert.equal(paymentItemLimitError(20001, 20000), '최대 20,000원까지 신청할 수 있어요.')

function receiptDraft(input: {
  tripType: 'one_way' | 'round_trip'
  depart: string
  back: string
  mealAmount?: string
  mealMax?: number | null
}) {
  return buildSettlementWriteDraft({
    applicationId: '1',
    sessionId: '1',
    isInstructor: false,
    documentKind: 'receipt',
    name: '홍길동',
    homeAddress: '',
    homeAddressDetail: '',
    bank: 'B',
    accountNumber: '1',
    accountHolder: '홍길동',
    transportItemType: 'TRANSPORTATION',
    tripType: input.tripType,
    departTransit: 'BUS',
    departAmount: input.depart,
    returnTransit: 'BUS',
    returnAmount: input.back,
    extraItems: [
      {
        ...createEmptyAmountItemDraft({
          itemType: 'MEAL',
          itemName: '식사비',
          maxLimitWon: input.mealMax ?? null,
        }),
        amount: input.mealAmount ?? '',
      },
    ],
    mealAmount: '',
    mealFiles: [],
    activityAmount: '',
    activityFiles: [],
  })
}

// 교통비는 한도가 없다 — 금액이 커도 한도 오류가 나지 않는다
const roundTrip = receiptDraft({ tripType: 'round_trip', depart: '150,000', back: '150,000' })
assert.equal(findExceededReceiptItemLimit(roundTrip), null)

// 금액 항목 한도
const mealOver = receiptDraft({
  tripType: 'one_way',
  depart: '',
  back: '',
  mealAmount: '12,000',
  mealMax: 10000,
})
assert.equal(findExceededReceiptItemLimit(mealOver), 10000)

// 강사 지급조서 draft는 대상 아님
assert.equal(
  findExceededReceiptItemLimit({ ...roundTrip, meta: { ...roundTrip.meta, documentKind: 'payment_statement' } }),
  null,
)

// 정렬은 itemType 기준 — 설정 이름에 다른 항목 단어가 있어도 순서가 바뀌지 않는다
assert.equal(receiptPayableDisplayRank('TRANSPORTATION', '학생 교통비'), 1)
assert.equal(receiptPayableDisplayRank('MEAL', '활동 식사비'), 4)
assert.equal(receiptPayableDisplayRank('ACTIVITY', '활동비'), 3)
assert.equal(receiptPayableDisplayRank('OTHER', '강사비'), 0)

console.log('payment-item-limit.selfcheck: ok')
