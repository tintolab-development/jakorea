import assert from 'node:assert/strict'
import {
  isReceiptPreConsentBasicInfoIncomplete,
  receiptPreConsentBasicInfoHasResidentNumberFields,
  RECEIPT_PRE_CONSENT_DEFAULT_PURPOSE,
  toReceiptPreConsentFilledBasicInfo,
} from '../../dist/consent/receipt-pre-consent-basic-info.js'

const payload = toReceiptPreConsentFilledBasicInfo({
  nameKo: '김참여자',
  residentFront: '900101',
  residentBack: '1234567',
  affiliation: '학교',
  bankName: '국민',
  accountNumber: '123',
  accountHolder: '김참여자',
  addressRoad: '서울',
  addressDetail: '101',
})

assert.equal(payload.paymentPurpose, RECEIPT_PRE_CONSENT_DEFAULT_PURPOSE)
assert.equal('residentFront' in payload, false)
assert.equal('residentBack' in payload, false)
assert.equal('affiliation' in payload, false)
assert.equal(receiptPreConsentBasicInfoHasResidentNumberFields(payload), false)
assert.equal(isReceiptPreConsentBasicInfoIncomplete(payload), false)
assert.equal(isReceiptPreConsentBasicInfoIncomplete({ nameKo: '김참여자' }), true)

console.log('receipt-pre-consent-basic-info.test: ok')
