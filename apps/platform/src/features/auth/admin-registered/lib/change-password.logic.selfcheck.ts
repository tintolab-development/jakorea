import assert from 'node:assert/strict'
import { validateAdminRegisteredChangePassword } from './change-password.logic.ts'
import { MEMBER_PASSWORD_HELP_TEXT } from '../../sign-up/lib/password-policy.ts'

// 관리자 등록 회원 최초 비밀번호 변경 — 회원 기준 8자 (QA 11/14 「12자 → 8자」)
const base = {
  currentPassword: 'old@example.com',
  initialPassword: 'old@example.com',
}

const run = (newPassword: string) =>
  validateAdminRegisteredChangePassword({ ...base, newPassword, confirmPassword: newPassword })

assert.equal(run('Abcd123!'), null, '8자 통과')
assert.deepEqual(run('Abc123!'), { field: 'new', message: MEMBER_PASSWORD_HELP_TEXT }, '7자 실패')
assert.deepEqual(
  run('Abcd 123'),
  { field: 'new', message: MEMBER_PASSWORD_HELP_TEXT },
  '공백만 특수문자로 쓰면 실패',
)
assert.equal(MEMBER_PASSWORD_HELP_TEXT.includes('8자'), true)

console.log('change-password.logic.selfcheck: ok')
