import assert from 'node:assert/strict'
import {
  resolveProgramApplyGateModal,
  shouldHideApplyPageBlockedBanner,
} from './application-apply-gate.ts'

assert.equal(resolveProgramApplyGateModal(true, undefined), 'proceed')
assert.equal(resolveProgramApplyGateModal(false, undefined), 'proceed')
assert.equal(
  resolveProgramApplyGateModal(false, 'VOLUNTEER_RECRUITMENT_TARGET_MISMATCH'),
  'not-eligible',
)
assert.equal(resolveProgramApplyGateModal(false, 'COLLEGE_STUDENT_REQUIRED'), 'not-eligible')
assert.equal(resolveProgramApplyGateModal(false, 'APPROVED_INSTRUCTOR_REQUIRED'), 'not-eligible')
assert.equal(resolveProgramApplyGateModal(false, 'ALREADY_APPLIED'), 'already-applied')
assert.equal(resolveProgramApplyGateModal(false, 'RECRUITMENT_NOT_STARTED'), 'proceed')
assert.equal(resolveProgramApplyGateModal(false, 'RECRUITMENT_CLOSED'), 'proceed')
assert.equal(resolveProgramApplyGateModal(false, 'CAPACITY_FULL'), 'proceed')
assert.equal(
  resolveProgramApplyGateModal(false, 'FACILITATOR_PLEDGE_REQUIRED'),
  'proceed',
)

assert.equal(
  shouldHideApplyPageBlockedBanner(false, 'VOLUNTEER_RECRUITMENT_TARGET_MISMATCH'),
  true,
)
assert.equal(shouldHideApplyPageBlockedBanner(false, 'RECRUITMENT_CLOSED'), false)

console.log('application-apply-gate.selfcheck: ok')
