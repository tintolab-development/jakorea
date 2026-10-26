import assert from 'node:assert/strict'
import {
  mapPaymentStatementBasicInfoToSettlementBasic,
  overlaySettlementBasicWithPaymentConsent,
} from './map-payment-statement-basic-info.ts'
import type { SettlementBasicInfo } from './map-payment-statement-basic-info.ts'

const empty: SettlementBasicInfo = {
  name: '',
  residentFront: '',
  residentBack: '',
  homeAddress: '',
  homeAddressDetail: '',
  bank: '',
  accountNumber: '',
  accountHolder: '',
}

assert.deepEqual(mapPaymentStatementBasicInfoToSettlementBasic(undefined), {})
assert.deepEqual(mapPaymentStatementBasicInfoToSettlementBasic({}), {})

const mapped = mapPaymentStatementBasicInfoToSettlementBasic({
  nameKo: ' 홍길동 ',
  nameEn: 'Hong',
  residentFront: '900101',
  residentBack: '1234567',
  addressRoad: '서울시 종로구',
  addressDetail: '101호',
  bankName: '국민은행',
  accountNumber: '1234567890',
  accountHolder: '홍길동',
})
assert.deepEqual(mapped, {
  name: '홍길동',
  residentFront: '900101',
  residentBack: '1234567',
  homeAddress: '서울시 종로구',
  homeAddressDetail: '101호',
  bank: '국민은행',
  accountNumber: '1234567890',
  accountHolder: '홍길동',
})

const holderFromName = mapPaymentStatementBasicInfoToSettlementBasic({
  nameKo: '김하나',
  accountHolder: '  ',
})
assert.equal(holderFromName.accountHolder, '김하나')

const filled = overlaySettlementBasicWithPaymentConsent(
  { ...empty, name: '기존이름', bank: '우리은행' },
  mapped,
)
assert.equal(filled.name, '기존이름')
assert.equal(filled.bank, '우리은행')
assert.equal(filled.residentFront, '900101')
assert.equal(filled.accountNumber, '1234567890')
assert.equal(filled.homeAddress, '서울시 종로구')

console.log('map-payment-statement-basic-info.selfcheck: ok')
