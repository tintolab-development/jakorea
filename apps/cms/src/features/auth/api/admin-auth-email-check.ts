import { axiosClient } from '@/shared/api'
import type {
  AccountEmailCheckRequest,
  AccountEmailCheckResponse,
} from '@/shared/api/generated/members/schemas'
import { adminAuthPaths } from '@/shared/config/api-paths'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import {
  AdminRegisterApiError,
  parseAdminRegisterApiError,
} from '@/features/auth/model/admin-register-api.types'

export type AdminAuthEmailCheckPurpose = 'SIGNUP' | 'PASSWORD_RESET'

function unwrapEmailCheckResponse(payload: unknown): AccountEmailCheckResponse {
  if (!payload || typeof payload !== 'object') {
    throw parseAdminRegisterApiError(payload)
  }

  const o = payload as Record<string, unknown>
  if (o.success === false) {
    throw parseAdminRegisterApiError(payload)
  }
  if (o.data && typeof o.data === 'object') {
    return o.data as AccountEmailCheckResponse
  }
  return o as AccountEmailCheckResponse
}

export function isAdminAuthEmailCheckRemoteEnabled(): boolean {
  return isRealApiModuleEnabled('adminAuth') || isRealApiModuleEnabled('findPassword')
}

export async function checkAdminAuthEmail(
  email: string,
  purpose: AdminAuthEmailCheckPurpose
): Promise<AccountEmailCheckResponse> {
  const body: AccountEmailCheckRequest = {
    email: email.trim(),
    purpose,
  }

  try {
    const { data: payload } = await axiosClient.post<unknown>(adminAuthPaths.emailCheck(), body)
    return unwrapEmailCheckResponse(payload)
  } catch (error) {
    if (error instanceof AdminRegisterApiError) {
      throw error
    }
    const axiosErr = error as { response?: { data?: unknown } }
    if (axiosErr.response?.data) {
      throw parseAdminRegisterApiError(axiosErr.response.data)
    }
    throw error instanceof Error
      ? new AdminRegisterApiError('NETWORK', error.message)
      : new AdminRegisterApiError('NETWORK', '이메일 확인에 실패했습니다.')
  }
}

export function isEmailAvailableForSignup(result: AccountEmailCheckResponse): boolean {
  if (typeof result.available === 'boolean') {
    return result.available
  }
  if (typeof result.exists === 'boolean') {
    return !result.exists
  }
  return false
}

export function isEmailRegisteredForPasswordReset(result: AccountEmailCheckResponse): boolean {
  if (typeof result.exists === 'boolean') {
    return result.exists
  }
  if (result.nextAction === 'START_IDENTITY_VERIFICATION') {
    return true
  }
  if (result.nextAction === 'SHOW_EMAIL_NOT_FOUND') {
    return false
  }
  if (typeof result.available === 'boolean') {
    return !result.available
  }
  return false
}
