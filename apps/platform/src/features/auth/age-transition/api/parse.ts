import { isAxiosError } from 'axios'
import {
  AgeTransitionApiError,
  type AgeTransitionChoiceResult,
  type AgeTransitionCompletionResult,
  type AgeTransitionNiceSessionStatus,
  type AgeTransitionNiceValidateResult,
  type AgeTransitionPortalStatus,
} from './types'

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function optionalBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : undefined
}

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function optionalNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

export function extractAgeTransitionErrorCode(error: unknown): string | undefined {
  if (error instanceof AgeTransitionApiError && error.code.trim()) {
    return error.code.trim()
  }
  if (!isAxiosError(error)) {
    if (error && typeof error === 'object' && 'code' in error) {
      const code = (error as { code?: unknown }).code
      if (typeof code === 'string' && code.trim()) return code.trim()
    }
    return undefined
  }
  return readErrorCode(error.response?.data)
}

function readErrorCode(payload: unknown): string | undefined {
  const root = asRecord(payload)
  if (!root) return undefined
  const nested = asRecord(root.error)
  const nestedCode = optionalString(nested?.code)
  if (nestedCode) return nestedCode
  return optionalString(root.code)
}

export function getAgeTransitionHttpStatus(error: unknown): number | undefined {
  if (error instanceof AgeTransitionApiError) return error.httpStatus
  if (isAxiosError(error)) {
    const status = error.response?.status
    return typeof status === 'number' ? status : undefined
  }
  return undefined
}

export function toAgeTransitionApiError(error: unknown, fallbackCode = 'UNKNOWN'): AgeTransitionApiError {
  if (error instanceof AgeTransitionApiError) return error
  if (isAxiosError(error)) {
    const payload = error.response?.data
    const code = readErrorCode(payload) ?? fallbackCode
    return new AgeTransitionApiError(code, 'AGE14_TRANSITION_ERROR', error.response?.status)
  }
  const code =
    error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
      ? error.code
      : fallbackCode
  return new AgeTransitionApiError(code, 'AGE14_TRANSITION_ERROR')
}

function unwrapEnvelope<T>(payload: unknown): T {
  const root = asRecord(payload)
  if (!root) return payload as T
  if (root.success === false) {
    throw new AgeTransitionApiError(readErrorCode(payload) ?? 'UNKNOWN', 'AGE14_TRANSITION_ERROR')
  }
  if (root.success === true && 'data' in root) {
    return root.data as T
  }
  return payload as T
}

export function parseAgeTransitionPortalStatus(payload: unknown): AgeTransitionPortalStatus {
  const data = asRecord(unwrapEnvelope<unknown>(payload)) ?? {}
  return {
    status: optionalString(data.status),
    transitionedAt: optionalString(data.transitionedAt) ?? null,
    noticePending: optionalBoolean(data.noticePending),
    guardianPersonalDataDeleted: optionalBoolean(data.guardianPersonalDataDeleted),
    identityVerificationRequired: optionalBoolean(data.identityVerificationRequired),
    choice: optionalString(data.choice),
    signupAgeOrigin: optionalString(data.signupAgeOrigin),
    signupUnder14: optionalBoolean(data.signupUnder14),
    eligible: optionalBoolean(data.eligible),
    completed: optionalBoolean(data.completed),
    convertedAt: optionalString(data.convertedAt) ?? null,
  }
}

export function parseAgeTransitionChoiceResult(payload: unknown): AgeTransitionChoiceResult {
  const data = asRecord(unwrapEnvelope<unknown>(payload)) ?? {}
  return {
    choice: optionalString(data.choice),
    transitionSelected: optionalBoolean(data.transitionSelected),
    guardianPersonalDataDeleted: optionalBoolean(data.guardianPersonalDataDeleted),
    status: optionalString(data.status),
  }
}

export function parseAgeTransitionCompletionResult(payload: unknown): AgeTransitionCompletionResult {
  const data = asRecord(unwrapEnvelope<unknown>(payload)) ?? {}
  return {
    status: optionalString(data.status),
    completed: optionalBoolean(data.completed),
    evidencePending: optionalBoolean(data.evidencePending),
    guardianConsentRowsDeleted: optionalNumber(data.guardianConsentRowsDeleted) ?? null,
    filePiiCleanupStatus: optionalString(data.filePiiCleanupStatus),
  }
}

export function parseAgeTransitionNiceValidateResult(payload: unknown): AgeTransitionNiceValidateResult {
  const data = asRecord(unwrapEnvelope<unknown>(payload)) ?? {}
  return {
    status: optionalString(data.status),
    identityVerified: optionalBoolean(data.identityVerified),
    transitionCompleted: optionalBoolean(data.transitionCompleted),
  }
}

export function parseAgeTransitionNiceSessionStatus(payload: unknown): AgeTransitionNiceSessionStatus {
  const data = asRecord(unwrapEnvelope<unknown>(payload)) ?? {}
  return {
    sessionId: optionalNumber(data.sessionId) ?? null,
    provider: optionalString(data.provider),
    status: optionalString(data.status),
    failureCode: optionalString(data.failureCode),
    verifiedAt: optionalString(data.verifiedAt) ?? null,
    expiresAt: optionalString(data.expiresAt) ?? null,
    usedAt: optionalString(data.usedAt) ?? null,
  }
}
