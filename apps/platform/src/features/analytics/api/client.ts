import type { InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import type { VisitorSessionResponse } from './types'

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

/** POST /api/public/analytics/sessions — 쿠키 `ja_homepage_session` */
export async function postVisitorSession(): Promise<VisitorSessionResponse> {
  const { data } = await axiosClient.post<unknown>(
    '/api/public/analytics/sessions',
    undefined,
    SKIP_AUTH,
  )
  return unwrapEnvelope<VisitorSessionResponse>(data)
}

/** POST /api/public/analytics/events */
export async function postMetricEvent(metricCode: string): Promise<void> {
  await axiosClient.post('/api/public/analytics/events', { metricCode }, SKIP_AUTH)
}
