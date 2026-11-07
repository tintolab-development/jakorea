import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import { getJAKoreaCMSBackendAPIProgramProgressSubset } from '@/shared/api/generated/program-progress/program-progress-api'
import type { EmployeeVolunteerCountReplaceRequest } from '@/shared/api/generated/program-progress/schemas/employeeVolunteerCountReplaceRequest'
import type { EmployeeVolunteerCountSetResponse } from '@/shared/api/generated/program-progress/schemas/employeeVolunteerCountSetResponse'
import type { PageResponseProgramParticipantRegisterCandidateResponse } from '@/shared/api/generated/program-progress/schemas/pageResponseProgramParticipantRegisterCandidateResponse'
import type { VolunteerParticipantRegisterRequest } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantRegisterRequest'
import type { VolunteerParticipantRegisterResponse } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantRegisterResponse'

import type { PageResponseParticipantListItemResponse } from '@/shared/api/generated/dashboard/schemas/pageResponseParticipantListItemResponse'
import type { ParticipantListItemResponse } from '@/shared/api/generated/dashboard/schemas/participantListItemResponse'
import {
  filterProgramProgressParticipantItems,
  type ProgramProgressParticipantListItem,
} from '@/features/program/general/lib/program-progress-list-visibility'
import type { ChangeRequest } from '@/shared/api/generated/dashboard/schemas/changeRequest'
import type { ChangeResponse } from '@/shared/api/generated/dashboard/schemas/changeResponse'
import type { AttendanceItemResponse } from '@/shared/api/generated/dashboard/schemas/attendanceItemResponse'
import {
  bulkAttendanceScheduleIdsCacheKey,
  ensureAttendancesByScheduleIdKeys,
  groupAttendancesByScheduleId,
  normalizeBulkAttendanceScheduleIds,
  type BulkAttendanceScheduleIdsInput,
} from '@/features/program/general/lib/program-attendance-bulk'

const inFlightAttendancesByScheduleIds = new Map<
  string,
  Promise<Record<string, AttendanceItemResponse[]>>
>()

function attendancesByScheduleIdsInFlightKey(
  programId: string,
  normalized: ReturnType<typeof normalizeBulkAttendanceScheduleIds>
): string {
  return `${programId}:${bulkAttendanceScheduleIdsCacheKey(normalized)}`
}

const programProgressApi = getJAKoreaCMSBackendAPIProgramProgressSubset()

function toNumericProgramId(programId: string): number {
  const parsed = Number(programId)
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid programId: ${programId}`)
  }
  return parsed
}

export type ProgramParticipantsListQuery = {
  participantType?: string
  status?: string
  page?: number
  size?: number
}

export interface ProgramParticipantsPageDto {
  items?: ParticipantListItemResponse[]
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
}

export async function fetchProgramParticipantsRemote(
  programId: string,
  params?: ProgramParticipantsListQuery
): Promise<ProgramParticipantsPageDto> {
  const page = await unwrapApiBody<PageResponseParticipantListItemResponse>(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/participants`,
      method: 'GET',
      params,
    })
  )
  const items = (page.items ?? []) as ProgramProgressParticipantListItem[]
  const visibleItems = filterProgramProgressParticipantItems(items)
  const hiddenCount = items.length - visibleItems.length
  return {
    ...page,
    items: visibleItems,
    totalElements:
      page.totalElements != null
        ? Math.max(0, page.totalElements - hiddenCount)
        : visibleItems.length,
  }
}

export async function fetchScheduleAttendancesRemote(
  programId: string,
  scheduleId: string
): Promise<AttendanceItemResponse[]> {
  const body = await unwrapApiBody<
    AttendanceItemResponse[] | { items?: AttendanceItemResponse[] }
  >(
    await customInstance({
      url: `/api/admin/program-execution/programs/${encodeURIComponent(programId)}/schedules/${encodeURIComponent(scheduleId)}/attendances`,
      method: 'GET',
    })
  )
  if (Array.isArray(body)) return body
  return body.items ?? []
}

type ProgramAttendancesBulkScope = {
  /** 지정 시 해당 기관 신청 참여자 출결만 조회 */
  organizationApplicationId?: string | number | null
}

