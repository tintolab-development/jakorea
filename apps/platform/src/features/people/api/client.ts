import type { InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import type { PublicPeopleResponse } from './types'

type SkipAuthConfig = InternalAxiosRequestConfig & {
  skipAuth?: boolean
  skipRefresh?: boolean
}

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (record.success === true && 'data' in record) {
      return unwrapEnvelope<T>(record.data)
    }
  }
  return payload as T
}

const SKIP_AUTH: SkipAuthConfig = {
  timeout: 8_000,
  skipAuth: true,
  skipRefresh: true,
} as SkipAuthConfig

/** GET /api/public/ja-korea/people — 인증 불필요 */
export async function fetchPublicPeople(signal?: AbortSignal): Promise<PublicPeopleResponse> {
  const { data } = await axiosClient.get<unknown>('/api/public/ja-korea/people', {
    ...SKIP_AUTH,
    signal,
  })
  return unwrapEnvelope<PublicPeopleResponse>(data)
}
