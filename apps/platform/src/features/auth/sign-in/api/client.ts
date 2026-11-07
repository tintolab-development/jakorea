import { axiosClient, postPortalAuthLogout } from '@/shared/api/axios-instance'
import type { InternalAxiosRequestConfig } from 'axios'
import { portalAuthPaths, portalMePaths } from './endpoints'
import { parseAuthTokenResponse } from './parse-auth-token'
import {
  parseHomepageMeResponse,
  parsePhoneIdentityChangeResponse,
  parsePortalProfileResponse,
} from './parse-portal-member'
import {
  PORTAL_WITHDRAWAL_CONFIRMATION_TEXT,
  type AuthTokenResponse,
  type HomepageMeResponse,
  type MemberLoginRequest,
  type PasswordChangeRequest,
  type PhoneIdentityChangeResponse,
  type PhoneIdentityConfirmRequest,
  type PortalProfileResponse,
  type PortalWithdrawalRequest,
  type PortalWithdrawalResponse,
  type UpdatePortalProfileRequest,
} from './types'

type SkipAuthConfig = InternalAxiosRequestConfig & {
  skipAuth?: boolean
  skipRefresh?: boolean
}

/** POST /api/portal/auth/logout — body refreshToken, 204 */
export async function postPortalLogout(refreshToken: string): Promise<void> {
  await postPortalAuthLogout(refreshToken)
}

/** POST /api/portal/auth/login — PUBLIC */
export async function postPortalLogin(
  body: MemberLoginRequest,
): Promise<AuthTokenResponse & { accessToken: string; refreshToken: string }> {
  const { data } = await axiosClient.post<unknown>(portalAuthPaths.login(), body, {
    skipAuth: true,
    skipRefresh: true,
  } as SkipAuthConfig)
  return parseAuthTokenResponse(data)
}

/** GET /api/portal/auth/me — 세션 회원 정보 */
export async function getPortalMe(signal?: AbortSignal): Promise<HomepageMeResponse> {
  const { data } = await axiosClient.get<unknown>(portalAuthPaths.me(), { signal })
  return parseHomepageMeResponse(data)
}

/** GET /api/portal/me/profile — 내정보(역할 플래그 포함) */
export async function getPortalProfile(signal?: AbortSignal): Promise<PortalProfileResponse> {
  const { data } = await axiosClient.get<unknown>(portalMePaths.profile(), { signal })
  return parsePortalProfileResponse(data)
}

/** PATCH /api/portal/me/profile — 내정보 수정 (본인인증 필드 제외) */
export async function patchPortalProfile(
  body: UpdatePortalProfileRequest,
): Promise<PortalProfileResponse> {
  const { data } = await axiosClient.patch<unknown>(portalMePaths.profile(), body)
  return parsePortalProfileResponse(data)
}

/** POST /api/portal/me/phone/identity/confirm — 연락처 본인인증 후 변경 */
export async function postPortalPhoneIdentityConfirm(
  body: PhoneIdentityConfirmRequest,
): Promise<PhoneIdentityChangeResponse> {
  const { data } = await axiosClient.post<unknown>(portalMePaths.phoneIdentityConfirm(), body)
  return parsePhoneIdentityChangeResponse(data)
}

export type PortalPasswordChangeTokens = AuthTokenResponse & {
  accessToken: string
  refreshToken: string
}

/**
 * POST /api/portal/auth/password/change
 * BE는 기존 세션을 폐기하고 새 sid 결속 `AuthTokenResponse`를 즉시 반환한다 — 호출자는 이 토큰을 저장해야 한다.
 * 응답에 토큰이 없으면(구 BE 계약) null — 성공으로 토큰을 꾸며내지 않는다.
 */
export async function postPortalPasswordChange(
  body: PasswordChangeRequest,
): Promise<PortalPasswordChangeTokens | null> {
  const { data } = await axiosClient.post<unknown>(portalAuthPaths.passwordChange(), body)
  try {
    return parseAuthTokenResponse(data)
  } catch {
    return null
  }
}

/** POST /api/portal/me/withdrawals — 회원 탈퇴 및 개인정보 비식별화 */
export async function postPortalWithdrawal(
  body: PortalWithdrawalRequest,
): Promise<PortalWithdrawalResponse> {
  const { data } = await axiosClient.post<unknown>(portalMePaths.withdrawals(), {
    currentPassword: body.currentPassword,
    reason: body.reason,
    confirmationText:
      body.confirmationText?.trim() || PORTAL_WITHDRAWAL_CONFIRMATION_TEXT,
  })
  if (!data || typeof data !== 'object') {
    return {}
  }
  const root = data as Record<string, unknown>
  const payload =
    root.success === true && root.data && typeof root.data === 'object'
      ? (root.data as Record<string, unknown>)
      : root
  return {
    memberId: typeof payload.memberId === 'number' ? payload.memberId : undefined,
    status: typeof payload.status === 'string' ? payload.status : undefined,
    withdrawnAt: typeof payload.withdrawnAt === 'string' ? payload.withdrawnAt : undefined,
    message: typeof payload.message === 'string' ? payload.message : undefined,
  }
}
