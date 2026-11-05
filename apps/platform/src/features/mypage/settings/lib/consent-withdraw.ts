import { isAxiosError } from 'axios'

/** 마이페이지 5종 동의 — 참여 상태와 무관하게 서버 withdrawable/status로 철회 */
export const FIVE_POLICY_CONSENT_TYPES = [
  'PORTRAIT_RIGHTS',
  'PAYMENT_STATEMENT_CONSENT',
  'FACILITATOR_PLEDGE',
  'ADMINISTRATIVE_INFO_CONSENT',
  'CRIMINAL_HISTORY_CHECK_CONSENT',
] as const

/** documentId 없이 유형으로 철회 가능한 항목. 아동 개인정보는 기존 정책 유지 */
export const TYPE_WITHDRAWABLE_CONSENT_TYPES = [
  ...FIVE_POLICY_CONSENT_TYPES,
  'RECEIPT_PRE_CONSENT',
  'CHILD_PRIVACY_COLLECTION',
] as const

export type TypeWithdrawableConsentType = (typeof TYPE_WITHDRAWABLE_CONSENT_TYPES)[number]

export type ConsentWithdrawMutationResponse = {
  documentId?: number | null
  consentType?: string
  status?: string
  changedAt?: string
}

export const CONSENT_WITHDRAW_FAILED_MESSAGE =
  '동의 철회에 실패했어요. 잠시 후 다시 시도해 주세요.'
export const CONSENT_WITHDRAW_CONFLICT_MESSAGE =
  '이미 반영된 상태예요. 최신 동의 현황으로 갱신했어요.'
export const CONSENT_TYPE_INVALID_MESSAGE = '유효하지 않은 동의 유형입니다.'
export const CONSENT_TYPE_WITHDRAWAL_NOT_ALLOWED_MESSAGE =
  '현재 서버 정책상 이 동의는 철회할 수 없습니다.'
export const CONSENT_DRAFT_DOCUMENT_NOT_WITHDRAWABLE_MESSAGE =
  '작성 중인 동의서는 철회할 수 없습니다.'
export const CONSENT_DOCUMENT_NOT_FOUND_MESSAGE =
  '동의서를 찾을 수 없습니다. 본인 문서를 다시 확인해 주세요.'

const LEGACY_PORTRAIT_ACTIVE_PROGRAM_MESSAGE =
  '진행 중인 프로그램 참여가 있어 초상권 동의만 단독으로 철회할 수 없습니다. 먼저 해당 프로그램의 활동 포기를 진행해 주세요.'

const WITHDRAW_ERROR_MESSAGES: Record<string, string> = {
  PORTAL_CONSENT_TYPE_INVALID: CONSENT_TYPE_INVALID_MESSAGE,
  PORTAL_CONSENT_TYPE_WITHDRAWAL_NOT_ALLOWED: CONSENT_TYPE_WITHDRAWAL_NOT_ALLOWED_MESSAGE,
  PORTAL_CONSENT_WITHDRAWAL_NOT_ALLOWED: CONSENT_WITHDRAW_FAILED_MESSAGE,
  PORTAL_CONSENT_ONLY_SIGNED_DOCUMENT_WITHDRAWABLE:
    CONSENT_DRAFT_DOCUMENT_NOT_WITHDRAWABLE_MESSAGE,
  PORTAL_CONSENT_DOCUMENT_NOT_FOUND: CONSENT_DOCUMENT_NOT_FOUND_MESSAGE,
  PORTAL_CONSENT_WITHDRAWAL_CONFLICT: CONSENT_WITHDRAW_CONFLICT_MESSAGE,
  PORTAL_PORTRAIT_WITHDRAWAL_ACTIVE_PROGRAM_EXISTS: CONSENT_WITHDRAW_FAILED_MESSAGE,
}

export type ConsentWithdrawTarget =
  | { kind: 'document'; documentId: number }
  | { kind: 'type'; consentType: TypeWithdrawableConsentType }

export type ConsentWithdrawErrorInfo = {
  code: string | null
  message: string
  refetch: boolean
  backendRegression: boolean
}

export function isFivePolicyConsentType(value: string | undefined): boolean {
  return (FIVE_POLICY_CONSENT_TYPES as readonly string[]).includes(value ?? '')
}

