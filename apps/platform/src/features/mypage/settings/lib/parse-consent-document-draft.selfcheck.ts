import assert from 'node:assert/strict'
import { readPaymentBasicInfoFromConsentDetail } from './parse-consent-document-draft.ts'

const sidecar = readPaymentBasicInfoFromConsentDetail({
  filledDocument: {
    templateCode: 'agreement-third-party',
    paymentBasicInfo: {
      nameEn: 'Hong',
      bankName: '신한은행',
      accountNumber: '110123',
      accountHolder: '홍길동',
    },
  },
})
assert.equal(sidecar?.bankName, '신한은행')
assert.equal(sidecar?.accountNumber, '110123')
assert.equal(sidecar?.nameEn, 'Hong')

const nested = readPaymentBasicInfoFromConsentDetail({
  filledDocument: {
    paymentStatementBasicInfo: {
      bankName: '국민',
      accountNumber: '999',
      accountHolder: '예금주',
    },
  } as never,
})
assert.equal(nested?.bankName, '국민')
assert.equal(nested?.accountNumber, '999')

console.log('parse-consent-document-draft.selfcheck: ok')
