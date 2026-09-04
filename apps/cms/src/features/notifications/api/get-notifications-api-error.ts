import {
  extractApiErrorCode,
  extractApiErrorMessage,
  getApiErrorCode,
  getApiErrorHttpStatus,
  type ApiErrorEnvelope,
} from '@/shared/lib/extract-api-error-message'

const ERROR_CODE_MESSAGES: Record<string, string> = {
  CATEGORY_HAS_CHILDREN: '하위 카테고리 또는 템플릿이 있어 삭제할 수 없습니다.',
  NOTIFICATION_TEMPLATE_CATEGORY_NOT_FOUND:
    '카테고리를 찾을 수 없습니다. 동기화 또는 새로고침 후 다시 시도해 주세요.',
  NOTIFICATION_TEMPLATE_NOT_FOUND: '템플릿을 찾을 수 없습니다. 동기화 후 다시 시도해 주세요.',
  ALIMTALK_TEMPLATE_NOT_APPROVED: '카카오 승인이 완료되지 않은 템플릿은 발송할 수 없습니다.',
  ALIMTALK_SENDER_PROFILE_MISMATCH: '선택한 발신 프로필이 템플릿과 일치하지 않습니다.',
  ALIMTALK_TEMPLATE_MANAGED_BY_NHN:
    '알림톡 템플릿 본문은 NHN Cloud에서 관리됩니다. CMS에서는 수정할 수 없습니다.',
  ALIMTALK_TEMPLATE_DELETE_REJECTED_BY_NHN:
    'NHN Console에서 템플릿 삭제가 거절되었습니다. 승인·공용 템플릿은 Console에서 확인해 주세요.',
  DIRECT_RECIPIENT_AD_CONSENT_UNSUPPORTED:
    '직접 입력 수신자로는 해당 유형의 알림톡을 발송할 수 없습니다.',
  PROVIDER_UNAVAILABLE:
    '외부 연동 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.',
  DATABASE_ERROR: '데이터베이스 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  PROVIDER_CATEGORY_REQUIRED:
    '부모 카테고리가 NHN과 연결되어 있지 않습니다. 「동기화」를 먼저 실행한 뒤 다시 시도해 주세요.',
}

const PROVIDER_UNAVAILABLE_HINT =
  'CMS→BE 호출은 정상입니다. BE·NHN 연동(AppKey/네트워크/JA_NOTIFICATION_MODE)을 확인해 주세요.'

const DATABASE_ERROR_HINT =
  '잠시 후 다시 시도해 주세요. 지속되면 BE 로그에 traceId를 전달해 주세요.'

const SYNC_FIRST_HINT =
  '「동기화」를 먼저 실행해 NHN 카테고리를 맞춘 뒤 다시 시도해 주세요.'

function readAxiosData(error: unknown): unknown {
  if (!error || typeof error !== 'object' || !('response' in error)) return undefined
  return (error as { response?: { data?: unknown } }).response?.data
}

export function getNotificationsApiTraceId(error: unknown): string | undefined {
  const data = readAxiosData(error)
  if (!data || typeof data !== 'object') return undefined
  const envelope = data as ApiErrorEnvelope
  const nested = envelope.error?.traceId?.trim()
  if (nested) return nested
  const top = envelope.traceId?.trim()
  return top || undefined
}

/** 503/500 등은 항상, 그 외는 개발 모드에서만 traceId 노출 */
function appendTraceId(message: string, error: unknown, force = false): string {
  const traceId = getNotificationsApiTraceId(error)
  if (!traceId) return message
  if (!force && !import.meta.env.DEV) return message
  return `${message}\n\ntraceId: ${traceId}`
}

function looksLikeNeedsSyncMessage(message: string): boolean {
  const text = message.toLowerCase()
  return (
    text.includes('provider_category') ||
    text.includes('providercategory') ||
    text.includes('동기화') ||
    text.includes('provider category')
  )
}

