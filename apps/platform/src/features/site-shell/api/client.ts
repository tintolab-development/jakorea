import type { InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'

type SkipAuthConfig = InternalAxiosRequestConfig & {
  skipAuth?: boolean
  skipRefresh?: boolean
}

function unwrapData(payload: unknown): unknown {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>
    if (record.success === true && 'data' in record) return unwrapData(record.data)
  }
  return payload
}

async function getPublic(path: string, signal?: AbortSignal): Promise<unknown> {
  const { data } = await axiosClient.get<unknown>(path, {
    signal,
    timeout: 8_000,
    skipAuth: true,
    skipRefresh: true,
  } as SkipAuthConfig)
  return unwrapData(data)
}

export function fetchPublicSiteSettings(signal?: AbortSignal): Promise<unknown> {
  return getPublic('/api/public/site/settings', signal)
}

export function fetchPublicSiteGnb(signal?: AbortSignal): Promise<unknown> {
  return getPublic('/api/public/site/gnb', signal)
}

export function fetchPublicSiteFooter(signal?: AbortSignal): Promise<unknown> {
  return getPublic('/api/public/site/footer', signal)
}
