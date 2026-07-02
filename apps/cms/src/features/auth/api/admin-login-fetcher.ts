/**
 * 실서버 관리자 로그인 — POST /api/admin/auth/login → MFA challenge
 */

import { axiosClient } from '@/shared/api'
import { adminAuthPaths } from '@/shared/config/api-paths'
import {
  AdminLoginApprovalPendingError,
  isAdminLoginApprovalPendingCode,
} from '@/features/auth/errors/admin-login-approval-pending-error'
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

function parseLoginError(payload: unknown): AdminLoginApiError | AdminLoginApprovalPendingError {
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    const wrapped = o.error as { code?: string; message?: string } | undefined
    const code = wrapped?.code ?? (typeof o.code === 'string' ? o.code : 'UNKNOWN')
    const message =
      wrapped?.message ??
      (typeof o.message === 'string' ? o.message : undefined) ??
      '로그인에 실패했습니다.'
    const normalizedCode = String(code)
    if (isAdminLoginApprovalPendingCode(normalizedCode)) {
      return new AdminLoginApprovalPendingError(message)
    }
    return new AdminLoginApiError(normalizedCode, message)
  }
  return new AdminLoginApiError('UNKNOWN', '로그인에 실패했습니다.')
}

function unwrapChallengeResponse(payload: unknown): AdminMfaChallengeResponse | null {
  if (!payload || typeof payload !== 'object') return null
  const o = payload as Record<string, unknown>
  if (o.success === true && o.data && typeof o.data === 'object') {
    return unwrapChallengeResponse(o.data)
  }

  const challengeUuid = o.challengeUuid
  const mfaMethod = o.mfaMethod
  const expiresAt = o.expiresAt
  if (typeof challengeUuid !== 'string' || typeof mfaMethod !== 'string' || typeof expiresAt !== 'string') {
    return null
  }

  const readOptionalString = (value: unknown): string | undefined =>
    typeof value === 'string' && value.trim() ? value.trim() : undefined

  return {
    requiresMfa: typeof o.requiresMfa === 'boolean' ? o.requiresMfa : undefined,
    challengeUuid,
    mfaMethod,
    expiresAt,
    totpSecret: readOptionalString(o.totpSecret) ?? readOptionalString(o.secret),
    otpauthUri: readOptionalString(o.otpauthUri),
    qrDataUrl: readOptionalString(o.qrDataUrl) ?? readOptionalString(o.qrCode),
  }
}

/**
 * 이메일·비밀번호 검증 성공 시 MFA challenge 반환 (토큰은 mfa/verify 이후).
 */
export async function fetchAdminLogin(
  body: AdminLoginRequestBody
): Promise<AdminMfaChallengeResponse> {
  try {
    const { data: payload } = await axiosClient.post<unknown>(adminAuthPaths.login(), body)
    const challenge = unwrapChallengeResponse(payload)

    if (challenge?.challengeUuid) {
      return challenge
    }

    throw parseLoginError(payload)
  } catch (err) {
    if (err instanceof AdminLoginApiError || err instanceof AdminLoginApprovalPendingError) throw err
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response?: { data?: unknown } }
      throw parseLoginError(axiosErr.response?.data)
    }
    throw new AdminLoginApiError('NETWORK', '로그인 요청에 실패했습니다.')
  }
}
