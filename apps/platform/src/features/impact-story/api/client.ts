import type { InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import type {
  PublicCategoryResponse,
  PublicStoryDetail,
  PublicStoryListPage,
  PublicStoryListQuery,
} from './types'

type SkipAuthConfig = InternalAxiosRequestConfig & {
  skipAuth?: boolean
  skipRefresh?: boolean
}

const PUBLIC_CATEGORIES_PATH = '/api/public/impact-story/categories'
const PUBLIC_STORIES_PATH = '/api/public/impact-story/stories'

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

/** GET /api/public/impact-story/categories — 인증 불필요 */
export async function fetchPublicImpactCategories(
  signal?: AbortSignal
): Promise<PublicCategoryResponse[]> {
  const { data } = await axiosClient.get<unknown>(PUBLIC_CATEGORIES_PATH, {
    ...SKIP_AUTH,
    signal,
  })
  const unwrapped = unwrapEnvelope<unknown>(data)
  return Array.isArray(unwrapped) ? (unwrapped as PublicCategoryResponse[]) : []
}

/** GET /api/public/impact-story/stories — 인증 불필요 */
export async function fetchPublicImpactStories(
  params: PublicStoryListQuery,
  signal?: AbortSignal
): Promise<PublicStoryListPage> {
  const q = params.q?.trim()
  const { data } = await axiosClient.get<unknown>(PUBLIC_STORIES_PATH, {
    ...SKIP_AUTH,
    signal,
    params: {
      ...(params.categoryId != null ? { categoryId: params.categoryId } : {}),
      ...(q ? { q } : {}),
      page: params.page ?? 0,
      size: params.size ?? 20,
    },
  })
  const unwrapped = unwrapEnvelope<PublicStoryListPage>(data)
  if (!unwrapped || typeof unwrapped !== 'object') {
    return { items: [], totalCount: 0, page: 0, size: params.size ?? 20, totalPages: 0 }
  }
  return unwrapped
}

/** GET /api/public/impact-story/stories/{id} — 인증 불필요 */
export async function fetchPublicImpactStoryDetail(
  id: number,
  signal?: AbortSignal
): Promise<PublicStoryDetail> {
  const { data } = await axiosClient.get<unknown>(`${PUBLIC_STORIES_PATH}/${id}`, {
    ...SKIP_AUTH,
    signal,
  })
  return unwrapEnvelope<PublicStoryDetail>(data)
}
