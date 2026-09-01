import { closeIdentityPopupSoon, postIdentityMessageToOpener } from './messaging'
import {
  normalizeVerificationSession,
  pickVerifiedFieldsFromCallbackLocation,
} from './parse-verification-session'
import { pickProfileTokenFromSearchParams } from './parse-verified-identity-profile'
import { toVerifiedBirthDate } from './birth-date'
import type { IdentityVerificationClient } from './client'
import type { IdentityCallbackOutcome, IdentityVerifiedPayload } from './types'

export interface ProcessIdentityCallbackOptions {
  /** useEffect cleanup 시 true — noOpener UI 억제 */
  cancelled?: boolean
  /**
   * profile GET 전에 호출. admin-provisioned identity/confirm처럼
   * profileToken을 먼저 소비해야 하는 후속 API에 사용한다.
   */
  beforeProfileFetch?: (input: {
    sessionId: number
    profileToken: string
  }) => Promise<void>
  /**
   * true면 verified profile GET을 하지 않는다.
   * 부모 창에서 profileToken으로 confirm 할 때 토큰 선소비를 막는다.
   * 세션/쿼리에 이름·전화가 없어도 sessionId·profileToken만으로 성공 메시지를 보낸다.
   */
  skipVerifiedProfileFetch?: boolean
}

function failOutcome(
  message: string,
  cancelled: boolean,
  posted: boolean
): IdentityCallbackOutcome {
  if (!posted && !cancelled) {
    return { kind: 'failed', message, noOpener: true }
  }
  if (!posted) {
    return { kind: 'cancelled' }
  }
  return { kind: 'failed', message, noOpener: false }
}

async function processRemoteCallback(
  client: IdentityVerificationClient,
  params: URLSearchParams,
  cancelled: boolean,
  options: Pick<
    ProcessIdentityCallbackOptions,
    'beforeProfileFetch' | 'skipVerifiedProfileFetch'
  > = {}
): Promise<IdentityCallbackOutcome> {
  const { beforeProfileFetch, skipVerifiedProfileFetch } = options
  const { state } = client
  const queryError = params.get('error')
  const queryMessage = params.get('message') ?? params.get('errorMessage')
  const queryState = params.get('state')
  const sessionIdRaw =
    params.get('sessionId') ?? state.getPendingChallenge()?.sessionId?.toString() ?? ''

  if (queryError) {
    const message = queryMessage ?? '본인인증에 실패했습니다.'
    const posted = postIdentityMessageToOpener({ type: 'IDENTITY_FAILED', message })
    if (posted) {
      state.clearPendingChallenge()
      closeIdentityPopupSoon()
    }
    return failOutcome(message, cancelled, posted)
  }

  if (!state.validatePendingState(queryState)) {
    const message = '인증 요청 정보가 일치하지 않습니다. 다시 시도해 주세요.'
    const posted = postIdentityMessageToOpener({ type: 'IDENTITY_FAILED', message })
    if (posted) {
      state.clearPendingChallenge()
      closeIdentityPopupSoon()
    }
    return failOutcome(message, cancelled, posted)
  }

  const sessionId = Number(sessionIdRaw)
  if (!sessionIdRaw || Number.isNaN(sessionId) || sessionId <= 0) {
    const message = '인증 세션 정보가 없습니다. 회원가입 화면에서 다시 시도해 주세요.'
    const posted = postIdentityMessageToOpener({ type: 'IDENTITY_FAILED', message })
    if (posted) {
      state.clearPendingChallenge()
      closeIdentityPopupSoon()
    }
    return failOutcome(message, cancelled, posted)
  }

  try {
    const session = normalizeVerificationSession(await client.fetchSession(sessionId))
    const queryStatus = params.get('status')?.toUpperCase()
    const isVerified =
      client.isSessionVerified(session.status) || queryStatus === 'VERIFIED'

    if (!isVerified) {
      const message = queryMessage ?? '본인인증이 완료되지 않았습니다.'
      const posted = postIdentityMessageToOpener({ type: 'IDENTITY_FAILED', message })
      if (posted) {
        state.clearPendingChallenge()
        closeIdentityPopupSoon()
      }
      return failOutcome(message, cancelled, posted)
    }

    const profileToken = pickProfileTokenFromSearchParams(params)
    if (!profileToken) {
      const message =
        '인증 프로필 정보가 없습니다. 회원가입 화면에서 다시 시도해 주세요.'
      const posted = postIdentityMessageToOpener({ type: 'IDENTITY_FAILED', message })
      if (posted) {
        state.clearPendingChallenge()
        closeIdentityPopupSoon()
      }
      return failOutcome(message, cancelled, posted)
    }

    if (beforeProfileFetch) {
      await beforeProfileFetch({ sessionId, profileToken })
    }

    const fromQuery = pickVerifiedFieldsFromCallbackLocation(
      params,
      typeof window !== 'undefined' ? window.location.hash : ''
    )

    /**
     * profile GET은 백엔드에 따라 profileToken을 소비할 수 있다.
     * beforeProfileFetch(confirm) 이후이거나, 세션/쿼리에 PII가 있으면 조회를 생략한다.
     */
    let verifiedName = session.verifiedName ?? fromQuery.verifiedName
    let verifiedPhone = session.verifiedPhone ?? fromQuery.verifiedPhone
    let verifiedBirthDate = session.verifiedBirthDate ?? fromQuery.verifiedBirthDate
    let verifiedAt = session.verifiedAt
    let resolvedSessionId = session.sessionId ?? sessionId

    if (!verifiedName || !verifiedPhone) {
      if (!skipVerifiedProfileFetch) {
        try {
          const profile = await client.fetchVerifiedProfile(sessionId, profileToken)
          verifiedName = profile.name ?? verifiedName
          verifiedPhone = profile.phone ?? verifiedPhone
          verifiedBirthDate =
            (profile.birthDate ? toVerifiedBirthDate(profile.birthDate) : undefined) ??
            (profile.birthDateRaw ? toVerifiedBirthDate(profile.birthDateRaw) : undefined) ??
            verifiedBirthDate
          verifiedAt = profile.verifiedAt ?? verifiedAt
          resolvedSessionId = profile.sessionId ?? resolvedSessionId
        } catch {
          // confirm 등으로 토큰이 이미 소비된 경우 — 세션/쿼리 값만으로 진행
        }
      }
    }

    if (verifiedBirthDate) {
      verifiedBirthDate = toVerifiedBirthDate(verifiedBirthDate)
    }

    if (!skipVerifiedProfileFetch && (!verifiedName || !verifiedPhone)) {
      const message = '본인인증 프로필 정보를 확인할 수 없습니다.'
      const posted = postIdentityMessageToOpener({ type: 'IDENTITY_FAILED', message })
      if (posted) {
        state.clearPendingChallenge()
        closeIdentityPopupSoon()
      }
      return failOutcome(message, cancelled, posted)
    }

    const payload: IdentityVerifiedPayload = {
      type: 'IDENTITY_VERIFIED',
      sessionId: resolvedSessionId,
      sessionUuid: session.sessionUuid ?? String(resolvedSessionId),
      profileToken,
      verifiedName,
      verifiedPhone,
      verifiedBirthDate,
      verifiedAt: verifiedAt ?? new Date().toISOString(),
    }

    const posted = postIdentityMessageToOpener(payload)
    if (!posted) {
      return failOutcome(
        '인증은 완료되었으나 부모 창과 연결할 수 없습니다. 회원가입 탭으로 돌아가 주세요.',
        cancelled,
        false
      )
    }

    state.clearPendingChallenge()
    closeIdentityPopupSoon()
    return { kind: 'verified', payload }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '본인인증 결과를 확인할 수 없습니다.'
    const posted = postIdentityMessageToOpener({ type: 'IDENTITY_FAILED', message })
    if (posted) {
      state.clearPendingChallenge()
      closeIdentityPopupSoon()
    }
    return failOutcome(message, cancelled, posted)
  }
}

