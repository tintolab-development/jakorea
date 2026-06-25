import type { IdentityVerificationClient } from './client'
import { closeIdentityPopupSoon, postIdentityMessageToOpener } from './messaging'
import {
  normalizeVerificationSession,
  pickVerifiedFieldsFromCallbackLocation,
} from './parse-verification-session'
import { pickProfileTokenFromSearchParams } from './parse-verified-identity-profile'
import { toVerifiedBirthDate } from './birth-date'
import type { IdentityCallbackOutcome, IdentityVerifiedPayload } from './types'

export interface ProcessIdentityCallbackOptions {
  /** useEffect cleanup 시 true — noOpener UI 억제 */
  cancelled?: boolean
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
  cancelled: boolean
): Promise<IdentityCallbackOutcome> {
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

    const profile = await client.fetchVerifiedProfile(sessionId, profileToken)
    const fromQuery = pickVerifiedFieldsFromCallbackLocation(
      params,
      typeof window !== 'undefined' ? window.location.hash : ''
    )

    const verifiedName = profile.name ?? fromQuery.verifiedName
    const verifiedPhone = profile.phone ?? fromQuery.verifiedPhone
    const verifiedBirthDate =
      (profile.birthDate ? toVerifiedBirthDate(profile.birthDate) : undefined) ??
      (profile.birthDateRaw ? toVerifiedBirthDate(profile.birthDateRaw) : undefined) ??
      fromQuery.verifiedBirthDate

    if (!verifiedName || !verifiedPhone) {
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
      sessionId: profile.sessionId ?? session.sessionId ?? sessionId,
      sessionUuid: session.sessionUuid ?? String(session.sessionId ?? sessionId),
      profileToken,
      verifiedName,
      verifiedPhone,
      verifiedBirthDate,
      verifiedAt: profile.verifiedAt ?? session.verifiedAt ?? new Date().toISOString(),
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
    return processRemoteCallback(client, searchParams, cancelled)
  }

  return processMockCallback(client, searchParams, cancelled)
}
