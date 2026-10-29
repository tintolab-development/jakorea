import assert from 'node:assert/strict'
import { formatGeminiInstructorRoleLabel } from './instructor-role-label.ts'

assert.equal(formatGeminiInstructorRoleLabel('LEAD'), '주강사')
assert.equal(formatGeminiInstructorRoleLabel('ASSISTANT'), '보조강사')
assert.equal(formatGeminiInstructorRoleLabel(null), '-')
assert.equal(formatGeminiInstructorRoleLabel(''), '-')
assert.notEqual(formatGeminiInstructorRoleLabel('LEAD'), 'LEAD')
assert.notEqual(formatGeminiInstructorRoleLabel('UNKNOWN'), 'UNKNOWN')
assert.equal(formatGeminiInstructorRoleLabel('UNKNOWN'), '-')

console.log('instructor-role-label.selfcheck: ok')