async function processMockCallback(
  client: IdentityVerificationClient,
  params: URLSearchParams,
  cancelled: boolean
): Promise<IdentityCallbackOutcome> {
  const { state } = client
  const webTransactionId = params.get('web_transaction_id') ?? ''

  if (!webTransactionId) {
    const message = '인증 정보가 없습니다. 회원가입 화면에서 다시 시도해 주세요.'
    const posted = postIdentityMessageToOpener({ type: 'IDENTITY_FAILED', message })
    if (posted) {
      state.clearPendingChallenge()
      closeIdentityPopupSoon()
    }
    return failOutcome(message, cancelled, posted)
  }

  const pending = state.getPendingChallenge()
  if (!pending) {
    const message = '인증 세션이 만료되었습니다. 회원가입 화면에서 다시 시도해 주세요.'
    const posted = postIdentityMessageToOpener({ type: 'IDENTITY_FAILED', message })
    if (posted) {
      state.clearPendingChallenge()
      closeIdentityPopupSoon()
    }
    return failOutcome(message, cancelled, posted)
  }

  try {
    const result = await client.completeChallengeMock({
      sessionId: pending.sessionId,
      webTransactionId,
      birthDate: pending.birthDate,
      gender: pending.gender,
    })

    const payload: IdentityVerifiedPayload = {
      type: 'IDENTITY_VERIFIED',
      sessionId: result.sessionId,
      sessionUuid: String(result.sessionId),
      profileToken: 'mock-profile-token',
      verifiedName: result.verifiedName,
      verifiedPhone: result.verifiedPhone,
      verifiedBirthDate: result.verifiedBirthDate,
      verifiedAt: result.verifiedAt,
    }

    const posted = postIdentityMessageToOpener(payload)
    if (!posted) {
      return failOutcome(
        '인증은 완료되었으나 부모 창과 연결할 수 없습니다. 회원가입 탭으로 돌아가 주세요.',
        cancelled,
        false
      )
    }

    state.clearPendingChallenge()
    closeIdentityPopupSoon()
    return { kind: 'verified', payload }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '본인인증 결과를 확인할 수 없습니다.'
    const posted = postIdentityMessageToOpener({ type: 'IDENTITY_FAILED', message })
    if (posted) {
      state.clearPendingChallenge()
      closeIdentityPopupSoon()
    }
    return failOutcome(message, cancelled, posted)
  }
}

/** NICE 콜백 페이지에서 호출 — 실 API / mock 분기 포함 */
export async function processIdentityCallback(
  client: IdentityVerificationClient,
  searchParams: URLSearchParams,
  options: ProcessIdentityCallbackOptions = {}
): Promise<IdentityCallbackOutcome> {
  const cancelled = options.cancelled ?? false

  if (client.isRemoteEnabled()) {
    return processRemoteCallback(client, searchParams, cancelled, {
      beforeProfileFetch: options.beforeProfileFetch,
      skipVerifiedProfileFetch: options.skipVerifiedProfileFetch,
    })
  }

  return processMockCallback(client, searchParams, cancelled)
}
