import assert from 'node:assert/strict'
import { supportsInstructorInstitutionAssignment } from './instructor-assignment-support.ts'

assert.equal(supportsInstructorInstitutionAssignment('GENERAL_ORGANIZATION'), true)
assert.equal(supportsInstructorInstitutionAssignment('GEMINI_TRAINING'), true)
assert.equal(supportsInstructorInstitutionAssignment('COMPANY_SCHOOL'), false)
assert.equal(supportsInstructorInstitutionAssignment('GENERAL_INDIVIDUAL'), false)
assert.equal(supportsInstructorInstitutionAssignment(undefined), false)

console.log('instructor-assignment-support.selfcheck: ok')
