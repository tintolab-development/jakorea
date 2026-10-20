/**
 * 관리자 MFA 검증·토큰 갱신 fetcher
 */

import { isAxiosError, type InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api'
import { adminAuthPaths } from '@/shared/config/api-paths'
import type {
  AdminMfaVerifyRequestBody,
  AdminMfaSetupRequestBody,
  AdminMfaSetupResult,
  AuthTokenResponse,
  RefreshTokenRequestBody,
} from '@/features/auth/model/admin-login-api.types'
import { AdminLoginApiError } from '@/features/auth/api/admin-login-fetcher'
import { mapMfaVerifyError, parseAdminMfaSetupResult } from '@/features/auth/lib/admin-mfa-contract'
import { parseAuthTokenResponse } from '@/features/auth/lib/parse-auth-token-response'

export class AdminMfaApiError extends Error {
  readonly code: string
  readonly httpStatus?: number

  constructor(code: string, message: string, httpStatus?: number) {
    super(message)
    this.name = 'AdminMfaApiError'
    this.code = code
    this.httpStatus = httpStatus
  }
}

function resolveAuthErrorCode(code: string, httpStatus?: number): string {
  if (code !== 'UNKNOWN' && code !== 'MFA_FAILED') return code
  if (httpStatus === 429) return 'MFA_RATE_LIMITED'
  if (httpStatus === 423) return 'ACCOUNT_LOCKED'
  if (httpStatus === 400) return 'VALIDATION_ERROR'
  return code
}

function humanizeAuthErrorMessage(code: string, message: string, fallback: string, httpStatus?: number): string {
  if (message.includes('jwt.secret')) {
    return '백엔드 JWT 설정(app.auth.jwt.secret, 32자 이상)이 없어 토큰 발급에 실패했습니다. 백엔드팀에 설정을 요청하세요.'
  }
  const mapped = mapMfaVerifyError(code, httpStatus)
  if (mapped.kind !== 'other') return mapped.message
  return message || fallback
}

function parseAuthError(payload: unknown, fallback: string, httpStatus?: number): AdminMfaApiError {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    const wrapped = record.error as { code?: string; message?: string } | undefined
    const rawMessage =
      wrapped?.message ??
      (typeof record.message === 'string' ? record.message : fallback)
    const codeFromBody = wrapped?.code ?? (typeof record.code === 'string' ? record.code : undefined)
    const inferred =
      codeFromBody ??
      (rawMessage.includes('ACCOUNT_LOCKED')
        ? 'ACCOUNT_LOCKED'
        : rawMessage.includes('MFA_VERIFICATION_FAILED')
          ? 'MFA_VERIFICATION_FAILED'
          : rawMessage.includes('MFA_CHALLENGE_EXPIRED')
            ? 'MFA_CHALLENGE_EXPIRED'
            : rawMessage.includes('MFA_CHALLENGE_INVALID')
              ? 'MFA_CHALLENGE_INVALID'
              : rawMessage.includes('MFA_ALREADY_ENROLLED')
                ? 'MFA_ALREADY_ENROLLED'
                : 'UNKNOWN')
    const code = resolveAuthErrorCode(String(inferred), httpStatus)
    return new AdminMfaApiError(
      code,
      humanizeAuthErrorMessage(code, rawMessage, fallback, httpStatus),
      httpStatus
    )
  }
  const code = resolveAuthErrorCode('UNKNOWN', httpStatus)
  return new AdminMfaApiError(code, humanizeAuthErrorMessage(code, fallback, fallback, httpStatus), httpStatus)
}

function throwAuthRequestError(err: unknown, fallback: string): never {
  if (err instanceof AdminMfaApiError) throw err
  if (isAxiosError(err)) {
    if (err.code === 'ECONNABORTED') {
      throw new AdminMfaApiError('NETWORK', '요청 시간이 초과되었습니다.')
    }
    throw parseAuthError(err.response?.data, fallback, err.response?.status)
  }
  throw new AdminMfaApiError('NETWORK', fallback)
}

function unwrapTokenResponse(payload: unknown): AuthTokenResponse {
  const parsed = parseAuthTokenResponse(payload)
  if (parsed) return parsed
  throw parseAuthError(payload, '인증 토큰 응답 형식이 올바르지 않습니다.')
}

function unwrapMfaSetupResponse(payload: unknown): AdminMfaSetupResult {
  const parsed = parseAdminMfaSetupResult(payload)
  if (parsed) return parsed
  throw parseAuthError(payload, 'MFA 설정 응답 형식이 올바르지 않습니다.')
}

function anonymousAuthConfig(): InternalAxiosRequestConfig & {
  skipRefresh?: boolean
  skipAuth?: boolean
  skipGlobalErrorAlert?: boolean
} {
  return {
    skipRefresh: true,
    skipAuth: true,
    skipGlobalErrorAlert: true,
  } as InternalAxiosRequestConfig & {
    skipRefresh?: boolean
    skipAuth?: boolean
    skipGlobalErrorAlert?: boolean
  }
}

/** POST /api/admin/auth/mfa/enrollment — challenge만으로 pending QR 발급 */
export async function fetchAdminMfaEnrollment(
  body: AdminMfaSetupRequestBody
): Promise<AdminMfaSetupResult> {
  try {
    const { data: payload } = await axiosClient.post<unknown>(
      adminAuthPaths.mfaEnrollment(),
      body,
      anonymousAuthConfig()
    )
    return unwrapMfaSetupResponse(payload)
  } catch (err) {
    throwAuthRequestError(err, 'MFA 설정에 실패했습니다.')
  }
}

export async function fetchAdminMfaVerify(
  body: AdminMfaVerifyRequestBody
): Promise<AuthTokenResponse> {
  try {
    const { data: payload } = await axiosClient.post<unknown>(
      `${adminAuthPaths.mfaVerify()}`,
      body
    )
    return unwrapTokenResponse(payload)
  } catch (err) {
    throwAuthRequestError(err, 'MFA 인증에 실패했습니다.')
  }
}

export async function fetchAdminAuthRefresh(
  body: RefreshTokenRequestBody
): Promise<AuthTokenResponse> {
  try {
    const { data: payload } = await axiosClient.post<unknown>(
      adminAuthPaths.refresh(),
      body,
      {
        skipRefresh: true,
        skipAuth: true,
        skipGlobalErrorAlert: true,
      } as InternalAxiosRequestConfig & {
        skipRefresh?: boolean
        skipAuth?: boolean
        skipGlobalErrorAlert?: boolean
      }
    )
    return unwrapTokenResponse(payload)
  } catch (err) {
    throwAuthRequestError(err, '토큰 갱신에 실패했습니다.')
  }
}

/** POST /api/admin/auth/logout — body refreshToken only (Authorization 제외). OpenAPI 200/204 */
export async function fetchAdminAuthLogout(body: RefreshTokenRequestBody): Promise<void> {
  try {
    await axiosClient.post<unknown>(
      adminAuthPaths.logout(),
      body,
      {
        skipRefresh: true,
        skipAuth: true,
        skipGlobalErrorAlert: true,
        validateStatus: (status: number) => status === 204 || status === 200,
      } as unknown as InternalAxiosRequestConfig & {
        skipRefresh?: boolean
        skipAuth?: boolean
        skipGlobalErrorAlert?: boolean
      }
    )
  } catch (err) {
    throwAuthRequestError(err, '로그아웃에 실패했습니다.')
  }
}

export { AdminLoginApiError }
