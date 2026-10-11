import assert from 'node:assert/strict'
import { shouldShowDocumentPassBanner } from './document-pass-banner.ts'

assert.equal(
  shouldShowDocumentPassBanner({
    displayStatus: 'document_passed',
    hasInterview: true,
  }),
  true
)

assert.equal(
  shouldShowDocumentPassBanner({
    displayStatus: 'document_passed',
    hasInterview: false,
  }),
  false
)

assert.equal(
  shouldShowDocumentPassBanner({
    displayStatus: 'waiting_result',
    hasInterview: true,
    interviewAtLabel: '2026년 04월 12일(일), 14시',
  }),
  false
)

console.log('document-pass-banner.selfcheck: ok')
