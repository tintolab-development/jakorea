/**
 * POST /api/admin/auth/password/change
 */

import type { InternalAxiosRequestConfig } from 'axios'

import { axiosClient } from '@/shared/api'
import { adminAuthPaths } from '@/shared/config/api-paths'
import { AdminMfaApiError } from '@/features/auth/api/admin-auth-fetcher'

export type AdminPasswordChangeRequestBody = {
  currentPassword: string
  newPassword: string
}

function parseError(payload: unknown, fallback: string): AdminMfaApiError {
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    if (o.success === false) {
      const raw = typeof o.message === 'string' ? o.message : fallback
      return new AdminMfaApiError('PASSWORD_CHANGE_FAILED', raw)
    }
    const wrapped = o.error as { code?: string; message?: string } | undefined
    const code = wrapped?.code ?? 'UNKNOWN'
    const raw = wrapped?.message ?? (typeof o.message === 'string' ? o.message : fallback)
    return new AdminMfaApiError(String(code), raw || fallback)
  }
  return new AdminMfaApiError('UNKNOWN', fallback)
}

export async function fetchAdminPasswordChange(
  body: AdminPasswordChangeRequestBody
): Promise<void> {
  try {
    await axiosClient.post(adminAuthPaths.passwordChange(), body, {
      skipRefresh: true,
      skipGlobalErrorAlert: true,
    } as InternalAxiosRequestConfig & {
      skipRefresh?: boolean
      skipGlobalErrorAlert?: boolean
    })
  } catch (err) {
    if (err instanceof AdminMfaApiError) throw err
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response?: { data?: unknown } }
      throw parseError(axiosErr.response?.data, '비밀번호 변경에 실패했습니다.')
    }
    throw new AdminMfaApiError('NETWORK', '비밀번호 변경 요청에 실패했습니다.')
  }
}
