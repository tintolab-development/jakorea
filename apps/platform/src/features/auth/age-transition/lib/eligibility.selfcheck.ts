import assert from 'node:assert/strict'
import {
  isAgeTransitionCompleted,
  isAgeTransitionEvidencePending,
  shouldPromptAge14Transition,
} from './eligibility.ts'

assert.equal(
  shouldPromptAge14Transition({
    signupUnder14: true,
    eligible: true,
    completed: false,
    status: 'POLICY_HOLD',
  }),
  true,
)

assert.equal(
  shouldPromptAge14Transition({
    signupUnder14: false,
    eligible: true,
    completed: false,
    status: 'POLICY_HOLD',
  }),
  false,
)

assert.equal(
  shouldPromptAge14Transition({
    signupUnder14: true,
    eligible: false,
    completed: false,
    status: 'VERIFICATION_REQUIRED',
  }),
  false,
)

assert.equal(
  shouldPromptAge14Transition({
    signupUnder14: true,
    eligible: true,
    completed: false,
    status: 'EVIDENCE_PENDING',
  }),
  false,
)

assert.equal(
  isAgeTransitionCompleted({
    status: 'COMPLETED',
    completed: true,
  }),
  true,
)

assert.equal(
  isAgeTransitionCompleted({
    status: 'EVIDENCE_PENDING',
    completed: false,
  }),
  false,
)

assert.equal(
  isAgeTransitionCompleted({
    status: 'COMPLETED',
    completed: false,
  }),
  false,
)

assert.equal(
  isAgeTransitionCompleted({
    status: 'EVIDENCE_PENDING',
    completed: true,
  }),
  false,
)

assert.equal(
  isAgeTransitionEvidencePending({
    status: 'EVIDENCE_PENDING',
    completed: false,
  }),
  true,
)

assert.equal(
  shouldPromptAge14Transition({
    signupUnder14: true,
    eligible: true,
    completed: true,
    status: 'COMPLETED',
  }),
  false,
)
