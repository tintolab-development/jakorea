/**
 * 실서버 관리자 로그인 — POST /api/admin/auth/login → MFA challenge
 */

import { isAxiosError, type InternalAxiosRequestConfig } from 'axios'
import { axiosInstance } from '@/shared/instance/axios-instance'
import { adminAuthPaths } from '@/shared/config/api-paths'
import {
  AdminLoginApprovalPendingError,
  ADMIN_LOGIN_APPROVAL_PENDING_MESSAGE,
  isAdminLoginApprovalPendingResponse,
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

function parseLoginError(
  payload: unknown,
  httpStatus?: number
): AdminLoginApiError | AdminLoginApprovalPendingError {
  if (isAdminLoginApprovalPendingResponse(payload, httpStatus)) {
    return new AdminLoginApprovalPendingError(ADMIN_LOGIN_APPROVAL_PENDING_MESSAGE)
  }
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

function unwrapChallengeResponse(payload: unknown): AdminMfaChallengeResponse | null {
  if (!payload || typeof payload !== 'object') return null
  const o = payload as Record<string, unknown>
  if (o.success === true && o.data && typeof o.data === 'object') {
    return unwrapChallengeResponse(o.data)
  }

  const challengeUuid = o.challengeUuid
  const mfaMethod = o.mfaMethod
  const expiresAt = o.expiresAt
  if (
    typeof challengeUuid !== 'string' ||
    typeof mfaMethod !== 'string' ||
    typeof expiresAt !== 'string'
  ) {
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

export async function fetchAdminLogin(
  body: AdminLoginRequestBody
): Promise<AdminMfaChallengeResponse> {
  try {
    const { data: payload } = await axiosInstance.post<unknown>(adminAuthPaths.login(), body, {
      skipRefresh: true,
      skipAuth: true,
    } as InternalAxiosRequestConfig & { skipRefresh?: boolean; skipAuth?: boolean })
    const challenge = unwrapChallengeResponse(payload)

    if (challenge?.challengeUuid) {
      return challenge
    }

    throw parseLoginError(payload)
  } catch (err) {
    if (err instanceof AdminLoginApiError || err instanceof AdminLoginApprovalPendingError) {
      throw err
    }
    if (isAxiosError(err)) {
      throw parseLoginError(err.response?.data, err.response?.status)
    }
    throw new AdminLoginApiError('NETWORK', '로그인 요청에 실패했습니다.')
  }
}
