/**
 * PATCH /api/portal/me/profile 매핑 — GET 필드 echo · 빈 external1365Id 유지
 */
import assert from 'node:assert/strict'
import { mapAdminRegisteredEditToPortalProfileUpdate } from './map-profile-update.ts'

const enrolled = mapAdminRegisteredEditToPortalProfileUpdate({
  schoolStatus: 'enrolled',
  schoolName: '고양관산초등학교',
  grade: '3학년',
  address: '서울특별시 마포구 독막로 95-27',
  addressDetail: '9877',
  postalCode: '04068',
  regionSido: '서울특별시',
  regionSigungu: '마포구',
  volunteerId: '',
  email: 'ilban@test.com',
  name: '홍길동',
  phone: '01012345678',
  birthDate: '1990.05.01',
  gender: 'female',
  memberType: 'general',
  portalProfile: {
    memberId: 12,
    email: 'ilban@test.com',
    name: '홍길동',
    phone: '01012345678',
    birthDate: '1990-05-01',
    gender: 'F',
    memberType: 'GENERAL',
    teacher: false,
    instructor: false,
    schoolOrganizationId: 6,
    accountStatus: 'ACTIVE',
    joinedAt: '2026-01-01T00:00:00Z',
  },
})

assert.equal(enrolled.schoolEnrollmentStatus, 'ENROLLED')
assert.equal(enrolled.affiliationName, '고양관산초등학교')
assert.equal(enrolled.schoolName, '고양관산초등학교')
assert.equal(enrolled.grade, '3학년')
assert.equal(enrolled.external1365Id, '')
assert.equal(enrolled.name, '홍길동')
assert.equal(enrolled.phone, '01012345678')
assert.equal(enrolled.email, 'ilban@test.com')
assert.equal(enrolled.birthDate, '1990-05-01')
assert.equal(enrolled.gender, 'F')
assert.equal(enrolled.memberType, 'GENERAL')
assert.equal(enrolled.teacher, false)
assert.equal(enrolled.memberId, 12)
assert.equal(enrolled.schoolOrganizationId, 6)

const with1365 = mapAdminRegisteredEditToPortalProfileUpdate({
  schoolStatus: 'none',
  schoolName: '',
  grade: '',
  address: '서울',
  addressDetail: '1',
  volunteerId: 'vol-1',
  name: '김교사',
  phone: '01000000000',
})
assert.equal(with1365.external1365Id, 'vol-1')
assert.equal(with1365.schoolEnrollmentStatus, 'NOT_ENROLLED')
assert.equal(with1365.schoolName, '')
assert.equal(with1365.name, '김교사')

console.log('map-profile-update.selfcheck: ok')
