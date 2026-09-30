import {
  bulkDeleteAdminProgramsRemote,
  deleteAdminProgramRemote,
  fetchAdminProgramByIdRemote,
  fetchAdminProgramSponsorsRemote,
  fetchAdminProgramsRemote,
  updateAdminProgramRemote,
} from '@/features/program/general/api/programs-api-client'
import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { Program } from '@/types/domain'
import {
  mapTrainedTeacherDetailToProgram,
  mapTrainedTeacherListItemToProgram,
  mapTrainedTeacherToCreateRequest,
  mapTrainedTeacherToUpdateRequest,
  mergeTrainedTeacherSponsorAssignments,
} from './adapters'
import { shouldUseTrainedTeacherProgramsRemoteApi } from './capabilities'
import {
  mapTrainedTeacherInfoSaveToRequest,
  mergeTrainedTeacherInfoDetailIntoProgram,
  type TrainedTeachersCommonInfoSavePayload,
} from './info-detail-adapters'
import {
  fetchTrainedTeacherInfoDetailRemote,
  patchTrainedTeacherInfoDetailRemote,
} from './info-detail-client'
import type { GeneralProgramOverviewStageCounts } from '@/features/program/general/lib/overview-stage-counts'
import {
  TRAINED_TEACHER_PROGRAM_LIST_PAGE_SIZE,
  trainedTeacherListParams,
  type TrainedTeacherListFilters,
} from './list-params'
import { TRAINED_TEACHER_PROGRAM_API_TYPE } from './adapters'
import { resolveStoredBusinessArea } from '@/features/program/shared/lib/program-detail-info-constants'

/** remote list 스냅샷 — 상세 분기(isTrainedTeachersDetailProgram)용 */
let remoteIdSnapshot: Set<string> | null = null

export function getTrainedTeacherRemoteIdSnapshot(): Set<string> | null {
  return remoteIdSnapshot
}

function setRemoteIdSnapshot(programs: Program[]): void {
  remoteIdSnapshot = new Set(programs.map(p => p.id).filter(Boolean))
}

function assertRemoteReady(): void {
  if (shouldUseTrainedTeacherProgramsRemoteApi()) return
  throw new Error(
    '교육받은 교사 API가 활성화되지 않았습니다. 원격 JWT, programs 모듈, VITE_TRAINED_TEACHER_PROGRAMS_REMOTE_ENABLED=true(또는 trainedTeacherPrograms) 설정을 확인해 주세요. mock 폴백은 사용하지 않습니다.'
  )
}

/** @deprecated mock 제거 — 호출 시 throw */
export function getTrainedTeachersMockList(): Program[] {
  throw new Error(
    '교육받은 교사 mock 목록은 제거되었습니다. Admin programs API를 사용해 주세요.'
  )
}

export type TrainedTeacherProgramsRemoteListPage = {
  programs: Program[]
  page: number
  size: number
  totalElements: number
  hasMore: boolean
}

