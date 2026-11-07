import assert from 'node:assert/strict'
import {
  isDatedFormRequiredIncomplete,
  isHistoryFormRequiredIncomplete,
} from './history-form-required.ts'

assert.equal(
  isHistoryFormRequiredIncomplete({ year: '2024', month: '3', content: '설립' }),
  false,
)
assert.equal(
  isHistoryFormRequiredIncomplete({ year: '', month: '3', content: '설립' }),
  true,
)
assert.equal(
  isHistoryFormRequiredIncomplete({ year: '2024', month: '  ', content: '설립' }),
  true,
)
assert.equal(
  isHistoryFormRequiredIncomplete({ year: '2024', month: '3', content: '   ' }),
  true,
)

const validDate = { isValid: () => true }
const filledDated = { date: validDate, name: '대통령상', organization: '교육부' }
assert.equal(isDatedFormRequiredIncomplete(filledDated), false)
assert.equal(isDatedFormRequiredIncomplete({ ...filledDated, date: null }), true)
assert.equal(
  isDatedFormRequiredIncomplete({ ...filledDated, date: { isValid: () => false } }),
  true,
)
assert.equal(isDatedFormRequiredIncomplete({ ...filledDated, name: '  ' }), true)
assert.equal(isDatedFormRequiredIncomplete({ ...filledDated, organization: '' }), true)
assert.equal(isDatedFormRequiredIncomplete({ date: null, name: '', organization: '' }), true)

console.log('history-form-required.selfcheck: ok')
