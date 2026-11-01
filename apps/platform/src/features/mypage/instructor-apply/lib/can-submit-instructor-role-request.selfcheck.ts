import assert from 'node:assert/strict'
import {
  canSubmitInstructorRoleRequest,
  getInstructorRoleRequestStatusMessage,
} from './can-submit-instructor-role-request.ts'

assert.equal(canSubmitInstructorRoleRequest(undefined), true)
assert.equal(canSubmitInstructorRoleRequest({ canRequest: true }), true)

assert.equal(
  canSubmitInstructorRoleRequest(
    { status: 'APPROVED', canRequest: false },
    { isApprovedInstructor: false },
  ),
  true,
)
assert.equal(
  getInstructorRoleRequestStatusMessage(
    { status: 'APPROVED', canRequest: false },
    { isApprovedInstructor: false },
  ),
  '현재 강사 신청을 제출할 수 없습니다.',
)

assert.equal(
  canSubmitInstructorRoleRequest(
    { status: 'APPROVED', canRequest: false },
    { isApprovedInstructor: true },
  ),
  false,
)
assert.equal(
  getInstructorRoleRequestStatusMessage(undefined, { isApprovedInstructor: true }),
  '이미 강사 권한이 승인되었습니다.',
)

assert.equal(
  canSubmitInstructorRoleRequest({ status: 'PENDING', canRequest: false }),
  false,
)

console.log('can-submit-instructor-role-request.selfcheck: ok')
