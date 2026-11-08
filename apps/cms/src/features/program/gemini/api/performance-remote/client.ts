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

export type GeminiTrainingReportDeliveryTypeWire = 'ONLINE' | 'OFFLINE'

/**
 * 실적 목록 서버 검색 조건.
 * `dateFrom`/`dateTo`는 training_date 기준 `YYYY-MM-DD`(양끝 포함).
 */
export type GeminiTrainingReportsRemoteParams = {
  programId?: number
  page?: number
  size?: number
  instructorName?: string
  trainingLocation?: string
  dateFrom?: string
  dateTo?: string
  deliveryType?: GeminiTrainingReportDeliveryTypeWire
}

export function buildGeminiTrainingReportsListQuery(
  params: GeminiTrainingReportsRemoteParams = {}
): URLSearchParams {
  const query = new URLSearchParams()
  if (params.programId != null) query.set('programId', String(params.programId))
  const instructorName = params.instructorName?.trim()
  if (instructorName) query.set('instructorName', instructorName)
  const trainingLocation = params.trainingLocation?.trim()
  if (trainingLocation) query.set('trainingLocation', trainingLocation)
  if (params.dateFrom) query.set('dateFrom', params.dateFrom)
  if (params.dateTo) query.set('dateTo', params.dateTo)
  if (params.deliveryType) query.set('deliveryType', params.deliveryType)
  query.set('page', String(params.page ?? 0))
  query.set('size', String(params.size ?? GEMINI_PERFORMANCE_LIST_PAGE_SIZE))
  return query
}

export async function fetchGeminiTrainingReportsRemotePage(
  params?: GeminiTrainingReportsRemoteParams
): Promise<GeminiTrainingReportsRemotePage> {
  const pageParam = params?.page ?? 0
  const sizeParam = params?.size ?? GEMINI_PERFORMANCE_LIST_PAGE_SIZE
  const query = buildGeminiTrainingReportsListQuery({ ...params, page: pageParam, size: sizeParam })
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
  return {
    items,
    page: currentPage,
    size,
    totalElements,
    hasMore: size > 0 && (currentPage + 1) * size < totalElements,
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
    await customInstance(
      {
        url: `${BASE}/import/preview`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: request,
      },
      // 실패 안내는 업로드 화면이 시안 팝업 하나로 띄운다(공통 오류 Alert와 중복 방지).
      { skipGlobalErrorAlert: true }
    )
  )
}

export async function importGeminiTrainingReportsRemote(
  request: GeminiTrainingReportImportRequest
): Promise<GeminiTrainingReportImportResponse> {
  return unwrapApiBody<GeminiTrainingReportImportResponse>(
    await customInstance(
      {
        url: `${BASE}/import`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: request,
      },
      // 실패 안내는 업로드 화면이 시안 팝업 하나로 띄운다(공통 오류 Alert와 중복 방지).
      { skipGlobalErrorAlert: true }
    )
  )
}

export async function deleteGeminiTrainingReportRemote(
  trainingReportId: number
): Promise<void> {
  await customInstance({
    url: `${BASE}/${trainingReportId}`,
    method: 'DELETE',
  })
}

const BULK_DELETE_MAX_IDS = 100

export async function bulkDeleteGeminiTrainingReportsRemote(
  ids: number[]
): Promise<void> {
  const unique = [...new Set(ids.filter(id => Number.isFinite(id) && id > 0))]
  for (let offset = 0; offset < unique.length; offset += BULK_DELETE_MAX_IDS) {
    const chunk = unique.slice(offset, offset + BULK_DELETE_MAX_IDS)
    await customInstance({
      url: `${BASE}/bulk-delete`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: { ids: chunk },
    })
  }
}
