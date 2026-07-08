import { getGeneralPrograms } from '@/data/mock/general-programs'
import {
  filterGeneralProgramsByOverviewStatus,
  mapAdminProgramDetailToProgram,
  mapAdminProgramListItemToProgram,
} from '@/features/program/general/api/adapters/general-program-adapters'
import {
  shouldUseGeneralProgramsRemoteApi,
} from '@/features/program/general/api/general-programs-remote-capabilities'
import {
  fetchAdminProgramByIdRemote,
  fetchAdminProgramsRemote,
} from '@/features/program/general/api/programs-api-client'
import { resolveGeneralProgramForDetail } from '@/features/program/general/lib/detail-meta'
import type { GeneralProgramOverviewStatusFilter } from '@/features/program/general/lib/list-status-filter'
import type { Program } from '@/types/domain'

const GENERAL_PROGRAM_API_TYPE = 'GENERAL'

function assertGeneralProgramsRemoteReady(): void {
  if (!shouldUseGeneralProgramsRemoteApi()) {
    throw new Error(
      '일반 프로그램 API가 활성화되지 않았습니다. API 로그인 후 VITE_REAL_API_MODULES에 programs를 추가해 주세요.'
    )
  }
}

export function getGeneralProgramsMockList(
  statusFilter: GeneralProgramOverviewStatusFilter | null
): Program[] {
  return filterGeneralProgramsByOverviewStatus(getGeneralPrograms(), statusFilter)
}

export function getGeneralProgramMockById(programId: string): Program | null {
  return resolveGeneralProgramForDetail(programId) ?? null
}

export async function fetchGeneralProgramsRemoteList(
  statusFilter: GeneralProgramOverviewStatusFilter | null
): Promise<Program[]> {
  assertGeneralProgramsRemoteReady()

  const page = await fetchAdminProgramsRemote({
    programType: GENERAL_PROGRAM_API_TYPE,
    page: 0,
    size: 500,
  })

  const programs = (page.items ?? []).map(mapAdminProgramListItemToProgram)
  return filterGeneralProgramsByOverviewStatus(programs, statusFilter)
}

export async function fetchGeneralProgramRemoteById(programId: string): Promise<Program> {
  assertGeneralProgramsRemoteReady()
  const dto = await fetchAdminProgramByIdRemote(programId)
  return mapAdminProgramDetailToProgram(dto)
}
