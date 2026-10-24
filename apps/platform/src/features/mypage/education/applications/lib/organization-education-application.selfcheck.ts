import assert from 'node:assert/strict'
import {
  hasInstitutionApplicationFormAnswers,
  isOrganizationEducationApplication,
  isTrainedTeachersEducationProgram,
  resolveOrganizationApplicationTypeForContent,
  resolveTeacherApplicationProgramGroup,
} from './organization-education-application.ts'

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
  isOrganizationEducationApplication(
    { applicationType: 'ORGANIZATION', categoryLabel: '기관' },
    { programAudience: 'individual', programType: 'GENERAL_ORGANIZATION', registrationKind: undefined },
  ),
  true,
)
assert.equal(
  hasInstitutionApplicationFormAnswers({
    'program-application-institution-seed-basic-info': { schoolName: '테스트학교' },
  }),
  true,
)
assert.equal(
  isOrganizationEducationApplication(
    {
      applicationType: 'INDIVIDUAL',
      applicationAnswers: {
        'program-application-institution-seed-basic-info': { schoolName: '테스트학교' },
      },
    },
    { programAudience: 'individual', programType: 'GENERAL_INDIVIDUAL', registrationKind: undefined },
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
  resolveOrganizationApplicationTypeForContent(
    'INDIVIDUAL',
    { programAudience: 'individual', programType: 'GENERAL_INDIVIDUAL', registrationKind: undefined },
    { 'program-application-institution-seed-basic-info': {} },
  ),
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
