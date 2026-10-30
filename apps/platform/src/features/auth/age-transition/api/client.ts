import { isAxiosError } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import { ageTransitionPaths } from './endpoints'
import {
  parseAgeTransitionChoiceResult,
  parseAgeTransitionCompletionResult,
  parseAgeTransitionNiceSessionStatus,
  parseAgeTransitionNiceValidateResult,
  parseAgeTransitionPortalStatus,
  toAgeTransitionApiError,
} from './parse'
import type {
  AgeTransitionChoice,
  AgeTransitionChoiceResult,
  AgeTransitionCompleteRequest,
  AgeTransitionCompletionResult,
  AgeTransitionNiceSessionStatus,
  AgeTransitionNiceValidateResult,
  AgeTransitionPortalStatus,
} from './types'

function createIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `age14-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/** GET /api/portal/me/age-transition */
export async function getAgeTransitionStatus(signal?: AbortSignal): Promise<AgeTransitionPortalStatus> {
  try {
    const { data } = await axiosClient.get<unknown>(ageTransitionPaths.status(), { signal })
    return parseAgeTransitionPortalStatus(data)
  } catch (error) {
    throw toAgeTransitionApiError(error)
  }
}

/** POST /api/portal/me/age-transition/choice */
export async function postAgeTransitionChoice(
  choice: AgeTransitionChoice,
): Promise<AgeTransitionChoiceResult> {
  try {
    const { data } = await axiosClient.post<unknown>(ageTransitionPaths.choice(), { choice })
    return parseAgeTransitionChoiceResult(data)
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 409) {
      throw toAgeTransitionApiError(error, 'CONFLICT')
    }
    throw toAgeTransitionApiError(error)
  }
}

/** NICE start 전 TRANSITION 선택. 이미 선택된 409는 통과. */
export async function ensureAgeTransitionChoice(choice: AgeTransitionChoice): Promise<void> {
  try {
    await postAgeTransitionChoice(choice)
  } catch (error) {
    const wrapped = toAgeTransitionApiError(error)
    if (wrapped.code === 'CONFLICT') return
    throw wrapped
  }
}

let validateInflight: Promise<AgeTransitionNiceValidateResult> | null = null
let validateInflightSessionId: number | null = null

/** POST /api/portal/me/age-transition/nice/{sessionId}/validate — 세션 비소비 */
export async function postAgeTransitionNiceValidate(
  sessionId: number,
): Promise<AgeTransitionNiceValidateResult> {
  if (validateInflight && validateInflightSessionId === sessionId) {
    return validateInflight
  }

  validateInflightSessionId = sessionId
  validateInflight = (async () => {
    try {
      const { data } = await axiosClient.post<unknown>(ageTransitionPaths.niceValidate(sessionId))
      return parseAgeTransitionNiceValidateResult(data)
    } catch (error) {
      throw toAgeTransitionApiError(error)
    }
  })().finally(() => {
    if (validateInflightSessionId === sessionId) {
      validateInflight = null
      validateInflightSessionId = null
    }
  })

  return validateInflight
}

/** GET /api/portal/me/age-transition/nice/{sessionId} — status only, no PII */
export async function getAgeTransitionNiceStatus(
  sessionId: number,
  signal?: AbortSignal,
): Promise<AgeTransitionNiceSessionStatus> {
  try {
    const { data } = await axiosClient.get<unknown>(ageTransitionPaths.niceStatus(sessionId), {
      signal,
    })
    return parseAgeTransitionNiceSessionStatus(data)
  } catch (error) {
    throw toAgeTransitionApiError(error)
  }
}

/** POST /api/portal/me/age-transition/complete */
export async function postAgeTransitionComplete(
  body: AgeTransitionCompleteRequest,
  idempotencyKey?: string,
): Promise<AgeTransitionCompletionResult> {
  const key = idempotencyKey?.trim() || createIdempotencyKey()
  try {
    const { data } = await axiosClient.post<unknown>(ageTransitionPaths.complete(), body, {
      headers: { 'Idempotency-Key': key },
    })
    return parseAgeTransitionCompletionResult(data)
  } catch (error) {
    throw toAgeTransitionApiError(error)
  }
}
