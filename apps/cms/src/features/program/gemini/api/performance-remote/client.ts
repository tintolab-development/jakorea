import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { GeminiTrainingReportImportRequest } from '@/shared/api/generated/dashboard/schemas/geminiTrainingReportImportRequest'
import type { GeminiTrainingReportImportResponse } from '@/shared/api/generated/dashboard/schemas/geminiTrainingReportImportResponse'
import type { GeminiTrainingReportItem } from '@/shared/api/generated/dashboard/schemas/geminiTrainingReportItem'
import type { GeminiTrainingReportListResponse } from '@/shared/api/generated/dashboard/schemas/geminiTrainingReportListResponse'

const BASE = '/api/admin/gemini/trainings/training-reports'

function asContentArray<T>(
  body: { content?: T[] } | T[] | null | undefined
): T[] {
  if (Array.isArray(body)) return body
  return body?.content ?? []
}

export async function fetchGeminiTrainingReportsRemote(params?: {
  programId?: number
  page?: number
  size?: number
}): Promise<GeminiTrainingReportItem[]> {
  const query = new URLSearchParams()
  if (params?.programId != null) query.set('programId', String(params.programId))
  if (params?.page != null) query.set('page', String(params.page))
  if (params?.size != null) query.set('size', String(params.size))
  const qs = query.toString()
  const body = await unwrapApiBody<GeminiTrainingReportListResponse | GeminiTrainingReportItem[]>(
    await customInstance({
      url: qs ? `${BASE}?${qs}` : BASE,
      method: 'GET',
    })
  )
  return asContentArray(body)
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
