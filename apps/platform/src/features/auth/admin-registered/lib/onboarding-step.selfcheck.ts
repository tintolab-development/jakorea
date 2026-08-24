import assert from 'node:assert/strict'
import {
  normalizeAdminProvisionedOnboardingStep,
  resolveAdminProvisionedOnboardingEntryPath,
  resolveAdminProvisionedOnboardingPath,
  resolveAdminProvisionedStepFromPathname,
  shouldRedirectAdminProvisionedOnboardingStep,
} from './onboarding-step.ts'

assert.equal(normalizeAdminProvisionedOnboardingStep('profile_review'), 'PROFILE_REVIEW')
assert.equal(resolveAdminProvisionedOnboardingPath('IDENTITY'), '/auth/admin-registered/identity')
assert.equal(
  resolveAdminProvisionedStepFromPathname('/auth/admin-registered/edit'),
  'PROFILE_REVIEW',
)

assert.equal(
  resolveAdminProvisionedOnboardingEntryPath({
    registeredByAdmin: true,
    adminProvisionedOnboardingStep: 'PROFILE_REVIEW',
    identitySelfSignupCompletedAfterAdminRegistration: false,
  }),
  '/auth/admin-registered/confirm',
)

assert.equal(
  shouldRedirectAdminProvisionedOnboardingStep({
    pathname: '/auth/admin-registered/birth',
    flags: {
      registeredByAdmin: true,
      adminProvisionedOnboardingStep: 'PASSWORD',
      identitySelfSignupCompletedAfterAdminRegistration: false,
    },
  }),
  '/auth/admin-registered/change-password',
)

assert.equal(
  shouldRedirectAdminProvisionedOnboardingStep({
    pathname: '/auth/admin-registered/complete',
    flags: {
      registeredByAdmin: true,
      adminProvisionedOnboardingStep: 'PROFILE_REVIEW',
      identitySelfSignupCompletedAfterAdminRegistration: false,
    },
  }),
  null,
)

console.log('onboarding-step.selfcheck: ok')
