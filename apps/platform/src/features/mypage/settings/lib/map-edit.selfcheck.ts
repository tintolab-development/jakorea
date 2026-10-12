import assert from 'node:assert/strict'
import { MOCK_SETTINGS_PROFILE, MOCK_TEACHER_SETTINGS_PROFILE } from './constants.ts'
import {
  applySettingsEditToSnapshot,
  applyTeacherSettingsEditToSnapshot,
  isSettingsEditValid,
  isTeacherSettingsEditValid,
  mapProfileToSettingsEditForm,
  mapProfileToTeacherSettingsEditForm,
  nullifyEmptyProfileUpdateFields,
  sanitizeSettingsEditSchoolFields,
  toSettingsGender,
  toSettingsGradeOption,
  toSettingsSchoolStatus,
  toTeacherEmploymentStatus,
} from './map-edit.ts'

assert.equal(toSettingsSchoolStatus('ENROLLED'), 'enrolled')
assert.equal(toSettingsSchoolStatus('NOT_ENROLLED'), 'none')
assert.equal(toSettingsGender('M'), 'male')
assert.equal(toSettingsGradeOption('2'), '2학년')

const initial = mapProfileToSettingsEditForm(MOCK_SETTINGS_PROFILE)
assert.equal(initial.schoolStatus, 'enrolled')
assert.equal(initial.schoolName, '재희 고등학교')
assert.equal(initial.grade, '2학년')
assert.equal(initial.addressDetail, '9층 901호')
assert.equal(isSettingsEditValid(initial), true)

const missingGrade = { ...initial, grade: '' }
assert.equal(isSettingsEditValid(missingGrade), false)

const saved = applySettingsEditToSnapshot(MOCK_SETTINGS_PROFILE, {
  ...initial,
  schoolStatus: 'none',
  schoolName: '',
  affiliationName: '',
  grade: '',
  volunteerId: 'vol-1',
})
assert.equal(saved.schoolEnrollmentStatus, 'NOT_ENROLLED')
assert.equal(saved.schoolName, '')
assert.equal(saved.affiliationName, '')
assert.equal(saved.external1365Id, 'vol-1')

const notEnrolledInitial = mapProfileToSettingsEditForm({
  schoolEnrollmentStatus: 'NOT_ENROLLED',
  affiliationName: '지역아동센터',
  address: '서울특별시 마포구 독막로 95-27',
  addressDetail: '9층 901호',
})
assert.equal(notEnrolledInitial.schoolStatus, 'none')
assert.equal(notEnrolledInitial.affiliationName, '지역아동센터')
assert.equal(notEnrolledInitial.schoolName, '')
assert.equal(isSettingsEditValid(notEnrolledInitial), true)

const savedAffiliation = applySettingsEditToSnapshot(MOCK_SETTINGS_PROFILE, {
  ...notEnrolledInitial,
  volunteerId: 'vol-1',
})
assert.equal(savedAffiliation.affiliationName, '지역아동센터')
assert.equal(savedAffiliation.schoolName, '')
assert.equal(savedAffiliation.grade, '')

const nulled = nullifyEmptyProfileUpdateFields({
  external1365Id: '',
  schoolName: '재희 고등학교',
  grade: '   ',
  schoolOrganizationId: null,
})
assert.equal(nulled.external1365Id, null)
assert.equal(nulled.grade, null)
assert.equal(nulled.schoolName, '재희 고등학교')
assert.equal(nulled.schoolOrganizationId, null)

const sanitizedNone = sanitizeSettingsEditSchoolFields({
  schoolStatus: 'none' as const,
  schoolName: '심원초등학교',
  affiliationName: '',
  grade: '5학년',
  schoolOrganizationId: 190108,
  schoolAddress: '경기도 부천시 옥산로 66',
  schoolNeisCode: '7581089',
  schoolEducationOfficeCode: 'J10',
  schoolSource: 'neis' as const,
  address: '서울',
  addressDetail: '1',
  postalCode: '04049',
  regionSido: '서울특별시',
  regionSigungu: '마포구',
  volunteerId: '123414',
})
assert.equal(sanitizedNone.schoolName, '')
assert.equal(sanitizedNone.grade, '')
assert.equal(sanitizedNone.schoolOrganizationId, null)
assert.equal(sanitizedNone.schoolNeisCode, '')
assert.equal(sanitizedNone.schoolSource, undefined)
assert.equal(sanitizedNone.affiliationName, '')
assert.equal(sanitizedNone.volunteerId, '123414')

assert.equal(toTeacherEmploymentStatus('EMPLOYED'), 'ACTIVE')
assert.equal(toTeacherEmploymentStatus('ON_LEAVE'), 'ON_LEAVE')
assert.equal(toTeacherEmploymentStatus('TRANSFERRED'), '')

const teacherInitial = mapProfileToTeacherSettingsEditForm(MOCK_TEACHER_SETTINGS_PROFILE)
assert.equal(teacherInitial.schoolName, '서울초등학교')
assert.equal(teacherInitial.employmentStatus, 'ACTIVE')
assert.equal(isTeacherSettingsEditValid(teacherInitial), true)
assert.equal(isTeacherSettingsEditValid({ ...teacherInitial, schoolName: '' }), false)

const teacherSaved = applyTeacherSettingsEditToSnapshot(MOCK_TEACHER_SETTINGS_PROFILE, {
  ...teacherInitial,
  employmentStatus: 'ON_LEAVE',
})
assert.equal(teacherSaved.teacherEmploymentStatus, 'ON_LEAVE')

console.log('map-edit.selfcheck: ok')
