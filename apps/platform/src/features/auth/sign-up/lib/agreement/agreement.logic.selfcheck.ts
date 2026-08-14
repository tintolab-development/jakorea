/**
 * Platform 가입 약관 — 필수/전체 동의 boolean 판정 검증.
 */
import assert from 'node:assert/strict'

type AgreementState = {
  service: boolean
  privacy: boolean
  marketing: boolean
  portrait: boolean
}

const items = [
  { key: 'service' as const, required: true },
  { key: 'privacy' as const, required: true },
  { key: 'marketing' as const, required: false },
  { key: 'portrait' as const, required: false },
]

function isRequiredAgreed(agreements: AgreementState) {
  return items.filter(item => item.required).every(item => agreements[item.key])
}

function isAllAgreed(agreements: AgreementState) {
  return items.every(item => agreements[item.key])
}

const initial: AgreementState = {
  service: false,
  privacy: false,
  marketing: false,
  portrait: false,
}

assert.equal(isRequiredAgreed(initial), false)
assert.equal(isAllAgreed(initial), false)

const requiredOnly: AgreementState = {
  ...initial,
  service: true,
  privacy: true,
}
assert.equal(isRequiredAgreed(requiredOnly), true)
assert.equal(isAllAgreed(requiredOnly), false)

const allAgreed: AgreementState = {
  service: true,
  privacy: true,
  marketing: true,
  portrait: true,
}
assert.equal(isRequiredAgreed(allAgreed), true)
assert.equal(isAllAgreed(allAgreed), true)

console.log('agreement.logic.selfcheck: ok')
