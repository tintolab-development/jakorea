import assert from 'node:assert/strict'
import { resolveGeminiOfficialDocumentFromAnswers } from './official-document-from-answers.ts'

const fromRows = resolveGeminiOfficialDocumentFromAnswers({
  'gemini-vt-instructor-seed-official-document': {
    dataRows: [
      ['공문 필요 여부', '필요'],
      ['공문 필요 정보', '이름, 소속(학교)'],
    ],
  },
})
assert.deepEqual(fromRows, {
  requiredLabel: '필요',
  info: '이름, 소속(학교)',
})

const fromNeed = resolveGeminiOfficialDocumentFromAnswers({
  'gemini-vt-instructor-seed-official-document': {
    officialNeed: 'not_needed',
    officialDetail: '없음',
  },
})
assert.deepEqual(fromNeed, { requiredLabel: '필요 없음', info: '없음' })

assert.equal(resolveGeminiOfficialDocumentFromAnswers({}), null)

console.log('official-document-from-answers.selfcheck: ok')
