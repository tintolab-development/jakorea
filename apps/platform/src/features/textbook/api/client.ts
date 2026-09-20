import type { InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import type { PublicTextbookListPage } from './types'

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
const TEXTBOOKS_PAGE_SIZE = 50

/** GET /api/public/education/textbooks — 인증 불필요. 페이지 키는 `items`. */
export async function fetchPublicTextbooks(signal?: AbortSignal): Promise<PublicTextbookListPage> {
  const { data } = await axiosClient.get<unknown>(TEXTBOOKS_PATH, {
    ...SKIP_AUTH,
    signal,
    params: { page: 0, size: TEXTBOOKS_PAGE_SIZE },
  })
  const unwrapped = unwrapEnvelope<PublicTextbookListPage>(data)
  if (!unwrapped || typeof unwrapped !== 'object') {
    return { items: [], totalCount: 0, page: 0, size: TEXTBOOKS_PAGE_SIZE, totalPages: 0 }
  }
  return {
    items: Array.isArray(unwrapped.items) ? unwrapped.items : [],
    totalCount: unwrapped.totalCount,
    page: unwrapped.page,
    size: unwrapped.size,
    totalPages: unwrapped.totalPages,
  }
}
