/**
 * Run:
 *   node --experimental-strip-types --experimental-transform-types \
 *     src/features/careers/lib/link-cta.selfcheck.ts
 */
import assert from 'node:assert/strict'
import {
  careerPostingLinkCtaVisible,
  careerPostingLinkHref,
  readCareerPostingLinkFields,
} from './link-cta.ts'

// 버튼명을 입력한 공고에만 노출 — 링크만 있으면 버튼 없음
assert.equal(careerPostingLinkCtaVisible({ buttonLabel: '', linkUrl: '' }), false)
assert.equal(careerPostingLinkCtaVisible({ buttonLabel: '', linkUrl: 'https://jobs.example.test' }), false)
assert.equal(careerPostingLinkCtaVisible({ buttonLabel: '   ', linkUrl: 'https://jobs.example.test' }), false)
assert.equal(careerPostingLinkCtaVisible({ buttonLabel: '지원하기', linkUrl: '' }), false)
assert.equal(careerPostingLinkCtaVisible({ buttonLabel: '지원하기', linkUrl: 'javascript:alert(1)' }), false)
assert.equal(careerPostingLinkCtaVisible({ buttonLabel: '지원하기', linkUrl: 'https://jobs.example.test' }), true)
assert.equal(careerPostingLinkCtaVisible({ buttonLabel: '지원하기', linkUrl: 'jobs.example.test' }), true)
assert.equal(careerPostingLinkHref('https://jobs.example.test'), 'https://jobs.example.test')
assert.equal(careerPostingLinkHref('jobs.example.test'), 'https://jobs.example.test')
assert.equal(careerPostingLinkHref('/internal'), '/internal')
assert.deepEqual(readCareerPostingLinkFields({}), { buttonLabel: '', linkUrl: '' })
assert.deepEqual(
  readCareerPostingLinkFields({ buttonLabel: '  지원하기  ', linkUrl: ' https://jobs.example.test ' }),
  { buttonLabel: '지원하기', linkUrl: 'https://jobs.example.test' },
)

console.log('careers link-cta selfcheck: ok')
