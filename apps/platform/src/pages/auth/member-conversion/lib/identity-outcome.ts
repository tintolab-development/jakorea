import {
  mapAgeTransitionErrorCodeToAlert,
  mapAgeTransitionUnknownErrorToAlert,
  type AgeTransitionAlertKind,
} from '@/features/auth/age-transition'

export type MemberConversionIdentityOutcome = AgeTransitionAlertKind | 'ok'

/** HTTP 409 error.code 4종만 모달. 그 외는 매핑하지 않는다. */
export function classifyMemberConversionIdentityError(
  code: string | null | undefined,
): AgeTransitionAlertKind | null {
  return mapAgeTransitionErrorCodeToAlert(code)
}

export function classifyMemberConversionIdentityUnknownError(
  error: unknown,
): AgeTransitionAlertKind | null {
  return mapAgeTransitionUnknownErrorToAlert(error)
}
