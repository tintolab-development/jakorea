/** BE `JA_NICE_AGE14_FRONTEND_RETURN_URL` path 와 동일 */
export const AGE14_NICE_IDENTITY_CALLBACK_PATH = '/auth/age-transition/identity/callback'

export const AGE14_NICE_IDENTITY_MOCK_PATH = '/auth/age-transition/identity/mock'

export const AGE14_NICE_IDENTITY_FLOW = 'AGE14_TRANSITION'

/**
 * NICE return 단계 실패(errorCode). POST /validate 4종 모달과 분리 — 전환 화면 `fail` 모달만.
 * EXPECTED_PROFILE_MISMATCH 등 validate API code를 return에 억지 매핑하지 않는다.
 */
export function isAgeTransitionNiceReturnFailure(params: URLSearchParams): boolean {
  const error = params.get('error')?.trim()
  if (error) return true
  const status = params.get('status')?.trim().toUpperCase()
  return status === 'FAILED' || status === 'EXPIRED' || status === 'CANCELLED' || status === 'CANCELED'
}
