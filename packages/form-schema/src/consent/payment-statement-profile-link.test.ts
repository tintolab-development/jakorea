import assert from 'node:assert/strict'
import {
  buildPaymentStatementProfileLinkedValues,
  overlayPaymentStatementProfileLinkedValues,
} from '../../dist/consent/payment-statement-basic-info.js'

const profile = buildPaymentStatementProfileLinkedValues({
  name: '홍길동',
  memberType: 'general',
  affiliationName: 'JA Korea',
  homeAddress: '서울특별시 강남구',
  homeAddressDetail: '101호',
})

assert.deepEqual(profile, {
  nameKo: '홍길동',
  affiliation: 'JA Korea',
  noAffiliation: false,
  addressRoad: '서울특별시 강남구',
  addressDetail: '101호',
})

const overlaid = overlayPaymentStatementProfileLinkedValues(
  {
    nameKo: '',
    nameEn: 'Hong',
    residentFront: '900101',
    residentBack: '1234567',
    affiliation: '',
    noAffiliation: false,
    addressRoad: '',
    addressDetail: '',
    bankName: '신한',
    accountNumber: '9999',
    accountHolder: '예금주',
    paymentPurpose: '강사비 또는 활동비 지급',
  },
  profile
)

assert.equal(overlaid.nameKo, '홍길동')
assert.equal(overlaid.nameEn, 'Hong')
assert.equal(overlaid.residentFront, '900101')
assert.equal(overlaid.affiliation, 'JA Korea')
assert.equal(overlaid.bankName, '신한')
assert.equal(overlaid.accountNumber, '9999')

console.log('payment-statement-profile-link.test: ok')
