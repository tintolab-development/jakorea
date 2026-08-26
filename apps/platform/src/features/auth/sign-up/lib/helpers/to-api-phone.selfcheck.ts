/**
 * 회원가입 API 전화번호 — 본인인증 숫자-only 값을 하이픈 형식으로 맞춘다.
 */
import assert from 'node:assert/strict'
import { toApiSignupPhone } from './to-api-phone.ts'

assert.equal(toApiSignupPhone('01012345678'), '010-1234-5678')
assert.equal(toApiSignupPhone('010-1234-5678'), '010-1234-5678')
assert.equal(toApiSignupPhone('010 1234 5678'), '010-1234-5678')
assert.equal(toApiSignupPhone('07012345678'), '070-1234-5678')
assert.equal(toApiSignupPhone('  '), undefined)
assert.equal(toApiSignupPhone(undefined), undefined)

console.log('to-api-phone.selfcheck: ok')
