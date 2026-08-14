import type { AdminProvisionedOnboardingResponse } from './types'

function unwrapData(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  if (root.success === true && root.data && typeof root.data === 'object') {
    return root.data as Record<string, unknown>
  }
  return root
}

function optionalBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : undefined
}

function optionalString(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

export function parseAdminProvisionedOnboardingResponse(
  payload: unknown,
): AdminProvisionedOnboardingResponse {
  const root = unwrapData(payload)
  if (!root) {
    return {}
  }

  return {
    registeredByAdmin: optionalBoolean(root.registeredByAdmin),
    adminProvisionedOnboardingRequired: optionalBoolean(root.adminProvisionedOnboardingRequired),
    adminProvisionedOnboardingStep: optionalString(root.adminProvisionedOnboardingStep),
    profileCompleted: optionalBoolean(root.profileCompleted),
    identityCompleted: optionalBoolean(root.identityCompleted),
    passwordChangeRequired: optionalBoolean(root.passwordChangeRequired),
    identitySelfSignupCompletedAfterAdminRegistration: optionalBoolean(
      root.identitySelfSignupCompletedAfterAdminRegistration,
    ),
  }
}
