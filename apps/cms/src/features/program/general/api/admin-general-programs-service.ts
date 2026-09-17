import {
  mapAdminProgramDetailToProgram,
  mapAdminProgramListItemToProgram,
  mapGeneralProgramToCreateRequest,
  mapGeneralProgramToUpdateRequest,
} from '@/features/program/general/api/adapters/general-program-adapters'
import {
  clientFilterGeneralPrograms,
  GENERAL_PROGRAM_LIST_PAGE_SIZE,
  generalProgramListParamsFromFilters,
  type GeneralProgramListTableFilters,
} from '@/features/program/general/api/general-program-list-filter-params'
import {
  shouldUseGeneralProgramsRemoteApi,
  shouldUseProgramsHttpRemoteApi,
} from '@/features/program/general/api/general-programs-remote-capabilities'
import {
  mapProgramManagerResponsesToRows,
  toProgramManagerApiRole,
} from '@/features/program/general/api/adapters/program-managers-adapters'
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
  deleteAdminProgramPostReactionRemote,
  fetchAdminProgramByIdRemote,
  fetchAdminProgramFormBindingsRemote,
  fetchAdminProgramManagersRemote,
  fetchAdminProgramNavigationRemote,
  fetchAdminProgramPostAttachmentsRemote,
  fetchAdminProgramPostCommentsRemote,
  fetchAdminProgramPostDetailRemote,
  fetchAdminProgramPostReactionsRemote,
  fetchAdminProgramPostReadsRemote,
  fetchAdminProgramPostsRemote,
  createAdminProgramPostUnreadReminderRemote,
  fetchAdminProgramsRemote,
  fetchAdminProgramSurveyResponseDetailRemote,
  fetchAdminProgramSurveyResponsesRemote,
  fetchAdminProgramSurveySummaryRemote,
  fetchAdminProgramSurveysRemote,
  putAdminProgramPostAttachmentsRemote,
  putAdminProgramPostReactionRemote,
  createAdminProgramPostCommentRemote,
  submitAdminFormResponseRemote,
  updateAdminProgramManagerRemote,
  updateAdminProgramRemote,
  updateAdminProgramPostRemote,
} from '@/features/program/general/api/programs-api-client'
import type { ProgramFormBindingRequest } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingRequest'
import type { ProgramRole } from '@/types/user'
import type { GeneralProgramOverviewStatusFilter } from '@/features/program/general/lib/list-status-filter'
import type { GeneralProgramOverviewStageCounts } from '@/features/program/general/lib/overview-stage-counts'
import type { Program } from '@/types/domain'

const GENERAL_PROGRAM_API_TYPE = 'GENERAL'

