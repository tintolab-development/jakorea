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
  MAIL_SENDER_PROFILE_MISMATCH_MESSAGE,
  MAIL_SENDER_PROFILES_EMPTY_MESSAGE,
} from '@/features/notifications/model/mail-template/sender-email'
import {
  SMS_CATEGORY_PARENT_NOT_LINKED_MESSAGE,
  SMS_SENDER_PHONE_REQUIRED_MESSAGE,
  SMS_TEMPLATE_DELETE_REJECTED_BY_NHN_MESSAGE,
} from '@/features/notifications/model/sms-template/sender-phone'
import {
  MAIL_TEMPLATE_NAME_INVALID_MESSAGE,
  MAIL_TEMPLATE_NAME_REQUIRED_MESSAGE,
} from '@/features/notifications/model/mail-template/template-name'
import { SCHEDULED_AT_MUST_BE_FUTURE_MESSAGE } from '@/features/notifications/model/send-scheduled-at'
import {
  formatNotificationFailedReason,
  formatNotificationMissingVariablesMessage,
  parseNotificationMissingVariableKeys,
} from '@/features/notifications/model/shared/format-notification-failed-reason'
import { NOTIFICATION_REQUIRED_VARIABLE_MISSING_HINT } from '@/features/notifications/model/shared/send-ux-copy'

const ERROR_CODE_MESSAGES: Record<string, string> = {
  CATEGORY_HAS_CHILDREN: '하위 카테고리 또는 템플릿이 있어 삭제할 수 없습니다.',
  NOTIFICATION_TEMPLATE_CATEGORY_NOT_FOUND:
    '카테고리를 찾을 수 없습니다. 동기화 또는 새로고침 후 다시 시도해 주세요.',
  NOTIFICATION_TEMPLATE_NOT_FOUND: '템플릿을 찾을 수 없습니다. 동기화 후 다시 시도해 주세요.',
  ALIMTALK_TEMPLATE_NOT_APPROVED: '카카오 승인이 완료되지 않은 템플릿은 발송할 수 없습니다.',
  ALIMTALK_SENDER_PROFILE_MISMATCH: '선택한 발신 프로필이 템플릿과 일치하지 않습니다.',
  NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING: '템플릿 필수 변수가 없습니다.',
  NOTIFICATION_TEMPLATE_VARIABLE_SCOPE_DISABLED:
    '선택한 템플릿에 현재 프로그램 또는 수신자 유형에서 사용할 수 없는 변수가 포함되어 있습니다. 템플릿과 수신자 설정을 다시 확인해 주세요.',
  NOTIFICATION_SERVER_RESERVED_VARIABLE:
    '서버가 채우는 예약 변수는 발송 요청에 넣을 수 없습니다.',
  ALIMTALK_TEMPLATE_MANAGED_BY_NHN:
    '알림톡 템플릿 본문은 NHN Cloud에서 관리됩니다. CMS에서는 수정할 수 없습니다.',
  ALIMTALK_TEMPLATE_DELETE_REJECTED_BY_NHN:
    'NHN Console에서 템플릿 삭제가 거절되었습니다. 승인·공용 템플릿은 Console에서 확인해 주세요.',
  EMAIL_TEMPLATE_DELETE_REJECTED_BY_NHN:
    'NHN에서 메일 템플릿 삭제가 거절되었습니다. 잠시 후 다시 시도하거나 발신 프로필을 확인해 주세요.',
  SMS_TEMPLATE_DELETE_REJECTED_BY_NHN: SMS_TEMPLATE_DELETE_REJECTED_BY_NHN_MESSAGE,
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
  NOTIFICATION_CATEGORY_PARENT_NOT_LINKED_TO_NHN: SMS_CATEGORY_PARENT_NOT_LINKED_MESSAGE,
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
  EMAIL_SENDER_PROFILE_MISMATCH: MAIL_SENDER_PROFILE_MISMATCH_MESSAGE,
  EMAIL_SENDER_PROFILE_NOT_HARVESTED: MAIL_SENDER_EMAIL_NOT_REGISTERED_MESSAGE,
  EMAIL_SENDER_PROFILES_EMPTY: MAIL_SENDER_PROFILES_EMPTY_MESSAGE,
  NOTIFICATION_SENDER_PROFILE_NOT_FOUND:
    '발신 프로필을 찾을 수 없습니다. 발신 프로필 동기화 후 다시 시도해 주세요.',
  EMAIL_TEMPLATE_NAME_INVALID: MAIL_TEMPLATE_NAME_INVALID_MESSAGE,
  EMAIL_CATEGORY_NOT_LINKED_TO_NHN: '카테고리 동기화 후 다시 시도해 주세요.',
  // MMS 첨부 (BE error.message 우선, 없을 때만 아래 문구)
  NOTIFICATION_ATTACHMENT_ONLY_MMS: '첨부 파일은 MMS 발송에서만 사용할 수 있습니다.',
  NOTIFICATION_MMS_ATTACHMENT_FORMAT_INVALID:
    'MMS 첨부는 JPG/JPEG 이미지이며 파일명은 40자 이내, 공백 없이 입력해 주세요.',
  NOTIFICATION_MMS_ATTACHMENT_SIZE_INVALID:
    'MMS 첨부 이미지는 파일당 300KiB 이하이며 합계 600KiB 이하여야 합니다.',
  NOTIFICATION_MMS_ATTACHMENT_COUNT_INVALID: 'MMS 첨부는 최대 2개까지 등록할 수 있습니다.',
  NOTIFICATION_MMS_ATTACHMENT_RESOLUTION_INVALID:
    'MMS 첨부 이미지는 가로 1500px, 세로 1440px 이하만 등록할 수 있습니다.',
  NOTIFICATION_MMS_ATTACHMENT_NOT_FOUND: 'MMS 첨부 파일을 찾을 수 없습니다.',
  NOTIFICATION_MMS_ATTACHMENT_NOT_AVAILABLE:
    'MMS 첨부 파일이 아직 준비되지 않았거나 만료·삭제되었습니다. 파일을 다시 등록해 주세요.',
  NOTIFICATION_MMS_ATTACHMENT_OWNER_MISMATCH:
    'MMS 첨부 파일의 업로드 용도 또는 소유자가 올바르지 않습니다.',
  NOTIFICATION_MMS_ATTACHMENT_DUPLICATE: '같은 MMS 첨부 파일을 중복해서 등록할 수 없습니다.',
  NOTIFICATION_MMS_ATTACHMENT_UPLOAD_FAILED:
    'MMS 첨부를 발송 서비스에 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.',
}

