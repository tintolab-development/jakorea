import { getCompanySchoolPrograms } from '@/data/mock/economy-programs'
import { programService } from '@/entities/program/api/program-service'
import {
  deleteCompanySchoolRegistrationLocalSaveProgram,
  readCompanySchoolRegistrationLocalSavePrograms,
  updateCompanySchoolRegistrationLocalSaveProgram,
} from '@/features/program/general/lib/registration-local-save'
import {
  createAdminProgramRemote,
  deleteAdminProgramRemote,
  fetchAdminProgramByIdRemote,
  fetchAdminProgramsRemote,
  updateAdminProgramRemote,
} from '@/features/program/general/api/programs-api-client'
import type { Program } from '@/types/domain'
import {
  COMPANY_SCHOOL_PROGRAM_API_TYPE,
  mapCompanySchoolDetailToProgram,
  mapCompanySchoolListItemToProgram,
  mapCompanySchoolToCreateRequest,
  mapCompanySchoolToUpdateRequest,
} from './adapters'
import { shouldUseCompanySchoolRemoteApi } from './capabilities'
import { companySchoolListParams, type CompanySchoolListFilters } from './list-params'
import {
  countCompanySchoolOverviewStages,
  type CompanySchoolOverviewStageCounts,
} from '@/features/program/1c-1s/lib/overview-stage-counts'

function assertRemoteReady(): void {
  if (shouldUseCompanySchoolRemoteApi()) return
  throw new Error(
    '1사1교 API가 활성화되지 않았습니다. 원격 JWT, programs 모듈, VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED=true 설정을 확인해 주세요.'
  )
}

export function getCompanySchoolMockList(): Program[] {
  const mockPrograms = getCompanySchoolPrograms()
  const localPrograms = readCompanySchoolRegistrationLocalSavePrograms().filter(
    local => !mockPrograms.some(mock => mock.id === local.id)
  )
  return [...mockPrograms, ...localPrograms]
}

export async function listCompanySchoolPrograms(
  filters: CompanySchoolListFilters = {}
): Promise<Program[]> {
  if (!shouldUseCompanySchoolRemoteApi()) return getCompanySchoolMockList()
  assertRemoteReady()
  const page = await fetchAdminProgramsRemote(companySchoolListParams(filters))
  return (page.items ?? []).map(mapCompanySchoolListItemToProgram)
}

/**
 * 상단 4카드 건수.
 * remote: GET /programs?programType=COMPANY_SCHOOL&periodStatus=* 의 totalElements
 * mock: 운영 기간·lifecycle 버킷 집계 (목록 overview 필터와 동일)
 *
 * 별도 count API 불필요 — 기존 목록 API로 충분. (500건 초과 시 totalElements가 SSOT)
 */
export async function fetchCompanySchoolOverviewStages(): Promise<CompanySchoolOverviewStageCounts> {
  if (!shouldUseCompanySchoolRemoteApi()) {
    return countCompanySchoolOverviewStages(getCompanySchoolMockList())
  }

  assertRemoteReady()

  const base = {
    programType: COMPANY_SCHOOL_PROGRAM_API_TYPE,
    page: 0,
    size: 1,
  } as const
  const [all, scheduled, inProgress, completed] = await Promise.all([
    fetchAdminProgramsRemote({ ...base }),
    fetchAdminProgramsRemote({ ...base, periodStatus: 'RECRUITING' }),
    fetchAdminProgramsRemote({ ...base, periodStatus: 'IN_PROGRESS' }),
    fetchAdminProgramsRemote({ ...base, periodStatus: 'COMPLETED' }),
  ])

  return {
    total: all.totalElements ?? all.items?.length ?? 0,
    scheduled: scheduled.totalElements ?? scheduled.items?.length ?? 0,
    inProgress: inProgress.totalElements ?? inProgress.items?.length ?? 0,
    completed: completed.totalElements ?? completed.items?.length ?? 0,
  }
}

export async function getCompanySchoolProgram(programId: string): Promise<Program> {
  if (!shouldUseCompanySchoolRemoteApi()) return programService.getById(programId)
  assertRemoteReady()
  return mapCompanySchoolDetailToProgram(await fetchAdminProgramByIdRemote(programId))
}

export async function createCompanySchoolProgram(program: Program): Promise<Program> {
  if (!shouldUseCompanySchoolRemoteApi()) {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...data } = program
    return programService.create(data)
  }
  assertRemoteReady()
  const dto = await createAdminProgramRemote(mapCompanySchoolToCreateRequest(program))
  return mapCompanySchoolDetailToProgram(dto)
}

export async function updateCompanySchoolProgram(
  programId: string,
  program: Program,
  patch?: Partial<Program>
): Promise<Program> {
  if (!shouldUseCompanySchoolRemoteApi()) {
    const mergedPatch = patch ?? program
    const updatedLocal = updateCompanySchoolRegistrationLocalSaveProgram(
      programId,
      mergedPatch
    )
    if (updatedLocal) return updatedLocal

    const mockProgram = getCompanySchoolPrograms().find(item => item.id === programId)
    if (mockProgram) {
      Object.assign(mockProgram, mergedPatch, {
        id: mockProgram.id,
        createdAt: mockProgram.createdAt,
        updatedAt: new Date().toISOString(),
      })
      return mockProgram
    }

    const { id: _id, createdAt: _createdAt, ...data } = mergedPatch
    return programService.update(programId, data)
  }
  assertRemoteReady()
  const dto = await updateAdminProgramRemote(
    programId,
    mapCompanySchoolToUpdateRequest(program, patch)
  )
  return mapCompanySchoolDetailToProgram(dto)
}

export async function deleteCompanySchoolProgram(programId: string): Promise<void> {
  if (!shouldUseCompanySchoolRemoteApi()) {
    if (deleteCompanySchoolRegistrationLocalSaveProgram(programId)) return
    const mockPrograms = getCompanySchoolPrograms()
    const mockIndex = mockPrograms.findIndex(program => program.id === programId)
    if (mockIndex >= 0) {
      mockPrograms.splice(mockIndex, 1)
      return
    }
    await programService.delete(programId)
    return
  }
  assertRemoteReady()
  await deleteAdminProgramRemote(programId)
}
