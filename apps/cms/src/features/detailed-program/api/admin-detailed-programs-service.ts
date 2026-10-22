import {
  mapDetailedProgramListResponse,
  mapDetailedProgramResponse,
  toDetailedProgramRequest,
} from '@/features/detailed-program/api/adapters/detailed-program-adapters'
import {
  DETAILED_PROGRAM_LIST_MAX_PAGES,
  detailedProgramsParamsFromSearchParams,
} from '@/features/detailed-program/api/detailed-program-filter-params'
import {
  createDetailedProgramRemote,
  bulkDeleteDetailedProgramsRemote,
  bulkUpdateDetailedProgramsRemote,
  fetchDetailedProgramsRemote,
} from '@/features/detailed-program/api/detailed-programs-api-client'
import type { DetailedProgramBulkUpdateItem } from '@/features/detailed-program/lib/bulk-update'
import type { DetailedProgramManagementRow } from '@/features/detailed-program/model/detailed-program-management.types'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

function assertDetailedProgramsRemoteReady(): void {
  if (!isRealApiModuleEnabled('detailedPrograms')) {
    throw new Error(
      '세부 프로그램 API가 활성화되지 않았습니다. VITE_API_SERVER(또는 VITE_API_BASE_URL)로 백엔드를 설정해 주세요.'
    )
  }
  if (!hasRemoteAdminJwt()) {
    throw new Error('세부 프로그램 조회는 관리자 로그인 후 이용할 수 있습니다.')
  }
}

export function shouldUseDetailedProgramsRemoteApi(): boolean {
  return isRealApiModuleEnabled('detailedPrograms') && hasRemoteAdminJwt()
}

async function fetchAllDetailedProgramRows(
  searchParams: URLSearchParams
): Promise<DetailedProgramManagementRow[]> {
  const rows: DetailedProgramManagementRow[] = []
  let page = 0
  let totalPages = 1
  while (page < totalPages && page < DETAILED_PROGRAM_LIST_MAX_PAGES) {
    const dto = await fetchDetailedProgramsRemote(
      detailedProgramsParamsFromSearchParams(searchParams, page)
    )
    const pageRows = mapDetailedProgramListResponse(dto)
    rows.push(...pageRows)
    totalPages = dto.totalPages ?? page + 1
    if (pageRows.length === 0) break
    page += 1
  }
  return rows
}

export async function getDetailedProgramList(
  searchParams: URLSearchParams
): Promise<DetailedProgramManagementRow[]> {
  assertDetailedProgramsRemoteReady()
  return fetchAllDetailedProgramRows(searchParams)
}

/** 등록·공통정보 셀렉트 — 사용(active)만. remote 미연동 시 빈 목록. */
export async function getDetailedProgramOptionsList(): Promise<DetailedProgramManagementRow[]> {
  if (!shouldUseDetailedProgramsRemoteApi()) {
    return []
  }
  const rows = await getDetailedProgramList(new URLSearchParams('dp_use=active'))
  return rows.filter(row => row.active)
}

export async function createDetailedProgram(input: {
  name: string
  active: boolean
}): Promise<DetailedProgramManagementRow> {
  assertDetailedProgramsRemoteReady()
  const dto = await createDetailedProgramRemote(toDetailedProgramRequest(input))
  return mapDetailedProgramResponse(dto)
}

export async function bulkUpdateDetailedPrograms(
  items: DetailedProgramBulkUpdateItem[]
): Promise<DetailedProgramManagementRow[]> {
  assertDetailedProgramsRemoteReady()
  const dtos = await bulkUpdateDetailedProgramsRemote(items)
  return dtos.map(mapDetailedProgramResponse)
}

export async function deleteDetailedPrograms(ids: string[]): Promise<void> {
  assertDetailedProgramsRemoteReady()
  await bulkDeleteDetailedProgramsRemote(ids)
}
