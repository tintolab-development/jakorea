import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { GeminiTrainingReportImportRequest } from '@/shared/api/generated/dashboard/schemas/geminiTrainingReportImportRequest'
import type { GeminiTrainingReportImportResponse } from '@/shared/api/generated/dashboard/schemas/geminiTrainingReportImportResponse'
import type { GeminiTrainingReportItem } from '@/shared/api/generated/dashboard/schemas/geminiTrainingReportItem'
import type { GeminiTrainingReportListResponse } from '@/shared/api/generated/dashboard/schemas/geminiTrainingReportListResponse'
import { GENERAL_PROGRAM_LIST_PAGE_SIZE } from '@/features/program/general/api/general-program-list-filter-params'

const BASE = '/api/admin/gemini/trainings/training-reports'
export const GEMINI_PERFORMANCE_LIST_PAGE_SIZE = GENERAL_PROGRAM_LIST_PAGE_SIZE

function asContentArray<T>(
  body: { content?: T[] } | T[] | null | undefined
): T[] {
  if (Array.isArray(body)) return body
  return body?.content ?? []
}

export type GeminiTrainingReportsRemotePage = {
  items: GeminiTrainingReportItem[]
  page: number
  size: number
  totalElements: number
  hasMore: boolean
}

export async function fetchGeminiTrainingReportsRemotePage(params?: {
  programId?: number
  page?: number
  size?: number
}): Promise<GeminiTrainingReportsRemotePage> {
  const pageParam = params?.page ?? 0
  const sizeParam = params?.size ?? GEMINI_PERFORMANCE_LIST_PAGE_SIZE
  const query = new URLSearchParams()
  if (params?.programId != null) query.set('programId', String(params.programId))
  query.set('page', String(pageParam))
  query.set('size', String(sizeParam))
  const body = await unwrapApiBody<GeminiTrainingReportListResponse | GeminiTrainingReportItem[]>(
    await customInstance({
      url: `${BASE}?${query.toString()}`,
      method: 'GET',
    })
  )
  if (Array.isArray(body)) {
    return {
      items: body,
      page: pageParam,
      size: sizeParam,
      totalElements: body.length,
      hasMore: false,
    }
  }
  const items = asContentArray(body)
  const size = body.size ?? sizeParam
  const currentPage = body.page ?? pageParam
  const totalElements = body.totalElements ?? items.length
  const totalPages = size > 0 ? Math.ceil(totalElements / size) : currentPage + 1
  return {
    items,
    page: currentPage,
    size,
    totalElements,
    hasMore: currentPage + 1 < totalPages,
  }
}

/** @deprecated 무한 스크롤은 `fetchGeminiTrainingReportsRemotePage` 사용 */
export async function fetchGeminiTrainingReportsRemote(params?: {
  programId?: number
  page?: number
  size?: number
}): Promise<GeminiTrainingReportItem[]> {
  const page = await fetchGeminiTrainingReportsRemotePage(params)
  return page.items
}

export async function previewGeminiTrainingReportImportRemote(
  request: GeminiTrainingReportImportRequest
): Promise<GeminiTrainingReportImportResponse> {
  return unwrapApiBody<GeminiTrainingReportImportResponse>(
    await customInstance({
      url: `${BASE}/import/preview`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: request,
    })
  )
}

export async function importGeminiTrainingReportsRemote(
  request: GeminiTrainingReportImportRequest
): Promise<GeminiTrainingReportImportResponse> {
  return unwrapApiBody<GeminiTrainingReportImportResponse>(
    await customInstance({
      url: `${BASE}/import`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: request,
    })
  )
}
