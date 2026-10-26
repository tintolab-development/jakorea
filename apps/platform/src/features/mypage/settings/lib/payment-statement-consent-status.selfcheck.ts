import assert from 'node:assert/strict'
import {
  ensurePinnedPaymentStatementConsentItem,
  isPaymentStatementPreConsentSubmitted,
  pickPaymentStatementConsentDocumentId,
} from './payment-statement-consent-status.ts'
import type { SettingsConsentItem } from './consent-catalog.ts'

const unpaid: SettingsConsentItem = {
  id: 'paymentStatement',
  title: '지급조서 사전 동의서',
  required: false,
  kind: 'document',
  agreed: false,
}
const paid: SettingsConsentItem = { ...unpaid, agreed: true }

assert.equal(isPaymentStatementPreConsentSubmitted([]), false)
assert.equal(isPaymentStatementPreConsentSubmitted([unpaid]), false)
assert.equal(isPaymentStatementPreConsentSubmitted([paid]), true)
assert.equal(pickPaymentStatementConsentDocumentId([paid]), null)
assert.equal(pickPaymentStatementConsentDocumentId([{ ...paid, documentId: 42 }]), 42)
assert.equal(pickPaymentStatementConsentDocumentId([{ ...unpaid, documentId: 42 }]), null)
assert.equal(
  isPaymentStatementPreConsentSubmitted([
    { ...unpaid, id: 'educatorPledge', title: '교육진행자 서약서', agreed: true },
  ]),
  false,
)

const withoutPin = ensurePinnedPaymentStatementConsentItem([])
assert.equal(withoutPin.some(item => item.id === 'paymentStatement'), false)
assert.deepEqual(
  ensurePinnedPaymentStatementConsentItem([unpaid]).map(item => item.id),
  ['paymentStatement'],
)

console.log('payment-statement-consent-status.selfcheck: ok')
