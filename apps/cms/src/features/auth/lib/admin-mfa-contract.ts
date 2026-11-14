/**
 * 관리자 MFA 로그인·등록·초기화 계약.
 * 로그인 응답의 QR/Secret은 화면에 쓰지 않고, enrollment 응답 QR만 1회 표시한다.
 */

import { OTP_POLICY } from '@/shared/constants/mfa-policy'
import type {
  AdminMfaChallengeResponse,
  AdminMfaSetupRequestBody,
  AdminMfaSetupResult,
} from '@/features/auth/model/admin-login-api.types'

export const MFA_ENROLLMENT_QR_SIZE = 220

export const MFA_RECOVERY_TYPES = [
  'DEVICE_LOST',
  'DEVICE_CHANGED',
  'AUTHENTICATOR_REMOVED',
  'ENROLLMENT_INCOMPLETE',
  'SECRET_UNAVAILABLE',
  'ADMINISTRATIVE_RECOVERY',
] as const

export type MfaRecoveryType = (typeof MFA_RECOVERY_TYPES)[number]

export const MFA_RECOVERY_TYPE_LABEL: Record<MfaRecoveryType, string> = {
  DEVICE_LOST: '기기 분실',
  DEVICE_CHANGED: '기기 변경',
  AUTHENTICATOR_REMOVED: '인증 앱 삭제',
  ENROLLMENT_INCOMPLETE: '등록 미완료',
  SECRET_UNAVAILABLE: 'Secret 사용 불가',
  ADMINISTRATIVE_RECOVERY: '관리자 복구',
}

const QR_DATA_URL_KEYS = ['qrCodeDataUrl', 'qrDataUrl', 'qrImageUrl', 'qrCodeImageUrl'] as const
const MANUAL_KEY_KEYS = ['manualEntryKey', 'secretKey', 'totpSecret'] as const

function readOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function readFirstString(
  source: Record<string, unknown>,
  keys: readonly string[]
): string | undefined {
  for (const key of keys) {
    const value = readOptionalString(source[key])
    if (value) return value
  }
  return undefined
}

/** POST /api/admin/auth/login 200. QR/Secret 호환 필드는 결과에 넣지 않는다. */
export function parseAdminMfaChallenge(payload: unknown): AdminMfaChallengeResponse | null {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  if (record.success === true && record.data && typeof record.data === 'object') {
    return parseAdminMfaChallenge(record.data)
  }

  const challengeUuid = record.challengeUuid
  const mfaMethod = record.mfaMethod
  const expiresAt = record.expiresAt
  if (
    typeof challengeUuid !== 'string' ||
    typeof mfaMethod !== 'string' ||
    typeof expiresAt !== 'string'
  ) {
    return null
  }

  return {
    requiresMfa: typeof record.requiresMfa === 'boolean' ? record.requiresMfa : undefined,
    challengeUuid,
    mfaMethod,
    expiresAt,
    mfaSetupRequired:
      typeof record.mfaSetupRequired === 'boolean' ? record.mfaSetupRequired : undefined,
  }
}

/** enrollment 본문. 클라이언트가 Secret·enabled·backup code를 결정하지 않는다. */
export function buildAdminMfaEnrollmentRequest(challengeUuid: string): AdminMfaSetupRequestBody {
  return {
    challengeUuid,
    mfaMethod: 'TOTP',
    qrSize: MFA_ENROLLMENT_QR_SIZE,
  }
}

export function pickEnrollmentQrDataUrl(source: Record<string, unknown>): string | undefined {
  return readFirstString(source, QR_DATA_URL_KEYS)
}

export function pickEnrollmentManualKey(source: Record<string, unknown>): string | undefined {
  return readFirstString(source, MANUAL_KEY_KEYS)
}

export function parseAdminMfaSetupResult(payload: unknown): AdminMfaSetupResult | null {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  if (record.success === true && record.data && typeof record.data === 'object') {
    return parseAdminMfaSetupResult(record.data)
  }

  const qrDataUrl = pickEnrollmentQrDataUrl(record)
  const manualEntryKey = pickEnrollmentManualKey(record)
  const hasSetupShape =
    qrDataUrl != null ||
    manualEntryKey != null ||
    typeof record.enabled === 'boolean' ||
    typeof record.mfaSetupRequired === 'boolean' ||
    typeof record.adminAccountId === 'number' ||
    typeof record.adminId === 'number'

  if (!hasSetupShape) return null

  return {
    adminAccountId: typeof record.adminAccountId === 'number' ? record.adminAccountId : undefined,
    adminId: typeof record.adminId === 'number' ? record.adminId : undefined,
    mfaMethod: readOptionalString(record.mfaMethod),
    enabled: typeof record.enabled === 'boolean' ? record.enabled : undefined,
    message: readOptionalString(record.message),
    mfaSetupRequired:
      typeof record.mfaSetupRequired === 'boolean' ? record.mfaSetupRequired : undefined,
    manualEntryKey,
    qrDataUrl,
  }
}

