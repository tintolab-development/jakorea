export { createIdentityVerificationClient } from './client'
export type { CreateIdentityVerificationClientOptions, IdentityVerificationClient } from './client'

export { processIdentityCallback } from './callback'
export type { ProcessIdentityCallbackOptions } from './callback'

export { createIdentityVerificationState } from './state'
export type { CreateIdentityVerificationStateOptions, IdentityVerificationState } from './state'

export { IdentityVerificationApiError, parseIdentityVerificationApiError } from './errors'

export {
  normalizeBirthDateDigits,
  toApiBirthDate,
  toApiGender,
  toVerifiedBirthDate,
} from './birth-date'

export {
  NiceAuthPopupBlockedError,
  navigateNiceAuthPopup,
  openNiceAuthPopup,
  openNiceAuthPopupWindow,
  watchNiceAuthPopupClosed,
} from './popup'

export {
  closeIdentityPopupOrResume,
  closeIdentityPopupSoon,
  deliverIdentityMessage,
  postIdentityMessageToOpener,
} from './messaging'

export {
  clearIdentityCompletion,
  publishIdentityCompletion,
  subscribeIdentityCompletion,
  takeIdentityCompletion,
} from './completion-channel'

export { unwrapApiData, rethrowIdentityApiError } from './api-unwrap'

export type {
  IdentityVerificationStartRequest,
  NiceIdentityAuthStartResponse,
  IdentityVerificationSessionResponse,
  VerifiedIdentityProfileResponse,
  IdentityChallengeStartInput,
  IdentityChallengeStartResult,
  IdentityChallengeCompleteInput,
  IdentityChallengeCompleteResult,
  IdentityVerifiedPayload,
  IdentityFailedPayload,
  IdentityCancelledPayload,
  IdentityMessage,
  PendingIdentityChallenge,
  IdentityVerificationPaths,
  IdentityVerificationRoutes,
  IdentityVerificationHttpClient,
  IdentityCallbackOutcome,
} from './types'
