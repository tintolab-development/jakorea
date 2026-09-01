/**
 * PATCH /api/portal/me/profile 매핑 — OpenAPI 허용 필드만 · 빈 external1365Id 유지
 */
import assert from 'node:assert/strict'
import { mapAdminRegisteredEditToPortalProfileUpdate } from './map-profile-update.ts'

const enrolledWithPk = mapAdminRegisteredEditToPortalProfileUpdate({
  schoolStatus: 'enrolled',
  schoolName: '고양관산초등학교',
  grade: '3학년',
  address: '서울특별시 마포구 독막로 95-27',
  addressDetail: '9877',
  postalCode: '04068',
  regionSido: '서울특별시',
  regionSigungu: '마포구',
  volunteerId: '',
  schoolOrganizationId: 6,
  portalProfile: {
    teacherEmploymentStatus: 'ACTIVE',
  },
})

assert.equal(enrolledWithPk.schoolEnrollmentStatus, 'ENROLLED')
assert.equal(enrolledWithPk.affiliationName, '고양관산초등학교')
assert.equal(enrolledWithPk.schoolName, '고양관산초등학교')
assert.equal(enrolledWithPk.grade, '3학년')
assert.equal(enrolledWithPk.external1365Id, '')
assert.equal(enrolledWithPk.schoolOrganizationId, 6)
assert.equal(enrolledWithPk.schoolSelection, undefined)
assert.equal('email' in enrolledWithPk, false)
assert.equal('name' in enrolledWithPk, false)
assert.equal('phone' in enrolledWithPk, false)
assert.equal('memberId' in enrolledWithPk, false)

const enrolledNeisOnly = mapAdminRegisteredEditToPortalProfileUpdate({
  schoolStatus: 'enrolled',
  schoolName: '서울중학교',
  grade: '2학년',
  address: '서울',
  addressDetail: '1',
  volunteerId: '',
  schoolOrganizationId: null,
  schoolAddress: '서울특별시 강남구',
  schoolNeisCode: 'B100000658',
})

assert.equal(enrolledNeisOnly.schoolOrganizationId, undefined)
assert.equal(enrolledNeisOnly.schoolSelection?.provider, 'NEIS')
assert.equal(enrolledNeisOnly.schoolSelection?.externalSchoolCode, 'B100000658')
assert.equal(enrolledNeisOnly.schoolSelection?.name, '서울중학교')

const with1365 = mapAdminRegisteredEditToPortalProfileUpdate({
  schoolStatus: 'none',
  schoolName: '',
  grade: '',
  address: '서울',
  addressDetail: '1',
  volunteerId: 'vol-1',
})
assert.equal(with1365.external1365Id, 'vol-1')
assert.equal(with1365.schoolEnrollmentStatus, 'NOT_ENROLLED')
assert.equal(with1365.schoolName, '')
assert.equal(with1365.schoolOrganizationId, null)

console.log('map-profile-update.selfcheck: ok')
