/**
 * POST /api/admin/auth/password/change — CMS 계정
 */

import { isAxiosError } from 'axios'
import { axiosInstance } from '@/shared/instance/axios-instance'
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
      const wrapped = o.error as { code?: string; message?: string } | undefined
      const code = wrapped?.code?.trim() || 'PASSWORD_CHANGE_FAILED'
      const raw =
        wrapped?.message?.trim() ||
        (typeof o.message === 'string' ? o.message.trim() : '') ||
        fallback
      return new AdminMfaApiError(code, raw || fallback)
    }
    const wrapped = o.error as { code?: string; message?: string } | undefined
    const code = wrapped?.code ?? 'UNKNOWN'
    const raw = wrapped?.message ?? (typeof o.message === 'string' ? o.message : fallback)
    return new AdminMfaApiError(String(code), raw || fallback)
  }
  return new AdminMfaApiError('UNKNOWN', fallback)
}

export async function fetchAdminPasswordChange(
  body: AdminPasswordChangeRequestBody,
): Promise<void> {
  try {
    await axiosInstance.post(adminAuthPaths.passwordChange(), body)
  } catch (error) {
    if (error instanceof AdminMfaApiError) throw error
    if (isAxiosError(error)) {
      throw parseError(error.response?.data, '비밀번호 변경에 실패했습니다.')
    }
    throw new AdminMfaApiError('NETWORK', '비밀번호 변경 요청에 실패했습니다.')
  }
}