function resolveAttendanceOrganizationApplicationId(scope?: ProgramAttendancesBulkScope): number | null {
  const id = Number(scope?.organizationApplicationId)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

function buildProgramAttendancesBulkUrl(
  programId: string,
  normalized: ReturnType<typeof normalizeBulkAttendanceScheduleIds>,
  scope?: ProgramAttendancesBulkScope
): string {
  const base = `/api/admin/program-execution/programs/${encodeURIComponent(programId)}/attendances`
  const search = new URLSearchParams()
  if (normalized.kind === 'filtered') {
    for (const scheduleId of normalized.scheduleIds) {
      search.append('scheduleIds', String(scheduleId))
    }
  }
  const organizationApplicationId = resolveAttendanceOrganizationApplicationId(scope)
  if (organizationApplicationId != null) {
    search.append('organizationApplicationId', String(organizationApplicationId))
  }
  const query = search.toString()
  return query ? `${base}?${query}` : base
}

/** GET /api/admin/program-execution/programs/{programId}/attendances */
export async function fetchProgramAttendancesBulkRemote(
  programId: string,
  scheduleIds?: BulkAttendanceScheduleIdsInput,
  scope?: ProgramAttendancesBulkScope
): Promise<AttendanceItemResponse[]> {
  const normalized = normalizeBulkAttendanceScheduleIds(scheduleIds)
  if (normalized.kind === 'empty') {
    return []
  }
  const body = await unwrapApiBody<AttendanceItemResponse[] | { items?: AttendanceItemResponse[] }>(
    await customInstance({
      url: buildProgramAttendancesBulkUrl(programId, normalized, scope),
      method: 'GET',
    })
  )
  if (Array.isArray(body)) return body
  return body.items ?? []
}

export async function fetchAttendancesByScheduleIdsRemote(
  programId: string,
  scheduleIds: BulkAttendanceScheduleIdsInput,
  options: { includeEmptyScheduleKeys?: boolean } & ProgramAttendancesBulkScope = {}
): Promise<Record<string, AttendanceItemResponse[]>> {
  const normalized = normalizeBulkAttendanceScheduleIds(scheduleIds)
  if (normalized.kind === 'empty') {
    return {}
  }
  const organizationApplicationId = resolveAttendanceOrganizationApplicationId(options)
  const inFlightKey = `${attendancesByScheduleIdsInFlightKey(programId, normalized)}:${options.includeEmptyScheduleKeys ? 'include-empty' : 'assigned-only'}:org-${organizationApplicationId ?? 'all'}`
  const existing = inFlightAttendancesByScheduleIds.get(inFlightKey)
  if (existing) {
    return existing
  }
  const promise = (async () => {
    const items = await fetchProgramAttendancesBulkRemote(programId, scheduleIds, {
      organizationApplicationId,
    })
    const grouped = groupAttendancesByScheduleId(items)
    // The general institution attendance flow treats the attendance response
    // as the source of truth for schedules that are actually assigned. Do not
    // synthesize empty buckets there: an empty/missing bucket must not be
    // rendered as a session (or as "lecture not held"). UJAT keeps its legacy
    // all-schedule view by explicitly opting into empty buckets.
    if (options.includeEmptyScheduleKeys && normalized.kind === 'filtered') {
      return ensureAttendancesByScheduleIdKeys(grouped, normalized.scheduleIds)
    }
    return groupAttendancesByScheduleId(items)
  })()
  inFlightAttendancesByScheduleIds.set(inFlightKey, promise)
  try {
    return await promise
  } finally {
    inFlightAttendancesByScheduleIds.delete(inFlightKey)
  }
}

export async function putScheduleAttendancesRemote(
  scheduleId: string,
  payload: import('@/shared/api/generated/dashboard/schemas/scheduleAttendanceBulkUpsertRequest').ScheduleAttendanceBulkUpsertRequest
): Promise<void> {
  await customInstance({
    url: `/api/admin/program-schedules/${encodeURIComponent(scheduleId)}/attendances`,
    method: 'PUT',
    data: payload,
  })
}

export async function bulkUpsertProgramAttendancesRemote(
  programId: string,
  payload: import('@/shared/api/generated/dashboard/schemas/attendanceBulkUpsertRequest').AttendanceBulkUpsertRequest
): Promise<
  import('@/shared/api/generated/dashboard/schemas/attendanceBulkUpsertResponse').AttendanceBulkUpsertResponse
> {
  return unwrapApiBody(
    await customInstance({
      url: `/api/admin/program-execution/programs/${encodeURIComponent(programId)}/attendances:bulk-upsert`,
      method: 'POST',
      data: payload,
    })
  )
}

/** 일정 시작일 범위(포함, YYYY-MM-DD Asia/Seoul). 없으면 BE 기본 범위(이번 달). */
export interface ProgramScheduleDateRange {
  dateFrom: string
  dateTo: string
}

/** GET /api/admin/dashboard/program-schedules — 프로그램 일정 목록(출석 세션 옵션용). P2-2 전용 schedules list 대체. */
export async function fetchProgramSchedulesViaDashboardRemote(
  programId: string,
  dateRange?: ProgramScheduleDateRange | null
): Promise<
  import('@/shared/api/generated/dashboard/schemas/dashboardProgramScheduleResponse').DashboardProgramScheduleResponse[]
> {
  const { fetchDashboardProgramSchedulesRemote, toDashboardQueryParams } = await import(
    '@/features/dashboard/api/dashboard-api-client'
  )
  const body = await fetchDashboardProgramSchedulesRemote(
    toDashboardQueryParams({
      programIds: [programId],
      ...(dateRange ? { extra: { dateFrom: dateRange.dateFrom, dateTo: dateRange.dateTo } } : {}),
    })
  )
  return body.items ?? []
}

/** GET /api/admin/programs/{programId}/lecture-reports */
export interface ProgramLectureReportsPageDto {
  items?: unknown[]
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
}

export async function fetchProgramLectureReportsRemote(
  programId: string,
  params?: { page?: number; size?: number; instructorMemberId?: number }
): Promise<ProgramLectureReportsPageDto> {
  const instructorMemberId =
    params?.instructorMemberId != null && params.instructorMemberId > 0
      ? params.instructorMemberId
      : undefined
  const body = await unwrapApiBody<unknown[] | ProgramLectureReportsPageDto>(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/lecture-reports`,
      method: 'GET',
      params: {
        page: params?.page,
        size: params?.size,
        ...(instructorMemberId != null ? { instructorMemberId } : {}),
      },
    })
  )
  if (Array.isArray(body)) {
    return {
      items: body,
      page: params?.page ?? 0,
      size: params?.size ?? body.length,
      totalElements: body.length,
      totalPages: 1,
    }
  }
  return body
}

/**
 * GET /api/admin/programs/{programId}/lecture-reports/download
 * 제출 첨부 ZIP Job. 본문 PDF가 아니다. 빈 대상은 HTTP 409 LECTURE_REPORT_NO_DOWNLOADABLE_FILES.
 */
export async function downloadProgramLectureReportsRemote(
  programId: string,
  params?: { instructorMemberId?: number }
): Promise<import('@/shared/lib/lecture-report-bulk-download').LectureReportBulkDownloadJob> {
  const query =
    params?.instructorMemberId != null && params.instructorMemberId > 0
      ? { instructorMemberId: params.instructorMemberId }
      : undefined
  return unwrapApiBody(
    await customInstance(
      {
        url: `/api/admin/programs/${encodeURIComponent(programId)}/lecture-reports/download`,
        method: 'GET',
        params: query,
      },
      { skipGlobalErrorAlert: true }
    )
  )
}

export type TextbookDeliveryStatus = 'PREPARING' | 'SHIPPING' | 'DELIVERED' | 'NOT_APPLICABLE'

export type TextbookDeliveryPatchRequest = {
  textbookDeliveryStatus: TextbookDeliveryStatus
}

export type TextbookDeliveryPatchResponse = {
  participantId?: number
  programId?: number
  organizationApplicationId?: number
  textbookDeliveryStatus?: TextbookDeliveryStatus
}

/**
 * PATCH /api/admin/programs/{programId}/participants/{participantId}/textbook-delivery
 * 참여 기관 교재 배송 배지. materialAssignmentStatus(교재 배정)와 다르다.
 */
export async function patchParticipantTextbookDeliveryRemote(
  programId: string,
  participantId: string,
  payload: TextbookDeliveryPatchRequest
): Promise<TextbookDeliveryPatchResponse> {
  return unwrapApiBody<TextbookDeliveryPatchResponse>(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/participants/${encodeURIComponent(participantId)}/textbook-delivery`,
      method: 'PATCH',
      data: payload,
    })
  )
}

