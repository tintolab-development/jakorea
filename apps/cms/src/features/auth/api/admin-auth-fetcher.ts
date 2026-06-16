/**
 * 관리자 MFA 검증·토큰 갱신 fetcher
 */

import { axiosClient } from '@/shared/api'
import { adminAuthPaths } from '@/shared/config/api-paths'
import type { InternalAxiosRequestConfig } from 'axios'
import type {
  AdminMfaVerifyRequestBody,
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

function humanizeAuthErrorMessage(message: string, fallback: string): string {
  if (message.includes('jwt.secret')) {
    return '백엔드 JWT 설정(app.auth.jwt.secret, 32자 이상)이 없어 토큰 발급에 실패했습니다. 백엔드팀에 설정을 요청하세요.'
  }
  if (message.includes('MFA_VERIFICATION_FAILED')) {
    return '인증번호가 올바르지 않습니다. LOCAL_TEST_CODE 환경이면 000000을 입력하세요.'
  }
  if (message.includes('MFA_CHALLENGE_INVALID') || message.includes('cooldown')) {
    return 'MFA challenge가 만료되었거나 재시도 대기 중입니다. 로그인부터 다시 시도하세요.'
  }
  return message || fallback
}

function parseAuthError(payload: unknown, fallback: string): AdminMfaApiError {
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    if (o.success === false) {
      const raw = typeof o.message === 'string' ? o.message : fallback
      return new AdminMfaApiError('MFA_FAILED', humanizeAuthErrorMessage(raw, fallback))
    }
    const wrapped = o.error as { code?: string; message?: string } | undefined
    const code = wrapped?.code ?? 'UNKNOWN'
    const raw = wrapped?.message ?? (typeof o.message === 'string' ? o.message : fallback)
    return new AdminMfaApiError(String(code), humanizeAuthErrorMessage(raw, fallback))
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
    if (typeof accessToken === 'string' && typeof refreshToken === 'string') {
      return {
        accessToken,
        refreshToken,
        tokenType: typeof o.tokenType === 'string' ? o.tokenType : undefined,
        expiresInSeconds:
          typeof o.expiresInSeconds === 'number' ? o.expiresInSeconds : undefined,
      }
    }
  }
  throw parseAuthError(payload, '인증 토큰 응답 형식이 올바르지 않습니다.')
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
    if (err instanceof AdminMfaApiError) throw err
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response?: { data?: unknown } }
      throw parseAuthError(axiosErr.response?.data, 'MFA 인증에 실패했습니다.')
    }
    throw new AdminMfaApiError('NETWORK', 'MFA 인증 요청에 실패했습니다.')
  }
}

export async function fetchAdminAuthRefresh(
  body: RefreshTokenRequestBody
): Promise<AuthTokenResponse> {
  try {
    const { data: payload } = await axiosClient.post<unknown>(
      adminAuthPaths.refresh(),
      body,
      { skipRefresh: true } as InternalAxiosRequestConfig & { skipRefresh?: boolean }
    )
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

/** POST /api/admin/auth/logout — refreshToken 무효화 (Bearer는 axios 인터셉터) */
export async function fetchAdminAuthLogout(body: RefreshTokenRequestBody): Promise<void> {
  try {
    await axiosClient.post<unknown>(
      adminAuthPaths.logout(),
      body,
      { skipRefresh: true } as InternalAxiosRequestConfig & { skipRefresh?: boolean }
    )
  } catch (err) {
    if (err instanceof AdminMfaApiError) throw err
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response?: { data?: unknown } }
      throw parseAuthError(axiosErr.response?.data, '로그아웃에 실패했습니다.')
    }
    throw new AdminMfaApiError('NETWORK', '로그아웃 요청에 실패했습니다.')
  }
}

export { AdminLoginApiError }
