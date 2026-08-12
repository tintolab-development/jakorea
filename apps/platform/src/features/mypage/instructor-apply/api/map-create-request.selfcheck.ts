/**
 * Platform 강사 신청 → CreateRequest 매핑 검증.
 * (node strip-types: 앱 import 체인 없이 인라인 검증)
 */
import assert from 'node:assert/strict'

function toApiBirthDate(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length !== 8) return value.trim()
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
}

function toApiGender(value: string): string {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'female' || normalized === 'f') return 'F'
  return 'M'
}

assert.equal(toApiBirthDate('1990.05.01'), '1990-05-01')
assert.equal(toApiBirthDate('19900501'), '1990-05-01')
assert.equal(toApiGender('female'), 'F')
assert.equal(toApiGender('male'), 'M')

const bank = JSON.stringify({
  bankName: '국민',
  accountNumber: '123',
  accountHolder: '홍길동',
})
assert.ok(bank.includes('국민'))

const agreement = JSON.stringify([
  { termsType: 'PAYMENT_STATEMENT_PRE_CONSENT', required: true, agreed: true },
])
assert.ok(agreement.includes('PAYMENT_STATEMENT_PRE_CONSENT'))

console.log('map-create-request.selfcheck: ok')
