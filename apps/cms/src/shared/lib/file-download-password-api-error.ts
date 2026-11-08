import {
  isFileDownloadPasswordErrorCode,
  messageForProtectedDownloadErrorCode,
} from '@jakorea/domain/shared/file-download-password'

function readAxiosErrorData(error: unknown): unknown {
  if (!error || typeof error !== 'object' || !('response' in error)) return undefined
  return (error as { response?: { data?: unknown } }).response?.data
}

function readErrorCode(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const envelope = data as { error?: { code?: unknown }; code?: unknown }
  if (typeof envelope.error?.code === 'string') return envelope.error.code
  if (typeof envelope.code === 'string') return envelope.code
  return undefined
}

function readErrorField(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const field = (data as { error?: { field?: unknown } }).error?.field
  return typeof field === 'string' ? field : undefined
}

function readErrorMessage(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const message = (data as { message?: unknown }).message
  return typeof message === 'string' && message.trim() ? message.trim() : undefined
}

/** 400 error.code + field=password 를 암호 입력 폼 에러로 쓴다. */
export function getFileDownloadPasswordFormError(error: unknown): string | null {
  const data = readAxiosErrorData(error)
  const code = readErrorCode(data)
  if (!isFileDownloadPasswordErrorCode(code)) return null
  const field = readErrorField(data)
  if (field && field !== 'password') return null
  return readErrorMessage(data) ?? messageForProtectedDownloadErrorCode(code) ?? null
}

export function isFileDownloadPasswordApiError(error: unknown): boolean {
  return isFileDownloadPasswordErrorCode(readErrorCode(readAxiosErrorData(error)))
}