/** MMS 첨부 오류 코드 — 발송 화면에서 첨부 영역으로 안내 */
export const NOTIFICATION_MMS_ATTACHMENT_ERROR_CODES = [
  'NOTIFICATION_ATTACHMENT_ONLY_MMS',
  'NOTIFICATION_MMS_ATTACHMENT_FORMAT_INVALID',
  'NOTIFICATION_MMS_ATTACHMENT_SIZE_INVALID',
  'NOTIFICATION_MMS_ATTACHMENT_COUNT_INVALID',
  'NOTIFICATION_MMS_ATTACHMENT_RESOLUTION_INVALID',
  'NOTIFICATION_MMS_ATTACHMENT_NOT_FOUND',
  'NOTIFICATION_MMS_ATTACHMENT_NOT_AVAILABLE',
  'NOTIFICATION_MMS_ATTACHMENT_OWNER_MISMATCH',
  'NOTIFICATION_MMS_ATTACHMENT_DUPLICATE',
  'NOTIFICATION_MMS_ATTACHMENT_UPLOAD_FAILED',
] as const

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
    text.includes('parent_not_linked') ||
    text.includes('not_linked_to_nhn') ||
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

/** BE: SMS template requires providerSenderPhoneNumber when NHN catalog is enabled */
function looksLikeSenderPhoneRequired(message: string, field?: string): boolean {
  if (
    field === 'providerSenderPhoneNumber' ||
    field === 'provider_sender_phone_number'
  ) {
    return true
  }
  const text = message.toLowerCase()
  return (
    text.includes('providersenderphonenumber') ||
    (text.includes('sms template requires') && text.includes('sender'))
  )
}

