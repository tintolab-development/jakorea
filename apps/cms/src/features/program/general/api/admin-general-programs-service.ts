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
  shouldUseProgramsHttpRemoteApi,
} from '@/features/program/general/api/general-programs-remote-capabilities'
import { mapProgramManagerResponsesToRows } from '@/features/program/general/api/adapters/program-managers-adapters'
import {
  addAdminProgramManagerRemote,
  bulkDeleteAdminProgramsRemote,
  createAdminProgramFormBindingRemote,
  createAdminProgramRemote,
  createAdminProgramPostRemote,
  deleteAdminProgramFormBindingRemote,
  deleteAdminProgramManagerRemote,
  deleteAdminProgramRemote,
  deleteAdminProgramPostRemote,
  fetchAdminProgramByIdRemote,
  fetchAdminProgramFormBindingsRemote,
  fetchAdminProgramManagersRemote,
  fetchAdminProgramNavigationRemote,
  fetchAdminProgramPostsRemote,
  fetchAdminProgramsRemote,
  fetchAdminProgramSurveyResponseDetailRemote,
  fetchAdminProgramSurveyResponsesRemote,
  fetchAdminProgramSurveySummaryRemote,
  fetchAdminProgramSurveysRemote,
  submitAdminFormResponseRemote,
  updateAdminProgramManagerRemote,
  updateAdminProgramRemote,
  updateAdminProgramPostRemote,
} from '@/features/program/general/api/programs-api-client'
import type { ProgramFormBindingRequest } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingRequest'
import { resolveGeneralProgramForDetail } from '@/features/program/general/lib/detail-meta'
import type { ProgramRole } from '@/types/user'
import type { GeneralProgramOverviewStatusFilter } from '@/features/program/general/lib/list-status-filter'
import {
  countGeneralProgramOverviewStages,
  type GeneralProgramOverviewStageCounts,
} from '@/features/program/general/lib/overview-stage-counts'
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

