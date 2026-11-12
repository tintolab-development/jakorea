import assert from 'node:assert/strict'
import { isValidMemberPassword, isValidPassword } from './password-policy.ts'

assert.equal(isValidMemberPassword('Ab1!xxxx'), true)
assert.equal(isValidMemberPassword('Ab1!xxx'), false)
assert.equal(isValidPassword('Ab1!xxxx'), false)
assert.equal(isValidPassword('Abcdefghij1!'), true)

console.log('utils.password.selfcheck: ok')