const PROGRAM_REQUIRED_FOR_TEMPLATE_VARIABLES = 'NOTIFICATION_PROGRAM_REQUIRED_FOR_TEMPLATE_VARIABLES'
const TEMPLATE_VARIABLE_SCOPE_DISABLED = 'NOTIFICATION_TEMPLATE_VARIABLE_SCOPE_DISABLED'

function parseCodeSuffixKeys(raw: string | undefined, prefix: string): string[] {
  const text = raw?.trim() ?? ''
  if (!text.startsWith(`${prefix}:`)) return []
  return text
    .slice(prefix.length + 1)
    .split(',')
    .map(key => key.trim())
    .filter(Boolean)
}

/** 서버가 붙인 변수명만 노출. 문장·에러코드·디버그 접미사는 버린다. */
function isSafeNotificationVariableName(name: string): boolean {
  const trimmed = name.trim()
  if (!trimmed || trimmed.length > 80) return false
  if (/[=;\n]/.test(trimmed)) return false
  if (trimmed.includes('NOTIFICATION_')) return false
  if (/[.!?]$/.test(trimmed)) return false
  if (/(요|다)$/.test(trimmed)) return false
  return true
}

function parseScopeDisabledVariableNames(
  code: string | undefined,
  serverMessage: string
): string[] {
  const fromCode = parseCodeSuffixKeys(code, TEMPLATE_VARIABLE_SCOPE_DISABLED)
  const fromMessage = parseCodeSuffixKeys(serverMessage, TEMPLATE_VARIABLE_SCOPE_DISABLED)
  const fromPlainMessage =
    fromMessage.length === 0 &&
    serverMessage &&
    serverMessage !== TEMPLATE_VARIABLE_SCOPE_DISABLED &&
    !serverMessage.startsWith(`${TEMPLATE_VARIABLE_SCOPE_DISABLED}:`)
      ? [serverMessage.trim()]
      : []
  const keys = (fromCode.length > 0 ? fromCode : fromMessage.length > 0 ? fromMessage : fromPlainMessage)
    .map(key => key.trim())
    .filter(isSafeNotificationVariableName)
  return [...new Set(keys)]
}

function formatTemplateVariableScopeDisabledMessage(
  code: string | undefined,
  serverMessage: string
): string {
  const base = ERROR_CODE_MESSAGES[TEMPLATE_VARIABLE_SCOPE_DISABLED]
  const names = parseScopeDisabledVariableNames(code, serverMessage)
  if (names.length === 0) return base
  return `${base}\n사용할 수 없는 변수: ${names.join(', ')}`
}

