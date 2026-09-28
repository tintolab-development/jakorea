import type { InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import type {
  PublicNoticeDetail,
  PublicNoticeListPage,
  PublicNoticeListQuery,
} from './types'

type SkipAuthConfig = InternalAxiosRequestConfig & {
  skipAuth?: boolean
  skipRefresh?: boolean
}

const PUBLIC_NOTICES_PATH = '/api/public/ja-korea/notices'

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    if (o.success === true && 'data' in o) {
      return unwrapEnvelope<T>(o.data)
    }
  }
  return payload as T
}

const SKIP_AUTH: SkipAuthConfig = {
  timeout: 8_000,
  skipAuth: true,
  skipRefresh: true,
} as SkipAuthConfig

/** GET /api/public/ja-korea/notices — 인증 불필요. optional `q` + page·size. */
export async function fetchPublicNotices(
  params: PublicNoticeListQuery,
  signal?: AbortSignal,
): Promise<PublicNoticeListPage> {
  const q = params.q?.trim()
  const { data } = await axiosClient.get<unknown>(PUBLIC_NOTICES_PATH, {
    ...SKIP_AUTH,
    signal,
    params: {
      ...(q ? { q } : {}),
      page: params.page ?? 0,
      size: params.size ?? 20,
    },
  })
  const unwrapped = unwrapEnvelope<PublicNoticeListPage>(data)
  if (!unwrapped || typeof unwrapped !== 'object') {
    return { items: [], totalCount: 0, page: 0, size: params.size ?? 20, totalPages: 0 }
  }
  return unwrapped
}

/** GET /api/public/ja-korea/notices/{id} — 인증 불필요. 조회수 증가. */
export async function fetchPublicNoticeDetail(
  id: number,
  signal?: AbortSignal,
): Promise<PublicNoticeDetail> {
  const { data } = await axiosClient.get<unknown>(`${PUBLIC_NOTICES_PATH}/${id}`, {
    ...SKIP_AUTH,
    signal,
  })
  return unwrapEnvelope<PublicNoticeDetail>(data)
}
