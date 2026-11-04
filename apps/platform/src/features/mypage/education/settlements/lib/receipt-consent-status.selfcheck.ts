import assert from 'node:assert/strict'
import {
  isReceiptPreConsentSubmitted,
  pickReceiptPreConsentDocumentId,
} from './receipt-consent-status.ts'

assert.equal(
  isReceiptPreConsentSubmitted([
    { id: 'paymentStatement', title: '지급조서 사전 동의서', required: false, kind: 'document', agreed: true },
  ]),
  false,
)
assert.equal(
  isReceiptPreConsentSubmitted([
    { id: 'receiptPreConsent', title: '영수증 발급 사전 동의서', required: false, kind: 'document', agreed: true, documentId: 42 },
  ]),
  true,
)
assert.equal(
  pickReceiptPreConsentDocumentId([
    { id: 'paymentStatement', title: '지급조서', required: false, kind: 'document', agreed: true, documentId: 7 },
    { id: 'receiptPreConsent', title: '영수증', required: false, kind: 'document', agreed: true, documentId: 42 },
  ]),
  42,
)

console.log('receipt-consent-status.selfcheck: ok')
