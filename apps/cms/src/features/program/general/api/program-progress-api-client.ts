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
import type { FeePolicy } from '@/shared/api/generated/dashboard/schemas/feePolicy'
import {
  filterProgramProgressParticipantItems,
  type ProgramProgressParticipantListItem,
} from '@/features/program/general/lib/program-progress-list-visibility'
import type { ChangeRequest } from '@/shared/api/generated/dashboard/schemas/changeRequest'
import type { ChangeResponse } from '@/shared/api/generated/dashboard/schemas/changeResponse'
import type { AttendanceItemResponse } from '@/shared/api/generated/dashboard/schemas/attendanceItemResponse'
import type { VolunteerAssignmentResponse } from '@/shared/api/generated/dashboard/schemas/volunteerAssignmentResponse'
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

/** 참여 강사 강사비 정본 위치 — 신청서(INSTRUCTOR_APPLICATION) 또는 직접 추가 참여 강사(PARTICIPANT) */
export type ParticipantInstructorFeePolicySource = 'INSTRUCTOR_APPLICATION' | 'PARTICIPANT'

/**
 * GET·PATCH …/participants/{participantId}/instructor-fee-policy 응답 (BE 회신 A4, 코드 생성 범위 밖이라 수기 정의)
 * - feePolicy null = 미등록
 * - updatedAssignmentCount: 이번 저장으로 다시 반영된 정산 전 배정(회차) 수. GET은 0
 */
export type ParticipantInstructorFeePolicyResponse = {
  programId?: number
  participantId?: number
  instructorApplicationId?: number | null
  feePolicySource?: ParticipantInstructorFeePolicySource | null
  feePolicy?: FeePolicy | null
  updatedAssignmentCount?: number
  updatedAt?: string | null
}

/** PATCH 요청 — 강사 승인 `Approval.feePolicy`와 같은 형태 */
export type ParticipantInstructorFeePolicyUpdateRequest = {
  feePolicy: FeePolicy
}

function participantInstructorFeePolicyUrl(programId: string, participantId: string): string {
  return `/api/admin/programs/${encodeURIComponent(programId)}/participants/${encodeURIComponent(participantId)}/instructor-fee-policy`
}

/** GET /api/admin/programs/{programId}/participants/{participantId}/instructor-fee-policy */
export async function fetchParticipantInstructorFeePolicyRemote(
  programId: string,
  participantId: string
): Promise<ParticipantInstructorFeePolicyResponse> {
  return unwrapApiBody<ParticipantInstructorFeePolicyResponse>(
    await customInstance({
      url: participantInstructorFeePolicyUrl(programId, participantId),
      method: 'GET',
    })
  )
}

/**
 * PATCH /api/admin/programs/{programId}/participants/{participantId}/instructor-fee-policy
 * 신청 유무와 관계없이 참여 강사 강사비 저장은 이 API로 통일한다(신청 있는 강사는 신청서 값이 같이 바뀜).
 * 409 INSTRUCTOR_FEE_POLICY_SETTLEMENT_EXISTS · 422 INVALID_FEE_POLICY · 422 PARTICIPANT_TYPE_UNSUPPORTED
 */
export async function patchParticipantInstructorFeePolicyRemote(
  programId: string,
  participantId: string,
  payload: ParticipantInstructorFeePolicyUpdateRequest
): Promise<ParticipantInstructorFeePolicyResponse> {
  return unwrapApiBody<ParticipantInstructorFeePolicyResponse>(
    await customInstance({
      url: participantInstructorFeePolicyUrl(programId, participantId),
      method: 'PATCH',
      data: payload,
    })
  )
}

/** 배정 알림 시점 — `SCHEDULED`는 현재보다 1분 이상 뒤 (400 INVALID_NOTIFICATION_SCHEDULE) */
export type VolunteerAssignmentNotificationTiming = {
  timing: 'IMMEDIATE' | 'SCHEDULED'
  scheduledAt?: string | null
}

export type VolunteerAssignedOrganizationsRequest = {
  organizationApplicationIds: number[]
  expectedRevision?: number
  /** 필수 2~500자 */
  reason?: string
  /**
   * 빠지는 기관의 배정 알림이 이미 발송(SENT)됐을 때 취소 알림 시점. 생략 시 즉시.
   * 발송 전이면 BE가 예약 알림만 중단하고 이 값은 무시한다.
   */
  notification?: VolunteerAssignmentNotificationTiming
}

/** 배정 알림 상태 — NONE 없음 / SCHEDULED 예약 대기 / SENT 발송됨 / CANCELLED 발송 전 예약 중단 */
export type VolunteerAssignmentNotificationStatus = 'NONE' | 'SCHEDULED' | 'SENT' | 'CANCELLED'

/**
 * GET/POST/DELETE …/volunteer-assignments 의 VolunteerAssignmentResponse(생성 타입).
 * 알림 3필드(assignmentNotificationStatus / SentAt / ScheduledAt)는 옵셔널 — 구버전 응답에는 없다.
 */
