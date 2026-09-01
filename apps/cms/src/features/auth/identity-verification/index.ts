import { useIdentityVerification as useIdentityVerificationBase } from '@jakorea/identity-verification/react'
import type { IdentityChallengeCompleteResult } from '@jakorea/identity-verification'

import type { AdminRegisterGender } from '@/types/admin-register'

import { cmsIdentityVerificationClient } from './cms-client'
import { findEmailIdentityVerificationClient } from './find-email-client'
import { findPasswordIdentityVerificationClient } from './find-password-client'
import { passwordChangeRequiredIdentityClient } from './password-change-required-client'

export { cmsIdentityVerificationClient } from './cms-client'
export { findEmailIdentityVerificationClient } from './find-email-client'
export { findPasswordIdentityVerificationClient } from './find-password-client'
export { passwordChangeRequiredIdentityClient } from './password-change-required-client'

export type {
  IdentityCallbackOutcome,
  IdentityChallengeCompleteResult,
  IdentityChallengeStartInput,
  IdentityChallengeStartResult,
  IdentityMessage,
  IdentityVerificationApiError,
  IdentityVerificationClient,
  IdentityVerificationSessionResponse,
  VerifiedIdentityProfileResponse,
  IdentityVerifiedPayload,
  PendingIdentityChallenge,
} from '@jakorea/identity-verification'

export type { IdentityVerificationHookStatus } from '@jakorea/identity-verification/react'

export {
  closeIdentityPopupSoon,
  createIdentityVerificationClient,
  createIdentityVerificationState,
  NiceAuthPopupBlockedError,
  openNiceAuthPopup,
  parseIdentityVerificationApiError,
  postIdentityMessageToOpener,
  processIdentityCallback,
  toApiBirthDate,
  watchNiceAuthPopupClosed,
} from '@jakorea/identity-verification'

interface UseIdentityVerificationOptions {
  birthDate?: string
  gender?: AdminRegisterGender
  onSuccess: (result: IdentityChallengeCompleteResult) => void
}

export function useIdentityVerification(options: UseIdentityVerificationOptions) {
  return useIdentityVerificationBase({
    client: cmsIdentityVerificationClient,
    birthDate: options.birthDate,
    gender: options.gender,
    onSuccess: options.onSuccess,
  })
}

interface UseFindEmailIdentityVerificationOptions {
  onSuccess: (result: IdentityChallengeCompleteResult) => void
}

export function useFindEmailIdentityVerification(
  options: UseFindEmailIdentityVerificationOptions
) {
  return useIdentityVerificationBase({
    client: findEmailIdentityVerificationClient,
    requireBirthGender: false,
    requireName: false,
    onSuccess: options.onSuccess,
  })
}

interface UseFindPasswordIdentityVerificationOptions {
  onSuccess: (result: IdentityChallengeCompleteResult) => void
}

export function useFindPasswordIdentityVerification(
  options: UseFindPasswordIdentityVerificationOptions
) {
  return useIdentityVerificationBase({
    client: findPasswordIdentityVerificationClient,
    requireBirthGender: false,
    requireName: false,
    onSuccess: options.onSuccess,
  })
}

interface UsePasswordChangeRequiredIdentityVerificationOptions {
  birthDate?: string
  gender?: AdminRegisterGender
  onSuccess: (result: IdentityChallengeCompleteResult) => void
}

export function usePasswordChangeRequiredIdentityVerification(
  options: UsePasswordChangeRequiredIdentityVerificationOptions
) {
  return useIdentityVerificationBase({
    client: passwordChangeRequiredIdentityClient,
    birthDate: options.birthDate,
    gender: options.gender,
    onSuccess: options.onSuccess,
  })
}

/** @deprecated `cmsIdentityVerificationClient.startChallenge` 사용 */
export const startIdentityChallenge = cmsIdentityVerificationClient.startChallenge.bind(
  cmsIdentityVerificationClient
)

/** @deprecated `cmsIdentityVerificationClient.fetchSession` 사용 */
export const fetchIdentitySession = cmsIdentityVerificationClient.fetchSession.bind(
  cmsIdentityVerificationClient
)

/** @deprecated `cmsIdentityVerificationClient.fetchVerifiedProfile` 사용 */
export const fetchVerifiedIdentityProfile =
  cmsIdentityVerificationClient.fetchVerifiedProfile.bind(cmsIdentityVerificationClient)

/** @deprecated `cmsIdentityVerificationClient.completeChallengeMock` 사용 */
export const completeIdentityChallenge = cmsIdentityVerificationClient.completeChallengeMock.bind(
  cmsIdentityVerificationClient
)

/** @deprecated `cmsIdentityVerificationClient.isSessionVerified` 사용 */
export const isIdentitySessionVerified = cmsIdentityVerificationClient.isSessionVerified.bind(
  cmsIdentityVerificationClient
)

const { state: identityState } = cmsIdentityVerificationClient

/** @deprecated `cmsIdentityVerificationClient.state` 사용 */
export const setPendingIdentityChallenge = identityState.setPendingChallenge.bind(identityState)
export const getPendingIdentityChallenge = identityState.getPendingChallenge.bind(identityState)
export const clearPendingIdentityChallenge = identityState.clearPendingChallenge.bind(identityState)
export const buildRegisterIdentityCallbackUrl = identityState.buildCallbackUrl.bind(identityState)
export const buildRegisterIdentityMockNiceUrl = identityState.buildMockNiceUrl.bind(identityState)
export const validatePendingIdentityState = identityState.validatePendingState.bind(identityState)
export const isRegisterIdentityMessage = identityState.isIdentityMessage.bind(identityState)

export type RegisterIdentityMessage = import('@jakorea/identity-verification').IdentityMessage
export type RegisterIdentityVerifiedPayload =
  import('@jakorea/identity-verification').IdentityVerifiedPayload
