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
  mapTrainedTeacherDetailToProgram,
  mapTrainedTeacherListItemToProgram,
  mapTrainedTeacherToCreateRequest,
  mapTrainedTeacherToUpdateRequest,
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
import {
  TRAINED_TEACHER_PROGRAM_LIST_PAGE_SIZE,
  trainedTeacherListParams,
  type TrainedTeacherListFilters,
} from './list-params'

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

export async function getTrainedTeacherProgram(programId: string): Promise<Program> {
  assertRemoteReady()
  const program = mapTrainedTeacherDetailToProgram(await fetchAdminProgramByIdRemote(programId))
  try {
    const infoDetail = await fetchTrainedTeacherInfoDetailRemote(programId)
    return mergeTrainedTeacherInfoDetailIntoProgram(program, infoDetail)
  } catch {
    // info detail 실패 시 programs 코어 detail만 반환 (Phase 2 soft-fail)
    return program
  }
}

export async function createTrainedTeacherProgram(program: Program): Promise<Program> {
  assertRemoteReady()
  const dto = await createAdminProgramRemote(mapTrainedTeacherToCreateRequest(program))
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
  const dto = await updateAdminProgramRemote(
    programId,
    mapTrainedTeacherToUpdateRequest(program, patch)
  )
  const mapped = mapTrainedTeacherDetailToProgram(dto)
  try {
    const infoDetail = await fetchTrainedTeacherInfoDetailRemote(programId)
    return mergeTrainedTeacherInfoDetailIntoProgram(mapped, infoDetail)
  } catch {
    return mapped
  }
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
