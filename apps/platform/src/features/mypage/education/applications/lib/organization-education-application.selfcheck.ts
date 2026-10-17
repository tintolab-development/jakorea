import assert from 'node:assert/strict'
import {
  isOrganizationEducationApplication,
  isTrainedTeachersEducationProgram,
  resolveOrganizationApplicationTypeForContent,
  resolveTeacherApplicationProgramGroup,
} from './organization-education-application'

assert.equal(
  isTrainedTeachersEducationProgram({ programType: 'TRAINED_TEACHER', registrationKind: undefined }),
  true,
)
assert.equal(
  isOrganizationEducationApplication(
    { applicationType: 'INDIVIDUAL', categoryLabel: '교육받은 교사' },
    { programAudience: 'individual', programType: 'TRAINED_TEACHER', registrationKind: 'trainedTeachers' },
  ),
  true,
)
assert.equal(
  resolveOrganizationApplicationTypeForContent('INDIVIDUAL', {
    programAudience: 'individual',
    programType: 'TRAINED_TEACHER',
    registrationKind: 'trainedTeachers',
  }),
  'ORGANIZATION',
)
assert.equal(
  resolveTeacherApplicationProgramGroup(
    { programType: 'TRAINED_TEACHER', registrationKind: 'trainedTeachers' },
    undefined,
  ),
  'TRAINED_TEACHER',
)

console.log('organization-education-application.selfcheck: ok')
