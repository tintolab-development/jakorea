/**
 * Run:
 *   node --experimental-strip-types --experimental-transform-types \
 *     src/features/careers/lib/link-cta.selfcheck.ts
 */
import assert from 'node:assert/strict'
import {
  CAREER_POSTING_DEFAULT_BUTTON_LABEL,
  careerPostingLinkCtaVisible,
  careerPostingLinkHref,
  readCareerPostingLinkFields,
  resolveCareerPostingLinkCtaLabel,
} from './link-cta.ts'

assert.equal(CAREER_POSTING_DEFAULT_BUTTON_LABEL, '채용 공고 바로가기')
assert.equal(careerPostingLinkCtaVisible(''), false)
assert.equal(careerPostingLinkCtaVisible('   '), false)
assert.equal(careerPostingLinkCtaVisible('javascript:alert(1)'), false)
assert.equal(careerPostingLinkCtaVisible('https://jobs.example.test'), true)
assert.equal(careerPostingLinkCtaVisible('jobs.example.test'), true)
assert.equal(careerPostingLinkHref('https://jobs.example.test'), 'https://jobs.example.test')
assert.equal(careerPostingLinkHref('jobs.example.test'), 'https://jobs.example.test')
assert.equal(careerPostingLinkHref('/internal'), '/internal')
assert.equal(resolveCareerPostingLinkCtaLabel(''), CAREER_POSTING_DEFAULT_BUTTON_LABEL)
assert.equal(resolveCareerPostingLinkCtaLabel('  지원하기  '), '지원하기')
assert.deepEqual(readCareerPostingLinkFields({}), { buttonLabel: '', linkUrl: '' })
assert.deepEqual(
  readCareerPostingLinkFields({ buttonLabel: '  지원하기  ', linkUrl: ' https://jobs.example.test ' }),
  { buttonLabel: '지원하기', linkUrl: 'https://jobs.example.test' },
)

console.log('careers link-cta selfcheck: ok')
