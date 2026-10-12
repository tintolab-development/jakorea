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
assert.equal(enrolledNeisOnly.schoolSelection?.educationOfficeCode, 'B10')
assert.equal(enrolledNeisOnly.schoolSelection?.name, '서울중학교')

const enrolledNeisClearsSnapshotPk = mapAdminRegisteredEditToPortalProfileUpdate({
  schoolStatus: 'enrolled',
  schoolName: '서울중학교',
  grade: '2학년',
  address: '서울',
  addressDetail: '1',
  volunteerId: '',
  schoolOrganizationId: null,
  schoolAddress: '서울특별시 강남구',
  schoolNeisCode: 'B100000658',
  portalProfile: {
    schoolOrganizationId: 190108,
    schoolName: '경기초등학교',
  },
})
assert.equal(enrolledNeisClearsSnapshotPk.schoolOrganizationId, undefined)
assert.equal(enrolledNeisClearsSnapshotPk.schoolSelection?.externalSchoolCode, 'B100000658')

const teacherNeisNumericCode = mapAdminRegisteredEditToPortalProfileUpdate({
  schoolStatus: 'enrolled',
  schoolName: '심원초등학교',
  grade: '',
  address: '경기',
  addressDetail: '1',
  volunteerId: '',
  schoolOrganizationId: null,
  schoolAddress: '경기도 부천시 옥산로 66',
  schoolNeisCode: '7581089',
  schoolEducationOfficeCode: 'B10',
})

assert.equal(teacherNeisNumericCode.schoolSelection?.educationOfficeCode, 'B10')
assert.equal(teacherNeisNumericCode.schoolSelection?.externalSchoolCode, '7581089')

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
assert.equal(with1365.affiliationName, '')
assert.equal(with1365.schoolOrganizationId, null)

const withAffiliation = mapAdminRegisteredEditToPortalProfileUpdate({
  schoolStatus: 'none',
  schoolName: '',
  affiliationName: '지역아동센터',
  grade: '',
  address: '서울',
  addressDetail: '1',
  volunteerId: '',
})
assert.equal(withAffiliation.affiliationName, '지역아동센터')
assert.equal(withAffiliation.schoolName, '')
assert.equal(withAffiliation.grade, '')

/** 재학 중 → 해당 없음 + 소속 기관명 미입력: 잔여 NEIS 메타가 있어도 ENROLLED/schoolSelection 금지 */
const noneWithLeftoverNeis = mapAdminRegisteredEditToPortalProfileUpdate({
  schoolStatus: 'none',
  schoolName: '심원초등학교',
  grade: '5학년',
  affiliationName: '',
  address: '서울특별시 마포구 독막로 65-1 (상수동)',
  addressDetail: '32206',
  postalCode: '04049',
  regionSido: '서울특별시',
  regionSigungu: '마포구',
  volunteerId: '123414',
  schoolOrganizationId: null,
  schoolAddress: '경기도 부천시 옥산로 66',
  schoolNeisCode: '7581089',
  schoolEducationOfficeCode: 'J10',
  schoolSource: 'neis',
  portalProfile: {
    schoolOrganizationId: 190108,
    schoolName: '심원초등학교',
    schoolEnrollmentStatus: 'ENROLLED',
  },
})
assert.equal(noneWithLeftoverNeis.schoolEnrollmentStatus, 'NOT_ENROLLED')
assert.equal(noneWithLeftoverNeis.schoolOrganizationId, null)
assert.equal(noneWithLeftoverNeis.schoolName, '')
assert.equal(noneWithLeftoverNeis.grade, '')
assert.equal(noneWithLeftoverNeis.affiliationName, '')
assert.equal(noneWithLeftoverNeis.schoolSelection, undefined)
assert.equal(noneWithLeftoverNeis.external1365Id, '123414')

console.log('map-profile-update.selfcheck: ok')
