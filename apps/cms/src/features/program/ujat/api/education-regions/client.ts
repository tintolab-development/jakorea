import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { UjatEducationRegionListResponse } from '@/shared/api/generated/forms-surveys/schemas/ujatEducationRegionListResponse'
import type { UjatEducationRegionResponse } from '@/shared/api/generated/forms-surveys/schemas/ujatEducationRegionResponse'
import type { UjatEducationRegionReorderRequest } from '@/shared/api/generated/forms-surveys/schemas/ujatEducationRegionReorderRequest'
import type { UjatEducationRegionUpdateRequest } from '@/shared/api/generated/forms-surveys/schemas/ujatEducationRegionUpdateRequest'

const BASE = '/api/admin/ujat/education-regions'

export type UjatEducationRegionRemoteListParams = {
  includeInactive?: boolean
  activeYn?: boolean
  keyword?: string
}

export async function fetchAdminUjatEducationRegionsRemote(
  params: UjatEducationRegionRemoteListParams = {}
): Promise<UjatEducationRegionResponse[]> {
  const query: Record<string, string | boolean> = {}
  if (params.includeInactive !== undefined) query.includeInactive = params.includeInactive
  if (params.activeYn !== undefined) query.activeYn = params.activeYn
  if (params.keyword) query.keyword = params.keyword
  const body = await unwrapApiBody<UjatEducationRegionListResponse | UjatEducationRegionResponse[]>(
    await customInstance({
      url: BASE,
      method: 'GET',
      params: query,
    })
  )
  if (Array.isArray(body)) return body
  return body.content ?? []
}

export async function createAdminUjatEducationRegionRemote(request: {
  nameKo?: string
  displayName?: string
  displayOrder?: number
  activeYn?: boolean
  code?: string
}): Promise<UjatEducationRegionResponse> {
  return unwrapApiBody<UjatEducationRegionResponse>(
    await customInstance({
      url: BASE,
      method: 'POST',
      data: request,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

export async function patchAdminUjatEducationRegionRemote(
  regionId: string,
  request: UjatEducationRegionUpdateRequest
): Promise<UjatEducationRegionResponse> {
  return unwrapApiBody<UjatEducationRegionResponse>(
    await customInstance({
      url: `${BASE}/${encodeURIComponent(regionId)}`,
      method: 'PATCH',
      data: request,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

export async function deleteAdminUjatEducationRegionRemote(regionId: string): Promise<void> {
  await unwrapApiBody(
    await customInstance({
      url: `${BASE}/${encodeURIComponent(regionId)}`,
      method: 'DELETE',
    })
  )
}

export async function reorderAdminUjatEducationRegionsRemote(
  request: UjatEducationRegionReorderRequest
): Promise<void> {
  await unwrapApiBody(
    await customInstance({
      url: `${BASE}/reorder`,
      method: 'PUT',
      data: request,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}
