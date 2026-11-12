/**
 * 실서버 관리자 로그인 — POST /api/admin/auth/login → MFA challenge
 */

import { isAxiosError, type InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api'
import { adminAuthPaths } from '@/shared/config/api-paths'
import {
  AdminLoginApprovalPendingError,
  ADMIN_LOGIN_APPROVAL_PENDING_MESSAGE,
  isAdminLoginApprovalPendingResponse,
} from '@/features/auth/errors/admin-login-approval-pending-error'
import { parseAdminMfaChallenge } from '@/features/auth/lib/admin-mfa-contract'
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
  /** 서버 `error.field` (입력 검증 실패 시 `email`·`password` 등) */
  readonly field?: string

  constructor(code: string, message: string, field?: string) {
    super(message)
    this.name = 'AdminLoginApiError'
    this.code = code
    this.field = field
  }
}

function parseLoginError(
  payload: unknown,
  httpStatus?: number
): AdminLoginApiError | AdminLoginApprovalPendingError {
  if (isAdminLoginApprovalPendingResponse(payload, httpStatus)) {
    return new AdminLoginApprovalPendingError(ADMIN_LOGIN_APPROVAL_PENDING_MESSAGE)
  }
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    const wrapped = o.error as { code?: string; message?: string; field?: unknown } | undefined
    const code = wrapped?.code ?? (typeof o.code === 'string' ? o.code : 'UNKNOWN')
    const message =
      wrapped?.message ??
      (typeof o.message === 'string' ? o.message : undefined) ??
      '로그인에 실패했습니다.'
    const field =
      typeof wrapped?.field === 'string' && wrapped.field.trim() ? wrapped.field.trim() : undefined
    return new AdminLoginApiError(String(code), message, field)
  }
  return new AdminLoginApiError('UNKNOWN', '로그인에 실패했습니다.')
}

function unwrapChallengeResponse(payload: unknown): AdminMfaChallengeResponse | null {
  return parseAdminMfaChallenge(payload)
}

/**
 * 이메일·비밀번호 검증 성공 시 MFA challenge 반환 (토큰은 mfa/verify 이후).
 */
export async function fetchAdminLogin(
  body: AdminLoginRequestBody
): Promise<AdminMfaChallengeResponse> {
  try {
    const { data: payload } = await axiosClient.post<unknown>(adminAuthPaths.login(), body, {
      skipRefresh: true,
      skipAuth: true,
      skipGlobalErrorAlert: true,
    } as InternalAxiosRequestConfig & {
      skipRefresh?: boolean
      skipAuth?: boolean
      skipGlobalErrorAlert?: boolean
    })
    const challenge = unwrapChallengeResponse(payload)

    if (challenge?.challengeUuid) {
      return challenge
    }

    throw parseLoginError(payload)
  } catch (err) {
    if (err instanceof AdminLoginApiError || err instanceof AdminLoginApprovalPendingError) throw err
    if (isAxiosError(err)) {
      throw parseLoginError(err.response?.data, err.response?.status)
    }
    throw new AdminLoginApiError('NETWORK', '로그인 요청에 실패했습니다.')
  }
}
