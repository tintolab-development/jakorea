import {
  deleteCompanySchoolRegistrationLocalSaveProgram,
  updateCompanySchoolRegistrationLocalSaveProgram,
} from '@/features/program/general/lib/registration-local-save'
import {
  bulkDeleteAdminProgramsRemote,
  deleteAdminProgramRemote,
  fetchAdminProgramByIdRemote,
  fetchAdminProgramsRemote,
  updateAdminProgramRemote,
  fetchAdminProgramOverviewStagesRemote,
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

/**
 * 상단 4카드 — GET /programs totalElements.
 * 예정: SCHEDULED ∪ RECRUITING (id 중복 제거) — 목록 예정 필터와 동일.
 * BE가 버킷을 배타로 유지 — FE에서 카드 합을 강제 정규화하지 않음.
 * `RECRUITING`은 예정 별칭(참여자 모집 창 아님).
 */
export async function fetchCompanySchoolOverviewStages(): Promise<CompanySchoolOverviewStageCounts> {
  assertRemoteReady()

  return fetchAdminProgramOverviewStagesRemote(COMPANY_SCHOOL_PROGRAM_API_TYPE)
}

export async function getCompanySchoolProgram(programId: string): Promise<Program> {
  assertRemoteReady()
  // 상세와 후원사 배정은 서로 의존하지 않으므로 동시에 요청한다. 후원사 실패 시 상세만 보여 준다.
  const sponsorAssignmentsPromise = import('@/features/program/general/api/programs-api-client').then(
    ({ fetchAdminProgramSponsorsRemote }) => fetchAdminProgramSponsorsRemote(programId)
  )
  sponsorAssignmentsPromise.catch(() => undefined)
  const [dto, { withFetchedProgramSponsorAssignments }] = await Promise.all([
    fetchAdminProgramByIdRemote(programId),
    import('@/features/program/shared/lib/merge-program-sponsor-assignments'),
  ])
  return withFetchedProgramSponsorAssignments(
    mapCompanySchoolDetailToProgram(dto),
    programId,
    () => sponsorAssignmentsPromise
  )
}

export async function createCompanySchoolProgram(
  program: Program,
  prepared?: import('@/features/program/general/lib/build-registration-create-form-bindings').RegistrationCreateFormBindingsPayload | null
): Promise<Program> {
  assertRemoteReady()
  const { createAdminProgramRemoteWithRegistrationForms } = await import(
    '@/features/program/general/api/create-admin-program-remote-with-registration-forms'
  )
  const dto = await createAdminProgramRemoteWithRegistrationForms(
    program,
    mapCompanySchoolToCreateRequest(program),
    prepared
  )
  return mapCompanySchoolDetailToProgram(dto)
}

export async function updateCompanySchoolProgram(
  programId: string,
  program: Program,
  patch?: Partial<Program>
): Promise<Program> {
  assertRemoteReady()
  const merged = { ...program, ...(patch ?? {}), id: programId }
  // 등록 중 로컬 임시저장 키와 충돌하지 않도록 remote 성공 후 로컬 잔여만 정리
  updateCompanySchoolRegistrationLocalSaveProgram(programId, patch ?? program)
  const dto = await updateAdminProgramRemote(
    programId,
    mapCompanySchoolToUpdateRequest(
      merged,
      patch && Object.keys(patch).length > 0 ? patch : undefined
    )
  )
  const mapped = mapCompanySchoolDetailToProgram(dto)
  const { withFetchedProgramSponsorAssignments } = await import(
    '@/features/program/shared/lib/merge-program-sponsor-assignments'
  )
  const { fetchAdminProgramSponsorsRemote } = await import(
    '@/features/program/general/api/programs-api-client'
  )
  return withFetchedProgramSponsorAssignments(mapped, programId, fetchAdminProgramSponsorsRemote)
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