export type VolunteerKind = 'GENERAL' | 'EMPLOYEE'

export type ProgramParticipantCreateRequest =
  | { participantType: 'INSTRUCTOR'; memberId: number }
  | { participantType: 'VOLUNTEER'; memberId: number; volunteerKind?: VolunteerKind }

export type ProgramInstructorParticipantCreateRequest = Extract<
  ProgramParticipantCreateRequest,
  { participantType: 'INSTRUCTOR' }
>

export type ProgramInstructorParticipantCreateResponse = {
  participantId?: number
  programId?: number
  memberId?: number
  participantType?: string
  participantStatus?: string
  sourceApplicationId?: number | null
  volunteerKind?: VolunteerKind | null
}

/**
 * POST /api/admin/programs/{programId}/participants
 * 강사·봉사자 회원을 participant 로 등록. 신청 승인 API가 아니다.
 */
export async function createProgramParticipantRemote(
  programId: string,
  payload: ProgramParticipantCreateRequest
): Promise<ProgramInstructorParticipantCreateResponse> {
  return unwrapApiBody<ProgramInstructorParticipantCreateResponse>(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/participants`,
      method: 'POST',
      data: payload,
    })
  )
}

export async function createProgramInstructorParticipantRemote(
  programId: string,
  payload: ProgramInstructorParticipantCreateRequest
): Promise<ProgramInstructorParticipantCreateResponse> {
  return createProgramParticipantRemote(programId, payload)
}

export type VolunteerAssignedOrganizationsRequest = {
  organizationApplicationIds: number[]
  expectedRevision?: number
  reason?: string
}

export type VolunteerAssignedOrganizationsResponse = {
  participantId?: number
  revision?: number
  assignedOrganizationNames?: string[]
}

/**
 * PUT /api/admin/programs/{programId}/participants/{participantId}/assigned-organizations
 * 기관형 봉사 배정. 개인형 education-scope 와 다르다.
 */
export async function putParticipantAssignedOrganizationsRemote(
  programId: string,
  participantId: string,
  payload: VolunteerAssignedOrganizationsRequest
): Promise<VolunteerAssignedOrganizationsResponse> {
  return unwrapApiBody<VolunteerAssignedOrganizationsResponse>(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/participants/${encodeURIComponent(participantId)}/assigned-organizations`,
      method: 'PUT',
      data: payload,
    })
  )
}

