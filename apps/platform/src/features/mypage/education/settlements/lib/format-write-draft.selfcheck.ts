import assert from 'node:assert/strict'
import {
  INSTRUCTOR_MEAL_MAX_WON,
  formatSettlementAmountInput,
  formatSettlementSessionBannerTitle,
} from './format-write-draft.ts'

assert.equal(INSTRUCTOR_MEAL_MAX_WON, 30_000)
assert.equal(formatSettlementAmountInput('40000', INSTRUCTOR_MEAL_MAX_WON), '30,000')
assert.equal(formatSettlementAmountInput('40,000', 30_000), '30,000')
assert.equal(formatSettlementAmountInput('30000', 30_000), '30,000')
assert.equal(formatSettlementAmountInput('29999', 30_000), '29,999')
assert.equal(formatSettlementAmountInput('40000'), '40,000')
assert.equal(formatSettlementAmountInput('40000', null), '40,000')
assert.equal(formatSettlementAmountInput('40000', 0), '40,000')
assert.equal(formatSettlementAmountInput('', 30_000), '')
assert.equal(formatSettlementAmountInput('abc', 30_000), '')

assert.equal(
  formatSettlementSessionBannerTitle(
    { institutionName: null, grade: null },
    '정산(개인/봉사자/강사)',
    { institutionOnly: true },
  ),
  '정산(개인/봉사자/강사)',
)
assert.equal(
  formatSettlementSessionBannerTitle(
    { institutionName: '서울초', grade: '3' },
    '기관 프로그램',
    { institutionOnly: true },
  ),
  '서울초 3학년',
)
assert.equal(
  formatSettlementSessionBannerTitle({ institutionName: null, grade: null }, '', {
    institutionOnly: true,
  }),
  '-',
)

console.log('format-write-draft.selfcheck: ok')
