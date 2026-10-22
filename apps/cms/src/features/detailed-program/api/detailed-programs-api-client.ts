import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { assertBulkDeleteSucceeded, toBulkNumericIds } from '@/features/data-management/api/bulk-delete'
import { getDataManagementSubsetApi } from '@/features/data-management/api/data-management-subset-api'
import { DETAILED_PROGRAM_BULK_MAX } from '@/features/detailed-program/lib/bulk-update'
import type { DetailedProgramBulkUpdateItem } from '@/features/detailed-program/lib/bulk-update'
import type {
  BulkActionResponse,
  DetailedProgramRequest,
  DetailedProgramResponse,
  DetailedProgramUpdateRequest,
  DetailedProgramsParams,
  PageResponseDetailedProgramResponse,
} from '@/shared/api/generated/data-management/schemas'

const MUTATION_OPTIONS = { skipGlobalErrorAlert: true } as const

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
  // POST /api/admin/detailed-programs (Orval create11 — create10은 material-kits POST)
  return unwrapApiBody(await getDataManagementSubsetApi().create11(body, MUTATION_OPTIONS))
}

export async function updateDetailedProgramRemote(
  id: number,
  body: DetailedProgramUpdateRequest
): Promise<DetailedProgramResponse> {
  // PATCH /api/admin/detailed-programs/{id} (Orval update6)
  return unwrapApiBody(await getDataManagementSubsetApi().update6(id, body, MUTATION_OPTIONS))
}

export async function bulkUpdateDetailedProgramsRemote(
  items: DetailedProgramBulkUpdateItem[]
): Promise<DetailedProgramResponse[]> {
  if (items.length > DETAILED_PROGRAM_BULK_MAX) {
    throw new Error(`한 번에 최대 ${DETAILED_PROGRAM_BULK_MAX}건까지 수정할 수 있습니다.`)
  }
  const data = unwrapApiBody<DetailedProgramResponse[] | null>(
    await getDataManagementSubsetApi().bulkUpdateDetailedPrograms({ items }, MUTATION_OPTIONS)
  )
  if (!Array.isArray(data)) {
    throw new Error('세부 프로그램 일괄 수정 응답이 배열이 아닙니다.')
  }
  return data
}

export async function deleteDetailedProgramRemote(id: number): Promise<void> {
  await getDataManagementSubsetApi().delete4(id, MUTATION_OPTIONS)
}

export async function bulkDeleteDetailedProgramsRemote(ids: string[]): Promise<void> {
  const unique = [...new Set(ids.filter(Boolean))]
  if (unique.length === 0) return
  if (unique.length > DETAILED_PROGRAM_BULK_MAX) {
    throw new Error(`한 번에 최대 ${DETAILED_PROGRAM_BULK_MAX}건까지 삭제할 수 있습니다.`)
  }
  const result = unwrapApiBody<BulkActionResponse>(
    await getDataManagementSubsetApi().bulkDelete3(
      { ids: toBulkNumericIds(unique) },
      MUTATION_OPTIONS
    )
  )
  assertBulkDeleteSucceeded(result, '세부 프로그램 일괄 삭제에 실패했습니다.')
}
