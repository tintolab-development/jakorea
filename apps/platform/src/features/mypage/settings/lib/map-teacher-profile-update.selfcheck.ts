import assert from 'node:assert/strict'
import { mapTeacherSettingsEditToPortalProfileUpdate } from './map-teacher-profile-update.ts'

const body = mapTeacherSettingsEditToPortalProfileUpdate({
  schoolName: '서울초등학교',
  schoolOrganizationId: 12,
  schoolAddress: '',
  schoolNeisCode: '',
  schoolEducationOfficeCode: '',
  employmentStatus: 'ON_LEAVE',
})

assert.equal(body.teacherEmploymentStatus, 'ON_LEAVE')
assert.equal(body.schoolName, '서울초등학교')
assert.equal(body.schoolOrganizationId, 12)
assert.equal('affiliationName' in body, false)

console.log('map-teacher-profile-update selfcheck: ok')
