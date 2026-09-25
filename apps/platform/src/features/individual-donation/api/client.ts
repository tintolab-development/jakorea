import type { InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import type { PublicPersonalSponsorshipResponse } from './types'

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

/** GET /api/public/sponsorship/personal — 인증 불필요 */
export async function fetchPublicPersonalSponsorship(
  signal?: AbortSignal,
): Promise<PublicPersonalSponsorshipResponse> {
  const { data } = await axiosClient.get<unknown>('/api/public/sponsorship/personal', {
    ...SKIP_AUTH,
    signal,
  })
  return unwrapEnvelope<PublicPersonalSponsorshipResponse>(data)
}
