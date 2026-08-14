export type { TermsViewType } from './model/terms-view.types'
export { TERMS_VIEW_TITLES } from './lib/terms-view-config'
export { useTermsViewModal } from './hooks/use-terms-view-modal'
export { TermsViewModal } from './ui/terms-view-modal'
export { RegisterTermsAgreement } from './ui/register-terms-agreement'

export {
  useSignUp,
  useSignUpConsent,
  AddressSearchModal,
  SchoolSearchModal,
  MOCK_VERIFIED_NAME,
  MOCK_VERIFIED_PHONE,
  isBirthStepValid,
  validateBirthStep,
  formatBirthDateInput,
  isValidEmail,
  isValidPassword,
} from './sign-up'
export type {
  UseSignUpReturn,
  SignUpConsentFieldKey,
  SignUpConsentState,
  GenderType,
  MemberType,
  SchoolStatus,
  SelectedAddress,
  SelectedSchool,
} from './sign-up'

export {
  portalAuthPaths,
  portalMePaths,
  postPortalLogin,
  getPortalMe,
  getPortalProfile,
  usePortalLoginMutation,
  usePortalMeQuery,
  usePortalProfileQuery,
  usePortalProfileUpdateMutation,
  usePortalPasswordChangeMutation,
  getLoginApiErrorMessage,
} from './sign-in'
export type {
  AuthTokenResponse,
  HomepageMeResponse,
  MemberLoginRequest,
  PasswordChangeRequest,
  PortalProfileResponse,
  UpdatePortalProfileRequest,
} from './sign-in'

export {
  useSignupIdentityVerification,
  useGuardianIdentityVerification,
  useFindPasswordIdentityVerification,
  processIdentityCallback,
  buildIdentityCallbackKey,
  isIdentityCallbackHandled,
  markIdentityCallbackHandled,
} from './identity-verification'
export type { IdentityChallengeCompleteResult } from './identity-verification'

export {
  requireAdminRegisteredWizardState,
  updateAdminRegisteredWizardState,
  useAdminRegisteredProfileHydration,
  useAdminRegisteredNoticeRedirect,
  setAdminRegisteredPasswordChangeRequired,
  isMockAdminRegisteredFirstLogin,
  requiresAdminRegisteredOnboarding,
  clearAdminRegisteredWizardState,
} from './admin-registered'
