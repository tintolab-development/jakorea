import type { InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import type { PublicTextbookListQuery } from '../lib/list-query'
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

function emptyTextbookPage(query: PublicTextbookListQuery): PublicTextbookListPage {
  return {
    items: [],
    totalCount: 0,
    page: query.page,
    size: query.size,
    totalPages: 0,
  }
}

/** GET /api/public/education/textbooks — 인증 불필요. 필터·정렬·페이지는 쿼리 SSOT. */
export async function fetchPublicTextbooks(
  query: PublicTextbookListQuery,
  signal?: AbortSignal
): Promise<PublicTextbookListPage> {
  const { data } = await axiosClient.get<unknown>(TEXTBOOKS_PATH, {
    ...SKIP_AUTH,
    signal,
    params: {
      ...(query.fieldCode ? { fieldCode: query.fieldCode } : {}),
      sort: query.sort,
      page: query.page,
      size: query.size,
    },
  })
  const unwrapped = unwrapEnvelope<PublicTextbookListPage>(data)
  if (!unwrapped || typeof unwrapped !== 'object') {
    return emptyTextbookPage(query)
  }
  return {
    items: Array.isArray(unwrapped.items) ? unwrapped.items : [],
    totalCount: unwrapped.totalCount ?? 0,
    page: unwrapped.page ?? query.page,
    size: unwrapped.size ?? query.size,
    totalPages: unwrapped.totalPages ?? 0,
  }
}

/** GET /api/public/education/textbooks/{id} — 인증 불필요 */
export async function fetchPublicTextbook(
  id: string,
  signal?: AbortSignal
): Promise<PublicTextbookDetail> {
  const { data } = await axiosClient.get<unknown>(`${TEXTBOOKS_PATH}/${id}`, {
    ...SKIP_AUTH,
    signal,
  })
  return unwrapEnvelope<PublicTextbookDetail>(data)
}