export type ProgramParticipantGiveUpRequest =
  import('@/shared/api/generated/dashboard/schemas/applicationGiveUpRequest').ApplicationGiveUpRequest

/**
 * POST /api/admin/programs/{programId}/participants/{participantId}/give-up
 * ORGANIZATION(참여 기관) 등 participant 활동 포기.
 * organization-applications/{id}/give-up 는 없음(의도적).
 */
export async function giveUpProgramParticipantRemote(
  programId: string,
  participantId: string,
  payload: ProgramParticipantGiveUpRequest
): Promise<void> {
  await customInstance({
    url: `/api/admin/programs/${encodeURIComponent(programId)}/participants/${encodeURIComponent(participantId)}/give-up`,
    method: 'POST',
    data: payload,
  })
}

/**
 * PATCH /api/admin/programs/{programId}/participants/{participantId}/schedules
 * 이 참여 기관에서 fromDate에 시작하는 교육 일정을 toDate로 옮긴다.
 */
export async function changeParticipantSchedulesRemote(
  programId: string,
  participantId: string,
  payload: ChangeRequest
): Promise<ChangeResponse> {
  return unwrapApiBody<ChangeResponse>(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/participants/${encodeURIComponent(participantId)}/schedules`,
      method: 'PATCH',
      data: payload,
    })
  )
}

/**
 * education-scope GET/PUT additive enrich — CmsParticipantEducationScopeScheduleEnrich.
 * GENERAL_INDIVIDUAL VOLUNTEER는 configured/scheduleIds와 무관하게
 * 프로그램 ACTIVE/COMPLETED 일정이 들어올 수 있다 (배정 대기 행의 distanceKm용).
 */
export type ParticipantEducationScopeScheduleEnrich = {
  scheduleId: number
  /** 일정 장소 표시. distanceKm와 별개 */
  locationName?: string | null
  /** 일정 주소 표시. distanceKm와 별개 */
  address?: string | null
  /**
   * member_personal_profile 자택 ↔ 일정 장소 편도 km. NAVER Maps 실측, 소수 1자리.
   * null: LOCAL_DISTANCE, 자택·일정 주소 없음, 지오코딩·경로 실패,
   * 자택과 장소가 같아 서버가 0km 이하로 버린 경우. FE는 재계산하지 않는다.
   */
  distanceKm?: number | null
  /** 장거리 표기 전용(단가 아님). 없으면 FE는 접미어를 붙이지 않는다. */
  longDistance?: boolean | null
  /** 동일 scheduleId VOLUNTEER education-scope 인원. 항상 number, 0 포함 (omit 금지) */
  assignedVolunteerCount: number
}

export type ParticipantEducationScopeResponse = {
  programId?: number
  participantId?: number
  revision?: number
  configured?: boolean
  scheduleIds?: number[]
  /** additive. [] 가능, null 아님. 없으면 FE는 []로 취급 */
  schedules?: ParticipantEducationScopeScheduleEnrich[]
}

export type ParticipantEducationScopeUpdateRequest = {
  scheduleIds: number[]
  expectedRevision: number
  reason: string
}

/** GET /api/admin/programs/{programId}/participants/{participantId}/education-scope */
export async function fetchParticipantEducationScopeRemote(
  programId: string,
  participantId: string
): Promise<ParticipantEducationScopeResponse> {
  return unwrapApiBody<ParticipantEducationScopeResponse>(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/participants/${encodeURIComponent(participantId)}/education-scope`,
      method: 'GET',
    })
  )
}

