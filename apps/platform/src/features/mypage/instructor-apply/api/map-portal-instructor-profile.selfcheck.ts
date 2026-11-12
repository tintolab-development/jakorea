import assert from 'node:assert/strict'
import { INITIAL_INSTRUCTOR_SHARED_PROFILE_VALUES } from '@jakorea/domain/instructor/profile-form-values'
import type { InstructorRoleRequestProfile } from './types.ts'
import {
  mapInstructorCmsProfileToFormPartial,
  mapInstructorRoleRequestDetailToSubmittedSnapshot,
} from './map-detail-to-form-values.ts'
import {
  mapInstructorFormValuesToCmsProfile,
  mapInstructorFormValuesToPortalEditableProfile,
} from './map-create-request.ts'

const sampleProfile: InstructorRoleRequestProfile = {
  memberType: 'GENERAL',
  affiliation: { organizationNames: ['JA'] },
  homeAddress: { line: '서울' },
  education: {
    highestSchoolType: 'college4',
    highestStatus: 'graduated',
    detailKeys: ['college4'] as InstructorRoleRequestProfile['education']['detailKeys'],
    college4: [{ schoolName: '대학', major: '경제', admitYear: '2020-03', gradYear: '2024-02' }],
  },
  career: { level: 'new', rows: [] },
  jaKoreaActivities: [],
  licenses: [],
  awards: [],
  essays: { freeWrite1: 'hello' },
}

const partial = mapInstructorCmsProfileToFormPartial(sampleProfile)
assert.equal(partial.eduSchoolType, 'college4')
assert.equal(partial.college4Rows?.[0]?.admitYear, '2020')
assert.equal(partial.college4Rows?.[0]?.gradYear, '2024')
assert.equal(partial.freeWrite1, 'hello')

const merged = { ...INITIAL_INSTRUCTOR_SHARED_PROFILE_VALUES, ...partial }
const cms = mapInstructorFormValuesToCmsProfile(merged)
assert.equal(cms.education?.college4?.[0]?.schoolName, '대학')

const editable = mapInstructorFormValuesToPortalEditableProfile(merged)
assert.equal(Object.prototype.hasOwnProperty.call(editable, 'memberType'), false)

const snapshot = mapInstructorRoleRequestDetailToSubmittedSnapshot({
  name: '테스트',
  gender: 'M',
  birthDate: '1990-01-01',
  phone: '01012345678',
  email: 'a@b.c',
  profile: sampleProfile,
})
assert.equal(snapshot.values.freeWrite1, 'hello')

console.log('map-portal-instructor-profile.selfcheck: ok')
