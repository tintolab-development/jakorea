import {
  mapDetailedProgramListResponse,
  mapDetailedProgramResponse,
  toDetailedProgramRequest,
} from '@/features/detailed-program/api/adapters/detailed-program-adapters'
import {
  clientFilterDetailedProgramsByName,
  detailedProgramsParamsFromSearchParams,
} from '@/features/detailed-program/api/detailed-program-filter-params'
import {
  createDetailedProgramRemote,
  deleteDetailedProgramRemote,
  fetchDetailedProgramsRemote,
  updateDetailedProgramRemote,
} from '@/features/detailed-program/api/detailed-programs-api-client'
import type { DetailedProgramManagementRow } from '@/features/detailed-program/model/detailed-program-management.types'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

function assertDetailedProgramsRemoteReady(): void {
  if (!isRealApiModuleEnabled('detailedPrograms')) {
    throw new Error(
      '세부 프로그램 API가 활성화되지 않았습니다. VITE_REAL_API_MODULES에 detailedPrograms를 추가해 주세요.'
    )
  }
  if (!hasRemoteAdminJwt()) {
    throw new Error('세부 프로그램 조회는 관리자 로그인 후 이용할 수 있습니다.')
  }
}

export function shouldUseDetailedProgramsRemoteApi(): boolean {
  return isRealApiModuleEnabled('detailedPrograms') && hasRemoteAdminJwt()
}

export async function getDetailedProgramList(
  searchParams: URLSearchParams
): Promise<DetailedProgramManagementRow[]> {
  assertDetailedProgramsRemoteReady()
  const dto = await fetchDetailedProgramsRemote(
    detailedProgramsParamsFromSearchParams(searchParams)
  )
  const rows = mapDetailedProgramListResponse(dto)
  return clientFilterDetailedProgramsByName(rows, searchParams)
}

export async function createDetailedProgram(input: {
  name: string
  active: boolean
}): Promise<DetailedProgramManagementRow> {
  assertDetailedProgramsRemoteReady()
  const dto = await createDetailedProgramRemote(toDetailedProgramRequest(input))
  return mapDetailedProgramResponse(dto)
}

export async function updateDetailedProgram(
  id: string,
  input: { name: string; active: boolean }
): Promise<DetailedProgramManagementRow> {
  assertDetailedProgramsRemoteReady()
  const dto = await updateDetailedProgramRemote(Number(id), toDetailedProgramRequest(input))
  return mapDetailedProgramResponse(dto)
}

export async function deleteDetailedPrograms(ids: string[]): Promise<void> {
  assertDetailedProgramsRemoteReady()
  for (const id of ids) {
    await deleteDetailedProgramRemote(Number(id))
  }
}
