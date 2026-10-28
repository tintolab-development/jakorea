import assert from 'node:assert/strict'
import {
  asAssignmentDisplayText,
  displayAssignmentValueOrDash,
  supportsInstructorInstitutionAssignment,
} from './instructor-assignment-support.ts'

assert.equal(supportsInstructorInstitutionAssignment('GENERAL_ORGANIZATION'), true)
assert.equal(supportsInstructorInstitutionAssignment('GEMINI_TRAINING'), true)
assert.equal(supportsInstructorInstitutionAssignment('COMPANY_SCHOOL'), false)
assert.equal(supportsInstructorInstitutionAssignment('GENERAL_INDIVIDUAL'), false)
assert.equal(supportsInstructorInstitutionAssignment(undefined), false)

assert.equal(asAssignmentDisplayText(12.4), '12.4')
assert.equal(asAssignmentDisplayText(' 서울 강서구 '), '서울 강서구')
assert.equal(asAssignmentDisplayText({ sido: '서울' }), '')
assert.equal(displayAssignmentValueOrDash(0), '0')
assert.equal(displayAssignmentValueOrDash(null), '-')
assert.equal(displayAssignmentValueOrDash(['강서구']), '-')

console.log('instructor-assignment-support.selfcheck: ok')
