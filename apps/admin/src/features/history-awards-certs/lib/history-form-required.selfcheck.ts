import assert from 'node:assert/strict'
import { isHistoryFormRequiredIncomplete } from './history-form-required.ts'

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

console.log('history-form-required.selfcheck: ok')
