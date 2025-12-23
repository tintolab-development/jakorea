/**
 * 공통 에러 처리 유틸리티
 * Phase 1.4: 에러 처리 일관화
 */

import { message } from 'antd'

/**
 * 에러 타입 분류
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

/**
 * 에러 정보 인터페이스
 */
export interface ErrorInfo {
  type: ErrorType
  message: string
  originalError?: unknown
}

/**
 * 에러 타입 분류 함수
 */
export function classifyError(error: unknown): ErrorType {
  if (!error) return ErrorType.UNKNOWN as ErrorType

  // Error 객체인 경우
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase()

    // 네트워크 에러
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      error.name === 'NetworkError' ||
      error.name === 'TypeError'
    ) {
      return ErrorType.NETWORK as ErrorType
    }

    // 404 에러
    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      return ErrorType.NOT_FOUND as ErrorType
    }

    // 401 에러
    if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
      return ErrorType.UNAUTHORIZED as ErrorType
    }

    // 403 에러
    if (errorMessage.includes('forbidden') || errorMessage.includes('403')) {
      return ErrorType.FORBIDDEN as ErrorType
    }

    // 400, 422 등 Validation 에러
    if (
      errorMessage.includes('validation') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('400') ||
      errorMessage.includes('422')
    ) {
      return ErrorType.VALIDATION as ErrorType
    }

    // 500 등 서버 에러
    if (
      errorMessage.includes('server') ||
      errorMessage.includes('internal') ||
      errorMessage.includes('500')
    ) {
      return ErrorType.SERVER as ErrorType
    }
  }

  // 문자열인 경우
  if (typeof error === 'string') {
    const errorMessage = error.toLowerCase()
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return ErrorType.NETWORK as ErrorType
    }
    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      return ErrorType.NOT_FOUND as ErrorType
    }
  }

  return ErrorType.UNKNOWN as ErrorType
}

/**
 * 사용자 친화적 에러 메시지 생성
 */
export function getUserFriendlyMessage(errorType: ErrorType, defaultMessage?: string): string {
  if (defaultMessage) return defaultMessage

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

/**
 * 에러 정보 추출
 */
export function extractErrorInfo(error: unknown, defaultMessage?: string): ErrorInfo {
  const type = classifyError(error)
  const message = getUserFriendlyMessage(type, defaultMessage)

  return {
    type,
    message,
    originalError: error,
  }
}

/**
 * 에러 로깅 (개발 환경)
 */
function logError(errorInfo: ErrorInfo, context?: string) {
  if (import.meta.env.DEV) {
    console.error(`[Error Handler]${context ? ` [${context}]` : ''}`, {
      type: errorInfo.type,
      message: errorInfo.message,
      originalError: errorInfo.originalError,
    })
  }
}

/**
 * 에러 처리 및 사용자 알림
 * @param error - 에러 객체
 * @param defaultMessage - 기본 메시지 (선택)
 * @param context - 에러 발생 컨텍스트 (로깅용, 선택)
 * @param showMessage - Ant Design message 표시 여부 (기본: true)
 * @returns 에러 정보
 */
export function handleError(
  error: unknown,
  options?: {
    defaultMessage?: string
    context?: string
    showMessage?: boolean
  }
): ErrorInfo {
  const { defaultMessage, context, showMessage = true } = options || {}
  const errorInfo = extractErrorInfo(error, defaultMessage)

  // 로깅
  logError(errorInfo, context)

  // 사용자 알림
  if (showMessage) {
    message.error(errorInfo.message)
  }

  return errorInfo
}

/**
 * 비동기 함수 실행 및 에러 처리
 * @param fn - 실행할 비동기 함수
 * @param options - 옵션
 * @returns 함수 실행 결과 또는 null (에러 발생 시)
 */
export async function executeWithErrorHandling<T>(
  fn: () => Promise<T>,
  options?: {
    defaultMessage?: string
    context?: string
    showMessage?: boolean
    onError?: (errorInfo: ErrorInfo) => void
  }
): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    const errorInfo = handleError(error, options)
    if (options?.onError) {
      options.onError(errorInfo)
    }
    return null
  }
}

/**
 * 성공 메시지 표시 헬퍼
 */
export function showSuccessMessage(messageText: string) {
  message.success(messageText)
}

/**
 * 정보 메시지 표시 헬퍼
 */
export function showInfoMessage(messageText: string) {
  message.info(messageText)
}

/**
 * 경고 메시지 표시 헬퍼
 */
export function showWarningMessage(messageText: string) {
  message.warning(messageText)
}

