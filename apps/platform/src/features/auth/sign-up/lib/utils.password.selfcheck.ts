import assert from 'node:assert/strict'
import { isValidMemberPassword } from './password-policy.ts'

assert.equal(isValidMemberPassword('Ab1!xxxx'), true)
assert.equal(isValidMemberPassword('Ab1!xxx'), false)

// 회원 8자 + 서버와 같은 특수문자 판정
assert.equal(isValidMemberPassword('Abcd123!'), true)
assert.equal(isValidMemberPassword('Abcd 123'), false, '공백만 특수문자로 쓰면 실패')
assert.equal(isValidMemberPassword('Abcd 123 '), false, '공백 여러 개도 특수문자가 아니다')
assert.equal(isValidMemberPassword('Ab cd123!'), true, '공백은 쓸 수 있다')
assert.equal(isValidMemberPassword('Abcd123\t'), false, '탭도 공백으로 본다')
assert.equal(isValidMemberPassword('Abcd123가'), true, 'ASCII 영문·숫자가 아닌 문자는 특수문자')

console.log('utils.password.selfcheck: ok')