export type VolunteerAssignmentRemoteRow = VolunteerAssignmentResponse

/**
 * GET /api/admin/programs/{programId}/volunteer-assignments
 * 기관형 봉사자 배정 목록(회차 행). 알림 상태는 「봉사자 + 기관」 단위로 같은 기관 행이 공유한다.
 */
export async function fetchVolunteerAssignmentsRemote(
  programId: string,
  params: { volunteerParticipantId: string },
  signal?: AbortSignal
): Promise<VolunteerAssignmentRemoteRow[]> {
  const body = unwrapApiBody<VolunteerAssignmentRemoteRow[] | null>(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/volunteer-assignments`,
      method: 'GET',
      params: { volunteerParticipantId: params.volunteerParticipantId },
      signal,
    })
  )
  return Array.isArray(body) ? body : []
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
 * GENERAL_INDIVIDUAL 봉사자·강사는 configured/scheduleIds와 무관하게
 * 프로그램 ACTIVE/COMPLETED 일정이 들어올 수 있다 (배정 대기 행의 distanceKm용).
 */
export type ParticipantEducationScopeScheduleEnrich = {
  scheduleId: number
  /** 일정 장소 표시. distanceKm와 별개 */
  locationName?: string | null
  /** 일정 주소 표시. distanceKm와 별개 */
  address?: string | null
  /**
   * 자택 ↔ 일정 장소 편도 km. NAVER Maps 실측, 소수 1자리.
   * 자택 우선순위(서버): 봉사자 가입 프로필 → 개인 프로필 / 강사 강사 프로필 → 가입 프로필 → 개인 프로필.
   * null: LOCAL_DISTANCE, 자택·일정 주소 없음, 지오코딩·경로 실패,
   * 자택과 장소가 같아 서버가 0km 이하로 버린 경우. FE는 재계산하지 않는다.
   */
  distanceKm?: number | null
  /** 장거리 표기 전용(단가 아님). 없으면 FE는 접미어를 붙이지 않는다. */
  longDistance?: boolean | null
  /** 동일 scheduleId VOLUNTEER education-scope 인원. 항상 number, 0 포함 (omit 금지) */
  assignedVolunteerCount: number
  /**
   * 배정 대기 상태. GENERAL_INDIVIDUAL 강사 참여자만 채워지고 그 외(봉사자·기관형·구버전 BE)는 null/없음.
   * UNAVAILABLE = 배정 불가(사유는 unavailableReason).
   */
  availabilityStatus?: 'AVAILABLE' | 'UNAVAILABLE' | null
  /** UNAVAILABLE 사유 코드. 현재 `INSTRUCTOR_ASSIGNMENT_SAME_DAY_CONFLICT`(같은 날짜 다른 일정 배정)만 */
  unavailableReason?: string | null
}

export type ParticipantEducationScopeResponse = {
  programId?: number
  participantId?: number
  revision?: number
  configured?: boolean
  scheduleIds?: number[]
  /** additive. [] 가능, null 아님. 없으면 FE는 []로 취급 */
  schedules?: ParticipantEducationScopeScheduleEnrich[]
  /** additive. 기관형 강사 참여자만 채워짐(배정 대기 대상 기관 전체), 그 외 []. 없으면 FE는 []로 취급 */
  organizations?: ParticipantEducationScopeOrganizationEnrich[]
}

/**
 * education-scope 기관 거리 — CmsParticipantEducationScopeOrganizationEnrich.
 * 매칭은 organizationApplicationId 우선, 행에 없을 때만 organizationId(null끼리는 매칭하지 않음).
 */
export type ParticipantEducationScopeOrganizationEnrich = {
  organizationId?: number | null
  organizationApplicationId: number
  organizationName?: string | null
  /** 강사 자택 ↔ 기관 편도 km, 소수 1자리. 산출 불가면 null(0으로 채우지 않음) */
  distanceKm?: number | null
  /** 장거리 표기 전용(단가 아님). distanceKm가 null이면 null */
  longDistance?: boolean | null
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
  /**
   * 과제 응답(form_response) id — 피드백 작성·조회 키(POST/GET /api/admin/form-responses/{id}/feedback).
   * 생성 타입 `GeneralIndividualAssignmentParticipant.formResponseId`와 같다(행 루트, 미제출이면 null).
   * 구버전 응답(키 없음)은 회원 과제 API처럼 `submissionId`로 올 수도 있어 함께 읽는다.
   */
  formResponseId?: number | null
  submissionId?: number | null
  /**
   * 삭제되지 않은 피드백이 있으면 true, 미제출이면 false
   * (생성 타입 `GeneralIndividualAssignmentParticipant.hasFeedback`). 구버전 응답엔 없다.
   */
  hasFeedback?: boolean | null
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