/** 400 `NOTIFICATION_PROGRAM_REQUIRED_FOR_TEMPLATE_VARIABLES:{키}` — 프로그램 필요 변수 키 안내 */
function formatProgramRequiredForTemplateVariablesMessage(
  code: string | undefined,
  serverMessage: string
): string {
  const base = ERROR_CODE_MESSAGES[PROGRAM_REQUIRED_FOR_TEMPLATE_VARIABLES]
  const keys = parseCodeSuffixKeys(code, PROGRAM_REQUIRED_FOR_TEMPLATE_VARIABLES)
  const resolved =
    keys.length > 0
      ? keys
      : parseCodeSuffixKeys(serverMessage, PROGRAM_REQUIRED_FOR_TEMPLATE_VARIABLES)
  if (resolved.length === 0) return base
  return `${base.replace(/\.$/, '')}: ${resolved.join(', ')}`
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

  if (looksLikeSenderPhoneRequired(serverMessage, field)) {
    return SMS_SENDER_PHONE_REQUIRED_MESSAGE
  }

  if (code === 'EMAIL_SENDER_PROFILE_MISMATCH') {
    return MAIL_SENDER_PROFILE_MISMATCH_MESSAGE
  }
  if (code === 'EMAIL_SENDER_PROFILE_NOT_HARVESTED') {
    return MAIL_SENDER_EMAIL_NOT_REGISTERED_MESSAGE
  }
  if (code === 'EMAIL_SENDER_PROFILES_EMPTY') {
    return MAIL_SENDER_PROFILES_EMPTY_MESSAGE
  }

  if (code === 'NOTIFICATION_SENDER_PROFILE_NOT_FOUND') {
    return ERROR_CODE_MESSAGES.NOTIFICATION_SENDER_PROFILE_NOT_FOUND
  }

  if (
    code === 'EMAIL_CATEGORY_NOT_LINKED_TO_NHN' ||
    code === 'NOTIFICATION_CATEGORY_PARENT_NOT_LINKED_TO_NHN'
  ) {
    return appendTraceId(
      code === 'NOTIFICATION_CATEGORY_PARENT_NOT_LINKED_TO_NHN'
        ? ERROR_CODE_MESSAGES.NOTIFICATION_CATEGORY_PARENT_NOT_LINKED_TO_NHN
        : ERROR_CODE_MESSAGES.EMAIL_CATEGORY_NOT_LINKED_TO_NHN,
      error,
      true
    )
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
  if (code === 'SMS_TEMPLATE_DELETE_REJECTED_BY_NHN') {
    if (serverMessage && serverMessage !== code) return serverMessage
    return ERROR_CODE_MESSAGES.SMS_TEMPLATE_DELETE_REJECTED_BY_NHN
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
    code === PROGRAM_REQUIRED_FOR_TEMPLATE_VARIABLES ||
    code?.startsWith(`${PROGRAM_REQUIRED_FOR_TEMPLATE_VARIABLES}:`)
  ) {
    return formatProgramRequiredForTemplateVariablesMessage(code, serverMessage)
  }
  if (
    code === TEMPLATE_VARIABLE_SCOPE_DISABLED ||
    code?.startsWith(`${TEMPLATE_VARIABLE_SCOPE_DISABLED}:`)
  ) {
    return formatTemplateVariableScopeDisabledMessage(code, serverMessage)
  }
  if (
    code === 'DIRECT_RECIPIENT_AD_CONSENT_UNSUPPORTED' ||
    code === 'NOTIFICATION_PROGRAM_REQUIRED_FOR_RECIPIENTS' ||
    code === 'NOTIFICATION_RECIPIENT_NOT_IN_PROGRAM' ||
    code === 'NOTIFICATION_ADMIN_RECIPIENT_NOT_IN_PROGRAM'
  ) {
    return ERROR_CODE_MESSAGES[code] || serverMessage
  }
  if (
    code === 'NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING' ||
    code?.startsWith('NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:')
  ) {
    const keys = parseNotificationMissingVariableKeys(code)
    const main = formatNotificationMissingVariablesMessage(
      keys.length > 0 ? keys : parseNotificationMissingVariableKeys(serverMessage)
    )
    return `${main}\n${NOTIFICATION_REQUIRED_VARIABLE_MISSING_HINT}`
  }
  if (code === 'NOTIFICATION_SERVER_RESERVED_VARIABLE') {
    const formatted = formatNotificationFailedReason(serverMessage || code)
    return formatted || ERROR_CODE_MESSAGES.NOTIFICATION_SERVER_RESERVED_VARIABLE
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
    code === 'NOTIFICATION_CATEGORY_PARENT_NOT_LINKED_TO_NHN' ||
    (status === 400 && looksLikeNeedsSyncMessage(serverMessage))
  ) {
    const base =
      serverMessage ||
      (code === 'NOTIFICATION_CATEGORY_PARENT_NOT_LINKED_TO_NHN'
        ? ERROR_CODE_MESSAGES.NOTIFICATION_CATEGORY_PARENT_NOT_LINKED_TO_NHN
        : ERROR_CODE_MESSAGES.PROVIDER_CATEGORY_REQUIRED)
    const withHint = base.includes('동기화') ? base : `${base}\n\n${SYNC_FIRST_HINT}`
    return appendTraceId(withHint, error, true)
  }

  if (code && ERROR_CODE_MESSAGES[code] && (!serverMessage || serverMessage === code)) {
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

/** 부모 카테고리 NHN 미연결·발신 프로필 harvest 0건 등 → 동기화 유도 */
export function isCategoryNeedsSyncError(error: unknown): boolean {
  const code = getApiErrorCode(error)
  if (
    code === 'PROVIDER_CATEGORY_REQUIRED' ||
    code === 'CATEGORY_PROVIDER_REQUIRED' ||
    code === 'EMAIL_CATEGORY_NOT_LINKED_TO_NHN' ||
    code === 'NOTIFICATION_CATEGORY_PARENT_NOT_LINKED_TO_NHN' ||
    code === 'EMAIL_SENDER_PROFILES_EMPTY'
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

/** 발송 배치 POST 400 중 화면 필드로 안내할 오류 (BE PR #43) */
export type NotificationSendErrorField =
  | 'template'
  | 'messageType'
  | 'content'
  | 'sender'
  | 'senderDisplayName'
  | 'attachments'
  | 'program'
  | null

const NOTIFICATION_SEND_FIELD_ERROR_CODES: Record<string, NotificationSendErrorField> = {
  NOTIFICATION_TEMPLATE_REQUIRED: 'template',
  NOTIFICATION_SMS_MESSAGE_TYPE_INVALID: 'messageType',
  NOTIFICATION_SMS_CONTENT_REQUIRED: 'content',
  NOTIFICATION_SMS_SENDER_REQUIRED: 'sender',
  NOTIFICATION_SENDER_PROFILE_NOT_FOUND: 'sender',
  NOTIFICATION_SMS_SENDER_PROFILE_MISMATCH: 'sender',
  NOTIFICATION_SENDER_DISPLAY_NAME_INVALID: 'senderDisplayName',
  NOTIFICATION_SENDER_DISPLAY_NAME_EMAIL_ONLY: 'senderDisplayName',
  NOTIFICATION_PROGRAM_REQUIRED_FOR_TEMPLATE_VARIABLES: 'program',
  NOTIFICATION_TEMPLATE_VARIABLE_SCOPE_DISABLED: 'template',
  NOTIFICATION_SERVER_RESERVED_VARIABLE: null,
  ...Object.fromEntries(
    NOTIFICATION_MMS_ATTACHMENT_ERROR_CODES.map(code => [code, 'attachments' as const])
  ),
}

/**
 * 발송 배치 POST 실패 중 사용자가 고칠 수 있는 검증 오류면 BE 문구와 포커스 대상 필드를 돌려준다.
 * `CODE:{키}` 형태도 접두어로 매칭. 해당 없으면 null(공통 실패 안내 사용).
 */
export function resolveNotificationSendFieldError(
  error: unknown
): { code: string; field: NotificationSendErrorField; message: string } | null {
  const rawCode = getApiErrorCode(error) ?? extractApiErrorCode(readAxiosData(error))
  if (!rawCode) return null
  const code = rawCode.split(':')[0]?.trim() ?? ''
  if (!(code in NOTIFICATION_SEND_FIELD_ERROR_CODES)) return null
  const data = readAxiosData(error)
  const serverMessage =
    data != null
      ? extractApiErrorMessage(data, { httpStatus: getApiErrorHttpStatus(error), fallback: '' })
      : ''
  // 프로그램 필요 변수·스코프 차단은 BE message 대신 FE 문구(+안전한 변수명)를 노출
  const useMappedMessage =
    code === PROGRAM_REQUIRED_FOR_TEMPLATE_VARIABLES ||
    code === TEMPLATE_VARIABLE_SCOPE_DISABLED
  const message =
    !useMappedMessage && serverMessage && serverMessage !== rawCode
      ? serverMessage
      : getNotificationsApiErrorMessage(error, '입력값을 확인하세요.')
  return { code, field: NOTIFICATION_SEND_FIELD_ERROR_CODES[code] ?? null, message }
}
