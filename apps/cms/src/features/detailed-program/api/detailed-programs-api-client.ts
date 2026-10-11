import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import {
  assertBulkDeleteSucceeded,
  forEachBulkIdChunk,
  toBulkNumericIds,
} from '@/features/data-management/api/bulk-delete'
import { getDataManagementSubsetApi } from '@/features/data-management/api/data-management-subset-api'
import type {
  BulkActionResponse,
  DetailedProgramRequest,
  DetailedProgramResponse,
  DetailedProgramsParams,
  PageResponseDetailedProgramResponse,
} from '@/shared/api/generated/data-management/schemas'


export async function fetchDetailedProgramsRemote(
  params: DetailedProgramsParams
): Promise<PageResponseDetailedProgramResponse> {
  return unwrapApiBody(await getDataManagementSubsetApi().detailedPrograms(params))
}

export async function fetchDetailedProgramRemote(
  id: number
): Promise<DetailedProgramResponse> {
  return unwrapApiBody(await getDataManagementSubsetApi().detailedProgram(id))
}

export async function createDetailedProgramRemote(
  body: DetailedProgramRequest
): Promise<DetailedProgramResponse> {
  // POST /api/admin/detailed-programs (Orval create10 — create9는 material-kits POST, 혼동 금지)
  return unwrapApiBody(await getDataManagementSubsetApi().create10(body))
}

export async function updateDetailedProgramRemote(
  id: number,
  body: DetailedProgramRequest
): Promise<DetailedProgramResponse> {
  // PATCH /api/admin/detailed-programs/{id} (Orval update6 — material-kits update5와 혼동 금지)
  return unwrapApiBody(await getDataManagementSubsetApi().update6(id, body))
}

export async function deleteDetailedProgramRemote(id: number): Promise<void> {
  await getDataManagementSubsetApi().delete4(id)
}

export async function bulkDeleteDetailedProgramsRemote(ids: string[]): Promise<void> {
  await forEachBulkIdChunk(ids, async chunk => {
    const result = unwrapApiBody<BulkActionResponse>(
      await getDataManagementSubsetApi().bulkDelete3({ ids: toBulkNumericIds(chunk) })
    )
    assertBulkDeleteSucceeded(result, '세부 프로그램 일괄 삭제에 실패했습니다.')
  })
}
