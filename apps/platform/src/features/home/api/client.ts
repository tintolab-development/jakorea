import type { InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import type { PublicMainResponse } from './types'

type SkipAuthConfig = InternalAxiosRequestConfig & {
  skipAuth?: boolean
  skipRefresh?: boolean
}

const PUBLIC_MAIN_PATH = '/api/public/main'

function unwrapPublicMain(payload: unknown): PublicMainResponse {
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    if (o.success === true && o.data && typeof o.data === 'object') {
      return unwrapPublicMain(o.data)
    }
    return payload as PublicMainResponse
  }
  return {}
}

/** GET /api/public/main — 인증 불필요 */
export async function fetchPublicMain(signal?: AbortSignal): Promise<PublicMainResponse> {
  const { data } = await axiosClient.get<unknown>(PUBLIC_MAIN_PATH, {
    signal,
    timeout: 8_000,
    skipAuth: true,
    skipRefresh: true,
  } as SkipAuthConfig)
  return unwrapPublicMain(data)
}
