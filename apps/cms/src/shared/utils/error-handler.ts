/**
 * 공통 에러 처리 유틸리티
 */

export const ErrorType = {
  NETWORK: 'NETWORK',
  SERVER: 'SERVER',
  VALIDATION: 'VALIDATION',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  UNKNOWN: 'UNKNOWN',
} as const

export type ErrorType = (typeof ErrorType)[keyof typeof ErrorType]

export interface ErrorInfo {
  type: ErrorType
  detail: string
  originalError?: unknown
}

/** 폼 필드 검증 오류 표시 (FieldError.message 미사용) */
export function fieldValidationHelp(error: unknown): string | undefined {
  return error ? '입력값을 확인해주세요.' : undefined
}

/** unknown 에러를 짧은 문자열로 (Error.prototype.message 미사용) */
export function unknownErrorText(error: unknown, fallback: string): string {
  if (error == null) return fallback
  if (typeof error === 'string' && error.trim()) return error
  return fallback
}

export function classifyError(error: unknown): ErrorType {
  if (!error) return ErrorType.UNKNOWN as ErrorType

  const errorText = String(error).toLowerCase()

  if (
    errorText.includes('network') ||
    errorText.includes('fetch') ||
    errorText.includes('connection') ||
    errorText.includes('timeout') ||
    (error instanceof Error &&
      (error.name === 'NetworkError' || error.name === 'TypeError'))
  ) {
    return ErrorType.NETWORK as ErrorType
  }

  if (errorText.includes('not found') || errorText.includes('404')) {
    return ErrorType.NOT_FOUND as ErrorType
  }

  if (errorText.includes('unauthorized') || errorText.includes('401')) {
    return ErrorType.UNAUTHORIZED as ErrorType
  }

  if (errorText.includes('forbidden') || errorText.includes('403')) {
    return ErrorType.FORBIDDEN as ErrorType
  }

  if (
    errorText.includes('validation') ||
    errorText.includes('invalid') ||
    errorText.includes('400') ||
    errorText.includes('422')
  ) {
    return ErrorType.VALIDATION as ErrorType
  }

  if (
    errorText.includes('server') ||
    errorText.includes('internal') ||
    errorText.includes('500')
  ) {
    return ErrorType.SERVER as ErrorType
  }

  return ErrorType.UNKNOWN as ErrorType
}

export function getUserFriendlyDetail(errorType: ErrorType, defaultDetail?: string): string {
  if (defaultDetail) return defaultDetail

  switch (errorType) {
    case ErrorType.NETWORK:
      return '네트워크 연결에 문제가 발생했습니다. 인터넷 연결을 확인해주세요.'
    case ErrorType.NOT_FOUND:
      return '요청한 데이터를 찾을 수 없습니다.'
    case ErrorType.UNAUTHORIZED:
      return '인증이 필요합니다. 다시 로그인해주세요.'
    case ErrorType.FORBIDDEN:
      return '접근 권한이 없습니다.'
    case ErrorType.VALIDATION:
      return '입력한 정보를 확인해주세요.'
    case ErrorType.SERVER:
      return '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
    case ErrorType.UNKNOWN:
    default:
      return '오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  }
}

export function extractErrorInfo(error: unknown, defaultDetail?: string): ErrorInfo {
  const type = classifyError(error)
  const detail = getUserFriendlyDetail(type, defaultDetail)

  return {
    type,
    detail,
    originalError: error,
  }
}

function logError(errorInfo: ErrorInfo, context?: string) {
  if (import.meta.env.DEV) {
    console.error(`[Error Handler]${context ? ` [${context}]` : ''}`, {
      type: errorInfo.type,
      detail: errorInfo.detail,
      originalError: errorInfo.originalError,
    })
  }
}

export function handleError(
  error: unknown,
  options?: {
    defaultMessage?: string
    context?: string
  }
): ErrorInfo {
  const { defaultMessage: defaultDetail, context } = options || {}
  const errorInfo = extractErrorInfo(error, defaultDetail)
  logError(errorInfo, context)
  return errorInfo
}

export async function executeWithErrorHandling<T>(
  fn: () => Promise<T>,
  options?: {
    defaultMessage?: string
    context?: string
    onError?: (errorInfo: ErrorInfo) => void
  }
): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    const errorInfo = handleError(error, options)
    options?.onError?.(errorInfo)
    return null
  }
}

export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  options?: {
    errorMessage?: string
    onSuccess?: (result: T) => void | Promise<void>
    onError?: (error: Error) => void
    context?: string
  }
): Promise<T | undefined> {
  try {
    const result = await operation()

    if (options?.onSuccess) {
      await options.onSuccess(result)
    }

    return result
  } catch (error) {
    const errorInfo = handleError(error, {
      defaultMessage: options?.errorMessage,
      context: options?.context,
    })

    if (options?.onError) {
      options.onError(new Error(errorInfo.detail))
    }

    return undefined
  }
}
