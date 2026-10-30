import type { AgeTransitionNiceSessionStatus, AgeTransitionNiceValidateResult } from '../api/types'

export type AgeTransitionAlertKind = 'fail' | 'under14' | 'mismatch' | 'duplicate'

function normalizeCode(value: string | null | undefined) {
  return value?.trim().toUpperCase().replace(/-/g, '_') ?? ''
}

/** HTTP 409 error.code → 피그마 실패 모달 4종. 이 목록 외 코드는 매핑하지 않는다. */
const VALIDATE_ALERT_BY_CODE: Record<string, AgeTransitionAlertKind> = {
  AGE14_TRANSITION_NICE_FAILED: 'fail',
  AGE14_TRANSITION_UNDER_AGE: 'under14',
  AGE14_TRANSITION_IDENTITY_MISMATCH: 'mismatch',
  AGE14_TRANSITION_CI_ALREADY_REGISTERED: 'duplicate',
}

export function mapAgeTransitionErrorCodeToAlert(
  code: string | null | undefined,
): AgeTransitionAlertKind | null {
  const normalized = normalizeCode(code)
  if (!normalized) return null
  return VALIDATE_ALERT_BY_CODE[normalized] ?? null
}

export function mapAgeTransitionNiceStatusToAlert(
  session: AgeTransitionNiceSessionStatus | null | undefined,
): AgeTransitionAlertKind | null {
  const fromFailure = mapAgeTransitionErrorCodeToAlert(session?.failureCode)
  if (fromFailure) return fromFailure
  const status = normalizeCode(session?.status)
  if (status === 'FAILED' || status === 'EXPIRED' || status === 'CANCELLED' || status === 'CANCELED') {
    return 'fail'
  }
  return null
}

export function isNiceSessionVerified(session: AgeTransitionNiceSessionStatus | null | undefined) {
  return normalizeCode(session?.status) === 'VERIFIED'
}

export function isAgeTransitionNiceValid(result: AgeTransitionNiceValidateResult | null | undefined) {
  if (!result) return false
  return (
    normalizeCode(result.status) === 'VALID' &&
    result.identityVerified === true &&
    result.transitionCompleted !== true
  )
}

function isAgeTransitionApiErrorShape(
  error: unknown,
): error is { code: string; httpStatus?: number } {
  return (
    Boolean(error) &&
    typeof error === 'object' &&
    (error as { name?: string }).name === 'AgeTransitionApiError' &&
    typeof (error as { code?: unknown }).code === 'string'
  )
}

function readHttpStatus(error: unknown) {
  if (isAgeTransitionApiErrorShape(error)) return error.httpStatus
  if (error && typeof error === 'object' && 'response' in error) {
    const status = (error as { response?: { status?: unknown } }).response?.status
    return typeof status === 'number' ? status : undefined
  }
  return undefined
}

function readStructuredCode(error: unknown) {
  if (isAgeTransitionApiErrorShape(error)) return error.code
  if (error && typeof error === 'object' && 'response' in error) {
    const data = (error as { response?: { data?: unknown } }).response?.data
    if (data && typeof data === 'object') {
      const nested = (data as { error?: { code?: unknown } }).error
      if (nested && typeof nested === 'object' && typeof nested.code === 'string') return nested.code
      if (typeof (data as { code?: unknown }).code === 'string') return (data as { code: string }).code
    }
  }
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code
    if (typeof code === 'string' && code.startsWith('AGE14_')) return code
  }
  return undefined
}

export function mapAgeTransitionUnknownErrorToAlert(error: unknown): AgeTransitionAlertKind | null {
  if (isAgeTransitionValidateUnavailable(error) || isAgeTransitionAuthBoundaryError(error)) {
    return null
  }
  return mapAgeTransitionErrorCodeToAlert(readStructuredCode(error))
}

export function isAgeTransitionValidateUnavailable(error: unknown) {
  return readHttpStatus(error) === 404
}

export function isAgeTransitionAuthBoundaryError(error: unknown) {
  const status = readHttpStatus(error)
  return status === 401 || status === 403
}
