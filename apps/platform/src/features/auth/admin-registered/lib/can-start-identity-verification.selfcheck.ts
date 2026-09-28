import assert from 'node:assert/strict'
import { canStartAdminProvisionedIdentityVerification } from './can-start-identity-verification.ts'

assert.equal(
  canStartAdminProvisionedIdentityVerification({
    isConfirming: false,
    isRemote: true,
    hasBirthAndGender: false,
  }),
  true,
  'remote IDENTITY는 로그인 직후 wizard에 생년월일이 없어도 NICE를 시작한다',
)

assert.equal(
  canStartAdminProvisionedIdentityVerification({
    isConfirming: true,
    isRemote: true,
    hasBirthAndGender: true,
  }),
  false,
)

assert.equal(
  canStartAdminProvisionedIdentityVerification({
    isConfirming: false,
    isRemote: false,
    hasBirthAndGender: false,
  }),
  false,
)

assert.equal(
  canStartAdminProvisionedIdentityVerification({
    isConfirming: false,
    isRemote: false,
    hasBirthAndGender: true,
  }),
  true,
)

console.log('can-start-identity-verification.selfcheck: ok')
