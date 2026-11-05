import assert from 'node:assert/strict'
import type { PortalProfileResponse } from '@/features/auth/sign-in'
import {
  composeSettlementWriteBasic,
  readSettlementMemberProfileBasic,
} from './map-payment-statement-basic-info.ts'

const portalProfile: PortalProfileResponse = {
  name: '홍길동',
  address: '서울시 종로구',
  addressDetail: '101호',
  instructorProfile: {
    profile: {
      memberType: 'GENERAL',
      affiliation: { organizationNames: [] },
      homeAddress: { line: '강남대로 1', detail: '10층' },
      education: { detailKeys: [] },
      career: { level: 'new', rows: [] },
      jaKoreaActivities: [],
      licenses: [],
      awards: [],
      essays: {},
    },
    settlement: {
      businessIncome: true,
      bankName: '국민은행',
      accountNumber: '1111',
      accountHolder: '홍길동',
    },
  },
}

const member = readSettlementMemberProfileBasic(portalProfile)

assert.equal(member.name, '홍길동')
assert.equal(member.homeAddress, '강남대로 1')
assert.equal(member.homeAddressDetail, '10층')
assert.equal(member.bank, '국민은행')
assert.equal(member.accountNumber, '1111')
assert.equal(member.accountHolder, '홍길동')

const receipt = composeSettlementWriteBasic({
  kind: 'receipt',
  member,
  consent: {
    nameKo: '동의서명',
    nameEn: 'Hong',
    residentFront: '900101',
    residentBack: '1234567',
    addressRoad: '동의서주소',
    addressDetail: '동의상세',
    bankName: '신한은행',
    accountNumber: '9999',
    accountHolder: '예금주',
  },
})

assert.equal(receipt.name, '홍길동')
assert.equal(receipt.homeAddress, '강남대로 1')
assert.equal(receipt.nameEn, 'Hong')
assert.equal(receipt.residentFront, '')
assert.equal(receipt.residentBack, '')
assert.equal(receipt.bank, '신한은행')
assert.equal(receipt.accountNumber, '9999')
assert.equal(receipt.accountHolder, '예금주')

const instructor = composeSettlementWriteBasic({
  kind: 'payment_statement',
  member,
  consent: {
    nameKo: '동의서명',
    nameEn: 'Hong',
    residentFront: '900101',
    residentBack: '1234567',
    addressRoad: '동의서주소',
    bankName: '신한은행',
    accountNumber: '9999',
    accountHolder: '예금주',
  },
})

assert.equal(instructor.name, '홍길동')
assert.equal(instructor.nameEn, 'Hong')
assert.equal(instructor.residentFront, '900101')
assert.equal(instructor.homeAddress, '강남대로 1')
assert.equal(instructor.bank, '신한은행')
assert.equal(instructor.accountNumber, '9999')
assert.equal(instructor.accountHolder, '예금주')

console.log('map-payment-statement-basic-info.selfcheck: ok')
