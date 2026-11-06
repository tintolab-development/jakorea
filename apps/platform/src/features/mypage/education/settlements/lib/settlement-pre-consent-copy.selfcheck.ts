import assert from 'node:assert/strict'
import { settlementPreConsentModalCopy } from './settlement-pre-consent-copy.ts'

const receipt = settlementPreConsentModalCopy('receipt')
assert.equal(receipt.title, '영수증 사전 동의서를 작성해 주세요.')
assert.equal(receipt.description.includes('영수증을 제출하려면'), true)
assert.equal(receipt.description.includes('10년간'), true)

const payment = settlementPreConsentModalCopy('payment_statement')
assert.equal(payment.title, '지급조서 사전 동의서를 작성해 주세요.')
assert.equal(payment.description.includes('지급조서를 제출하려면'), true)
assert.equal(payment.description.includes('영수증 사전'), false)

console.log('settlement-pre-consent-copy.selfcheck: ok')