function assertProgramsHttpRemoteReady(): void {
  if (!shouldUseProgramsHttpRemoteApi()) {
    throw new Error(
      '프로그램 API가 활성화되지 않았습니다. API 로그인 후 programs 모듈(및 1사1교 opt-in)을 확인해 주세요.'
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
  // periodStatus는 서버 필터 — trained-teachers/1사1교와 같이 클라이언트 overview 재필터 스킵
  return clientFilterGeneralPrograms(programs, tableFilters)
}

/**
 * 상단 4카드 건수.
 * remote: GET /programs?periodStatus=* 의 totalElements (목록과 동일 periodStatus 계약)
 * mock: lifecycle 버킷 집계 (목록 filterGeneralProgramsByOverviewStatus 와 동일)
 *
 * 별도 count API 불필요 — 기존 목록 API로 충분. (500건 초과 시 totalElements가 SSOT)
 */
export async function fetchGeneralProgramOverviewStages(): Promise<GeneralProgramOverviewStageCounts> {
  if (!shouldUseGeneralProgramsRemoteApi()) {
    return countGeneralProgramOverviewStages(getGeneralPrograms())
  }

  assertGeneralProgramsRemoteReady()

  const base = { programType: GENERAL_PROGRAM_API_TYPE, page: 0, size: 1 } as const
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
  if (programIds.length === 0) return

  if (!shouldUseGeneralProgramsRemoteApi()) {
    for (const programId of programIds) {
      await deleteGeneralProgram(programId)
    }
    return
  }

  assertGeneralProgramsRemoteReady()
  await bulkDeleteAdminProgramsRemote(programIds)
}

export async function fetchGeneralProgramNavigation(programId: string) {
  if (!shouldUseProgramsHttpRemoteApi()) return null
  assertProgramsHttpRemoteReady()
  return fetchAdminProgramNavigationRemote(programId)
}

export async function fetchGeneralProgramPosts(programId: string) {
  if (!shouldUseProgramsHttpRemoteApi()) return []
  assertProgramsHttpRemoteReady()
  const page = await fetchAdminProgramPostsRemote(programId)
  return page.items ?? []
}

export async function fetchGeneralProgramSurveys(programId: string) {
  if (!shouldUseProgramsHttpRemoteApi()) return []
  assertProgramsHttpRemoteReady()
  return fetchAdminProgramSurveysRemote(programId)
}

export async function createGeneralProgramPost(
  programId: string,
  payload: {
    title?: string
    content: string
    visibilityType?: string
  }
) {
  if (!shouldUseProgramsHttpRemoteApi()) return null
  assertProgramsHttpRemoteReady()
  return createAdminProgramPostRemote(programId, {
    title: payload.title ?? payload.content.slice(0, 40),
    content: payload.content,
    visibilityType: payload.visibilityType,
  })
}

export async function updateGeneralProgramPost(
  programId: string,
  postId: string,
  payload: {
    title?: string
    content?: string
    visibilityType?: string
  }
) {
  if (!shouldUseProgramsHttpRemoteApi()) return null
  assertProgramsHttpRemoteReady()
  return updateAdminProgramPostRemote(programId, postId, payload)
}

export async function deleteGeneralProgramPost(programId: string, postId: string) {
  if (!shouldUseProgramsHttpRemoteApi()) return
  assertProgramsHttpRemoteReady()
  await deleteAdminProgramPostRemote(programId, postId)
}

export async function fetchGeneralProgramSurveyResponses(
  programId: string,
  templateVersionId: string
) {
  if (!shouldUseProgramsHttpRemoteApi()) return []
  assertProgramsHttpRemoteReady()
  return fetchAdminProgramSurveyResponsesRemote(programId, templateVersionId)
}

export async function fetchGeneralProgramSurveySummary(
  programId: string,
  templateVersionId: string
) {
  if (!shouldUseProgramsHttpRemoteApi()) return []
  assertProgramsHttpRemoteReady()
  return fetchAdminProgramSurveySummaryRemote(programId, templateVersionId)
}

export async function fetchGeneralProgramSurveyResponseDetail(
  programId: string,
  templateVersionId: string,
  formResponseId: string
) {
  if (!shouldUseProgramsHttpRemoteApi()) return null
  assertProgramsHttpRemoteReady()
  return fetchAdminProgramSurveyResponseDetailRemote(
    programId,
    templateVersionId,
    formResponseId
  )
}

export async function fetchGeneralProgramFormBindings(programId: string) {
  if (!shouldUseProgramsHttpRemoteApi()) return []
  assertProgramsHttpRemoteReady()
  return fetchAdminProgramFormBindingsRemote(programId)
}

export async function createGeneralProgramFormBinding(
  programId: string,
  payload: ProgramFormBindingRequest
) {
  if (!shouldUseProgramsHttpRemoteApi()) return null
  assertProgramsHttpRemoteReady()
  return createAdminProgramFormBindingRemote(programId, payload)
}

export async function deleteGeneralProgramFormBinding(programId: string, bindingId: string) {
  if (!shouldUseProgramsHttpRemoteApi()) return
  assertProgramsHttpRemoteReady()
  await deleteAdminProgramFormBindingRemote(programId, bindingId)
}

/** 강의평가 등 관리자 form response 제출. remote OFF면 null. */
export async function submitGeneralProgramFormResponse(
  payload: import('@/shared/api/generated/forms-surveys/schemas/formResponseCreateRequest').FormResponseCreateRequest
) {
  if (!shouldUseProgramsHttpRemoteApi()) return null
  assertProgramsHttpRemoteReady()
  return submitAdminFormResponseRemote(payload)
}

export async function fetchGeneralProgramManagers(programId: string) {
  if (!shouldUseProgramsHttpRemoteApi()) return []
  assertProgramsHttpRemoteReady()
  const items = await fetchAdminProgramManagersRemote(programId)
  return mapProgramManagerResponsesToRows(items)
}

export async function addGeneralProgramManager(
  programId: string,
  payload: { adminId: number; role: ProgramRole }
) {
  if (!shouldUseProgramsHttpRemoteApi()) return null
  assertProgramsHttpRemoteReady()
  return addAdminProgramManagerRemote(programId, {
    adminId: payload.adminId,
    role: payload.role,
  })
}

export async function updateGeneralProgramManager(
  programId: string,
  assignmentId: string,
  payload: { role?: ProgramRole; adminId?: number }
) {
  if (!shouldUseProgramsHttpRemoteApi()) return null
  assertProgramsHttpRemoteReady()
  return updateAdminProgramManagerRemote(programId, assignmentId, payload)
}

export async function deleteGeneralProgramManager(programId: string, assignmentId: string) {
  if (!shouldUseProgramsHttpRemoteApi()) return
  assertProgramsHttpRemoteReady()
  await deleteAdminProgramManagerRemote(programId, assignmentId)
}

export { GENERAL_PROGRAM_API_TYPE }