function assertGeneralProgramsRemoteReady(): void {
  if (!shouldUseGeneralProgramsRemoteApi()) {
    throw new Error(
      '일반 프로그램 API가 활성화되지 않았습니다. VITE_API_SERVER(또는 VITE_API_BASE_URL)로 백엔드를 설정하고 관리자 API로 로그인해 주세요.'
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

export type GeneralProgramsRemoteListPage = {
  programs: Program[]
  page: number
  size: number
  totalElements: number
  hasMore: boolean
}

export async function fetchGeneralProgramsRemoteListPage(
  statusFilter: GeneralProgramOverviewStatusFilter | null,
  tableFilters: GeneralProgramListTableFilters = {},
  pageParam = 0
): Promise<GeneralProgramsRemoteListPage> {
  assertGeneralProgramsRemoteReady()

  const query = generalProgramListParamsFromFilters(statusFilter, tableFilters, pageParam)
  const page = await fetchAdminProgramsRemote(query)

  const programs = clientFilterGeneralPrograms(
    (page.items ?? []).map(mapAdminProgramListItemToProgram),
    tableFilters
  )
  // periodStatus는 서버 필터 — trained-teachers/1사1교와 같이 클라이언트 overview 재필터 스킵
  const size = page.size ?? GENERAL_PROGRAM_LIST_PAGE_SIZE
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

/** @deprecated 무한 스크롤은 `fetchGeneralProgramsRemoteListPage` 사용 */
export async function fetchGeneralProgramsRemoteList(
  statusFilter: GeneralProgramOverviewStatusFilter | null,
  tableFilters: GeneralProgramListTableFilters = {}
): Promise<Program[]> {
  const page = await fetchGeneralProgramsRemoteListPage(statusFilter, tableFilters, 0)
  return page.programs
}

/**
 * 상단 4카드 건수.
 * remote: GET /programs?periodStatus=* 의 totalElements (목록과 동일 periodStatus 계약)
 * 예정 = `RECRUITING`(예정 버킷 별칭). BE가 버킷을 배타로 유지 — FE에서 합을 강제 정규화하지 않음.
 * mock: lifecycle 버킷 집계 (목록 filterGeneralProgramsByOverviewStatus 와 동일)
 *
 * 별도 count API 불필요 — 기존 목록 API로 충분. (목록 페이징과 무관, totalElements가 SSOT)
 */
export async function fetchGeneralProgramOverviewStages(): Promise<GeneralProgramOverviewStageCounts> {
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
  assertGeneralProgramsRemoteReady()
  const dto = await createAdminProgramRemote(mapGeneralProgramToCreateRequest(program))
  return mapAdminProgramDetailToProgram(dto)
}

export async function updateGeneralProgram(
  programId: string,
  program: Program,
  patch?: Partial<Program>
): Promise<Program> {
  assertGeneralProgramsRemoteReady()
  const dto = await updateAdminProgramRemote(
    programId,
    mapGeneralProgramToUpdateRequest(program, patch)
  )
  return mapAdminProgramDetailToProgram(dto)
}

export async function deleteGeneralProgram(programId: string): Promise<void> {
  assertGeneralProgramsRemoteReady()
  await deleteAdminProgramRemote(programId)
}

export async function deleteGeneralPrograms(programIds: string[]): Promise<void> {
  if (programIds.length === 0) return
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

export async function fetchGeneralProgramPostDetail(programId: string, postId: string) {
  if (!shouldUseProgramsHttpRemoteApi()) return null
  assertProgramsHttpRemoteReady()
  return fetchAdminProgramPostDetailRemote(programId, postId)
}

export async function fetchGeneralProgramPostComments(programId: string, postId: string) {
  if (!shouldUseProgramsHttpRemoteApi()) return []
  assertProgramsHttpRemoteReady()
  const page = await fetchAdminProgramPostCommentsRemote(programId, postId)
  return page.items ?? []
}

export async function createGeneralProgramPostComment(
  programId: string,
  postId: string,
  content: string
) {
  if (!shouldUseProgramsHttpRemoteApi()) return null
  assertProgramsHttpRemoteReady()
  return createAdminProgramPostCommentRemote(programId, postId, { content })
}

export async function fetchGeneralProgramPostReactions(programId: string, postId: string) {
  if (!shouldUseProgramsHttpRemoteApi()) return null
  assertProgramsHttpRemoteReady()
  return fetchAdminProgramPostReactionsRemote(programId, postId)
}

export async function putGeneralProgramPostReaction(
  programId: string,
  postId: string,
  reactionType: string
) {
  if (!shouldUseProgramsHttpRemoteApi()) return null
  assertProgramsHttpRemoteReady()
  return putAdminProgramPostReactionRemote(programId, postId, { reactionType })
}

export async function deleteGeneralProgramPostReaction(programId: string, postId: string) {
  if (!shouldUseProgramsHttpRemoteApi()) return
  assertProgramsHttpRemoteReady()
  await deleteAdminProgramPostReactionRemote(programId, postId)
}

export async function fetchGeneralProgramPostAttachments(programId: string, postId: string) {
  if (!shouldUseProgramsHttpRemoteApi()) return []
  assertProgramsHttpRemoteReady()
  const page = await fetchAdminProgramPostAttachmentsRemote(programId, postId)
  return page.items ?? []
}

export async function putGeneralProgramPostAttachments(
  programId: string,
  postId: string,
  fileObjectIds: number[]
) {
  if (!shouldUseProgramsHttpRemoteApi()) return null
  assertProgramsHttpRemoteReady()
  return putAdminProgramPostAttachmentsRemote(programId, postId, { fileObjectIds })
}

export async function fetchGeneralProgramPostReads(programId: string, postId: string) {
  if (!shouldUseProgramsHttpRemoteApi()) return null
  assertProgramsHttpRemoteReady()
  return fetchAdminProgramPostReadsRemote(programId, postId)
}

export async function createGeneralProgramPostUnreadReminder(
  programId: string,
  postId: string,
  payload: { message?: string; memberIds?: number[] }
) {
  if (!shouldUseProgramsHttpRemoteApi()) return null
  assertProgramsHttpRemoteReady()
  return createAdminProgramPostUnreadReminderRemote(programId, postId, payload)
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

export async function fetchGeneralProgramManagers(
  programId: string,
  query: { keyword?: string; role?: string } = {}
) {
  assertProgramsHttpRemoteReady()
  const items = await fetchAdminProgramManagersRemote(programId, query)
  return mapProgramManagerResponsesToRows(items)
}

export async function addGeneralProgramManager(
  programId: string,
  payload: { adminId: number; role: ProgramRole }
) {
  assertProgramsHttpRemoteReady()
  return addAdminProgramManagerRemote(programId, {
    adminId: payload.adminId,
    role: toProgramManagerApiRole(payload.role),
  })
}

export async function updateGeneralProgramManager(
  programId: string,
  assignmentId: string,
  payload: { role?: ProgramRole; adminId?: number }
) {
  assertProgramsHttpRemoteReady()
  return updateAdminProgramManagerRemote(programId, assignmentId, {
    adminId: payload.adminId,
    ...(payload.role != null ? { role: toProgramManagerApiRole(payload.role) } : {}),
  })
}

export async function deleteGeneralProgramManager(programId: string, assignmentId: string) {
  assertProgramsHttpRemoteReady()
  await deleteAdminProgramManagerRemote(programId, assignmentId)
}

export { GENERAL_PROGRAM_API_TYPE }
