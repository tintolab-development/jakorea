import assert from 'node:assert/strict'
import { buildConsentItemsFromSummaries } from '../../../settings/lib/map-consents.ts'
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
  false,
)
assert.equal(
  isReceiptPreConsentSubmitted([
    {
      id: 'receiptPreConsent',
      title: '영수증 발급 사전 동의서',
      required: false,
      kind: 'document',
      agreed: true,
      signed: true,
      documentId: 42,
    },
  ]),
  true,
)
assert.equal(
  pickReceiptPreConsentDocumentId([
    { id: 'paymentStatement', title: '지급조서', required: false, kind: 'document', agreed: true, signed: true, documentId: 7 },
    { id: 'receiptPreConsent', title: '영수증', required: false, kind: 'document', agreed: true, signed: true, documentId: 42 },
  ]),
  42,
)

const mapped = buildConsentItemsFromSummaries([
  {
    consentType: 'AGREEMENT_RECEIPT_PRE_CONSENT',
    agreed: true,
    signed: true,
    listed: false,
    documentId: 55,
  },
  { consentType: 'PAYMENT_STATEMENT_CONSENT', agreed: true, signed: true, listed: true, documentId: 9 },
  { consentType: 'PORTRAIT_RIGHTS', agreed: true, listed: null },
])
assert.equal(mapped.documentItems.find(item => item.id === 'receiptPreConsent')?.listed, false)
assert.equal(mapped.documentItems.find(item => item.id === 'paymentStatement')?.listed, true)
assert.equal(mapped.basicItems.find(item => item.id === 'portrait')?.listed, undefined)
assert.equal(isReceiptPreConsentSubmitted(mapped.documentItems), true)

console.log('receipt-consent-status.selfcheck: ok')
