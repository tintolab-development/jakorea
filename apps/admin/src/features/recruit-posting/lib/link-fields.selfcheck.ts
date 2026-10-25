/**
 * Run:
 *   node --experimental-strip-types --experimental-transform-types \
 *     src/features/recruit-posting/lib/link-fields.selfcheck.ts
 */
import assert from 'node:assert/strict'
import {
  CAREER_POSTING_BUTTON_LABEL_MAX_LENGTH,
  careerPostingLinkButtonVisible,
  normalizeCareerPostingLinkFields,
  readCareerPostingLinkFields,
  validateCareerPostingLinkFields,
} from './link-fields.ts'

assert.equal(CAREER_POSTING_BUTTON_LABEL_MAX_LENGTH, 15)
assert.equal(validateCareerPostingLinkFields({ buttonLabel: '', linkUrl: '' }), null)
assert.equal(
  validateCareerPostingLinkFields({ buttonLabel: '채용 바로가기', linkUrl: 'https://example.test' }),
  null,
)
assert.equal(
  validateCareerPostingLinkFields({ buttonLabel: '가'.repeat(15), linkUrl: 'https://example.test' }),
  null,
)
assert.equal(
  validateCareerPostingLinkFields({ buttonLabel: '가'.repeat(16), linkUrl: 'https://example.test' }),
  '버튼명은 최대 15자까지 입력할 수 있습니다.',
)
assert.equal(
  validateCareerPostingLinkFields({ buttonLabel: '채용 바로가기', linkUrl: '' }),
  '버튼 링크를 입력해 주세요.',
)
assert.equal(
  validateCareerPostingLinkFields({ buttonLabel: '', linkUrl: 'https://example.test' }),
  '버튼명을 입력해 주세요.',
)

const hydrated = readCareerPostingLinkFields({
  buttonLabel: '  지원하기  ',
  linkUrl: ' https://jobs.example.test ',
})
assert.deepEqual(hydrated, {
  buttonLabel: '지원하기',
  linkUrl: 'https://jobs.example.test',
})
assert.deepEqual(readCareerPostingLinkFields({}), { buttonLabel: '', linkUrl: '' })
assert.deepEqual(readCareerPostingLinkFields({ buttonLabel: null, linkUrl: null }), {
  buttonLabel: '',
  linkUrl: '',
})
assert.deepEqual(readCareerPostingLinkFields({ buttonLabel: '버튼만', linkUrl: null }), {
  buttonLabel: '버튼만',
  linkUrl: '',
})
assert.deepEqual(readCareerPostingLinkFields({ buttonLabel: null, linkUrl: 'https://jobs.example.test' }), {
  buttonLabel: '',
  linkUrl: 'https://jobs.example.test',
})
assert.equal(careerPostingLinkButtonVisible(''), false)
assert.equal(careerPostingLinkButtonVisible('지원하기'), true)
assert.deepEqual(
  normalizeCareerPostingLinkFields({ buttonLabel: '  a  ', linkUrl: '  b  ' }),
  { buttonLabel: 'a', linkUrl: 'b' },
)

console.log('recruit-posting link-fields selfcheck: ok')