/** PUT /api/admin/programs/{programId}/participants/{participantId}/education-scope */
export async function putParticipantEducationScopeRemote(
  programId: string,
  participantId: string,
  payload: ParticipantEducationScopeUpdateRequest
): Promise<ParticipantEducationScopeResponse> {
  return unwrapApiBody<ParticipantEducationScopeResponse>(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/participants/${encodeURIComponent(participantId)}/education-scope`,
      method: 'PUT',
      data: payload,
    })
  )
}

export type ParticipantSubmissionTeamRole = 'LEADER' | 'MEMBER' | 'INDIVIDUAL'

export type ParticipantSubmissionTeamResponse = {
  teamId?: number | null
  teamName?: string
  name?: string
  role?: ParticipantSubmissionTeamRole
  revision?: number
  expectedRevision?: number
}

export type ParticipantSubmissionTeamUpdateRequest = {
  teamId?: number | null
  role: ParticipantSubmissionTeamRole
  expectedRevision: number
  reason: string
}

export type ProgramSubmissionTeamItem = {
  teamId?: number
  id?: number
  teamName?: string
  name?: string
  revision?: number
}

/** GET /api/admin/programs/{programId}/participants/{participantId}/submission-team */
export async function fetchParticipantSubmissionTeamRemote(
  programId: string,
  participantId: string
): Promise<ParticipantSubmissionTeamResponse> {
  return unwrapApiBody<ParticipantSubmissionTeamResponse>(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/participants/${encodeURIComponent(participantId)}/submission-team`,
      method: 'GET',
    })
  )
}