export type MfaVerifyErrorKind =
  | 'lock'
  | 'challenge'
  | 'otp'
  | 'not-configured'
  | 'rate'
  | 'validation'
  | 'other'

export function mapMfaVerifyError(
  code: string,
  httpStatus?: number
): { kind: MfaVerifyErrorKind; message: string } {
  // 423 은 사용 불가 계정(ACCOUNT_INACTIVE 등)에도 쓰인다 — 코드로만 잠금을 판단한다.
  // 본문에 코드가 없는 423 은 fetcher(resolveAuthErrorCode)가 ACCOUNT_LOCKED 로 바꿔 넘긴다.
  if (code === 'ACCOUNT_LOCKED') {
    return {
      kind: 'lock',
      message: `인증 시도 횟수를 초과했습니다. ${OTP_POLICY.lockoutDurationMinutes}분 후 다시 시도해주세요.`,
    }
  }
  if (code === 'MFA_CHALLENGE_INVALID' || code === 'MFA_CHALLENGE_EXPIRED') {
    return {
      kind: 'challenge',
      message: '인증 시간이 만료되었습니다. 로그인부터 다시 시도하세요.',
    }
  }
  if (code === 'MFA_NOT_CONFIGURED') {
    return {
      kind: 'not-configured',
      message: 'MFA가 설정되지 않았습니다. 로그인부터 다시 시도하세요.',
    }
  }
  if (code === 'MFA_VERIFICATION_FAILED') {
    return { kind: 'otp', message: '인증번호가 올바르지 않습니다.' }
  }
  if (httpStatus === 429 || code === 'MFA_RATE_LIMITED') {
    return { kind: 'rate', message: '요청이 많습니다. 잠시 후 다시 시도하세요.' }
  }
  if (httpStatus === 400 || code === 'VALIDATION_ERROR') {
    return { kind: 'validation', message: '인증번호 형식을 확인해 주세요.' }
  }
  return { kind: 'other', message: '' }
}

/** 실행자 TOTP — OpenAPI `^[0-9]{6,8}$` */
export function isExecutorTotpCode(value: string): boolean {
  return /^[0-9]{6,8}$/.test(value.trim())
}

export function containsMfaSecretMaterial(value: string): boolean {
  const trimmed = value.trim()
  if (/^\d{6}$/.test(trimmed)) return true
  return /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(trimmed)
}

export interface AdminMfaResetRequestBody {
  reason: string
  recoveryType: MfaRecoveryType
  verificationReference: string
  stepUpProof: string
}

/** 관리자 상세 MFA 재발급 — 화면 입력 없이 API required 필드만 채운다. */
export const ADMIN_DETAIL_MFA_RESET_DEFAULTS = {
  reason: 'authenticator reissue from admin detail',
  recoveryType: 'ADMINISTRATIVE_RECOVERY' as const satisfies MfaRecoveryType,
  verificationReference: 'CMS-ADMIN-DETAIL',
}

export function buildMfaResetRequest(input: {
  reason: string
  recoveryType: string
  verificationReference: string
  stepUpProof: string
}): { ok: true; body: AdminMfaResetRequestBody } | { ok: false; message: string } {
  const reason = input.reason.trim()
  const verificationReference = input.verificationReference.trim()
  const recoveryType = input.recoveryType.trim()
  const stepUpProof = input.stepUpProof.trim()

  if (!reason) return { ok: false, message: '사유를 입력해 주세요.' }
  if (reason.length > 500) return { ok: false, message: '사유는 500자 이하여야 합니다.' }
  if (containsMfaSecretMaterial(reason)) {
    return { ok: false, message: '사유에 인증번호나 토큰을 넣을 수 없습니다.' }
  }
  if (!MFA_RECOVERY_TYPES.includes(recoveryType as MfaRecoveryType)) {
    return { ok: false, message: '복구 유형을 선택해 주세요.' }
  }
  if (!verificationReference) return { ok: false, message: '내부 티켓 번호를 입력해 주세요.' }
  if (verificationReference.length > 120) {
    return { ok: false, message: '티켓 번호는 120자 이하여야 합니다.' }
  }
  if (containsMfaSecretMaterial(verificationReference)) {
    return { ok: false, message: '티켓 번호에 인증번호나 토큰을 넣을 수 없습니다.' }
  }
  if (!stepUpProof) return { ok: false, message: 'Step-up 인증을 다시 진행하세요.' }

  return {
    ok: true,
    body: {
      reason,
      recoveryType: recoveryType as MfaRecoveryType,
      verificationReference,
      stepUpProof,
    },
  }
}

