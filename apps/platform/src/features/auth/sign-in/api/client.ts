import { axiosClient } from '@/shared/api/axios-instance'
import type { InternalAxiosRequestConfig } from 'axios'
import { portalAuthPaths, portalMePaths } from './endpoints'
import { parseAuthTokenResponse } from './parse-auth-token'
import {
  parseHomepageMeResponse,
  parsePortalProfileResponse,
} from './parse-portal-member'
import type {
  HomepageMeResponse,
  MemberLoginRequest,
  PasswordChangeRequest,
  PortalProfileResponse,
  UpdatePortalProfileRequest,
} from './types'

type SkipAuthConfig = InternalAxiosRequestConfig & {
  skipAuth?: boolean
  skipRefresh?: boolean
}

/** POST /api/portal/auth/login — PUBLIC */
export async function postPortalLogin(body: MemberLoginRequest): Promise<{
  accessToken: string
  refreshToken: string
  tokenType?: string
  expiresInSeconds?: number
  passwordChangeRequired?: boolean
  adminProvisionedOnboardingRequired?: boolean
  adminProvisionedOnboardingStep?: string
  registeredByAdmin?: boolean
  identitySelfSignupCompletedAfterAdminRegistration?: boolean
}> {
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

/** POST /api/portal/auth/password/change */
export async function postPortalPasswordChange(body: PasswordChangeRequest): Promise<void> {
  await axiosClient.post(portalAuthPaths.passwordChange(), body)
}
