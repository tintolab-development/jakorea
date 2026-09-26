import type { InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import type {
  PublicReportListPage,
  PublicReportListQuery,
  PublicReportType,
  PublicTransparencyResponse,
} from './types'

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

const PUBLIC_TRANSPARENCY_PATH = '/api/public/ja-korea/transparency'

/** GET /api/public/ja-korea/transparency — 인증 불필요 */
export async function fetchPublicTransparency(
  signal?: AbortSignal,
): Promise<PublicTransparencyResponse> {
  const { data } = await axiosClient.get<unknown>(PUBLIC_TRANSPARENCY_PATH, {
    ...SKIP_AUTH,
    signal,
  })
  return unwrapEnvelope<PublicTransparencyResponse>(data)
}

/** GET /api/public/ja-korea/transparency/reports/{type} — 인증 불필요. optional `q` + page·size. */
export async function fetchPublicTransparencyReports(
  type: PublicReportType,
  params: PublicReportListQuery,
  signal?: AbortSignal,
): Promise<PublicReportListPage> {
  const q = params.q?.trim()
  const size = params.size ?? 20
  const { data } = await axiosClient.get<unknown>(
    `${PUBLIC_TRANSPARENCY_PATH}/reports/${type}`,
    {
      ...SKIP_AUTH,
      signal,
      params: {
        ...(q ? { q } : {}),
        page: params.page ?? 0,
        size,
      },
    },
  )
  const unwrapped = unwrapEnvelope<PublicReportListPage>(data)
  if (!unwrapped || typeof unwrapped !== 'object') {
    return { items: [], totalCount: 0, page: 0, size, totalPages: 0 }
  }
  return unwrapped
}
