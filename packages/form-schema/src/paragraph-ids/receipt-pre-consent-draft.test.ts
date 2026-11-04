import assert from 'node:assert/strict'
import {
  createReceiptPreConsentDraft,
  receiptPreConsentDraftContainsResidentNumber,
  RECEIPT_PRE_CONSENT_IDS,
  RECEIPT_PRE_CONSENT_TEMPLATE_CODE,
} from '../../dist/paragraph-ids/receipt-pre-consent-draft.js'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '../../dist/paragraph-ids/payment-statement-pre-consent-draft.js'

const draft = createReceiptPreConsentDraft()
const ids = new Set(draft.paragraphs.map(paragraph => paragraph.id))

assert.equal(RECEIPT_PRE_CONSENT_TEMPLATE_CODE, 'agreement-receipt-pre-consent')
assert.equal(draft.paragraphs[0]?.kind === 'description' && draft.paragraphs[0].variant === 'survey_title_with_period'
  ? draft.paragraphs[0].surveyTitle
  : '', '영수증 발급 사전 동의서')
assert.equal(ids.has(RECEIPT_PRE_CONSENT_IDS.p1Collection), true)
assert.equal(ids.has(RECEIPT_PRE_CONSENT_IDS.p2ThirdParty), true)
assert.equal(ids.has(RECEIPT_PRE_CONSENT_IDS.paymentRecord), true)
assert.equal(ids.has(PAYMENT_STATEMENT_PRE_CONSENT_IDS.p2RrnCollection), false)
assert.equal(ids.has(PAYMENT_STATEMENT_PRE_CONSENT_IDS.p4RrnThirdParty), false)
assert.equal(receiptPreConsentDraftContainsResidentNumber(draft), false)

const paymentRecord = draft.paragraphs.find(p => p.id === RECEIPT_PRE_CONSENT_IDS.paymentRecord)
assert.equal(
  paymentRecord && 'paragraphTitle' in paymentRecord ? paymentRecord.paragraphTitle : '',
  '지급 확인 정보',
)

const thirdParty = JSON.stringify(
  draft.paragraphs.find(p => p.id === RECEIPT_PRE_CONSENT_IDS.p2ThirdParty)
)
assert.equal(thirdParty.includes('원천세'), false)
assert.equal(thirdParty.includes('국세청'), false)

console.log('receipt-pre-consent-draft.test: ok')
