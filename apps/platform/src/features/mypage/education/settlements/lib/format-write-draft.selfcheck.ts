import assert from 'node:assert/strict'
import {
  INSTRUCTOR_MEAL_MAX_WON,
  formatSettlementAmountInput,
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

console.log('format-write-draft.selfcheck: ok')
