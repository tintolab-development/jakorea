import assert from 'node:assert/strict'
import {
  isAlreadyAppliedApplicationReason,
  resolveProgramApplyGateModal,
  shouldHideApplyPageBlockedBanner,
} from './application-apply-gate.ts'

assert.equal(resolveProgramApplyGateModal(true, undefined), 'proceed')
assert.equal(resolveProgramApplyGateModal(false, undefined), 'proceed')
assert.equal(
  resolveProgramApplyGateModal(false, 'VOLUNTEER_RECRUITMENT_TARGET_MISMATCH'),
  'not-eligible',
)
assert.equal(
  resolveProgramApplyGateModal(undefined, 'VOLUNTEER_RECRUITMENT_TARGET_MISMATCH'),
  'not-eligible',
)
assert.equal(
  resolveProgramApplyGateModal(undefined, 'ACTIVE_ORGANIZATION_AFFILIATION_REQUIRED'),
  'not-eligible',
)
assert.equal(
  resolveProgramApplyGateModal(undefined, 'SCHOOL_TEACHER_ROLE_REQUIRED'),
  'not-eligible',
)
assert.equal(
  resolveProgramApplyGateModal(undefined, 'TRAINED_TEACHER_APPLICATION_TARGET_REQUIRED'),
  'not-eligible',
)
assert.equal(
  resolveProgramApplyGateModal(true, 'VOLUNTEER_RECRUITMENT_TARGET_MISMATCH'),
  'proceed',
)
assert.equal(resolveProgramApplyGateModal(undefined, 'RECRUITMENT_CLOSED'), 'proceed')
assert.equal(resolveProgramApplyGateModal(false, 'COLLEGE_STUDENT_REQUIRED'), 'not-eligible')
assert.equal(resolveProgramApplyGateModal(false, 'APPROVED_INSTRUCTOR_REQUIRED'), 'not-eligible')
assert.equal(resolveProgramApplyGateModal(false, 'ALREADY_APPLIED'), 'already-applied')
assert.equal(
  resolveProgramApplyGateModal(undefined, 'APPLICATION_ALREADY_SUBMITTED'),
  'already-applied',
)
assert.equal(isAlreadyAppliedApplicationReason('UJAT_ORGANIZATION_ALREADY_APPLIED'), true)
assert.equal(isAlreadyAppliedApplicationReason('RECRUITMENT_CLOSED'), false)
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
assert.equal(
  shouldHideApplyPageBlockedBanner(undefined, 'VOLUNTEER_RECRUITMENT_TARGET_MISMATCH'),
  true,
)
assert.equal(shouldHideApplyPageBlockedBanner(false, 'RECRUITMENT_CLOSED'), false)

console.log('application-apply-gate.selfcheck: ok')
