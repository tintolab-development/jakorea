/**
 * Run: node --experimental-strip-types --experimental-transform-types src/features/mypage/education/surveys/lib/submit-confirm-copy.selfcheck.ts
 */
import assert from 'node:assert/strict'
import { educationSurveySubmitConfirmCopy } from './submit-confirm-copy.ts'

assert.deepEqual(educationSurveySubmitConfirmCopy('survey'), {
  title: '설문 응답을 제출할까요?',
  description: '내용을 확인한 뒤 제출해 주세요.',
})
assert.deepEqual(educationSurveySubmitConfirmCopy('satisfaction'), {
  title: '만족도조사 응답을 제출할까요?',
  description: '내용을 확인한 뒤 제출해 주세요.',
})

console.log('submit-confirm-copy.selfcheck ok')
