import { isAxiosError } from 'axios'
import {
  MemberFileConfirmError,
  MemberFileEmptyError,
  MemberFileRejectedError,
  MemberFileScanTimeoutError,
  MemberFileStatusCheckError,
  MemberFileStorageUploadError,
  MemberFileTooLargeError,
  MemberFileTypeNotAllowedError,
  MemberFileUploadRequestError,
} from '../api/member-file-upload'
import {
  CRIME_CONSENT_MESSAGES,
  CrimeConsentOriginalNotReadyError,
  readCrimeConsentErrorCodeFromBody,
  resolveCrimeConsentApiErrorMessage,
} from './crime-consent-original'
import { CrimeConsentSubmitError } from './crime-consent-submit'

export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (isAxiosError(error) && error.code === 'ERR_CANCELED')
  )
}

function unwrapFileStepError(error: unknown): unknown {
  if (
    error instanceof MemberFileUploadRequestError ||
    error instanceof MemberFileStorageUploadError ||
    error instanceof MemberFileConfirmError ||
    error instanceof MemberFileStatusCheckError
  ) {
    return error.originalError
  }
  return error
}

/** 응답 자체를 받지 못한 실패 (axios 무응답 · fetch TypeError) */
function isNetworkFailure(error: unknown): boolean {
  if (isAxiosError(error)) return error.response == null
  return error instanceof TypeError
}

function resolveAxiosMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback
  if (error.response == null) return CRIME_CONSENT_MESSAGES.network
  return resolveCrimeConsentApiErrorMessage(
    {
      code: readCrimeConsentErrorCodeFromBody(error.response.data),
      status: error.response.status,
    },
    fallback,
  )
}

/** 업로드·보안 검사 단계 오류 → 안내 문구. 검사 실패·시간 초과·네트워크를 구분한다. */
export function resolveCrimeConsentUploadErrorMessage(error: unknown): string {
  if (error instanceof MemberFileTypeNotAllowedError) return CRIME_CONSENT_MESSAGES.fileType
  if (error instanceof MemberFileTooLargeError) return CRIME_CONSENT_MESSAGES.fileSize
  if (error instanceof MemberFileEmptyError) return CRIME_CONSENT_MESSAGES.fileEmpty
  if (error instanceof MemberFileRejectedError) return CRIME_CONSENT_MESSAGES.scanRejected
  if (error instanceof MemberFileScanTimeoutError) return CRIME_CONSENT_MESSAGES.scanTimeout
  const original = unwrapFileStepError(error)
  if (isNetworkFailure(original)) return CRIME_CONSENT_MESSAGES.network
  return resolveAxiosMessage(original, CRIME_CONSENT_MESSAGES.uploadFailed)
}

/** 제출(재확인·create·complete) 단계 오류 → 안내 문구 */
export function resolveCrimeConsentSubmitErrorMessage(error: unknown): string {
  if (error instanceof CrimeConsentOriginalNotReadyError) return error.message
  if (error instanceof CrimeConsentSubmitError) return error.message
  return resolveAxiosMessage(error, CRIME_CONSENT_MESSAGES.submitFailed)
}
