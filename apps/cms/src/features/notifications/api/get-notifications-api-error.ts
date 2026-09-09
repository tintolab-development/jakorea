import {
  extractApiErrorCode,
  extractApiErrorMessage,
  getApiErrorCode,
  getApiErrorHttpStatus,
  type ApiErrorEnvelope,
} from '@/shared/lib/extract-api-error-message'
import {
  MAIL_SENDER_EMAIL_NOT_REGISTERED_MESSAGE,
  MAIL_SENDER_EMAIL_REQUIRED_MESSAGE,
} from '@/features/notifications/model/mail-template/sender-email'
import {
  MAIL_TEMPLATE_NAME_INVALID_MESSAGE,
  MAIL_TEMPLATE_NAME_REQUIRED_MESSAGE,
} from '@/features/notifications/model/mail-template/template-name'
import { SCHEDULED_AT_MUST_BE_FUTURE_MESSAGE } from '@/features/notifications/model/send-scheduled-at'

const ERROR_CODE_MESSAGES: Record<string, string> = {
  CATEGORY_HAS_CHILDREN: '하위 카테고리 또는 템플릿이 있어 삭제할 수 없습니다.',
  NOTIFICATION_TEMPLATE_CATEGORY_NOT_FOUND:
    '카테고리를 찾을 수 없습니다. 동기화 또는 새로고침 후 다시 시도해 주세요.',
  NOTIFICATION_TEMPLATE_NOT_FOUND: '템플릿을 찾을 수 없습니다. 동기화 후 다시 시도해 주세요.',
  ALIMTALK_TEMPLATE_NOT_APPROVED: '카카오 승인이 완료되지 않은 템플릿은 발송할 수 없습니다.',
  ALIMTALK_SENDER_PROFILE_MISMATCH: '선택한 발신 프로필이 템플릿과 일치하지 않습니다.',
  NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING: '템플릿 필수 변수가 없습니다.',
  ALIMTALK_TEMPLATE_MANAGED_BY_NHN:
    '알림톡 템플릿 본문은 NHN Cloud에서 관리됩니다. CMS에서는 수정할 수 없습니다.',
  ALIMTALK_TEMPLATE_DELETE_REJECTED_BY_NHN:
    'NHN Console에서 템플릿 삭제가 거절되었습니다. 승인·공용 템플릿은 Console에서 확인해 주세요.',
  EMAIL_TEMPLATE_DELETE_REJECTED_BY_NHN:
    'NHN에서 메일 템플릿 삭제가 거절되었습니다. 잠시 후 다시 시도하거나 발신 프로필을 확인해 주세요.',
  DIRECT_RECIPIENT_AD_CONSENT_UNSUPPORTED:
    '직접 입력 수신자로는 광고성 템플릿을 발송할 수 없습니다.',
  NOTIFICATION_PROGRAM_REQUIRED_FOR_RECIPIENTS: '프로그램을 먼저 선택하세요.',
  NOTIFICATION_PROGRAM_REQUIRED_FOR_TEMPLATE_VARIABLES:
    '프로그램 필수 변수가 있어 프로그램을 선택하세요.',
  PROGRAM_NOT_FOUND:
    '선택한 프로그램이 없거나 잘못된 id입니다. 프로그램 목록을 다시 불러오세요.',
  NOTIFICATION_RECIPIENT_NOT_IN_PROGRAM:
    '선택한 수신자가 해당 프로그램 참여자가 아닙니다.',
  NOTIFICATION_ADMIN_RECIPIENT_NOT_IN_PROGRAM:
    '선택한 관리자가 해당 프로그램에 배정되어 있지 않습니다.',
  PROVIDER_UNAVAILABLE:
    '외부 연동 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.',
  DATABASE_ERROR: '데이터베이스 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  PROVIDER_CATEGORY_REQUIRED:
    '부모 카테고리가 NHN과 연결되어 있지 않습니다. 「동기화」를 먼저 실행한 뒤 다시 시도해 주세요.',
  EMAIL_ATTACHMENT_LIMIT_EXCEEDED: '파일은 최대 10개까지 첨부할 수 있습니다.',
  EMAIL_ATTACHMENT_TOTAL_SIZE_EXCEEDED: '파일은 총 최대 30MB까지 업로드할 수 있습니다.',
  EMAIL_ATTACHMENT_FORBIDDEN_EXTENSION: 'js, exe, bat 등 실행 파일은 첨부할 수 없습니다.',
  EMAIL_ATTACHMENT_FILE_NAME_TOO_LONG: '파일명은 최대 45자까지 가능합니다.',
  EMAIL_ATTACHMENT_OWNER_MISMATCH:
    '파일이 해당 메일 템플릿 소유가 아닙니다. 업로드 후 다시 첨부해 주세요.',
  EMAIL_TEMPLATE_FILE_OWNER_INVALID:
    '업로드 대상이 메일 템플릿이 아닙니다. 템플릿을 다시 선택한 뒤 첨부해 주세요.',
  FILE_NOT_CLEAN: '파일 검사가 완료되지 않았거나 사용할 수 없는 파일입니다. 다시 업로드해 주세요.',
  FILE_OBJECT_NOT_FOUND: '파일을 찾을 수 없습니다. 다시 업로드하거나 첨부를 확인해 주세요.',
  EMAIL_TEMPLATE_LANGUAGE_FREEMARKER_NOT_SUPPORTED:
    '메일 템플릿은 일반 텍스트만 지원합니다. FreeMarker 템플릿은 사용할 수 없습니다.',
  EMAIL_SENDER_PROFILE_MISMATCH: MAIL_SENDER_EMAIL_NOT_REGISTERED_MESSAGE,
  EMAIL_SENDER_PROFILE_NOT_HARVESTED: MAIL_SENDER_EMAIL_NOT_REGISTERED_MESSAGE,
  NOTIFICATION_SENDER_PROFILE_NOT_FOUND:
    '발신 프로필을 찾을 수 없습니다. 발신 프로필 동기화 후 다시 시도해 주세요.',
  EMAIL_TEMPLATE_NAME_INVALID: MAIL_TEMPLATE_NAME_INVALID_MESSAGE,
  EMAIL_CATEGORY_NOT_LINKED_TO_NHN: '카테고리 동기화 후 다시 시도해 주세요.',
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

function readErrorField(error: unknown): string | undefined {
  const data = readAxiosData(error)
  if (!data || typeof data !== 'object') return undefined
  const field = (data as ApiErrorEnvelope).error?.field
  return typeof field === 'string' && field.trim() ? field.trim() : undefined
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

function appendDebugMeta(
  message: string,
  error: unknown,
  options?: { code?: string; serverMessage?: string }
): string {
  const lines = [message]
  const code = options?.code?.trim()
  if (code) lines.push(`code: ${code}`)
  const serverMessage = options?.serverMessage?.trim()
  if (serverMessage && serverMessage !== message && serverMessage !== code) {
    lines.push(`message: ${serverMessage}`)
  }
  return appendTraceId(lines.join('\n'), error, true)
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

function looksLikeDisplayNameRequired(message: string, field?: string): boolean {
  if (field === 'displayName') return true
  const text = message.toLowerCase()
  return (
    text.includes('displayname is required') ||
    text.includes('display_name is required') ||
    (text.includes('displayname') &&
      (text.includes('required') || text.includes('필수') || text.includes('missing')))
  )
}

function looksLikeSenderEmailRequired(message: string, field?: string): boolean {
  if (
    field === 'providerSenderEmailAddress' ||
    field === 'provider_sender_email_address'
  ) {
    return true
  }
  const text = message.toLowerCase()
  return (
    text.includes('providersenderemailaddress') ||
    (text.includes('email template requires') && text.includes('sender'))
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
  const field = readErrorField(error)
  const serverMessage =
    data != null
      ? extractApiErrorMessage(data, { httpStatus: status, fallback: '' }).trim()
      : ''

  if (code === 'EMAIL_TEMPLATE_NAME_INVALID' || (field === 'displayName' && /invalid|정규|허용/.test(serverMessage))) {
    return MAIL_TEMPLATE_NAME_INVALID_MESSAGE
  }

  if (
    looksLikeDisplayNameRequired(serverMessage, field) ||
    (code === 'MISSING_PARAMETER' && looksLikeDisplayNameRequired(serverMessage, field))
  ) {
    return MAIL_TEMPLATE_NAME_REQUIRED_MESSAGE
  }

  if (looksLikeSenderEmailRequired(serverMessage, field)) {
    return MAIL_SENDER_EMAIL_REQUIRED_MESSAGE
  }

  if (
    code === 'EMAIL_SENDER_PROFILE_MISMATCH' ||
    code === 'EMAIL_SENDER_PROFILE_NOT_HARVESTED'
  ) {
    return MAIL_SENDER_EMAIL_NOT_REGISTERED_MESSAGE
  }

  if (code === 'NOTIFICATION_SENDER_PROFILE_NOT_FOUND') {
    return ERROR_CODE_MESSAGES.NOTIFICATION_SENDER_PROFILE_NOT_FOUND
  }

  if (code === 'EMAIL_CATEGORY_NOT_LINKED_TO_NHN') {
    return appendTraceId(ERROR_CODE_MESSAGES.EMAIL_CATEGORY_NOT_LINKED_TO_NHN, error, true)
  }

  if (status === 503 || code === 'PROVIDER_UNAVAILABLE') {
    const base = ERROR_CODE_MESSAGES.PROVIDER_UNAVAILABLE
    return appendDebugMeta(`${base}\n\n${PROVIDER_UNAVAILABLE_HINT}`, error, {
      code: code || 'PROVIDER_UNAVAILABLE',
      serverMessage,
    })
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
  if (code === 'EMAIL_TEMPLATE_DELETE_REJECTED_BY_NHN') {
    if (serverMessage && serverMessage !== code) return serverMessage
    return ERROR_CODE_MESSAGES.EMAIL_TEMPLATE_DELETE_REJECTED_BY_NHN
  }
  if (code === 'PROGRAM_NOT_FOUND') {
    // BE "프로그램을 찾을 수 없습니다."는 권한/장애로 오해되기 쉬움 → FE 고정 문구
    return ERROR_CODE_MESSAGES.PROGRAM_NOT_FOUND
  }
  if (
    code === 'NOTIFICATION_TEMPLATE_CATEGORY_NOT_FOUND' ||
    code === 'NOTIFICATION_TEMPLATE_NOT_FOUND' ||
    code === 'NOTIFICATION_DELIVERY_NOT_FOUND'
  ) {
    if (code === 'NOTIFICATION_DELIVERY_NOT_FOUND') {
      return '발송 내역을 찾을 수 없습니다.'
    }
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
    code === 'DIRECT_RECIPIENT_AD_CONSENT_UNSUPPORTED' ||
    code === 'NOTIFICATION_PROGRAM_REQUIRED_FOR_RECIPIENTS' ||
    code === 'NOTIFICATION_PROGRAM_REQUIRED_FOR_TEMPLATE_VARIABLES' ||
    code === 'NOTIFICATION_RECIPIENT_NOT_IN_PROGRAM' ||
    code === 'NOTIFICATION_ADMIN_RECIPIENT_NOT_IN_PROGRAM'
  ) {
    return ERROR_CODE_MESSAGES[code] || serverMessage
  }
  if (code === 'NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING') {
    const token = serverMessage.includes(':')
      ? serverMessage.split(':').slice(1).join(':').trim()
      : ''
    if (token && !token.startsWith('NOTIFICATION_')) {
      return `템플릿 필수 변수가 없습니다: ${token}`
    }
    const fromRaw = (serverMessage || '').replace(
      /^NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:?\s*/,
      ''
    ).trim()
    return fromRaw
      ? `템플릿 필수 변수가 없습니다: ${fromRaw}`
      : ERROR_CODE_MESSAGES.NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING
  }
  if (
    code === 'EMAIL_ATTACHMENT_LIMIT_EXCEEDED' ||
    code === 'EMAIL_ATTACHMENT_TOTAL_SIZE_EXCEEDED' ||
    code === 'EMAIL_ATTACHMENT_FORBIDDEN_EXTENSION' ||
    code === 'EMAIL_ATTACHMENT_FILE_NAME_TOO_LONG' ||
    code === 'EMAIL_ATTACHMENT_OWNER_MISMATCH' ||
    code === 'EMAIL_TEMPLATE_FILE_OWNER_INVALID' ||
    code === 'FILE_NOT_CLEAN' ||
    code === 'FILE_OBJECT_NOT_FOUND' ||
    code === 'EMAIL_TEMPLATE_LANGUAGE_FREEMARKER_NOT_SUPPORTED'
  ) {
    const mapped = ERROR_CODE_MESSAGES[code]
    if (serverMessage && serverMessage !== code) return serverMessage
    return mapped || fallback
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
  if (
    code === 'PROVIDER_CATEGORY_REQUIRED' ||
    code === 'CATEGORY_PROVIDER_REQUIRED' ||
    code === 'EMAIL_CATEGORY_NOT_LINKED_TO_NHN'
  ) {
    return true
  }
  if (getApiErrorHttpStatus(error) !== 400) return false
  const data = readAxiosData(error)
  const message =
    data != null ? extractApiErrorMessage(data, { httpStatus: 400, fallback: '' }) : ''
  return looksLikeNeedsSyncMessage(message)
}

/** 발송 배치 POST 전용 — INVALID_VALUE는 예약 시각 재확인 CTA */
export function getNotificationSendBatchErrorMessage(error: unknown, fallback: string): string {
  const code = getApiErrorCode(error) ?? extractApiErrorCode(readAxiosData(error))
  // BE: scheduledAt must be in the future → INVALID_VALUE (field=null, 일반 문구)
  if (code === 'INVALID_VALUE') {
    return `${SCHEDULED_AT_MUST_BE_FUTURE_MESSAGE} 예약 발송 시각을 다시 확인해 주세요.`
  }
  return getNotificationsApiErrorMessage(error, fallback)
}
