export type GuardianBridgeErrorAction =
  | 'restart_profile'
  | 'refetch_status'
  | 'restart_intent'
  | 'bridge_disabled'
  | 'show_message'

export type GuardianBridgeErrorResolution = {
  action: GuardianBridgeErrorAction
  message: string
  httpStatus?: number
  code: string
}

const LOGIN_CREDENTIALS_COPY = '이메일 또는 비밀번호'

/**
 * 서버 message가 확정 문구인 보호자 오류 코드(기획 확정 2026-11-14) — FE에서 덮어쓰지 않는다.
 * 서버 `ClientErrorMessageResolver`의 GUARDIAN_* 9종 + 관계 입력 오류.
 */
const GUARDIAN_SERVER_MESSAGE_CODES: ReadonlySet<string> = new Set([
  'GUARDIAN_STATUS_TOKEN_INVALID',
  'GUARDIAN_SESSION_EXPIRED',
  'GUARDIAN_INVALID_STATE',
  'GUARDIAN_NICE_ALREADY_STARTED',
  'GUARDIAN_NICE_START_IN_PROGRESS',
  'GUARDIAN_NICE_START_OUTCOME_UNKNOWN',
  'GUARDIAN_ALREADY_CONSENTED',
  'GUARDIAN_SIGNUP_INTENT_CONFLICT',
  'GUARDIAN_FINAL_CONSENT_CHALLENGE_INVALID',
  'GUARDIAN_RELATION_INVALID',
])
const BRIDGE_DISABLED_CODE = 'GUARDIAN_SIGNUP_BRIDGE_NOT_ENABLED_PENDING_SECURITY_APPROVAL'

const DEFAULT_MESSAGES: Record<GuardianBridgeErrorAction, string> = {
  restart_profile: '보호자 인증 세션이 만료되었습니다. 보호자 정보부터 다시 진행해 주세요.',
  refetch_status: '이미 처리된 요청입니다. 인증 상태를 확인합니다.',
  restart_intent: '보호자 인증이 만료되었습니다. 처음부터 다시 진행해 주세요.',
  bridge_disabled: '보호자 인증을 잠시 이용할 수 없습니다. 공용 본인인증으로는 진행할 수 없어요.',
  show_message: '보호자 인증을 완료하지 못했습니다. 다시 시도해 주세요.',
}

function asBridgeError(error: unknown): { code?: string; message?: string; httpStatus?: number } | null {
  if (!error || typeof error !== 'object') return null
  const record = error as { code?: unknown; message?: unknown; httpStatus?: unknown; name?: unknown }
  if (typeof record.code !== 'string' && typeof record.httpStatus !== 'number') {
    return null
  }
  return {
    code: typeof record.code === 'string' ? record.code : undefined,
    message: typeof record.message === 'string' ? record.message : undefined,
    httpStatus: typeof record.httpStatus === 'number' ? record.httpStatus : undefined,
  }
}

function extractHttpStatus(error: unknown): number | undefined {
  const bridge = asBridgeError(error)
  if (typeof bridge?.httpStatus === 'number') {
    return bridge.httpStatus
  }
  const axiosErr = error as { response?: { status?: number } }
  return typeof axiosErr.response?.status === 'number' ? axiosErr.response.status : undefined
}

function extractCode(error: unknown): string {
  const bridgeCode = asBridgeError(error)?.code
  if (bridgeCode?.trim()) {
    return bridgeCode.trim().toUpperCase()
  }
  const axiosErr = error as { response?: { data?: { error?: { code?: unknown } } } }
  const code = axiosErr.response?.data?.error?.code
  return typeof code === 'string' ? code.trim().toUpperCase() : 'UNKNOWN'
}

function extractMessage(error: unknown): string | undefined {
  const bridgeMessage = asBridgeError(error)?.message
  if (bridgeMessage?.trim()) {
    return bridgeMessage.trim()
  }
  const axiosErr = error as {
    response?: { data?: { message?: unknown; error?: { message?: unknown } } }
  }
  const nested = axiosErr.response?.data?.error?.message
  if (typeof nested === 'string' && nested.trim()) return nested.trim()
  const message = axiosErr.response?.data?.message
  if (typeof message === 'string' && message.trim()) return message.trim()
  if (error instanceof Error && error.message.trim()) return error.message.trim()
  return undefined
}

function resolveAction(httpStatus: number | undefined, code: string): GuardianBridgeErrorAction {
  if (httpStatus === 503 || code === BRIDGE_DISABLED_CODE) {
    return 'bridge_disabled'
  }
  if (httpStatus === 410 || code === 'GONE' || code === 'EXPIRED') {
    return 'restart_intent'
  }
  if (httpStatus === 409 || code === 'CONFLICT') {
    return 'refetch_status'
  }
  if (code === 'GUARDIAN_FINAL_CONSENT_CHALLENGE_INVALID') {
    return 'show_message'
  }
  if (httpStatus === 401 || code === 'UNAUTHORIZED' || code === 'INVALID_CREDENTIALS') {
    return 'restart_profile'
  }
  return 'show_message'
}

export function resolveGuardianBridgeError(error: unknown): GuardianBridgeErrorResolution {
  const httpStatus = extractHttpStatus(error)
  const code = extractCode(error)
  const action = resolveAction(httpStatus, code)
  const rawMessage = extractMessage(error)
  const hideLoginCopy =
    action === 'restart_profile' ||
    action === 'bridge_disabled' ||
    Boolean(rawMessage?.includes(LOGIN_CREDENTIALS_COPY))

  const useServerMessage = Boolean(rawMessage) && GUARDIAN_SERVER_MESSAGE_CODES.has(code)
  const message = useServerMessage
    ? (rawMessage as string)
    : hideLoginCopy || !rawMessage
      ? DEFAULT_MESSAGES[action]
      : rawMessage

  return { action, message, httpStatus, code }
}

export function isGuardianBridgeConflict(error: unknown) {
  return resolveGuardianBridgeError(error).action === 'refetch_status'
}

export function isGuardianFinalConsentChallengeInvalid(error: unknown) {
  return resolveGuardianBridgeError(error).code === 'GUARDIAN_FINAL_CONSENT_CHALLENGE_INVALID'
}
