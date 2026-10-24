import assert from 'node:assert/strict'
import {
  hasRequiredVerificationSessions,
  resolveUnderAgeSignupSessions,
} from './signup-session.ts'

assert.equal(
  hasRequiredVerificationSessions({
    isUnderAgeSignup: true,
    identityVerificationSessionId: 99,
    guardianVerificationSessionId: 1,
    signupIntentId: 'intent-1',
    guardianBridgeFinalConsentCompleted: true,
  }),
  true,
)

assert.equal(
  hasRequiredVerificationSessions({
    isUnderAgeSignup: true,
    identityVerificationSessionId: 99,
    guardianVerificationSessionId: 1,
    signupIntentId: 'intent-1',
    guardianBridgeFinalConsentCompleted: false,
  }),
  false,
)

assert.equal(
  hasRequiredVerificationSessions({
    isUnderAgeSignup: false,
    identityVerificationSessionId: 10,
    guardianVerificationSessionId: null,
    signupIntentId: null,
  }),
  true,
)

assert.deepEqual(
  resolveUnderAgeSignupSessions({
    signupIntentId: null,
    guardianVerificationSessionId: null,
    guardianBridgeFinalConsentCompleted: false,
    persisted: {
      signupIntentId: 'intent-1',
      guardianSessionId: 7,
      finalConsentCompleted: true,
    },
    wizardStep: 7,
  }),
  {
    signupIntentId: 'intent-1',
    guardianVerificationSessionId: 7,
    guardianBridgeFinalConsentCompleted: true,
  },
)

assert.equal(
  resolveUnderAgeSignupSessions({
    signupIntentId: 'intent-1',
    guardianVerificationSessionId: 3,
    guardianBridgeFinalConsentCompleted: false,
    persisted: {
      signupIntentId: 'intent-1',
      guardianSessionId: 3,
    },
    wizardStep: 7,
  }).guardianBridgeFinalConsentCompleted,
  true,
)

console.log('signup-session.selfcheck: ok')
