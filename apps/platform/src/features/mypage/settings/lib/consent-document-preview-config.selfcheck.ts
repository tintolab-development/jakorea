import assert from 'node:assert/strict'
import {
  resolveConsentDocumentA4Title,
  resolveConsentDocumentPreviewConfig,
  stripAgreementExpenseAuthoringTitleSuffix,
} from './consent-document-preview-config.ts'

const payment = resolveConsentDocumentPreviewConfig('paymentStatement')
assert.ok(payment)
assert.deepEqual(
  [...payment.pageBreakBeforeParagraphIds],
  ['payment-statement-pre-consent-seed-payment-record'],
)
assert.equal(
  payment.pageBreakBeforeParagraphIds.has('payment-statement-pre-consent-seed-mid-consent-line'),
  false,
)
assert.equal(payment.bodyVariant, 'payment')
assert.equal(resolveConsentDocumentPreviewConfig('educatorPledge')?.bodyVariant, 'expense')
assert.equal(resolveConsentDocumentPreviewConfig('administrativeJoint')?.bodyVariant, 'notice')
assert.equal(resolveConsentDocumentPreviewConfig('portrait')?.bodyVariant, 'portrait')
assert.equal(
  stripAgreementExpenseAuthoringTitleSuffix('JA Korea 교육진행자 서약서(안)'),
  'JA Korea 교육진행자 서약서',
)
assert.equal(
  resolveConsentDocumentA4Title('agreement-expense', '교육진행자 서약서(안)'),
  '교육진행자 서약서',
)
assert.equal(
  resolveConsentDocumentA4Title('agreement-notice', '행정정보 공동이용 사전동의서'),
  '행정정보 공동이용 사전동의서',
)

console.log('consent-document-preview-config.selfcheck: ok')
