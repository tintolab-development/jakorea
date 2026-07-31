import { axiosClient } from '@/shared/api/axios-instance'
import type { InternalAxiosRequestConfig } from 'axios'
import { portalAuthPaths } from './endpoints'
import { parseAuthTokenResponse } from './parse-auth-token'
import type { MemberLoginRequest } from './types'

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
}> {
  const { data } = await axiosClient.post<unknown>(portalAuthPaths.login(), body, {
    skipAuth: true,
    skipRefresh: true,
  } as SkipAuthConfig)
  return parseAuthTokenResponse(data)
}