export function getNotificationsApiErrorMessage(error: unknown, fallback: string): string {
  const status = getApiErrorHttpStatus(error)
  if (status === 403) {
    return '알림 관리 조회 권한이 없습니다. 관리자 계정으로 다시 로그인해 주세요.'
  }
  if (status === 401) {
    return '세션이 만료되었습니다. 다시 로그인해 주세요.'
  }

  const data = readAxiosData(error)
  const code = getApiErrorCode(error) ?? extractApiErrorCode(data)
  const serverMessage =
    data != null
      ? extractApiErrorMessage(data, { httpStatus: status, fallback: '' }).trim()
      : ''

  if (status === 503 || code === 'PROVIDER_UNAVAILABLE') {
    const base = serverMessage || ERROR_CODE_MESSAGES.PROVIDER_UNAVAILABLE
    return appendTraceId(`${base}\n\n${PROVIDER_UNAVAILABLE_HINT}`, error, true)
  }

  if (code === 'DATABASE_ERROR' || status === 500) {
    const base = serverMessage || ERROR_CODE_MESSAGES.DATABASE_ERROR
    return appendTraceId(`${base}\n\n${DATABASE_ERROR_HINT}`, error, true)
  }

  if (code === 'CATEGORY_HAS_CHILDREN') {
    return ERROR_CODE_MESSAGES.CATEGORY_HAS_CHILDREN
  }
  if (code === 'ALIMTALK_TEMPLATE_DELETE_REJECTED_BY_NHN') {
    return serverMessage || ERROR_CODE_MESSAGES.ALIMTALK_TEMPLATE_DELETE_REJECTED_BY_NHN
  }
  if (
    code === 'NOTIFICATION_TEMPLATE_CATEGORY_NOT_FOUND' ||
    code === 'NOTIFICATION_TEMPLATE_NOT_FOUND'
  ) {
    return (
      ERROR_CODE_MESSAGES[code] ??
      serverMessage ??
      '요청한 리소스를 찾을 수 없습니다.'
    )
  }
  if (code === 'ALIMTALK_TEMPLATE_MANAGED_BY_NHN') {
    return ERROR_CODE_MESSAGES.ALIMTALK_TEMPLATE_MANAGED_BY_NHN
  }

  if (
    code === 'PROVIDER_CATEGORY_REQUIRED' ||
    code === 'CATEGORY_PROVIDER_REQUIRED' ||
    (status === 400 && looksLikeNeedsSyncMessage(serverMessage))
  ) {
    const base =
      serverMessage || ERROR_CODE_MESSAGES.PROVIDER_CATEGORY_REQUIRED
    const withHint = base.includes('동기화') ? base : `${base}\n\n${SYNC_FIRST_HINT}`
    return appendTraceId(withHint, error, true)
  }

  if (code && ERROR_CODE_MESSAGES[code] && !serverMessage) {
    return ERROR_CODE_MESSAGES[code]
  }
  if (code && ERROR_CODE_MESSAGES[code] && serverMessage) {
    return serverMessage
  }

  if (serverMessage) return appendTraceId(serverMessage, error)

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return fallback
}

export function isCategoryHasChildrenError(error: unknown): boolean {
  return getApiErrorCode(error) === 'CATEGORY_HAS_CHILDREN'
}

export function isAlimtalkTemplateDeleteRejectedByNhnError(error: unknown): boolean {
  return getApiErrorCode(error) === 'ALIMTALK_TEMPLATE_DELETE_REJECTED_BY_NHN'
}

export function isAlimtalkTemplateManagedByNhnError(error: unknown): boolean {
  return getApiErrorCode(error) === 'ALIMTALK_TEMPLATE_MANAGED_BY_NHN'
}

export function isProviderUnavailableError(error: unknown): boolean {
  const code = getApiErrorCode(error)
  return code === 'PROVIDER_UNAVAILABLE' || getApiErrorHttpStatus(error) === 503
}

/** 부모 카테고리 NHN 미연결 등 → 동기화 유도 */
export function isCategoryNeedsSyncError(error: unknown): boolean {
  const code = getApiErrorCode(error)
  if (code === 'PROVIDER_CATEGORY_REQUIRED' || code === 'CATEGORY_PROVIDER_REQUIRED') {
    return true
  }
  if (getApiErrorHttpStatus(error) !== 400) return false
  const data = readAxiosData(error)
  const message =
    data != null ? extractApiErrorMessage(data, { httpStatus: 400, fallback: '' }) : ''
  return looksLikeNeedsSyncMessage(message)
}