/** PUT /api/admin/programs/{programId}/participants/{participantId}/submission-team */
export async function putParticipantSubmissionTeamRemote(
  programId: string,
  participantId: string,
  payload: ParticipantSubmissionTeamUpdateRequest
): Promise<ParticipantSubmissionTeamResponse> {
  return unwrapApiBody<ParticipantSubmissionTeamResponse>(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/participants/${encodeURIComponent(participantId)}/submission-team`,
      method: 'PUT',
      data: payload,
    })
  )
}

/** GET /api/admin/programs/{programId}/submission-teams */
export async function fetchProgramSubmissionTeamsRemote(
  programId: string
): Promise<ProgramSubmissionTeamItem[]> {
  const body = await unwrapApiBody<
    ProgramSubmissionTeamItem[] | { items?: ProgramSubmissionTeamItem[] }
  >(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/submission-teams`,
      method: 'GET',
    })
  )
  if (Array.isArray(body)) return body
  return body.items ?? []
}

export type GeneralAssignmentSubmissionFileDto = {
  fileObjectId?: number
  fileName?: string | null
  originalFileName?: string | null
  downloadable?: boolean
}

export type GeneralAssignmentSubmissionLinkDto = {
  url?: string | null
  displayName?: string | null
}

export type GeneralAssignmentSubmissionParticipantDto = {
  participantId?: number
  memberId?: number
  memberName?: string | null
  gender?: string | null
  birthDate?: string | null
  affiliation?: string | null
  organizationName?: string | null
  grade?: string | null
  submissionStatus?: string | null
  remarkKind?: string | null
  remarkAt?: string | null
  files?: GeneralAssignmentSubmissionFileDto[] | null
  links?: GeneralAssignmentSubmissionLinkDto[] | null
  surveyResponse?: { templateVersionId?: number; formResponseId?: number } | null
  satisfactionResponse?: { templateVersionId?: number; formResponseId?: number } | null
  giveUpAt?: string | null
  participantStatus?: string | null
}

export type GeneralAssignmentSubmissionScheduleDto = {
  scheduleId?: number
  sessionNo?: number | null
  scheduleName?: string | null
  startAt?: string | null
  endAt?: string | null
  assignmentEnabled?: boolean
  assignmentPeriodStart?: string | null
  assignmentPeriodEnd?: string | null
  participants?: GeneralAssignmentSubmissionParticipantDto[] | null
}

export type GeneralAssignmentSubmissionListResponse = {
  items?: GeneralAssignmentSubmissionScheduleDto[] | null
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
}

const GENERAL_ASSIGNMENT_SUBMISSIONS_PAGE_SIZE = 20
const GENERAL_ASSIGNMENT_SUBMISSIONS_MAX_PAGES = 50

function readAssignmentSubmissionScheduleItems(
  body: unknown
): GeneralAssignmentSubmissionScheduleDto[] {
  if (Array.isArray(body)) return body
  if (body == null || typeof body !== 'object') return []
  const record = body as Record<string, unknown>
  const raw = record.items ?? record.content ?? record.schedules
  return Array.isArray(raw) ? (raw as GeneralAssignmentSubmissionScheduleDto[]) : []
}

