import assert from 'node:assert/strict'
import { resolveGeminiOfficialDocumentFromAnswers } from '../../../mypage/education/applications/lib/official-document-from-answers.ts'
import {
  emptyGeminiInstructorOfficialDocument,
  findIncompleteGeminiInstructorOfficialDocumentMessage,
  geminiInstructorOfficialDocumentAnswerFromValues,
  geminiInstructorOfficialDocumentValuesFromDraftAnswer,
} from './official-document-answers.ts'

assert.equal(
  findIncompleteGeminiInstructorOfficialDocumentMessage(emptyGeminiInstructorOfficialDocument()),
  '공문 필요 여부를 선택해 주세요.',
)
assert.equal(
  findIncompleteGeminiInstructorOfficialDocumentMessage({
    officialNeed: 'needed',
    officialDetail: '  ',
  }),
  '공문에 필요한 정보를 작성해 주세요.',
)
assert.equal(
  findIncompleteGeminiInstructorOfficialDocumentMessage({
    officialNeed: 'not_needed',
    officialDetail: '',
  }),
  null,
)

const needed = geminiInstructorOfficialDocumentAnswerFromValues({
  officialNeed: 'needed',
  officialDetail: '이름, 소속(학교)',
})
assert.deepEqual(needed, {
  officialNeed: 'needed',
  officialDetail: '이름, 소속(학교)',
  dataRows: [
    ['공문 필요 여부', '필요'],
    ['공문 필요 정보', '이름, 소속(학교)'],
  ],
})
assert.deepEqual(
  resolveGeminiOfficialDocumentFromAnswers({
    'gemini-vt-instructor-seed-official-document': needed,
  }),
  { requiredLabel: '필요', info: '이름, 소속(학교)' },
)

assert.deepEqual(
  geminiInstructorOfficialDocumentValuesFromDraftAnswer({
    dataRows: [
      ['공문 필요 여부', '필요 없음'],
      ['공문 필요 정보', ''],
    ],
  }),
  { officialNeed: 'not_needed', officialDetail: '' },
)
assert.deepEqual(
  geminiInstructorOfficialDocumentValuesFromDraftAnswer({
    officialNeed: 'needed',
    officialDetail: '소속 명시',
  }),
  { officialNeed: 'needed', officialDetail: '소속 명시' },
)

console.log('apply-gemini-instructor-official-document.selfcheck: ok')
