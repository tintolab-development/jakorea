/**
 * Platform 가입 약관 — 필수/전체 동의 boolean 판정 검증.
 */
import assert from 'node:assert/strict'

type AgreementState = {
  service: boolean
  privacy: boolean
  teacherInfo: boolean
  marketing: boolean
  portrait: boolean
}

const generalItems = [
  { key: 'service' as const, required: true },
  { key: 'privacy' as const, required: true },
  { key: 'marketing' as const, required: false },
  { key: 'portrait' as const, required: false },
]

const teacherItems = [
  { key: 'service' as const, required: true },
  { key: 'privacy' as const, required: true },
  { key: 'teacherInfo' as const, required: true },
  { key: 'marketing' as const, required: false },
  { key: 'portrait' as const, required: false },
]

function isRequiredAgreed(
  agreements: AgreementState,
  items: { key: keyof AgreementState; required: boolean }[],
) {
  return items.filter(item => item.required).every(item => agreements[item.key])
}

function isAllAgreed(agreements: AgreementState, items: { key: keyof AgreementState }[]) {
  return items.every(item => agreements[item.key])
}

const initial: AgreementState = {
  service: false,
  privacy: false,
  teacherInfo: false,
  marketing: false,
  portrait: false,
}

assert.equal(isRequiredAgreed(initial, generalItems), false)
assert.equal(isAllAgreed(initial, generalItems), false)
assert.equal(isRequiredAgreed(initial, teacherItems), false)

const requiredOnlyGeneral: AgreementState = {
  ...initial,
  service: true,
  privacy: true,
}
assert.equal(isRequiredAgreed(requiredOnlyGeneral, generalItems), true)
assert.equal(isAllAgreed(requiredOnlyGeneral, generalItems), false)
assert.equal(
  isRequiredAgreed(requiredOnlyGeneral, teacherItems),
  false,
  '교사회원은 학교/기관 정보 동의도 필수',
)

const requiredOnlyTeacher: AgreementState = {
  ...requiredOnlyGeneral,
  teacherInfo: true,
}
assert.equal(isRequiredAgreed(requiredOnlyTeacher, teacherItems), true)
assert.equal(isAllAgreed(requiredOnlyTeacher, teacherItems), false)

const allAgreed: AgreementState = {
  service: true,
  privacy: true,
  teacherInfo: true,
  marketing: true,
  portrait: true,
}
assert.equal(isRequiredAgreed(allAgreed, generalItems), true)
assert.equal(isAllAgreed(allAgreed, generalItems), true)
assert.equal(isRequiredAgreed(allAgreed, teacherItems), true)
assert.equal(isAllAgreed(allAgreed, teacherItems), true)

console.log('agreement.logic.selfcheck: ok')
