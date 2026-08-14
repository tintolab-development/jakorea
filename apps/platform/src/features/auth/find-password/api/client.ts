import type { InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import { portalAuthPaths } from '@/features/auth/sign-in'
import { parseAccountEmailCheckResponse, parsePasswordResetConfirmResponse } from './parse'
import type {
  AccountEmailCheckRequest,
  AccountEmailCheckResponse,
  PasswordResetConfirmRequest,
  PasswordResetConfirmResponse,
} from './types'

type SkipAuthConfig = InternalAxiosRequestConfig & {
  skipAuth?: boolean
  skipRefresh?: boolean
}

/** POST /api/portal/auth/email/check — PUBLIC */
export async function postPortalEmailCheck(
  body: AccountEmailCheckRequest,
): Promise<AccountEmailCheckResponse> {
  const { data } = await axiosClient.post<unknown>(portalAuthPaths.emailCheck(), body, {
    skipAuth: true,
    skipRefresh: true,
  } as SkipAuthConfig)
  return parseAccountEmailCheckResponse(data)
}

/** POST /api/portal/auth/password-reset/confirm — PUBLIC */
export async function postPortalPasswordResetConfirm(
  body: PasswordResetConfirmRequest,
): Promise<PasswordResetConfirmResponse> {
  const { data } = await axiosClient.post<unknown>(portalAuthPaths.passwordResetConfirm(), body, {
    skipAuth: true,
    skipRefresh: true,
  } as SkipAuthConfig)
  return parsePasswordResetConfirmResponse(data)
}