async function fetchProgramAssignmentSubmissionsPage(
  programId: string,
  params?: {
    scheduleId?: string
    memberName?: string
    affiliation?: string
    grade?: string
    submissionStatus?: 'NOT_SUBMITTED' | 'SUBMITTED'
    page?: number
    size?: number
  }
): Promise<GeneralAssignmentSubmissionListResponse> {
  const query = {
    page: params?.page ?? 0,
    size: params?.size ?? GENERAL_ASSIGNMENT_SUBMISSIONS_PAGE_SIZE,
    ...params,
  }
  const body = await unwrapApiBody<unknown>(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/assignment-submissions`,
      method: 'GET',
      params: query,
    })
  )
  if (Array.isArray(body)) return { items: body }
  if (body == null || typeof body !== 'object') return { items: [] }
  const record = body as GeneralAssignmentSubmissionListResponse
  return {
    ...record,
    items: readAssignmentSubmissionScheduleItems(body),
  }
}

/** GET /api/admin/programs/{programId}/assignment-submissions — 일반 개인 LNB 과제 관리 */
export async function fetchProgramAssignmentSubmissionsRemote(
  programId: string,
  params?: {
    scheduleId?: string
    memberName?: string
    affiliation?: string
    grade?: string
    submissionStatus?: 'NOT_SUBMITTED' | 'SUBMITTED'
    page?: number
    size?: number
  }
): Promise<GeneralAssignmentSubmissionListResponse> {
  const first = await fetchProgramAssignmentSubmissionsPage(programId, params)
  const pageSize = params?.size ?? first.size ?? GENERAL_ASSIGNMENT_SUBMISSIONS_PAGE_SIZE
  const items = [...(first.items ?? [])]
  const totalPages =
    first.totalPages ??
    (first.totalElements != null ? Math.ceil(first.totalElements / pageSize) : 1)
  const shouldPage =
    params?.page == null &&
    (totalPages > 1 || (first.totalElements != null && first.totalElements > items.length))
  if (!shouldPage) return { ...first, items }

  for (let page = 1; page < totalPages && page < GENERAL_ASSIGNMENT_SUBMISSIONS_MAX_PAGES; page += 1) {
    const next = await fetchProgramAssignmentSubmissionsPage(programId, {
      ...params,
      page,
      size: pageSize,
    })
    items.push(...(next.items ?? []))
  }
  return { ...first, items }
}

/** POST /api/admin/programs/{programId}/submission-teams */
export async function createProgramSubmissionTeamRemote(
  programId: string,
  payload: { teamName: string }
): Promise<ProgramSubmissionTeamItem> {
  return unwrapApiBody<ProgramSubmissionTeamItem>(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/submission-teams`,
      method: 'POST',
      data: payload,
    })
  )
}

export type { VolunteerParticipantRegisterRequest } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantRegisterRequest'
export type { VolunteerParticipantRegisterResponse } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantRegisterResponse'
export type { ProgramParticipantRegisterCandidateResponse } from '@/shared/api/generated/program-progress/schemas/programParticipantRegisterCandidateResponse'

/** @deprecated Use `PageResponseProgramParticipantRegisterCandidateResponse` from generated program-progress schemas */
export type ProgramParticipantRegisterCandidatesPage =
  PageResponseProgramParticipantRegisterCandidateResponse

/**
 * POST /api/admin/programs/{programId}/volunteer-participants/register
 * CMS 참여 봉사자 추가 등록 — 신청서·동의·participant 일괄 생성
 */
export async function registerVolunteerParticipantRemote(
  programId: string,
  payload: VolunteerParticipantRegisterRequest
): Promise<VolunteerParticipantRegisterResponse> {
  return unwrapApiBody<VolunteerParticipantRegisterResponse>(
    await programProgressApi.registerVolunteerParticipant(programId, payload)
  )
}

/** GET /api/admin/programs/{programId}/participant-register-candidates */
export async function fetchProgramParticipantRegisterCandidatesRemote(
  programId: string,
  params: {
    participantType: 'VOLUNTEER'
    volunteerKind: VolunteerKind
    keyword?: string
    page?: number
    size?: number
  }
): Promise<PageResponseProgramParticipantRegisterCandidateResponse> {
  return unwrapApiBody<PageResponseProgramParticipantRegisterCandidateResponse>(
    await programProgressApi.participantRegisterCandidates(programId, params)
  )
}

/** GET /api/admin/programs/{programId}/employee-volunteer-counts */
export async function fetchEmployeeVolunteerCountsRemote(
  programId: string,
  organizationApplicationId?: number
): Promise<EmployeeVolunteerCountSetResponse> {
  return unwrapApiBody(
    await programProgressApi.getEmployeeVolunteerCounts(
      toNumericProgramId(programId),
      organizationApplicationId != null ? { organizationApplicationId } : undefined
    )
  )
}

/** PUT /api/admin/programs/{programId}/employee-volunteer-counts */
export async function putEmployeeVolunteerCountsRemote(
  programId: string,
  payload: EmployeeVolunteerCountReplaceRequest
): Promise<EmployeeVolunteerCountSetResponse> {
  return unwrapApiBody(
    await programProgressApi.replaceEmployeeVolunteerCounts(
      toNumericProgramId(programId),
      payload
    )
  )
}
