import assert from 'node:assert/strict'
import { isPortalFormTargetRoleMismatch } from './portal-form-target-role.ts'

assert.equal(isPortalFormTargetRoleMismatch(undefined, 'ORGANIZATION', 'teacher'), false)
assert.equal(isPortalFormTargetRoleMismatch('TEACHER', 'ORGANIZATION', 'teacher'), false)
assert.equal(isPortalFormTargetRoleMismatch('INSTRUCTOR', 'ORGANIZATION', 'teacher'), false)
assert.equal(isPortalFormTargetRoleMismatch('STUDENT', 'ORGANIZATION', 'teacher'), true)
assert.equal(isPortalFormTargetRoleMismatch('TEACHER', 'ORGANIZATION', 'student'), true)
assert.equal(isPortalFormTargetRoleMismatch('INDIVIDUAL', 'ORGANIZATION', 'student'), false)
assert.equal(isPortalFormTargetRoleMismatch('TEACHER', 'INDIVIDUAL'), true)
assert.equal(isPortalFormTargetRoleMismatch('INDIVIDUAL', 'INDIVIDUAL'), false)

console.log('portal-form-target-role.selfcheck: ok')
