import assert from 'node:assert/strict'
import { MOCK_SETTINGS_PROFILE } from './constants.ts'
import {
  applySettingsEditToSnapshot,
  isSettingsEditValid,
  mapProfileToSettingsEditForm,
  nullifyEmptyProfileUpdateFields,
  toSettingsGender,
  toSettingsGradeOption,
  toSettingsSchoolStatus,
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
  grade: '',
  volunteerId: 'vol-1',
})
assert.equal(saved.schoolEnrollmentStatus, 'NOT_ENROLLED')
assert.equal(saved.schoolName, '')
assert.equal(saved.external1365Id, 'vol-1')

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

console.log('map-edit.selfcheck: ok')
