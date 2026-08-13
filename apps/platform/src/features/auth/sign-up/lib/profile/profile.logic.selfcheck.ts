/**
 * Platform 프로필 주소 — 사람 상세주소 필수 검증.
 */
import assert from 'node:assert/strict'
import { isRequiredAddressIncomplete } from '@jakorea/domain/shared/required-address'
import { isProfileStepValid } from './profile.logic.ts'

assert.equal(
  isRequiredAddressIncomplete({
    address: '서울시',
    addressDetail: '',
    subject: 'person',
  }),
  true,
)

assert.equal(isProfileStepValid('서울시', '', 'none', '', ''), false)
assert.equal(isProfileStepValid('서울시', '101호', 'none', '', ''), true)
assert.equal(isProfileStepValid('서울시', '101호', 'enrolled', '', '1학년'), false)
assert.equal(isProfileStepValid('서울시', '101호', 'enrolled', '○○고', '1학년'), true)

console.log('profile.logic.selfcheck: ok')