export async function listTrainedTeacherProgramsPage(
  filters: TrainedTeacherListFilters = {},
  pageParam = 0
): Promise<TrainedTeacherProgramsRemoteListPage> {
  assertRemoteReady()
  const page = await fetchAdminProgramsRemote(trainedTeacherListParams(filters, pageParam))
  const programs = (page.items ?? []).map(mapTrainedTeacherListItemToProgram)
  if (pageParam === 0) setRemoteIdSnapshot(programs)
  else if (remoteIdSnapshot) {
    for (const program of programs) remoteIdSnapshot.add(program.id)
  } else {
    setRemoteIdSnapshot(programs)
  }
  const size = page.size ?? TRAINED_TEACHER_PROGRAM_LIST_PAGE_SIZE
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

/** @deprecated 무한 스크롤은 `listTrainedTeacherProgramsPage` 사용 */
export async function listTrainedTeacherPrograms(
  filters: TrainedTeacherListFilters = {}
): Promise<Program[]> {
  const page = await listTrainedTeacherProgramsPage(filters, 0)
  return page.programs
}

/**
 * 상단 4카드 건수 — GET /api/admin/programs/overview-stages?programType=TRAINED_TEACHER
 * scheduled/recruiting 동일 버킷 가능 — FE에서 합산하지 않음 (BE list periodStatus 계약과 동일)
 */
export async function fetchTrainedTeacherOverviewStages(): Promise<GeneralProgramOverviewStageCounts> {
  assertRemoteReady()

  const data = await unwrapApiBody<{
    total?: number
    scheduled?: number
    recruiting?: number
    inProgress?: number
    completed?: number
  }>(
    await customInstance({
      url: '/api/admin/programs/overview-stages',
      method: 'GET',
      params: { programType: TRAINED_TEACHER_PROGRAM_API_TYPE },
    })
  )

  // BE: scheduled/recruiting 은 동일 예정 버킷일 수 있음 — 강제 합산하지 않음
  return {
    total: data.total ?? 0,
    scheduled: data.scheduled ?? 0,
    inProgress: data.inProgress ?? 0,
    completed: data.completed ?? 0,
  }
}

export async function getTrainedTeacherProgram(programId: string): Promise<Program> {
  assertRemoteReady()
  const [dto, sponsorsResult] = await Promise.all([
    fetchAdminProgramByIdRemote(programId),
    fetchAdminProgramSponsorsRemote(programId).then(
      data => ({ ok: true as const, data }),
      () => ({ ok: false as const, data: null })
    ),
  ])
  const base = mapTrainedTeacherDetailToProgram(dto)
  const withInfo = await (async () => {
    try {
      const infoDetail = await fetchTrainedTeacherInfoDetailRemote(programId)
      return mergeTrainedTeacherInfoDetailIntoProgram(base, infoDetail)
    } catch {
      return base
    }
  })()
  // sponsors API 가 후원·담당자 SSOT — 실패 시 merge skip (빈 배열 clear 오인 방지)
  if (!sponsorsResult.ok) return withInfo
  return mergeTrainedTeacherSponsorAssignments(withInfo, sponsorsResult.data)
}

export async function createTrainedTeacherProgram(
  program: Program,
  prepared?: import('@/features/program/general/lib/build-registration-create-form-bindings').RegistrationCreateFormBindingsPayload | null
): Promise<Program> {
  assertRemoteReady()
  const { createAdminProgramRemoteWithRegistrationForms } = await import(
    '@/features/program/general/api/create-admin-program-remote-with-registration-forms'
  )
  const dto = await createAdminProgramRemoteWithRegistrationForms(
    program,
    mapTrainedTeacherToCreateRequest(program),
    prepared
  )
  const mapped = mapTrainedTeacherDetailToProgram(dto)
  if (remoteIdSnapshot) remoteIdSnapshot.add(mapped.id)
  else remoteIdSnapshot = new Set([mapped.id])
  return mapped
}

export async function updateTrainedTeacherProgram(
  programId: string,
  program: Program,
  patch?: Partial<Program>
): Promise<Program> {
  assertRemoteReady()
  const request = mapTrainedTeacherToUpdateRequest(program, patch)
  const dto = await updateAdminProgramRemote(programId, request)
  const sponsorsResult = await fetchAdminProgramSponsorsRemote(programId).then(
    data => ({ ok: true as const, data }),
    () => ({ ok: false as const, data: null })
  )
  let mapped = mapTrainedTeacherDetailToProgram(dto)
  // PATCH echo 가 businessArea 를 빼거나 구값을 주면, 방금 보낸 마스터명을 유지한다.
  const requestedBusinessArea = resolveStoredBusinessArea(request.businessArea)
  if (
    requestedBusinessArea &&
    resolveStoredBusinessArea(mapped.businessArea) !== requestedBusinessArea
  ) {
    mapped = { ...mapped, businessArea: requestedBusinessArea }
  }
  try {
    const infoDetail = await fetchTrainedTeacherInfoDetailRemote(programId)
    mapped = mergeTrainedTeacherInfoDetailIntoProgram(mapped, infoDetail, {
      tablePreference: 'program',
    })
  } catch {
    // info-detail 실패 시 program GET 매핑만 사용
  }
  if (!sponsorsResult.ok) return mapped
  return mergeTrainedTeacherSponsorAssignments(mapped, sponsorsResult.data)
}

/** 공통 정보 LNB — trained-teacher/detail PATCH */
export async function updateTrainedTeacherProgramInfoDetail(
  programId: string,
  payload: TrainedTeachersCommonInfoSavePayload
): Promise<Program> {
  assertRemoteReady()
  const dto = await patchTrainedTeacherInfoDetailRemote(
    programId,
    mapTrainedTeacherInfoSaveToRequest(payload)
  )
  const base = await fetchAdminProgramByIdRemote(programId)
  return mergeTrainedTeacherInfoDetailIntoProgram(mapTrainedTeacherDetailToProgram(base), dto)
}

export async function deleteTrainedTeacherProgram(programId: string): Promise<void> {
  assertRemoteReady()
  await deleteAdminProgramRemote(programId)
  remoteIdSnapshot?.delete(programId)
}

export async function deleteTrainedTeacherPrograms(programIds: string[]): Promise<void> {
  if (programIds.length === 0) return
  assertRemoteReady()
  await bulkDeleteAdminProgramsRemote(programIds)
  for (const programId of programIds) {
    remoteIdSnapshot?.delete(programId)
  }
}
