/**
 * 회원가입 스텝퍼 번호 — 시안 단계(14세 이상·교사 8단계, 14세 미만 9단계)와 맞는지 확인한다.
 */
import assert from 'node:assert/strict'
import { resolveSignUpProgressStep } from './progress-step.ts'

const base = {
  isUnderAgeSignup: false,
  isIdentityVerified: false,
  isGuardianAgreementCompleted: false,
  isGuardianIdentityVerified: false,
}

// 14세 이상·교사: 본인인증 3 → 약관 동의 4 → 이메일 5 → … → 가입 정보 확인 8
assert.deepEqual(resolveSignUpProgressStep({ ...base, wizardStep: 1 }), { current: 1, total: 8 })
assert.deepEqual(resolveSignUpProgressStep({ ...base, wizardStep: 2 }), { current: 2, total: 8 })
assert.deepEqual(resolveSignUpProgressStep({ ...base, wizardStep: 3 }), { current: 3, total: 8 })
assert.deepEqual(
  resolveSignUpProgressStep({ ...base, wizardStep: 3, isIdentityVerified: true }),
  { current: 4, total: 8 },
)
assert.deepEqual(resolveSignUpProgressStep({ ...base, wizardStep: 4 }), { current: 5, total: 8 })
assert.deepEqual(resolveSignUpProgressStep({ ...base, wizardStep: 7 }), { current: 8, total: 8 })

// 14세 미만: 약관 동의 3 → 보호자 본인인증 4 → 보호자 정보 확인 5 → 이메일 6 → … → 가입 정보 확인 9
const minor = { ...base, isUnderAgeSignup: true }
assert.deepEqual(resolveSignUpProgressStep({ ...minor, wizardStep: 2 }), { current: 2, total: 9 })
assert.deepEqual(resolveSignUpProgressStep({ ...minor, wizardStep: 3 }), { current: 3, total: 9 })
assert.deepEqual(
  resolveSignUpProgressStep({ ...minor, wizardStep: 3, isGuardianAgreementCompleted: true }),
  { current: 4, total: 9 },
)
assert.deepEqual(
  resolveSignUpProgressStep({
    ...minor,
    wizardStep: 3,
    isGuardianAgreementCompleted: true,
    isGuardianIdentityVerified: true,
  }),
  { current: 5, total: 9 },
)
assert.deepEqual(resolveSignUpProgressStep({ ...minor, wizardStep: 4 }), { current: 6, total: 9 })
assert.deepEqual(resolveSignUpProgressStep({ ...minor, wizardStep: 7 }), { current: 9, total: 9 })

console.log('progress-step.selfcheck: ok')
