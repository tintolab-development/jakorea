export { createSocialAuthClient } from './client'
export type { CreateSocialAuthClientOptions, SocialAuthClient } from './client'

export { processOAuthCallback, processOAuthLinkCallback, processSignupSocialReturn } from './callback'
export type {
  ProcessOAuthCallbackOptions,
  ProcessOAuthLinkCallbackOptions,
  ProcessSignupSocialReturnOptions,
} from './callback'

export { createSocialAuthState } from './state'
export type { CreateSocialAuthStateOptions, SocialAuthState } from './state'

export {
  buildOAuthAuthorizeUrl,
  getOAuthRedirectUri,
} from './authorize'

export {
  SocialAccountNotLinkedError,
  SocialAccountAlreadyLinkedError,
  SocialAuthApiError,
  isSocialAccountNotLinkedError,
  isSocialAccountAlreadyLinkedError,
  parseSocialAuthApiError,
} from './errors'

export { toApiProviderCode, fromApiProviderCode, isSocialProvider } from './provider-map'

export {
  createAdminSsoAdapter,
  createMockSocialAuthAdapter,
  createSignupSocialAdapter,
  createCompositeRemoteAdapter,
} from './adapters'
export { createMemberTokenAdapterStub } from './adapters/member-token-adapter.stub'
export type {
  SocialAuthAdapter,
  CreateAdminSsoAdapterOptions,
  CreateMockSocialAuthAdapterOptions,
  CreateSignupSocialAdapterOptions,
  CreateCompositeRemoteAdapterOptions,
  MockSocialAuthLoginResult,
} from './adapters'

export { unwrapApiData, unwrapAuthTokenResult, rethrowSocialAuthApiError } from './api-unwrap'

export type {
  SocialProvider,
  SocialProviderCode,
  OAuthIntent,
  SocialAuthPaths,
  SocialAuthRoutes,
  SocialAuthHttpClient,
  AuthTokenResult,
  SocialLinkConsent,
  LinkedSocialAccount,
  SocialSignupStartInput,
  SocialVerificationSession,
  SsoStartInput,
  SsoStartResult,
  CallbackInput,
  LinkAccountInput,
  OAuthClientConfig,
  PendingSocialLink,
  OAuthCallbackOutcome,
  OAuthLinkCallbackOutcome,
  SignupSocialReturnOutcome,
} from './types'
