/**
 * 실서버 관리자 로그인 — POST /api/admin/auth/login → MFA challenge
 */

import { axiosClient } from '@/shared/api'
import { adminAuthPaths } from '@/shared/config/api-paths'
import type {
  AdminLoginRequestBody,
  AdminMfaChallengeResponse,
} from '@/features/auth/model/admin-login-api.types'

export type {
  AdminLoginRequestBody,
  AdminMfaChallengeResponse,
} from '@/features/auth/model/admin-login-api.types'

export class AdminLoginApiError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'AdminLoginApiError'
    this.code = code
  }
}

function parseLoginError(payload: unknown): AdminLoginApiError {
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    const wrapped = o.error as { code?: string; message?: string } | undefined
    const code = wrapped?.code ?? (typeof o.code === 'string' ? o.code : 'UNKNOWN')
    const message =
      wrapped?.message ??
      (typeof o.message === 'string' ? o.message : undefined) ??
      '로그인에 실패했습니다.'
    return new AdminLoginApiError(String(code), message)
  }
  return new AdminLoginApiError('UNKNOWN', '로그인에 실패했습니다.')
}

/**
 * 이메일·비밀번호 검증 성공 시 MFA challenge 반환 (토큰은 mfa/verify 이후).
 */
export async function fetchAdminLogin(
  body: AdminLoginRequestBody
): Promise<AdminMfaChallengeResponse> {
  try {
    const { data: payload } = await axiosClient.post<AdminMfaChallengeResponse>(
      adminAuthPaths.login(),
      body
    )

    if (payload?.challengeUuid) {
      return payload
    }

    throw parseLoginError(payload)
  } catch (err) {
    if (err instanceof AdminLoginApiError) throw err
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response?: { data?: unknown } }
      throw parseLoginError(axiosErr.response?.data)
    }
    throw new AdminLoginApiError('NETWORK', '로그인 요청에 실패했습니다.')
  }
}
