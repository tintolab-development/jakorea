/**
 * Run:
 *   node --experimental-strip-types --experimental-transform-types \
 *     src/features/recruit-posting/lib/link-fields.selfcheck.ts
 */
import assert from 'node:assert/strict'
import {
  CAREER_POSTING_BUTTON_LABEL_MAX_LENGTH,
  CAREER_POSTING_LINK_URL_FORMAT_ALERT,
  careerPostingLinkButtonVisible,
  careerPostingLinkUrlFormatAlert,
  careerPostingMutationLinkFormatAlert,
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
  '채용 공고 바로가기 링크를 입력해 주세요.',
)
assert.equal(
  validateCareerPostingLinkFields({ buttonLabel: '', linkUrl: 'https://example.test' }),
  '채용 공고 바로가기 버튼명을 입력해 주세요.',
)
assert.equal(
  validateCareerPostingLinkFields({ buttonLabel: '채용 바로가기', linkUrl: 'http://example.test/apply' }),
  null,
)
assert.equal(
  validateCareerPostingLinkFields({ buttonLabel: '', linkUrl: 'example.test' }),
  CAREER_POSTING_LINK_URL_FORMAT_ALERT.content,
)
assert.equal(CAREER_POSTING_LINK_URL_FORMAT_ALERT.title, '등록 불가 안내')
assert.equal(
  validateCareerPostingLinkFields({ buttonLabel: '채용 바로가기', linkUrl: 'javascript:alert(1)' }),
  CAREER_POSTING_LINK_URL_FORMAT_ALERT.content,
)
assert.equal(
  validateCareerPostingLinkFields({ buttonLabel: '', linkUrl: 'ftp://example.test' }),
  CAREER_POSTING_LINK_URL_FORMAT_ALERT.content,
)
assert.equal(careerPostingLinkUrlFormatAlert(''), null)
assert.equal(careerPostingLinkUrlFormatAlert('https://jobs.example.test'), null)
assert.equal(careerPostingLinkUrlFormatAlert('example.test'), CAREER_POSTING_LINK_URL_FORMAT_ALERT)
assert.equal(careerPostingLinkUrlFormatAlert('http://'), CAREER_POSTING_LINK_URL_FORMAT_ALERT)
assert.equal(careerPostingLinkUrlFormatAlert('https://'), CAREER_POSTING_LINK_URL_FORMAT_ALERT)
assert.equal(
  validateCareerPostingLinkFields({ buttonLabel: '가나다', linkUrl: 'http://' }),
  CAREER_POSTING_LINK_URL_FORMAT_ALERT.content,
)
assert.equal(
  careerPostingMutationLinkFormatAlert(new Error('linkUrl invalid format')),
  CAREER_POSTING_LINK_URL_FORMAT_ALERT,
)
assert.equal(careerPostingMutationLinkFormatAlert(new Error('network timeout')), null)

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
assert.equal(careerPostingLinkButtonVisible({ buttonLabel: '', linkUrl: '' }), false)
assert.equal(careerPostingLinkButtonVisible({ buttonLabel: '지원하기', linkUrl: '' }), false)
assert.equal(
  careerPostingLinkButtonVisible({ buttonLabel: '', linkUrl: 'https://jobs.example.test' }),
  false,
)
assert.equal(
  careerPostingLinkButtonVisible({ buttonLabel: '지원하기', linkUrl: 'https://jobs.example.test' }),
  true,
)
assert.deepEqual(
  normalizeCareerPostingLinkFields({ buttonLabel: '  a  ', linkUrl: '  b  ' }),
  { buttonLabel: 'a', linkUrl: 'b' },
)

console.log('recruit-posting link-fields selfcheck: ok')
