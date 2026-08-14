export type AdminProvisionedProfileRequest = {
  /** API `YYYY-MM-DD` */
  birthDate: string
  /** API `M` | `F` */
  gender: string
}

export type AdminProvisionedIdentityConfirmRequest = {
  identityVerificationSessionId: number
  profileToken: string
}

export type AdminProvisionedOnboardingResponse = {
  registeredByAdmin?: boolean
  adminProvisionedOnboardingRequired?: boolean
  adminProvisionedOnboardingStep?: string
  profileCompleted?: boolean
  identityCompleted?: boolean
  passwordChangeRequired?: boolean
  identitySelfSignupCompletedAfterAdminRegistration?: boolean
}
