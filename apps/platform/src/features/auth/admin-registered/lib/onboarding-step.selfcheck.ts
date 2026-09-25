import assert from 'node:assert/strict'
import {
  normalizeAdminProvisionedOnboardingStep,
  resolveAdminProvisionedOnboardingEntryPath,
  resolveAdminProvisionedOnboardingPath,
  resolveAdminProvisionedNoticeCta,
  resolveAdminProvisionedStepFromPathname,
  shouldContinueAdminProvisionedOnboarding,
  shouldRedirectAdminProvisionedOnboardingStep,
} from './onboarding-step.ts'

assert.equal(normalizeAdminProvisionedOnboardingStep('profile_review'), 'PROFILE_REVIEW')
assert.equal(normalizeAdminProvisionedOnboardingStep(null), null)
assert.equal(normalizeAdminProvisionedOnboardingStep(''), null)
assert.equal(resolveAdminProvisionedOnboardingPath('IDENTITY'), '/auth/admin-registered/identity')
assert.equal(
  resolveAdminProvisionedStepFromPathname('/auth/admin-registered/edit'),
  'PROFILE_REVIEW',
)

const qaRosterFlags = {
  passwordChangeRequired: false,
  adminProvisionedOnboardingRequired: false,
  adminProvisionedOnboardingStep: null,
  registeredByAdmin: true,
  identitySelfSignupCompletedAfterAdminRegistration: false,
}

assert.equal(shouldContinueAdminProvisionedOnboarding(qaRosterFlags), false)
assert.equal(resolveAdminProvisionedOnboardingEntryPath(qaRosterFlags), null)
assert.equal(
  shouldRedirectAdminProvisionedOnboardingStep({
    pathname: '/auth/admin-registered/birth',
    flags: qaRosterFlags,
  }),
  '/',
)

assert.equal(resolveAdminProvisionedOnboardingEntryPath({ registeredByAdmin: true }), null)
assert.equal(
  resolveAdminProvisionedOnboardingEntryPath({
    identitySelfSignupCompletedAfterAdminRegistration: false,
  }),
  null,
)
assert.equal(
  resolveAdminProvisionedOnboardingEntryPath({
    adminProvisionedOnboardingRequired: true,
    adminProvisionedOnboardingStep: 'PASSWORD',
    passwordChangeRequired: false,
  }),
  null,
)

assert.equal(
  resolveAdminProvisionedOnboardingEntryPath({
    adminProvisionedOnboardingRequired: true,
    adminProvisionedOnboardingStep: 'PROFILE',
    registeredByAdmin: true,
    identitySelfSignupCompletedAfterAdminRegistration: false,
  }),
  '/auth/admin-registered/birth',
)

assert.equal(
  resolveAdminProvisionedOnboardingEntryPath({
    adminProvisionedOnboardingRequired: true,
    adminProvisionedOnboardingStep: 'PROFILE_REVIEW',
    identitySelfSignupCompletedAfterAdminRegistration: false,
  }),
  '/auth/admin-registered/confirm',
)

assert.equal(
  shouldRedirectAdminProvisionedOnboardingStep({
    pathname: '/auth/admin-registered/birth',
    flags: {
      adminProvisionedOnboardingRequired: true,
      adminProvisionedOnboardingStep: 'PASSWORD',
      passwordChangeRequired: true,
      identitySelfSignupCompletedAfterAdminRegistration: false,
    },
  }),
  '/auth/admin-registered/change-password',
)

assert.equal(
  resolveAdminProvisionedNoticeCta({
    adminProvisionedOnboardingRequired: true,
    adminProvisionedOnboardingStep: 'PASSWORD',
    passwordChangeRequired: true,
    identitySelfSignupCompletedAfterAdminRegistration: false,
  })?.path,
  '/auth/admin-registered/change-password',
)

assert.equal(
  resolveAdminProvisionedNoticeCta({
    adminProvisionedOnboardingRequired: true,
    adminProvisionedOnboardingStep: 'PASSWORD',
    passwordChangeRequired: true,
    identitySelfSignupCompletedAfterAdminRegistration: false,
  })?.buttonLabel,
  '비밀번호 변경하기',
)

assert.equal(
  resolveAdminProvisionedNoticeCta({
    adminProvisionedOnboardingRequired: true,
    adminProvisionedOnboardingStep: 'IDENTITY',
    identitySelfSignupCompletedAfterAdminRegistration: false,
  })?.path,
  '/auth/admin-registered/identity',
)

assert.equal(
  resolveAdminProvisionedNoticeCta({
    registeredByAdmin: true,
    identitySelfSignupCompletedAfterAdminRegistration: true,
  }),
  null,
)

console.log('onboarding-step.selfcheck: ok')