export function isTypeWithdrawableConsentType(
  value: string | undefined,
): value is TypeWithdrawableConsentType {
  return (TYPE_WITHDRAWABLE_CONSENT_TYPES as readonly string[]).includes(value ?? '')
}

export function canWithdrawConsent(input: {
  withdrawable?: boolean
  status?: string | null
  pending?: boolean
}): boolean {
  if (input.pending) return false
  const status = input.status?.trim().toUpperCase() ?? ''
  return input.withdrawable === true && status !== 'WITHDRAWN'
}

function normalizeWithdrawConsentType(value: string | undefined): string {
  const normalized = value?.trim().toUpperCase() ?? ''
  if (normalized === 'PAYMENT_STATEMENT_PRE_CONSENT') return 'PAYMENT_STATEMENT_CONSENT'
  if (normalized === 'AGREEMENT_RECEIPT_PRE_CONSENT') return 'RECEIPT_PRE_CONSENT'
  return normalized
}

export function resolveConsentWithdrawTarget(input: {
  documentId?: number | null
  consentType?: string
}): ConsentWithdrawTarget | null {
  if (input.documentId != null) {
    return { kind: 'document', documentId: input.documentId }
  }
  const consentType = normalizeWithdrawConsentType(input.consentType)
  if (isTypeWithdrawableConsentType(consentType)) {
    return { kind: 'type', consentType }
  }
  return null
}

/** HTTP 2xx 응답이면 성공. `documentId: null`도 정상 성공 계약이다. */
export function isConsentWithdrawSuccess(
  response: ConsentWithdrawMutationResponse | null | undefined,
): boolean {
  return response != null && typeof response === 'object'
}

export function readApiErrorCode(error: unknown): string | null {
  if (!isAxiosError(error)) return null
  const data = error.response?.data
  if (!data || typeof data !== 'object') return null
  const body = data as { code?: unknown; error?: { code?: unknown } }
  const nested = body.error?.code
  if (typeof nested === 'string' && nested.trim()) return nested.trim().toUpperCase()
  if (typeof body.code === 'string' && body.code.trim()) return body.code.trim().toUpperCase()
  return null
}

function readApiErrorMessage(error: unknown): string | null {
  if (!isAxiosError(error)) return null
  const data = error.response?.data
  if (!data || typeof data !== 'object') return null
  const body = data as { message?: unknown; error?: { message?: unknown } }
  if (typeof body.error?.message === 'string' && body.error.message.trim()) {
    return body.error.message.trim()
  }
  if (typeof body.message === 'string' && body.message.trim()) {
    return body.message.trim()
  }
  return null
}

export function parseConsentWithdrawError(
  error: unknown,
  consentType?: string,
): ConsentWithdrawErrorInfo {
  const code = readApiErrorCode(error)
  const nestedMessage = readApiErrorMessage(error)
  const backendRegression =
    code === 'PORTAL_PORTRAIT_WITHDRAWAL_ACTIVE_PROGRAM_EXISTS' ||
    (code === 'PORTAL_CONSENT_WITHDRAWAL_NOT_ALLOWED' && isFivePolicyConsentType(consentType))
  const mapped = code ? WITHDRAW_ERROR_MESSAGES[code] : undefined
  const usesNestedMessage =
    nestedMessage != null &&
    nestedMessage !== LEGACY_PORTRAIT_ACTIVE_PROGRAM_MESSAGE &&
    !backendRegression &&
    code !== 'PORTAL_CONSENT_WITHDRAWAL_CONFLICT' &&
    code !== 'PORTAL_CONSENT_ONLY_SIGNED_DOCUMENT_WITHDRAWABLE'
  return {
    code,
    message: usesNestedMessage
      ? nestedMessage
      : (mapped ?? CONSENT_WITHDRAW_FAILED_MESSAGE),
    refetch:
      code === 'PORTAL_CONSENT_WITHDRAWAL_CONFLICT' ||
      (isAxiosError(error) && error.response?.status === 409),
    backendRegression,
  }
}

export function logConsentWithdrawBackendRegression(
  code: string | null,
  consentType?: string,
): void {
  console.error('[portal-consent-withdraw] backend regression', { code, consentType })
}
