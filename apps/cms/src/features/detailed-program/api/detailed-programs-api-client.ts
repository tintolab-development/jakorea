import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { getJAKoreaCMSBackendAPIDataManagementSubset } from '@/shared/api/generated/data-management/data-management-api'
import type {
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
  return unwrapApiBody(await dmApi.create6(body))
}

export async function updateDetailedProgramRemote(
  id: number,
  body: DetailedProgramRequest
): Promise<DetailedProgramResponse> {
  return unwrapApiBody(await dmApi.update4(id, body))
}

export async function deleteDetailedProgramRemote(id: number): Promise<void> {
  await dmApi.delete3(id)
}
