import { rethrowIdentityApiError, unwrapApiData } from './api-unwrap'
import { toApiBirthDate, toVerifiedBirthDate } from './birth-date'
import { IdentityVerificationApiError } from './errors'
import { normalizeVerificationSession } from './parse-verification-session'
import {
  normalizeVerifiedIdentityProfile,
} from './parse-verified-identity-profile'
import {
  NiceAuthPopupBlockedError,
  navigateNiceAuthPopup,
  openNiceAuthPopup,
  openNiceAuthPopupWindow,
  watchNiceAuthPopupClosed,
} from './popup'
import { createIdentityVerificationState, type IdentityVerificationState } from './state'
import type {
  IdentityChallengeCompleteInput,
  IdentityChallengeCompleteResult,
  IdentityChallengeStartInput,
  IdentityChallengeStartResult,
  IdentityVerificationHttpClient,
  IdentityVerificationPaths,
  IdentityVerificationRoutes,
  IdentityVerificationSessionResponse,
  IdentityVerificationStartRequest,
  NiceIdentityAuthStartResponse,
  VerifiedIdentityProfileResponse,
} from './types'

export interface CreateIdentityVerificationClientOptions {
  http: IdentityVerificationHttpClient
  paths: IdentityVerificationPaths
  routes: IdentityVerificationRoutes
  isRemoteEnabled: () => boolean
  /** 기본 `MEMBER_SIGNUP` */
  flow?: string
  storagePrefix?: string
}

export interface IdentityVerificationClient {
  readonly state: IdentityVerificationState
  readonly flow: string
  isRemoteEnabled: () => boolean
  startChallenge: (input: IdentityChallengeStartInput) => Promise<IdentityChallengeStartResult>
  fetchSession: (sessionId: number) => Promise<IdentityVerificationSessionResponse>
  fetchVerifiedProfile: (
    sessionId: number,
    profileToken: string
  ) => Promise<VerifiedIdentityProfileResponse>
  completeChallengeMock: (
    input: IdentityChallengeCompleteInput
  ) => Promise<IdentityChallengeCompleteResult>
  isSessionVerified: (status: string | undefined) => boolean
  popup: {
    open: typeof openNiceAuthPopup
    openWindow: typeof openNiceAuthPopupWindow
    navigate: typeof navigateNiceAuthPopup
    watchClosed: typeof watchNiceAuthPopupClosed
    NiceAuthPopupBlockedError: typeof NiceAuthPopupBlockedError
  }
}

const VERIFIED_SESSION_STATUS = 'VERIFIED'
const DEFAULT_FLOW = 'MEMBER_SIGNUP'

let mockSessionCounter = 1000

function createMockSessionId(): number {
  mockSessionCounter += 1
  return mockSessionCounter
}

