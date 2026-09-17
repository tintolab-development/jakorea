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
  COMPANY_SCHOOL_SCHEDULED_PERIOD_STATUSES,
  companySchoolListParams,
  type CompanySchoolListFilters,
} from './list-params'
import type { CompanySchoolOverviewStageCounts } from '@/features/program/1c-1s/lib/overview-stage-counts'

/** 복수 periodStatus 합집합 조회 상한 (1사1교 목록 규모 · 카드·목록 동일 집합) */
const COMPANY_SCHOOL_PERIOD_UNION_FETCH_SIZE = 500

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

async function listCompanySchoolProgramsByPeriodStatusUnion(
  filters: CompanySchoolListFilters,
  periodStatuses: readonly string[]
): Promise<CompanySchoolProgramsRemoteListPage> {
  const remotes = await Promise.all(
    periodStatuses.map(periodStatus =>
      fetchAdminProgramsRemote({
        programType: COMPANY_SCHOOL_PROGRAM_API_TYPE,
        keyword: filters.keyword?.trim() || undefined,
        periodStatus,
        businessYear: filters.businessYear,
        page: 0,
        size: COMPANY_SCHOOL_PERIOD_UNION_FETCH_SIZE,
      })
    )
  )

  const byId = new Map<string, Program>()
  for (const page of remotes) {
    for (const item of page.items ?? []) {
      const program = mapCompanySchoolListItemToProgram(item)
      if (!program.id) continue
      byId.set(program.id, program)
    }
  }

  const programs = [...byId.values()]
  return {
    programs,
    page: 0,
    size: COMPANY_SCHOOL_PERIOD_UNION_FETCH_SIZE,
    totalElements: programs.length,
    hasMore: false,
  }
}

export async function listCompanySchoolProgramsPage(
  filters: CompanySchoolListFilters = {},
  pageParam = 0
): Promise<CompanySchoolProgramsRemoteListPage> {
  assertRemoteReady()

  const unionStatuses = filters.periodStatuses
  if (unionStatuses && unionStatuses.length > 0) {
    // 합집합은 page0 1회 적재 — 위젯 scheduled 건수와 동일 집합
    if (pageParam > 0) {
      return {
        programs: [],
        page: pageParam,
        size: COMPANY_SCHOOL_PERIOD_UNION_FETCH_SIZE,
        totalElements: 0,
        hasMore: false,
      }
    }
    return listCompanySchoolProgramsByPeriodStatusUnion(filters, unionStatuses)
  }

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

/**
 * 상단 4카드 — GET /programs totalElements.
 * 예정: SCHEDULED ∪ RECRUITING (id 중복 제거) — 목록 예정 필터와 동일.
 * BE가 버킷을 배타로 유지 — FE에서 카드 합을 강제 정규화하지 않음.
 * `RECRUITING`은 예정 별칭(참여자 모집 창 아님).
 */
export async function fetchCompanySchoolOverviewStages(): Promise<CompanySchoolOverviewStageCounts> {
  assertRemoteReady()

  const base = {
    programType: COMPANY_SCHOOL_PROGRAM_API_TYPE,
    page: 0,
    size: 1,
  } as const
  const [all, inProgress, completed, scheduledUnion] = await Promise.all([
    fetchAdminProgramsRemote({ ...base }),
    fetchAdminProgramsRemote({ ...base, periodStatus: 'IN_PROGRESS' }),
    fetchAdminProgramsRemote({ ...base, periodStatus: 'COMPLETED' }),
    listCompanySchoolProgramsByPeriodStatusUnion({}, COMPANY_SCHOOL_SCHEDULED_PERIOD_STATUSES),
  ])

  return {
    total: all.totalElements ?? all.items?.length ?? 0,
    scheduled: scheduledUnion.totalElements,
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
