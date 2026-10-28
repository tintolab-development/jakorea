import assert from 'node:assert/strict'
import {
  displayGeminiBusinessIncomeLabel,
  displayGeminiLectureFeeBasis,
  GEMINI_LECTURE_SCHEDULES_PATH,
  GEMINI_SETTLEMENT_SUMMARY_PATH,
  mapGeminiPaymentStatementProcessLabel,
} from './gemini-settlement-status.ts'
assert.equal(
  GEMINI_SETTLEMENT_SUMMARY_PATH('12'),
  '/api/portal/me/programs/12/gemini-settlement-summary',
)
assert.equal(
  GEMINI_LECTURE_SCHEDULES_PATH('12'),
  '/api/portal/me/programs/12/gemini-lecture-schedules',
)

assert.equal(
  mapGeminiPaymentStatementProcessLabel({
    paymentStatementProcessingStatusCode: 'AWAITING_CONFIRMATION',
    accountPaymentStatus: 'PAID',
  }),
  '확인 대기 중',
)
assert.equal(
  mapGeminiPaymentStatementProcessLabel({
    paymentStatementProcessingStatusCode: 'PARTIAL_CONFIRMATION',
  }),
  '확인 진행 중',
)
assert.equal(
  mapGeminiPaymentStatementProcessLabel({
    paymentStatementProcessingStatusCode: 'ACCOUNT_PAID',
  }),
  '계좌 지급 완료',
)
assert.equal(
  mapGeminiPaymentStatementProcessLabel({ accountPaymentStatus: 'READY_TO_PAY' }),
  '확인 진행 중',
)
assert.equal(
  mapGeminiPaymentStatementProcessLabel({ settlementStatus: 'WAITING' }),
  '확인 대기 중',
)
assert.equal(
  mapGeminiPaymentStatementProcessLabel({ accountPaymentStatus: 'FAILED' }),
  '지급 실패',
)

assert.equal(displayGeminiLectureFeeBasis(null), '-')
assert.equal(displayGeminiLectureFeeBasis('GRADE_2'), '2급 강사비')
assert.equal(displayGeminiBusinessIncomeLabel(false), '해당 없음')
assert.equal(displayGeminiBusinessIncomeLabel(null), '-')

console.log('gemini-settlement-status.selfcheck: ok')
