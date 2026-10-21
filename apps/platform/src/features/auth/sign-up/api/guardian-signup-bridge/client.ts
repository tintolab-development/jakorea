import { axiosClient } from '@/shared/api/axios-instance'
import { guardianSignupBridgePaths } from './endpoints'
import {
  rethrowSignupBridgeApiError,
  unwrapSignupBridgeApiData,
} from './unwrap-api-data'
import type {
  GuardianChallengeCreateRequest,
  GuardianChallengeCreateResponse,
  GuardianConsentRequest,
  GuardianConsentResponse,
  GuardianFinalConsentChallengeResponse,
  GuardianNiceStartResponse,
  GuardianSignupStatusResponse,
  SignupIntentCreateRequest,
  SignupIntentCreateResponse,
} from './types'

const STATUS_TOKEN_HEADER = 'X-Verification-Status-Token'

async function postJson<T>(url: string, body?: unknown, headers?: Record<string, string>) {
  const { data } = await axiosClient.post<unknown>(url, body ?? undefined, { headers })
  return unwrapSignupBridgeApiData<T>(data)
}

async function getJson<T>(url: string, headers?: Record<string, string>) {
  const { data } = await axiosClient.get<unknown>(url, { headers })
  return unwrapSignupBridgeApiData<T>(data)
}

export async function postSignupIntent(body: SignupIntentCreateRequest) {
  try {
    return await postJson<SignupIntentCreateResponse>(guardianSignupBridgePaths.signupIntents(), body)
  } catch (error) {
    rethrowSignupBridgeApiError(error, '가입 준비 정보를 발급할 수 없습니다.')
  }
}

export async function postGuardianChallenge(body: GuardianChallengeCreateRequest) {
  try {
    return await postJson<GuardianChallengeCreateResponse>(
      guardianSignupBridgePaths.guardianSessions(),
      body,
    )
  } catch (error) {
    rethrowSignupBridgeApiError(error, '보호자 인증을 시작할 수 없습니다.')
  }
}

export async function postGuardianConsent(input: {
  guardianSessionId: number
  statusToken: string
  body: GuardianConsentRequest
  idempotencyKey?: string
}) {
  const headers: Record<string, string> = {
    [STATUS_TOKEN_HEADER]: input.statusToken,
  }
  if (input.idempotencyKey?.trim()) {
    headers['Idempotency-Key'] = input.idempotencyKey.trim()
  }
  try {
    return await postJson<GuardianConsentResponse>(
      guardianSignupBridgePaths.guardianConsent(input.guardianSessionId),
      input.body,
      headers,
    )
  } catch (error) {
    rethrowSignupBridgeApiError(error, '보호자 동의를 기록할 수 없습니다.')
  }
}

export async function postGuardianNiceStart(input: {
  guardianSessionId: number
  statusToken: string
  idempotencyKey?: string
}) {
  const headers: Record<string, string> = {
    [STATUS_TOKEN_HEADER]: input.statusToken,
  }
  if (input.idempotencyKey?.trim()) {
    headers['Idempotency-Key'] = input.idempotencyKey.trim()
  }
  try {
    return await postJson<GuardianNiceStartResponse>(
      guardianSignupBridgePaths.guardianNiceStart(input.guardianSessionId),
      undefined,
      headers,
    )
  } catch (error) {
    rethrowSignupBridgeApiError(error, '보호자 본인인증을 시작할 수 없습니다.')
  }
}

export async function postGuardianFinalConsentChallenge(input: {
  guardianSessionId: number
  statusToken: string
}) {
  try {
    return await postJson<GuardianFinalConsentChallengeResponse>(
      guardianSignupBridgePaths.guardianFinalConsentChallenge(input.guardianSessionId),
      undefined,
      { [STATUS_TOKEN_HEADER]: input.statusToken },
    )
  } catch (error) {
    rethrowSignupBridgeApiError(error, '최종 동의 인증을 발급할 수 없습니다.')
  }
}

export async function getGuardianSignupStatus(input: {
  guardianSessionId: number
  statusToken: string
}) {
  try {
    return await getJson<GuardianSignupStatusResponse>(
      guardianSignupBridgePaths.guardianSignupStatus(input.guardianSessionId),
      { [STATUS_TOKEN_HEADER]: input.statusToken },
    )
  } catch (error) {
    rethrowSignupBridgeApiError(error, '보호자 인증 상태를 확인할 수 없습니다.')
  }
}

export async function pollGuardianSignupStatus(input: {
  guardianSessionId: number
  statusToken: string
  maxAttempts?: number
  intervalMs?: number
}) {
  const maxAttempts = input.maxAttempts ?? 8
  const intervalMs = input.intervalMs ?? 750

  let last: GuardianSignupStatusResponse | null = null
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    last = await getGuardianSignupStatus(input)
    if (last.identityVerified === true || last.status?.trim().toUpperCase() === 'CONSENTED') {
      return last
    }
    if (attempt < maxAttempts - 1) {
      await new Promise(resolve => {
        window.setTimeout(resolve, intervalMs)
      })
    }
  }
  return last
}
