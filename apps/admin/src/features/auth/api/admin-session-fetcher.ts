import { isAxiosError } from 'axios'
import {
  parseAdminAuthActivityResponse,
  parseAdminAuthSessionResponse,
  type AdminAuthActivityResponse,
  type AdminAuthSessionResponse,
} from '@jakorea/domain/session'
import { adminAuthPaths } from '@/shared/config/api-paths'
import { axiosInstance, type RetryableRequest } from '@/shared/instance/axios-instance'

export async function postAdminAuthActivity(): Promise<AdminAuthActivityResponse> {
  const res = await axiosInstance.post<unknown>(
    adminAuthPaths.activity(),
    undefined,
    { skipRefresh: true } as RetryableRequest
  )
  const parsed = parseAdminAuthActivityResponse(res.data)
  if (!parsed) throw new Error('Invalid admin activity response')
  return parsed
}

export async function getAdminAuthSession(): Promise<AdminAuthSessionResponse> {
  const res = await axiosInstance.get<unknown>(adminAuthPaths.session())
  const parsed = parseAdminAuthSessionResponse(res.data)
  if (!parsed) throw new Error('Invalid admin session response')
  return parsed
}

export function isAdminAuthUnauthorizedError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 401
}

export function isAdminAuthForbiddenError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 403
}

export function isAdminAuthRetryableTransportError(error: unknown): boolean {
  if (!isAxiosError(error)) return false
  const status = error.response?.status
  return status == null || status >= 500
}
