import assert from 'node:assert/strict'
import {
  normalizeAdminProvisionedOnboardingStep,
  resolveAdminProvisionedOnboardingEntryPath,
  resolveAdminProvisionedOnboardingPath,
  resolveAdminProvisionedNoticeCta,
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
  resolveAdminProvisionedNoticeCta({
    registeredByAdmin: true,
    adminProvisionedOnboardingStep: 'PASSWORD',
    identitySelfSignupCompletedAfterAdminRegistration: false,
  })?.path,
  '/auth/admin-registered/change-password',
)

assert.equal(
  resolveAdminProvisionedNoticeCta({
    registeredByAdmin: true,
    adminProvisionedOnboardingStep: 'PASSWORD',
    identitySelfSignupCompletedAfterAdminRegistration: false,
  })?.buttonLabel,
  '비밀번호 변경하기',
)

assert.equal(
  resolveAdminProvisionedNoticeCta({
    registeredByAdmin: true,
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