function createChallengeNonce(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `nonce-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    window.setTimeout(resolve, ms)
  })
}

export function createIdentityVerificationClient(
  options: CreateIdentityVerificationClientOptions
): IdentityVerificationClient {
  const flow = options.flow ?? DEFAULT_FLOW
  const state = createIdentityVerificationState({
    routes: options.routes,
    storagePrefix: options.storagePrefix,
  })

  function buildNiceStartRequest(
    input: IdentityChallengeStartInput,
    challengeState: string
  ): IdentityVerificationStartRequest {
    return {
      provider: 'NICE',
      expectedBirthDate: toApiBirthDate(input.birthDate),
      flow,
      frontendReturnUrl: state.buildCallbackUrl(),
      state: challengeState,
    }
  }

  async function startChallengeRemote(
    input: IdentityChallengeStartInput
  ): Promise<IdentityChallengeStartResult> {
    const challengeState = createChallengeNonce()

    state.setPendingChallenge({
      sessionId: 0,
      nonce: challengeState,
      birthDate: input.birthDate,
      gender: input.gender,
    })

    try {
      const { data: payload } = await options.http.post<unknown>(
        options.paths.niceStart(),
        buildNiceStartRequest(input, challengeState)
      )

      const body = unwrapApiData<NiceIdentityAuthStartResponse>(payload)
      const sessionId = body.sessionId
      const authUrl = body.authUrl

      if (sessionId == null || !authUrl) {
        throw new IdentityVerificationApiError(
          'INVALID_RESPONSE',
          '본인인증 URL을 받지 못했습니다.'
        )
      }

      state.setPendingChallenge({
        sessionId,
        nonce: body.state ?? challengeState,
        birthDate: input.birthDate,
        gender: input.gender,
      })

      return {
        sessionId,
        authUrl,
        expiresAt: body.expiresAt ?? new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      }
    } catch (error) {
      rethrowIdentityApiError(error, '본인인증을 시작할 수 없습니다.')
    }
  }

  async function startChallengeMock(
    input: IdentityChallengeStartInput
  ): Promise<IdentityChallengeStartResult> {
    await delay(300)

    const sessionId = createMockSessionId()
    const nonce = createChallengeNonce()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    state.setPendingChallenge({
      sessionId,
      nonce,
      birthDate: input.birthDate,
      gender: input.gender,
    })

    return {
      sessionId,
      authUrl: state.buildMockNiceUrl(sessionId, nonce),
      expiresAt,
    }
  }

  async function startChallenge(
    input: IdentityChallengeStartInput
  ): Promise<IdentityChallengeStartResult> {
    if (options.isRemoteEnabled()) {
      return startChallengeRemote(input)
    }
    return startChallengeMock(input)
  }

  async function fetchSession(sessionId: number): Promise<IdentityVerificationSessionResponse> {
    if (!options.isRemoteEnabled()) {
      await delay(200)
      return {
        sessionId,
        provider: 'NICE',
        status: VERIFIED_SESSION_STATUS,
        verifiedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      }
    }

    try {
      const { data: payload } = await options.http.get<unknown>(
        options.paths.identitySession(sessionId)
      )
      return normalizeVerificationSession(unwrapApiData<unknown>(payload))
    } catch (error) {
      rethrowIdentityApiError(error, '본인인증 세션을 조회할 수 없습니다.')
    }
  }

  async function fetchVerifiedProfile(
    sessionId: number,
    profileToken: string
  ): Promise<VerifiedIdentityProfileResponse> {
    if (!profileToken.trim()) {
      throw new IdentityVerificationApiError(
        'INVALID_REQUEST',
        '인증 프로필 토큰이 없습니다.'
      )
    }

    if (!options.isRemoteEnabled()) {
      await delay(200)
      const pending = state.getPendingChallenge()
      return {
        sessionId,
        provider: 'NICE',
        status: VERIFIED_SESSION_STATUS,
        name: '홍길동',
        phone: '010-1234-5678',
        birthDate: pending ? toApiBirthDate(pending.birthDate) : undefined,
        verifiedAt: new Date().toISOString(),
      }
    }

    try {
      const { data: payload } = await options.http.get<unknown>(
        options.paths.identityProfile(sessionId, profileToken)
      )
      return normalizeVerifiedIdentityProfile(unwrapApiData<unknown>(payload))
    } catch (error) {
      rethrowIdentityApiError(error, '본인인증 프로필을 조회할 수 없습니다.')
    }
  }

  async function completeChallengeMock(
    input: IdentityChallengeCompleteInput
  ): Promise<IdentityChallengeCompleteResult> {
    await delay(300)

    if (!input.webTransactionId.trim()) {
      throw new Error('인증 정보가 올바르지 않습니다.')
    }

    if (input.webTransactionId === 'mock-mismatch') {
      throw new Error('입력하신 생년월일과 본인인증 정보가 일치하지 않습니다.')
    }

  return {
    sessionId: input.sessionId,
    sessionUuid: String(input.sessionId),
    verifiedName: '홍길동',
      verifiedPhone: '010-1234-5678',
      verifiedBirthDate: toVerifiedBirthDate(input.birthDate),
      verifiedAt: new Date().toISOString(),
    }
  }

  function isSessionVerified(status: string | undefined): boolean {
    return status?.toUpperCase() === VERIFIED_SESSION_STATUS
  }

  return {
    state,
    flow,
    isRemoteEnabled: options.isRemoteEnabled,
    startChallenge,
    fetchSession,
    fetchVerifiedProfile,
    completeChallengeMock,
    isSessionVerified,
    popup: {
      open: openNiceAuthPopup,
      openWindow: openNiceAuthPopupWindow,
      navigate: navigateNiceAuthPopup,
      watchClosed: watchNiceAuthPopupClosed,
      NiceAuthPopupBlockedError,
    },
  }
}
