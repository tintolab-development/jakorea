import type { InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import { API_LIST_PAGE_SIZE, fetchAllApiPages } from '@/shared/lib/fetch-all-api-pages'
import type { PublicTextbookDetail, PublicTextbookListPage } from './types'

type SkipAuthConfig = InternalAxiosRequestConfig & {
  skipAuth?: boolean
  skipRefresh?: boolean
}

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

const TEXTBOOKS_PATH = '/api/public/education/textbooks'
const TEXTBOOKS_PAGE_SIZE = API_LIST_PAGE_SIZE

/** GET /api/public/education/textbooks — 인증 불필요. 페이지 키는 `items`. */
export async function fetchPublicTextbooks(signal?: AbortSignal): Promise<PublicTextbookListPage> {
  const items = await fetchAllApiPages(async (page, size) => {
    const { data } = await axiosClient.get<unknown>(TEXTBOOKS_PATH, {
      ...SKIP_AUTH,
      signal,
      params: { page, size },
    })
    const unwrapped = unwrapEnvelope<PublicTextbookListPage>(data)
    if (!unwrapped || typeof unwrapped !== 'object') {
      return { items: [], totalPages: 0 }
    }
    return {
      items: Array.isArray(unwrapped.items) ? unwrapped.items : [],
      totalPages: unwrapped.totalPages,
    }
  })
  return {
    items,
    totalCount: items.length,
    page: 0,
    size: TEXTBOOKS_PAGE_SIZE,
    totalPages: items.length > 0 ? 1 : 0,
  }
}

/** GET /api/public/education/textbooks/{id} — 인증 불필요 */
export async function fetchPublicTextbook(
  id: string,
  signal?: AbortSignal,
): Promise<PublicTextbookDetail> {
  const { data } = await axiosClient.get<unknown>(`${TEXTBOOKS_PATH}/${id}`, {
    ...SKIP_AUTH,
    signal,
  })
  return unwrapEnvelope<PublicTextbookDetail>(data)
}
