import { getGeneralPrograms } from '@/data/mock/general-programs'
import {
  filterGeneralProgramsByOverviewStatus,
  mapAdminProgramDetailToProgram,
  mapAdminProgramListItemToProgram,
  mapGeneralProgramToCreateRequest,
  mapGeneralProgramToUpdateRequest,
} from '@/features/program/general/api/adapters/general-program-adapters'
import {
  clientFilterGeneralPrograms,
  generalProgramListParamsFromFilters,
  type GeneralProgramListTableFilters,
} from '@/features/program/general/api/general-program-list-filter-params'
import {
  shouldUseGeneralProgramsRemoteApi,
} from '@/features/program/general/api/general-programs-remote-capabilities'
import {
  createAdminProgramRemote,
  deleteAdminProgramRemote,
  fetchAdminProgramByIdRemote,
  fetchAdminProgramsRemote,
  updateAdminProgramRemote,
} from '@/features/program/general/api/programs-api-client'
import { resolveGeneralProgramForDetail } from '@/features/program/general/lib/detail-meta'
import type { GeneralProgramOverviewStatusFilter } from '@/features/program/general/lib/list-status-filter'
import { programService } from '@/entities/program/api/program-service'
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
  statusFilter: GeneralProgramOverviewStatusFilter | null,
  tableFilters: GeneralProgramListTableFilters = {}
): Promise<Program[]> {
  assertGeneralProgramsRemoteReady()

  const page = await fetchAdminProgramsRemote(
    generalProgramListParamsFromFilters(statusFilter, tableFilters)
  )

  const programs = (page.items ?? []).map(mapAdminProgramListItemToProgram)
  const overviewFiltered = filterGeneralProgramsByOverviewStatus(programs, statusFilter)
  return clientFilterGeneralPrograms(overviewFiltered, tableFilters)
}

export async function fetchGeneralProgramRemoteById(programId: string): Promise<Program> {
  assertGeneralProgramsRemoteReady()
  const dto = await fetchAdminProgramByIdRemote(programId)
  return mapAdminProgramDetailToProgram(dto)
}

export async function createGeneralProgram(program: Program): Promise<Program> {
  if (!shouldUseGeneralProgramsRemoteApi()) {
    const { id: _id, createdAt: _c, updatedAt: _u, ...data } = program
    return programService.create(data)
  }

  assertGeneralProgramsRemoteReady()
  const dto = await createAdminProgramRemote(mapGeneralProgramToCreateRequest(program))
  return mapAdminProgramDetailToProgram(dto)
}

export async function updateGeneralProgram(
  programId: string,
  program: Program,
  patch?: Partial<Program>
): Promise<Program> {
  if (!shouldUseGeneralProgramsRemoteApi()) {
    const { id: _id, createdAt: _c, ...data } = patch ?? program
    return programService.update(programId, data)
  }

  assertGeneralProgramsRemoteReady()
  const dto = await updateAdminProgramRemote(
    programId,
    mapGeneralProgramToUpdateRequest(program, patch)
  )
  return mapAdminProgramDetailToProgram(dto)
}

export async function deleteGeneralProgram(programId: string): Promise<void> {
  if (!shouldUseGeneralProgramsRemoteApi()) {
    await programService.delete(programId)
    return
  }

  assertGeneralProgramsRemoteReady()
  await deleteAdminProgramRemote(programId)
}

export async function deleteGeneralPrograms(programIds: string[]): Promise<void> {
  for (const programId of programIds) {
    await deleteGeneralProgram(programId)
  }
}

export { GENERAL_PROGRAM_API_TYPE }
