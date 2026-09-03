import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { getJAKoreaCMSBackendAPIDataManagementSubset } from '@/shared/api/generated/data-management/data-management-api'
import type {
  CurrentKitCalculationParams,
  KitsParams,
  MaterialKitCalculationResponse,
  MaterialKitRequest,
  MaterialKitResponse,
  MaterialKitTargetCountRequest,
  MaterialKitVersionRequest,
  MaterialKitVersionResponse,
  PageResponseMaterialKitResponse,
} from '@/shared/api/generated/data-management/schemas'

const dmApi = getJAKoreaCMSBackendAPIDataManagementSubset()

export async function fetchMaterialKitsRemote(
  params?: KitsParams
): Promise<PageResponseMaterialKitResponse> {
  // GET /api/admin/material-kits
  return unwrapApiBody(await dmApi.kits(params))
}

export async function createMaterialKitRemote(
  body: MaterialKitRequest
): Promise<MaterialKitResponse> {
  // POST /api/admin/material-kits (Orval create7 — 세부프로그램 create8과 혼동 금지)
  return unwrapApiBody(await dmApi.create7(body))
}

export async function fetchMaterialKitVersionsRemote(
  kitId: number
): Promise<MaterialKitVersionResponse[]> {
  // GET /api/admin/material-kits/{kitId}/versions
  const payload = await dmApi.versions(kitId)
  const body = unwrapApiBody<MaterialKitVersionResponse[] | { items?: MaterialKitVersionResponse[] }>(
    payload
  )
  if (Array.isArray(body)) return body
  return body.items ?? []
}

export async function createMaterialKitVersionRemote(
  kitId: number,
  body: MaterialKitVersionRequest
): Promise<MaterialKitVersionResponse> {
  // POST /api/admin/material-kits/{kitId}/versions
  return unwrapApiBody(await dmApi.createVersion(kitId, body))
}

export async function addMaterialKitTargetCountRemote(
  versionId: number,
  body: MaterialKitTargetCountRequest
): Promise<void> {
  // POST /api/admin/material-kits/versions/{versionId}/target-counts
  await dmApi.addTargetCount(versionId, body)
}

export async function fetchCurrentKitCalculationRemote(
  kitId: number,
  params: CurrentKitCalculationParams
): Promise<MaterialKitCalculationResponse> {
  // GET /api/admin/material-kits/{kitId}/versions/current/calculate
  return unwrapApiBody(await dmApi.currentKitCalculation(kitId, params))
}
