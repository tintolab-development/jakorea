import assert from 'node:assert/strict'
import {
  displayGeminiSummaryField,
  GEMINI_LECTURE_SCHEDULES_PATH,
  GEMINI_SETTLEMENT_SUMMARY_PATH,
} from './gemini-settlement-status.ts'
assert.equal(
  GEMINI_SETTLEMENT_SUMMARY_PATH('INSTRUCTOR', '12'),
  '/api/portal/me/program-applications/INSTRUCTOR/12/gemini-settlement-summary',
)
assert.equal(
  GEMINI_LECTURE_SCHEDULES_PATH('ORGANIZATION', '12'),
  '/api/portal/me/program-applications/ORGANIZATION/12/gemini-lecture-schedules',
)

assert.equal(displayGeminiSummaryField(null), '-')
assert.equal(displayGeminiSummaryField('확인 대기 중'), '확인 대기 중')
assert.equal(displayGeminiSummaryField(2), '2')
assert.equal(displayGeminiSummaryField('GRADE_2'), 'GRADE_2')

console.log('gemini-settlement-status.selfcheck: ok')
