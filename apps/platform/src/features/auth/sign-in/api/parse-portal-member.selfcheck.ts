import assert from 'node:assert/strict'
import { parsePortalProfileResponse } from './parse-portal-member.ts'

const parsed = parsePortalProfileResponse({
  memberId: 190104,
  email: 'minor@test.com',
  name: '신영서',
  phone: null,
  birthDate: '2020-08-08',
  gender: 'F',
  memberType: 'GENERAL',
  teacher: false,
  instructor: false,
  under14: true,
  ageGroup: 'UNDER_14',
  guardian: {
    guardianName: '최지원',
    guardianRelation: 'ㄷ',
    guardianPhone: '01033275124',
  },
})

assert.equal(parsed.guardian?.guardianName, '최지원')
assert.equal(parsed.guardian?.guardianRelation, 'ㄷ')
assert.equal(parsed.guardian?.guardianPhone, '01033275124')
assert.equal(parsed.under14, true)

assert.equal(
  parsePortalProfileResponse({ name: '성인', guardian: null }).guardian,
  undefined,
)
assert.equal(parsePortalProfileResponse({ name: '성인', guardian: {} }).guardian, undefined)

console.log('parse-portal-member.selfcheck: ok')
