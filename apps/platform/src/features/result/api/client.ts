import type { InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import type {
  ProgramResultDetail,
  ProgramResultListPage,
  ProgramResultListQuery,
} from './types'

type SkipAuthConfig = InternalAxiosRequestConfig & {
  skipAuth?: boolean
  skipRefresh?: boolean
}

const PROGRAM_RESULTS_PATH = '/api/portal/public/program-results'

const SKIP_AUTH = {
  timeout: 8_000,
  skipAuth: true,
  skipRefresh: true,
} as SkipAuthConfig

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (record.success === true && 'data' in record) {
      return unwrapEnvelope<T>(record.data)
    }
  }
  return payload as T
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function compactParams(query: ProgramResultListQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {
    page: query.page,
    size: query.size,
    sort: query.sort ?? 'LATEST',
  }
  if (query.categoryId != null) params.categoryId = query.categoryId
  if (query.keyword) params.keyword = query.keyword
  return params
}

function mapListItem(value: unknown) {
  if (!value || typeof value !== 'object') return null
  const row = value as Record<string, unknown>
  const resultId = readNumber(row.resultId)
  const categoryId = readNumber(row.categoryId)
  const title = readString(row.title)
  const announcedAt = readString(row.announcedAt)
  const categoryName = readString(row.categoryName)
  if (resultId == null || categoryId == null || !title || !announcedAt || !categoryName) return null
  return {
    resultId,
    categoryId,
    categoryName,
    title,
    announcedAt,
    viewCount: readNumber(row.viewCount) ?? 0,
  }
}

function mapCategories(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.flatMap(item => {
    if (!item || typeof item !== 'object') return []
    const row = item as Record<string, unknown>
    const categoryId = readNumber(row.categoryId)
    const categoryName = readString(row.categoryName)
    if (categoryId == null || !categoryName) return []
    return [{ categoryId, categoryName }]
  })
}

function normalizeListPage(payload: unknown, fallbackSize: number): ProgramResultListPage {
  const unwrapped = unwrapEnvelope<unknown>(payload)
  if (!unwrapped || typeof unwrapped !== 'object') {
    return { items: [], page: 0, size: fallbackSize, totalElements: 0, totalPages: 0, categories: [] }
  }
  const page = unwrapped as Record<string, unknown>
  const items = Array.isArray(page.items) ? page.items.flatMap(row => {
    const mapped = mapListItem(row)
    return mapped ? [mapped] : []
  }) : []
  return {
    items,
    page: readNumber(page.page) ?? 0,
    size: readNumber(page.size) ?? fallbackSize,
    totalElements: readNumber(page.totalElements) ?? items.length,
    totalPages: readNumber(page.totalPages) ?? 0,
    categories: mapCategories(page.categories),
  }
}

function mapNeighbor(value: unknown) {
  if (!value || typeof value !== 'object') return null
  const row = value as Record<string, unknown>
  const resultId = readNumber(row.resultId)
  const title = readString(row.title)
  if (resultId == null || !title) return null
  return { resultId, title }
}

/** GET /api/portal/public/program-results */
export async function fetchProgramResults(
  query: ProgramResultListQuery,
  signal?: AbortSignal,
): Promise<ProgramResultListPage> {
  const { data } = await axiosClient.get<unknown>(PROGRAM_RESULTS_PATH, {
    ...SKIP_AUTH,
    signal,
    params: compactParams(query),
  })
  return normalizeListPage(data, query.size)
}

/** GET /api/portal/public/program-results/{resultId} */
export async function fetchProgramResultDetail(
  resultId: string,
  sort: ProgramResultListQuery['sort'],
  signal?: AbortSignal,
): Promise<ProgramResultDetail> {
  const { data } = await axiosClient.get<unknown>(`${PROGRAM_RESULTS_PATH}/${encodeURIComponent(resultId)}`, {
    ...SKIP_AUTH,
    signal,
    params: { sort: sort ?? 'LATEST' },
  })
  const unwrapped = unwrapEnvelope<unknown>(data)
  const row = unwrapped && typeof unwrapped === 'object' ? (unwrapped as Record<string, unknown>) : {}
  const item = mapListItem(row)
  if (!item) {
    throw new Error('결과 응답을 해석할 수 없습니다.')
  }
  const attachments = Array.isArray(row.attachments)
    ? row.attachments.flatMap(file => {
        if (!file || typeof file !== 'object') return []
        const attachment = file as Record<string, unknown>
        const originalFilename = readString(attachment.originalFilename)
        const downloadEndpoint = readString(attachment.downloadEndpoint)
        if (!originalFilename || !downloadEndpoint) return []
        return [
          {
            originalFilename,
            fileSize: readNumber(attachment.fileSize),
            downloadEndpoint,
          },
        ]
      })
    : []
  return {
    ...item,
    content: readString(row.content) ?? '',
    attachments,
    previous: mapNeighbor(row.previous),
    next: mapNeighbor(row.next),
  }
}
