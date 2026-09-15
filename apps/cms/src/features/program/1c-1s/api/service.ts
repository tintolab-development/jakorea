import {
  deleteCompanySchoolRegistrationLocalSaveProgram,
  updateCompanySchoolRegistrationLocalSaveProgram,
} from '@/features/program/general/lib/registration-local-save'
import {
  bulkDeleteAdminProgramsRemote,
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
import {
  COMPANY_SCHOOL_PROGRAM_LIST_PAGE_SIZE,
  companySchoolListParams,
  type CompanySchoolListFilters,
} from './list-params'
import type { CompanySchoolOverviewStageCounts } from '@/features/program/1c-1s/lib/overview-stage-counts'

function assertRemoteReady(): void {
  if (shouldUseCompanySchoolRemoteApi()) return
  throw new Error(
    '1사1교 API가 활성화되지 않았습니다. 원격 JWT, programs 모듈, VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED=true 설정을 확인해 주세요. mock 폴백은 사용하지 않습니다.'
  )
}

export type CompanySchoolProgramsRemoteListPage = {
  programs: Program[]
  page: number
  size: number
  totalElements: number
  hasMore: boolean
}

export async function listCompanySchoolProgramsPage(
  filters: CompanySchoolListFilters = {},
  pageParam = 0
): Promise<CompanySchoolProgramsRemoteListPage> {
  assertRemoteReady()
  const page = await fetchAdminProgramsRemote(companySchoolListParams(filters, pageParam))
  const programs = (page.items ?? []).map(mapCompanySchoolListItemToProgram)
  const size = page.size ?? COMPANY_SCHOOL_PROGRAM_LIST_PAGE_SIZE
  const currentPage = page.page ?? pageParam
  const totalElements = page.totalElements ?? programs.length
  const totalPages =
    page.totalPages ?? (size > 0 ? Math.ceil(totalElements / size) : currentPage + 1)
  return {
    programs,
    page: currentPage,
    size,
    totalElements,
    hasMore: currentPage + 1 < totalPages,
  }
}

/** @deprecated 무한 스크롤은 `listCompanySchoolProgramsPage` 사용 */
export async function listCompanySchoolPrograms(
  filters: CompanySchoolListFilters = {}
): Promise<Program[]> {
  const page = await listCompanySchoolProgramsPage(filters, 0)
  return page.programs
}

/** 상단 4카드 — GET /programs totalElements */
export async function fetchCompanySchoolOverviewStages(): Promise<CompanySchoolOverviewStageCounts> {
  assertRemoteReady()

  const base = {
    programType: COMPANY_SCHOOL_PROGRAM_API_TYPE,
    page: 0,
    size: 1,
  } as const
  const [all, scheduled, recruiting, inProgress, completed] = await Promise.all([
    fetchAdminProgramsRemote({ ...base }),
    fetchAdminProgramsRemote({ ...base, periodStatus: 'SCHEDULED' }),
    fetchAdminProgramsRemote({ ...base, periodStatus: 'RECRUITING' }),
    fetchAdminProgramsRemote({ ...base, periodStatus: 'IN_PROGRESS' }),
    fetchAdminProgramsRemote({ ...base, periodStatus: 'COMPLETED' }),
  ])

  return {
    total: all.totalElements ?? all.items?.length ?? 0,
    scheduled:
      (scheduled.totalElements ?? scheduled.items?.length ?? 0) +
      (recruiting.totalElements ?? recruiting.items?.length ?? 0),
    inProgress: inProgress.totalElements ?? inProgress.items?.length ?? 0,
    completed: completed.totalElements ?? completed.items?.length ?? 0,
  }
}

export async function getCompanySchoolProgram(programId: string): Promise<Program> {
  assertRemoteReady()
  return mapCompanySchoolDetailToProgram(await fetchAdminProgramByIdRemote(programId))
}

export async function createCompanySchoolProgram(program: Program): Promise<Program> {
  assertRemoteReady()
  const dto = await createAdminProgramRemote(mapCompanySchoolToCreateRequest(program))
  return mapCompanySchoolDetailToProgram(dto)
}

export async function updateCompanySchoolProgram(
  programId: string,
  program: Program,
  patch?: Partial<Program>
): Promise<Program> {
  assertRemoteReady()
  const mergedPatch = patch ?? program
  // 등록 중 로컬 임시저장 키와 충돌하지 않도록 remote 성공 후 로컬 잔여만 정리
  updateCompanySchoolRegistrationLocalSaveProgram(programId, mergedPatch)
  const dto = await updateAdminProgramRemote(
    programId,
    mapCompanySchoolToUpdateRequest({ ...program, ...mergedPatch, id: programId })
  )
  return mapCompanySchoolDetailToProgram(dto)
}

export async function deleteCompanySchoolProgram(programId: string): Promise<void> {
  assertRemoteReady()
  deleteCompanySchoolRegistrationLocalSaveProgram(programId)
  await deleteAdminProgramRemote(programId)
}

export async function deleteCompanySchoolPrograms(programIds: string[]): Promise<void> {
  if (programIds.length === 0) return
  assertRemoteReady()
  await bulkDeleteAdminProgramsRemote(programIds)
}
