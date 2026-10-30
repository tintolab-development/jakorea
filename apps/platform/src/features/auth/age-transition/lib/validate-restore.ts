import { postAgeTransitionNiceValidate } from '../api/client'
import {
  isAgeTransitionAuthBoundaryError,
  isAgeTransitionNiceValid,
  isAgeTransitionValidateUnavailable,
  mapAgeTransitionUnknownErrorToAlert,
} from './error-codes'
import {
  clearAgeTransitionNiceSession,
  getAgeTransitionNiceSessionId,
  hasAgeTransitionNiceValidated,
  markAgeTransitionNiceValidated,
} from './nice-session'

export type AgeTransitionValidateRestore = 'valid' | 'blocked' | 'unavailable'

/** 재진입·새로고침 시 서버 세션으로 사전 검증을 다시 확인한다. */
export async function restoreAgeTransitionNiceValidation(): Promise<AgeTransitionValidateRestore> {
  const sessionId = getAgeTransitionNiceSessionId()
  if (sessionId == null) return 'blocked'

  try {
    const result = await postAgeTransitionNiceValidate(sessionId)
    if (isAgeTransitionNiceValid(result)) {
      markAgeTransitionNiceValidated()
      return 'valid'
    }
    clearAgeTransitionNiceSession()
    return 'blocked'
  } catch (error) {
    if (isAgeTransitionValidateUnavailable(error) || isAgeTransitionAuthBoundaryError(error)) {
      return hasAgeTransitionNiceValidated() ? 'unavailable' : 'blocked'
    }
    if (mapAgeTransitionUnknownErrorToAlert(error)) {
      clearAgeTransitionNiceSession()
      return 'blocked'
    }
    return hasAgeTransitionNiceValidated() ? 'unavailable' : 'blocked'
  }
}
