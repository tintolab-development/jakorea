import assert from 'node:assert/strict'
import { overlayReceiptLockedMemberValues } from './overlay-receipt-locked-member.ts'

const general = overlayReceiptLockedMemberValues(
  {
    nameKo: '입력값',
    nameEn: 'Choi',
    addressRoad: '다른 주소',
    addressDetail: '2층',
    bankName: '국민',
    accountNumber: '123',
    accountHolder: '최수아',
  },
  {
    nameKo: '최수아',
    addressRoad: '서울시 종로구',
    addressDetail: '1',
    lockAddress: true,
  },
)

assert.equal(general.nameKo, '최수아')
assert.equal(general.addressRoad, '서울시 종로구')
assert.equal(general.addressDetail, '1')
assert.equal(general.nameEn, 'Choi')
assert.equal(general.bankName, '국민')
assert.equal(general.accountNumber, '123')
assert.equal('residentFront' in general, false)

const teacher = overlayReceiptLockedMemberValues(
  {
    nameKo: '입력값',
    addressRoad: '입력 주소',
    addressDetail: '3층',
    bankName: '신한',
  },
  {
    nameKo: '최수아',
    addressRoad: '',
    addressDetail: '',
    lockAddress: false,
  },
)

assert.equal(teacher.nameKo, '최수아')
assert.equal(teacher.addressRoad, '입력 주소')
assert.equal(teacher.addressDetail, '3층')
assert.equal(teacher.bankName, '신한')

console.log('overlay-receipt-locked-member.selfcheck: ok')
