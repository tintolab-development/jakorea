import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import {
  assertBulkDeleteSucceeded,
  forEachBulkIdChunk,
  toBulkNumericIds,
} from '@/features/data-management/api/bulk-delete'
import { getJAKoreaCMSBackendAPIDataManagementSubset } from '@/shared/api/generated/data-management/data-management-api'
import type {
  BulkActionResponse,
  DetailedProgramRequest,
  DetailedProgramResponse,
  DetailedProgramsParams,
  PageResponseDetailedProgramResponse,
} from '@/shared/api/generated/data-management/schemas'

const dmApi = getJAKoreaCMSBackendAPIDataManagementSubset()

export async function fetchDetailedProgramsRemote(
  params: DetailedProgramsParams
): Promise<PageResponseDetailedProgramResponse> {
  return unwrapApiBody(await dmApi.detailedPrograms(params))
}

export async function fetchDetailedProgramRemote(
  id: number
): Promise<DetailedProgramResponse> {
  return unwrapApiBody(await dmApi.detailedProgram(id))
}

export async function createDetailedProgramRemote(
  body: DetailedProgramRequest
): Promise<DetailedProgramResponse> {
  // POST /api/admin/detailed-programs (Orval create8 — material-kits create7과 혼동 금지)
  return unwrapApiBody(await dmApi.create8(body))
}

export async function updateDetailedProgramRemote(
  id: number,
  body: DetailedProgramRequest
): Promise<DetailedProgramResponse> {
  return unwrapApiBody(await dmApi.update5(id, body))
}

export async function deleteDetailedProgramRemote(id: number): Promise<void> {
  await dmApi.delete4(id)
}

export async function bulkDeleteDetailedProgramsRemote(ids: string[]): Promise<void> {
  await forEachBulkIdChunk(ids, async chunk => {
    const result = unwrapApiBody<BulkActionResponse>(
      await dmApi.bulkDelete3({ ids: toBulkNumericIds(chunk) })
    )
    assertBulkDeleteSucceeded(result, '세부 프로그램 일괄 삭제에 실패했습니다.')
  })
}
