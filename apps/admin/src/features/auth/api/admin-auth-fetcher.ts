/**
 * 관리자 MFA 검증·토큰 갱신·로그아웃 fetcher
 */

import { axiosInstance } from '@/shared/instance/axios-instance'
import { adminAuthPaths } from '@/shared/config/api-paths'
import { OTP_POLICY } from '@/shared/constants/mfa-policy'
import type { InternalAxiosRequestConfig } from 'axios'
import type {
  AdminMfaVerifyRequestBody,
  AdminMfaSetupRequestBody,
  AdminMfaSetupResult,
  AuthTokenResponse,
  RefreshTokenRequestBody,
} from '@/features/auth/model/admin-login-api.types'
import { AdminLoginApiError } from '@/features/auth/api/admin-login-fetcher'

export class AdminMfaApiError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'AdminMfaApiError'
    this.code = code
  }
}

function humanizeAuthErrorMessage(code: string, message: string, fallback: string): string {
  if (code === 'ACCOUNT_LOCKED' || message.includes('ACCOUNT_LOCKED')) {
    return `인증 시도 횟수를 초과했습니다. ${OTP_POLICY.lockoutDurationMinutes}분 후 다시 시도해주세요.`
  }
  if (message.includes('jwt.secret')) {
    return '백엔드 JWT 설정(app.auth.jwt.secret, 32자 이상)이 없어 토큰 발급에 실패했습니다. 백엔드팀에 설정을 요청하세요.'
  }
  if (code === 'MFA_VERIFICATION_FAILED' || message.includes('MFA_VERIFICATION_FAILED')) {
    return '인증번호가 올바르지 않습니다. LOCAL_TEST_CODE 환경이면 000000을 입력해 주세요.'
  }
  if (
    code === 'MFA_CHALLENGE_INVALID' ||
    message.includes('MFA_CHALLENGE_INVALID') ||
    message.includes('cooldown')
  ) {
    return 'MFA challenge가 만료되었거나 재시도 대기 중입니다. 로그인부터 다시 시도하세요.'
  }
  return message || fallback
}

function parseAuthError(payload: unknown, fallback: string): AdminMfaApiError {
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    const wrapped = o.error as { code?: string; message?: string } | undefined
    const codeFromBody = wrapped?.code ?? (typeof o.code === 'string' ? o.code : undefined)
    if (o.success === false) {
      const raw = typeof o.message === 'string' ? o.message : fallback
      const codeFromMessage =
        codeFromBody ??
        (raw.includes('ACCOUNT_LOCKED')
          ? 'ACCOUNT_LOCKED'
          : raw.includes('MFA_VERIFICATION_FAILED')
            ? 'MFA_VERIFICATION_FAILED'
            : raw.includes('MFA_ALREADY_ENROLLED') || raw.includes('이미 MFA 등록')
              ? 'MFA_ALREADY_ENROLLED'
              : 'MFA_FAILED')
      return new AdminMfaApiError(
        codeFromMessage,
        humanizeAuthErrorMessage(codeFromMessage, raw, fallback)
      )
    }
    const code = String(codeFromBody ?? 'UNKNOWN')
    const raw = wrapped?.message ?? (typeof o.message === 'string' ? o.message : fallback)
    return new AdminMfaApiError(code, humanizeAuthErrorMessage(code, raw, fallback))
  }
  return new AdminMfaApiError('UNKNOWN', fallback)
}

function unwrapTokenResponse(payload: unknown): AuthTokenResponse {
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    if (o.success === true && o.data && typeof o.data === 'object') {
      return unwrapTokenResponse(o.data)
    }
    const accessToken = o.accessToken
    const refreshToken = o.refreshToken
    // QA-0137: refreshToken은 전환기에만 본문에 온다. access만 필수(쿠키 전용 운영이면 본문에 refreshToken 없음).
    if (typeof accessToken === 'string' && accessToken.length > 0) {
      return {
        accessToken,
        refreshToken:
          typeof refreshToken === 'string' && refreshToken.length > 0 ? refreshToken : undefined,
        tokenType: typeof o.tokenType === 'string' ? o.tokenType : undefined,
        expiresInSeconds: typeof o.expiresInSeconds === 'number' ? o.expiresInSeconds : undefined,
      }
    }
  }
  throw parseAuthError(payload, '인증 토큰 응답 형식이 올바르지 않습니다.')
}

/** QA-0137: 토큰 발급·갱신·폐기 호출은 HttpOnly refresh 쿠키(`JA_ADMIN_RT`)가 오가도록 credentials를 명시한다. */
const AUTH_COOKIE_CREDENTIALS = { withCredentials: true } as const

function readOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function unwrapMfaSetupResponse(payload: unknown): AdminMfaSetupResult {
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    if (o.success === true && o.data && typeof o.data === 'object') {
      return unwrapMfaSetupResponse(o.data)
    }

    const totpSecret =
      readOptionalString(o.totpSecret) ??
      readOptionalString(o.secret) ??
      readOptionalString(o.manualSecret)

    if (
      totpSecret ||
      readOptionalString(o.otpauthUri) ||
      readOptionalString(o.qrDataUrl) ||
      typeof o.enabled === 'boolean' ||
      typeof o.adminId === 'number'
    ) {
      return {
        adminId: typeof o.adminId === 'number' ? o.adminId : undefined,
        mfaMethod: readOptionalString(o.mfaMethod),
        enabled: typeof o.enabled === 'boolean' ? o.enabled : undefined,
        message: readOptionalString(o.message),
        totpSecret,
        otpauthUri: readOptionalString(o.otpauthUri),
        qrDataUrl: readOptionalString(o.qrDataUrl) ?? readOptionalString(o.qrCode),
      }
    }
  }

  throw parseAuthError(payload, 'MFA 설정 응답 형식이 올바르지 않습니다.')
}

export async function fetchAdminMfaEnrollment(
  body: AdminMfaSetupRequestBody
): Promise<AdminMfaSetupResult> {
  try {
    const { data: payload } = await axiosInstance.post<unknown>(
      adminAuthPaths.mfaEnrollment(),
      body
    )
    return unwrapMfaSetupResponse(payload)
  } catch (err) {
    if (err instanceof AdminMfaApiError) throw err
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response?: { data?: unknown } }
      throw parseAuthError(axiosErr.response?.data, 'MFA 설정에 실패했습니다.')
    }
    throw new AdminMfaApiError('NETWORK', 'MFA 설정 요청에 실패했습니다.')
  }
}

export async function fetchAdminMfaVerify(
  body: AdminMfaVerifyRequestBody
): Promise<AuthTokenResponse> {
  try {
    const { data: payload } = await axiosInstance.post<unknown>(
      adminAuthPaths.mfaVerify(),
      body,
      AUTH_COOKIE_CREDENTIALS
    )
    return unwrapTokenResponse(payload)
  } catch (err) {
    if (err instanceof AdminMfaApiError) throw err
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response?: { data?: unknown } }
      throw parseAuthError(axiosErr.response?.data, 'MFA 인증에 실패했습니다.')
    }
    throw new AdminMfaApiError('NETWORK', 'MFA 인증 요청에 실패했습니다.')
  }
}

/**
 * POST refresh. 본문 refreshToken이 있으면 전환기 본문, 없으면 본문 없이 HttpOnly 쿠키로 갱신한다 (QA-0137).
 * TODO(QA-0137 인프라 전환 후 삭제): body 인자를 지우고 항상 본문 없이 쿠키로만 요청한다.
 */
export async function fetchAdminAuthRefresh(
  body?: Partial<RefreshTokenRequestBody>
): Promise<AuthTokenResponse> {
  try {
    const requestBody = body?.refreshToken ? { refreshToken: body.refreshToken } : undefined
    const { data: payload } = await axiosInstance.post<unknown>(adminAuthPaths.refresh(), requestBody, {
      ...AUTH_COOKIE_CREDENTIALS,
      skipRefresh: true,
      skipAuth: true,
    } as InternalAxiosRequestConfig & { skipRefresh?: boolean; skipAuth?: boolean })
    return unwrapTokenResponse(payload)
  } catch (err) {
    if (err instanceof AdminMfaApiError) throw err
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response?: { data?: unknown } }
      throw parseAuthError(axiosErr.response?.data, '토큰 갱신에 실패했습니다.')
    }
    throw new AdminMfaApiError('NETWORK', '토큰 갱신 요청에 실패했습니다.')
  }
}

export async function fetchAdminAuthLogout(body: RefreshTokenRequestBody): Promise<void> {
  try {
    await axiosInstance.post<unknown>(adminAuthPaths.logout(), body, {
      ...AUTH_COOKIE_CREDENTIALS,
      skipRefresh: true,
      skipAuth: true,
      validateStatus: (status: number) => status === 204 || status === 200,
    } as unknown as InternalAxiosRequestConfig & {
      skipRefresh?: boolean
      skipAuth?: boolean
    })
  } catch (err) {
    if (err instanceof AdminMfaApiError) throw err
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response?: { data?: unknown } }
      throw parseAuthError(axiosErr.response?.data, '로그아웃에 실패했습니다.')
    }
    throw new AdminMfaApiError('NETWORK', '로그아웃 요청에 실패했습니다.')
  }
}

/**
 * POST /api/admin/auth/refresh/logout — HttpOnly refresh 쿠키의 토큰을 폐기하고 쿠키를 지운다 (QA-0137).
 * 본문 없음. 쿠키가 없거나(전환 전·로컬) 실패해도 로컬 로그아웃을 막지 않도록 best effort — 오류를 던지지 않는다.
 */
export async function fetchAdminAuthRefreshCookieLogout(): Promise<void> {
  try {
    await axiosInstance.post<unknown>(adminAuthPaths.refreshLogout(), undefined, {
      ...AUTH_COOKIE_CREDENTIALS,
      skipRefresh: true,
      skipAuth: true,
      validateStatus: (status: number) => status === 204 || status === 200,
    } as unknown as InternalAxiosRequestConfig & {
      skipRefresh?: boolean
      skipAuth?: boolean
    })
  } catch {
    // best effort: 쿠키 폐기 실패는 무시 (본문 logout·로컬 정리는 별도 진행)
  }
}

export { AdminLoginApiError }