export type MfaResetUiAction =
  | 'field'
  | 'restart-step-up'
  | 'permission'
  | 'refresh-target'
  | 'refresh-status'
  | 'inactive'
  | 'rate-limited'
  | 'timeout'
  | 'unknown'

export function mapMfaResetError(
  code: string,
  httpStatus?: number
): { action: MfaResetUiAction; message: string } {
  if (code === 'MFA_RESET_OUTCOME_UNKNOWN') {
    return {
      action: 'timeout',
      message:
        '응답을 확인하지 못했습니다. 초기화를 자동으로 다시 시도하지 않습니다. 대상 계정 상태를 확인한 뒤 결과가 불명확하면 MFA 재발급을 다시 시도하세요.',
    }
  }
  if (
    code === 'MFA_RESET_STEP_UP_FAILED' ||
    code === 'MFA_RESET_STEP_UP_EXPIRED' ||
    code === 'MFA_RESET_STEP_UP_REUSED'
  ) {
    return {
      action: 'restart-step-up',
      message: 'Step-up 인증이 유효하지 않습니다. MFA 재발급을 다시 시도하세요.',
    }
  }
  if (code === 'MFA_RESET_STEP_UP_REQUIRED') {
    return {
      action: 'permission',
      message: '실행자 MFA를 먼저 등록한 뒤 다시 시도하세요.',
    }
  }
  if (
    code === 'PERMISSION_DENIED' ||
    code === 'MFA_RESET_TARGET_PRIVILEGE_FORBIDDEN' ||
    code === 'MFA_RESET_SELF_FORBIDDEN'
  ) {
    return {
      action: 'permission',
      message: '권한이 없거나 요청을 처리할 수 없습니다. 잠시 후 다시 시도하세요.',
    }
  }
  if (code === 'MFA_VERIFICATION_FAILED') {
    return {
      action: 'restart-step-up',
      message: '인증번호가 올바르지 않습니다. 인증번호부터 다시 입력해 주세요.',
    }
  }
  if (code === 'UNAUTHORIZED' || (httpStatus === 401 && (code === 'UNKNOWN' || code === ''))) {
    return {
      action: 'permission',
      message: '로그인이 만료되었습니다. 다시 로그인한 뒤 시도하세요.',
    }
  }
  if (code === 'ACCOUNT_LOCKED') {
    return {
      action: 'rate-limited',
      message: `인증 시도 횟수를 초과했습니다. ${OTP_POLICY.lockoutDurationMinutes}분 후 다시 시도해주세요.`,
    }
  }
  if (code === 'MFA_RESET_TARGET_NOT_FOUND' || httpStatus === 404) {
    return {
      action: 'refresh-target',
      message: '대상 계정을 찾을 수 없습니다. 목록을 새로고침하세요.',
    }
  }
  if (
    code === 'MFA_RESET_CONCURRENT_CHANGE' ||
    code === 'MFA_RESET_ALREADY_UNENROLLED' ||
    code === 'MFA_ALREADY_ENROLLED' ||
    httpStatus === 409
  ) {
    return {
      action: 'refresh-status',
      message: '대상 MFA 상태가 바뀌었습니다. 화면을 새로고침한 뒤 결과를 확인하세요.',
    }
  }
  if (code === 'MFA_RESET_TARGET_INACTIVE' || httpStatus === 423) {
    return { action: 'inactive', message: '비활성 계정은 MFA를 초기화할 수 없습니다.' }
  }
  if (code === 'MFA_RESET_RATE_LIMITED' || httpStatus === 429) {
    return {
      action: 'rate-limited',
      message: '요청이 너무 많습니다. 잠시 후 다시 시도하세요. 대상 MFA는 변경되지 않았습니다.',
    }
  }
  if (httpStatus === 400 || code === 'VALIDATION_ERROR') {
    return { action: 'field', message: '입력값을 확인해 주세요.' }
  }
  return { action: 'unknown', message: 'MFA 초기화에 실패했습니다.' }
}

export function parseStepUpProof(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  if (record.success === true && record.data && typeof record.data === 'object') {
    return parseStepUpProof(record.data)
  }
  const proof = readOptionalString(record.stepUpProof)
  return proof ?? null
}
