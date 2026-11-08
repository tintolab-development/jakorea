/**
 * UJAT education-progress execution APIs (allocation-matrix / partner / attendance).
 * OpenAPI는 rich schema로 채워졌으나 dashboard orval subset 미포함 → 수동 타입 유지
 * (backend.openapi.json AllocationMatrixResponse 등과 동기).
 */

import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import {
  fetchAttendancesByScheduleIdsRemote,
  fetchProgramAttendancesBulkRemote,
} from '@/features/program/general/api/program-progress-api-client'
import customInstance from '@/shared/api/orval-mutator'
import type { UjatCapacityWarning } from './temporary-schedule-api'

function executionUjatPath(programId: string, suffix: string): string {
  return `/api/admin/program-execution/programs/${encodeURIComponent(programId)}/ujat${suffix}`
}

function executionProgramPath(programId: string, suffix: string): string {
  return `/api/admin/program-execution/programs/${encodeURIComponent(programId)}${suffix}`
}

export type UjatAllocationCellDto = {
  columnKey?: string | null
  scheduleId?: number | null
  organizationApplicationId?: number | null
  educationSlotId?: number | null
  assignmentGroupId?: string | null
  classLabel?: string | null
  attendanceManager?: boolean | null
  singleAssignment?: boolean | null
  unavailable?: boolean | null
  needsReassignment?: boolean | null
  /** BE 항상 대문자 3값. 라벨만 있고 상태 없는 셀 없음 */
  assignmentStatus?: 'ASSIGNED' | 'UNASSIGNED' | 'REASSIGNMENT_REQUIRED' | string | null
  /**
   * 참여 불가 대체 봉사자. unavailable=false이면 null.
   * 있으면 unavailability GET 없이 표시
   */
  replacementParticipantId?: number | null
  replacementVolunteerName?: string | null
}

export type UjatAllocationEducationSlotDto = {
  educationSlotId?: number | null
  classLabel?: string | null
  grade?: string | null
  className?: string | null
}

export type UjatAllocationColumnDto = {
  columnKey?: string | null
  scheduleId?: number | null
  educationStartAt?: string | null
  organizationApplicationId?: number | null
  organizationName?: string | null
  organizationRegion?: string | null
  educationRegionCode?: string | null
  classCount?: number | null
  /** 열의 확정 학급 슬롯. 배열(빈 배열 포함)이면 org-schedule-assignments를 호출하지 않는다 */
  educationSlots?: UjatAllocationEducationSlotDto[] | null
}

export type UjatAllocationVolunteerRowDto = {
  participantId?: number | null
  memberId?: number | null
  volunteerName?: string | null
  contact?: string | null
  email?: string | null
  educationRegionCode?: string | null
  participantStatus?: string | null
  giveUp?: boolean | null
  totalAssignedDays?: number | null
  cells?: UjatAllocationCellDto[] | null
}

export type UjatSemesterType = 'FIRST_HALF' | 'SECOND_HALF'

export type UjatAllocationMatrixResponse = {
  programId?: number | null
  educationRegionCode?: string | null
  /** 요청 반기 필터 echo. 미지정 조회 시 null */
  semesterType?: UjatSemesterType | null
  columns?: UjatAllocationColumnDto[] | null
  volunteers?: UjatAllocationVolunteerRowDto[] | null
}

export type UjatAutoAssignmentRequest = {
  educationRegionCode?: string | null
  semesterType?: UjatSemesterType | null
}

export type UjatAutoAssignmentSlotResult = {
  educationSlotId?: number | null
  scheduleId?: number | null
  organizationApplicationId?: number | null
  classLabel?: string | null
  educationRegionCode?: string | null
  result?: string | null
  assignmentGroupId?: string | null
  primaryParticipantId?: number | null
  secondaryParticipantId?: number | null
  attendanceManagerParticipantId?: number | null
  reason?: string | null
  /** PAIR_SPLIT 대상 학급의 원본 학급 educationSlotId. 그 외는 null */
  sourceEducationSlotId?: number | null
}

/** results[].result — ASSIGNED_PAIR | ASSIGNED_SINGLE | UNASSIGNED | SECONDARY_ADDED | SECONDARY_UNAVAILABLE */
export type UjatAutoAssignmentResult =
  | 'ASSIGNED_PAIR'
  | 'ASSIGNED_SINGLE'
  | 'UNASSIGNED'
  | 'SECONDARY_ADDED'
  | 'SECONDARY_UNAVAILABLE'

/** capacityWarnings[].capacityType — VOLUNTEER_SHORTAGE: maxCount=필요 인원, currentCount=배정 인원 */
export const UJAT_CAPACITY_WARNING_VOLUNTEER_SHORTAGE = 'VOLUNTEER_SHORTAGE'

export type UjatAutoAssignmentResponse = {
  programId?: number | null
  educationRegionCode?: string | null
  /** 빈 슬롯 수 + 보강 대상 1인 슬롯 수 */
  targetSlotCount?: number | null
  pairAssignedCount?: number | null
  singleAssignedCount?: number | null
  unassignedCount?: number | null
  /** 기존 1인 슬롯에 두 번째 봉사자를 추가한 수 (SECONDARY_ADDED) */
  secondaryAddedCount?: number | null
  /** 기존 1인 슬롯을 보강하지 못한 수 (SECONDARY_UNAVAILABLE) */
  secondaryUnfilledCount?: number | null
  results?: UjatAutoAssignmentSlotResult[] | null
  capacityWarnings?: UjatCapacityWarning[] | null
}

export type UjatDirectAssignmentRequest = {
  participantId: number
}

export type UjatDirectAssignmentCandidate = {
  participantId?: number | null
  memberId?: number | null
  volunteerName?: string | null
  totalAssignedDays?: number | null
  alreadyAssignedOnEducationDate?: boolean | null
  sourceAssignmentGroupId?: string | null
  sourceEducationSlotId?: number | null
  sourceClassLabel?: string | null
  sourcePartnerParticipantId?: number | null
}

export type UjatDirectAssignmentCandidatesResponse = {
  programId?: number | null
  educationSlotId?: number | null
  scheduleId?: number | null
  educationRegionCode?: string | null
  reallocationRequired?: boolean | null
  candidates?: UjatDirectAssignmentCandidate[] | null
  /** 일부 래퍼·별칭. fetch 정규화 후 candidates로 합친다 */
  items?: UjatDirectAssignmentCandidate[] | null
  /** 1인 슬롯만 PRIMARY id. 빈 슬롯·2인 슬롯은 null */
  existingPrimaryParticipantId?: number | null
  /** 슬롯 활성 배정 인원. 0 빈 / 1 SECONDARY 추가 / 2 가득. omit·null 금지 */
  assignedVolunteerCount: number
}

export type UjatDirectAssignmentSlotOccupancy = 'empty' | 'primary' | 'full' | 'unknown'

export function readUjatDirectAssignmentOccupancy(
  response: Pick<UjatDirectAssignmentCandidatesResponse, 'assignedVolunteerCount'> | null | undefined
): UjatDirectAssignmentSlotOccupancy {
  const count = response?.assignedVolunteerCount
  if (typeof count !== 'number' || !Number.isFinite(count)) return 'unknown'
  if (count >= 2) return 'full'
  if (count === 1) return 'primary'
  if (count === 0) return 'empty'
  return 'unknown'
}

function readNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) return Number(value.trim())
  return null
}

function readOptionalString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function normalizeDirectAssignmentCandidate(raw: unknown): UjatDirectAssignmentCandidate {
  if (raw == null || typeof raw !== 'object') return {}
  const o = raw as Record<string, unknown>
  return {
    participantId: readNullableNumber(o.participantId ?? o.participant_id),
    memberId: readNullableNumber(o.memberId ?? o.member_id),
    volunteerName:
      readOptionalString(o.volunteerName) ??
      readOptionalString(o.volunteer_name) ??
      readOptionalString(o.memberName),
    totalAssignedDays: readNullableNumber(o.totalAssignedDays ?? o.total_assigned_days),
    alreadyAssignedOnEducationDate:
      typeof (o.alreadyAssignedOnEducationDate ?? o.already_assigned_on_education_date) ===
      'boolean'
        ? Boolean(o.alreadyAssignedOnEducationDate ?? o.already_assigned_on_education_date)
        : null,
    sourceAssignmentGroupId:
      readOptionalString(o.sourceAssignmentGroupId) ??
      readOptionalString(o.source_assignment_group_id),
    sourceEducationSlotId: readNullableNumber(
      o.sourceEducationSlotId ?? o.source_education_slot_id
    ),
    sourceClassLabel:
      readOptionalString(o.sourceClassLabel) ?? readOptionalString(o.source_class_label),
    sourcePartnerParticipantId: readNullableNumber(
      o.sourcePartnerParticipantId ?? o.source_partner_participant_id
    ),
  }
}

/** GET direct-assignment-candidates 래퍼·별칭·배열 본문을 canonical DTO로 맞춘다 */
export function normalizeUjatDirectAssignmentCandidatesResponse(
  payload: unknown
): UjatDirectAssignmentCandidatesResponse {
  const body = unwrapApiBody<unknown>(payload)
  if (Array.isArray(body)) {
    return {
      candidates: body.map(normalizeDirectAssignmentCandidate),
      assignedVolunteerCount: Number.NaN,
    }
  }
  if (body == null || typeof body !== 'object') {
    return { candidates: [], assignedVolunteerCount: Number.NaN }
  }
  const o = body as Record<string, unknown>
  if (!('candidates' in o) && !('items' in o) && 'data' in o) {
    return normalizeUjatDirectAssignmentCandidatesResponse(o.data)
  }
  const rawList = Array.isArray(o.candidates)
    ? o.candidates
    : Array.isArray(o.items)
      ? o.items
      : []
  return {
    programId: readNullableNumber(o.programId ?? o.program_id),
    educationSlotId: readNullableNumber(o.educationSlotId ?? o.education_slot_id),
    scheduleId: readNullableNumber(o.scheduleId ?? o.schedule_id),
    educationRegionCode:
      readOptionalString(o.educationRegionCode) ?? readOptionalString(o.education_region_code),
    reallocationRequired:
      typeof (o.reallocationRequired ?? o.reallocation_required) === 'boolean'
        ? Boolean(o.reallocationRequired ?? o.reallocation_required)
        : null,
    candidates: rawList.map(normalizeDirectAssignmentCandidate),
    existingPrimaryParticipantId: readNullableNumber(
      o.existingPrimaryParticipantId ?? o.existing_primary_participant_id
    ),
    assignedVolunteerCount:
      readNullableNumber(o.assignedVolunteerCount ?? o.assigned_volunteer_count) ?? Number.NaN,
  }
}

export type UjatDirectAssignmentResponse = {
  programId?: number | null
  educationSlotId?: number | null
  movedParticipantId?: number | null
  movedFromExistingPair?: boolean | null
  /** 1인 슬롯 기존 조에 두 번째 봉사자로 추가되면 true */
  addedAsSecondary?: boolean | null
}

export type UjatAttendanceManagerUpdateRequest = {
  /**
   * 배정 매트릭스 열 SSOT. AllocationColumn.organizationApplicationId.
   * omit / undefined / null / 0 금지.
   */
  organizationApplicationId: number
  /**
   * 출결 담당 participantId.
   * - number: 해당 열 지정
   * - null: 해당 열(scheduleId+organizationApplicationId)만 해제 (키를 빼고 undefined로 보내지 말 것)
   */
  participantId: number | null
}

export type UjatVolunteerUnavailabilityRequest = {
  participantId: number
  replacementParticipantId?: number | null
  reason?: string | null
}

export type UjatVolunteerUnavailabilityResponse = {
  id?: number | null
  programId?: number | null
  scheduleId?: number | null
  participantId?: number | null
  replacementParticipantId?: number | null
  reason?: string | null
  replacementApplied?: boolean | null
}

export type UjatPartnerAssignmentConfirmRequest = {
  primaryParticipantId: number
  secondaryParticipantId?: number | null
  attendanceManagerParticipantId?: number | null
  educationSlotId?: number | null
  organizationApplicationId?: number | null
  classLabel?: string | null
}

export type UjatPartnerAssignmentResponse = {
  assignmentGroupId?: string | null
  programId?: number | null
  scheduleId?: number | null
  organizationApplicationId?: number | null
  educationSlotId?: number | null
  classLabel?: string | null
  primaryParticipantId?: number | null
  secondaryParticipantId?: number | null
  attendanceManagerParticipantId?: number | null
  status?: string | null
  assignedAt?: string | null
  cancelledAt?: string | null
  cancelReason?: string | null
  /**
   * 배정 알림 발송 여부. 서버는 항상 true|false.
   * false → 간단 취소 `{}`. true → 사유+알림.
   */
  assignmentNotificationSent?: boolean
}

/** AssignmentCancelRequest — 배정 알림 발송 전에는 reason 생략 가능 */
export type UjatAssignmentCancelRequest = {
  reason?: string | null
  /** IMMEDIATE | SCHEDULED. 배정 알림 발송 후에만 사용 */
  timing?: 'IMMEDIATE' | 'SCHEDULED' | null
  /** timing=SCHEDULED 일 때 예약 시각. IMMEDIATE면 null/omit */
  scheduledAt?: string | null
}

export type UjatAttendanceItemDto = {
  attendanceId?: number | null
  programId?: number | null
  scheduleId?: number | null
  participantId?: number | null
  status?: string | null
  absenceReason?: string | null
  checkedByAdminId?: number | null
  checkedAt?: string | null
  arrivalTime?: string | null
  internalLate?: boolean | null
  volunteer1365Minutes?: number | null
  volunteer1365DurationLabel?: string | null
}

export type UjatAttendanceItemRequest = {
  participantId: number
  status: string
  absenceReason?: string | null
  arrivalTime?: string | null
  /** 증빙 fileObjectId. 없으면 omit — absence-reasons에 파일 없음이 정상 */
  fileObjectIds?: number[]
}

export type UjatAttendanceBulkUpsertRequest = {
  scheduleId: number
  attendances: UjatAttendanceItemRequest[]
}

export async function fetchUjatAllocationMatrix(
  programId: string,
  params?: {
    educationRegionCode?: string
    scheduleIds?: number[]
    /** 상·하반기 컬럼 필터. 미지정 시 전체 (호환) */
    semesterType?: UjatSemesterType
    /** semesterType alias — 둘 다내면 동일 값이어야 함 */
    recruitHalf?: UjatSemesterType
  }
): Promise<UjatAllocationMatrixResponse> {
  return unwrapApiBody(
    await customInstance({
      url: executionUjatPath(programId, '/allocation-matrix'),
      method: 'GET',
      params: {
        educationRegionCode: params?.educationRegionCode,
        scheduleIds: params?.scheduleIds,
        semesterType: params?.semesterType,
        recruitHalf: params?.recruitHalf,
      },
    })
  )
}

export type UjatAssignmentDocumentStatus =
  | 'NOT_SUBMITTED'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'DEADLINE_MISSED'
  | 'FEEDBACK_REQUESTED'
  | 'REVISED'

export type UjatAssignmentDocumentDto = {
  status?: UjatAssignmentDocumentStatus | string | null
  submittedAt?: string | null
  feedbackDeliveredAt?: string | null
  formResponseId?: number | null
}

export type UjatAssignmentVolunteerDto = {
  participantId?: number | null
  memberId?: number | null
  volunteerName?: string | null
  institutionName?: string | null
  assignedClass?: string | null
  activityAbandoned?: boolean | null
  hasProgressOnDate?: boolean | null
  plan?: UjatAssignmentDocumentDto | null
  log?: UjatAssignmentDocumentDto | null
}

export type UjatAssignmentDatePeriodDto = {
  from?: string | null
  to?: string | null
}

export type UjatAssignmentSessionDto = {
  scheduleId?: number | null
  educationDate?: string | null
  planSubmissionPeriod?: UjatAssignmentDatePeriodDto | null
  logSubmissionPeriod?: UjatAssignmentDatePeriodDto | null
  volunteers?: UjatAssignmentVolunteerDto[] | null
}

export type UjatAssignmentSubmissionsResponse = {
  sessions?: UjatAssignmentSessionDto[] | null
}

export async function postUjatPartnerAssignmentsAuto(
  programId: string,
  body: UjatAutoAssignmentRequest
): Promise<UjatAutoAssignmentResponse> {
  return unwrapApiBody(
    await customInstance({
      url: executionUjatPath(programId, '/partner-assignments:auto'),
      method: 'POST',
      data: body,
    })
  )
}

export async function fetchUjatDirectAssignmentCandidates(
  programId: string,
  educationSlotId: string | number
): Promise<UjatDirectAssignmentCandidatesResponse> {
  return normalizeUjatDirectAssignmentCandidatesResponse(
    await customInstance(
      {
        url: executionUjatPath(
          programId,
          `/education-slots/${encodeURIComponent(String(educationSlotId))}/direct-assignment-candidates`
        ),
        method: 'GET',
      },
      { skipGlobalErrorAlert: true }
    )
  )
}

export async function postUjatDirectAssignment(
  programId: string,
  educationSlotId: string | number,
  body: UjatDirectAssignmentRequest
): Promise<UjatDirectAssignmentResponse> {
  return unwrapApiBody(
    await customInstance({
      url: executionUjatPath(
        programId,
        `/education-slots/${encodeURIComponent(String(educationSlotId))}/direct-assignment`
      ),
      method: 'POST',
      data: body,
    })
  )
}

export async function putUjatAttendanceManager(
  programId: string,
  scheduleId: string | number,
  body: UjatAttendanceManagerUpdateRequest
): Promise<void> {
  const organizationApplicationId = body.organizationApplicationId
  if (!Number.isFinite(organizationApplicationId) || organizationApplicationId <= 0) {
    throw new Error('출결 담당자를 저장할 교육 일정이 없습니다. 배정표를 새로고침해 주세요.')
  }
  // participantId: null 은 JSON null로 유지. undefined/omit/0 치환 금지.
  const participantId = body.participantId
  if (participantId === undefined) {
    throw new Error('출결 담당자를 저장할 교육 일정이 없습니다. 배정표를 새로고침해 주세요.')
  }
  if (participantId !== null && (!Number.isFinite(participantId) || participantId <= 0)) {
    throw new Error('출결 담당자를 저장할 교육 일정이 없습니다. 배정표를 새로고침해 주세요.')
  }
  const payload = await customInstance({
    url: executionUjatPath(
      programId,
      `/schedules/${encodeURIComponent(String(scheduleId))}/attendance-manager`
    ),
    method: 'PUT',
    data: { organizationApplicationId, participantId },
  })
  if (payload != null && typeof payload === 'object') {
    const envelope = payload as { success?: boolean; message?: string; error?: { message?: string } }
    if (envelope.success === false) {
      const message =
        envelope.error?.message?.trim() ||
        envelope.message?.trim() ||
        '출결 담당자 저장에 실패했습니다.'
      const error = new Error(message) as Error & {
        response: { status: number; data: unknown }
      }
      error.response = { status: 400, data: payload }
      throw error
    }
  }
}

export async function fetchUjatScheduleUnavailability(
  programId: string,
  scheduleId: string | number
): Promise<UjatVolunteerUnavailabilityResponse[]> {
  const body = await unwrapApiBody<
    UjatVolunteerUnavailabilityResponse[] | { items?: UjatVolunteerUnavailabilityResponse[] }
  >(
    await customInstance({
      url: executionUjatPath(
        programId,
        `/schedules/${encodeURIComponent(String(scheduleId))}/unavailability`
      ),
      method: 'GET',
    })
  )
  if (Array.isArray(body)) return body
  return body.items ?? []
}

export async function postUjatScheduleUnavailability(
  programId: string,
  scheduleId: string | number,
  body: UjatVolunteerUnavailabilityRequest
): Promise<UjatVolunteerUnavailabilityResponse> {
  return unwrapApiBody(
    await customInstance({
      url: executionUjatPath(
        programId,
        `/schedules/${encodeURIComponent(String(scheduleId))}/unavailability`
      ),
      method: 'POST',
      data: body,
    })
  )
}

export async function deleteUjatScheduleUnavailability(
  programId: string,
  scheduleId: string | number,
  participantId: string | number
): Promise<void> {
  await customInstance({
    url: executionUjatPath(
      programId,
      `/schedules/${encodeURIComponent(String(scheduleId))}/unavailability/${encodeURIComponent(String(participantId))}`
    ),
    method: 'DELETE',
  })
}

export type UjatPartnerRecommendationCandidate = {
  participantId?: number | null
  memberId?: number | null
  volunteerName?: string | null
  /** volunteerName 별칭 */
  memberName?: string | null
  totalAssignedDays?: number | null
  assignmentDayCount?: number | null
  /** assignmentDayCount 별칭 */
  assignedScheduleCount?: number | null
  hasPartnerHistoryWithVolunteer?: boolean | null
}

export type UjatPartnerRecommendationResponse = {
  programId?: number | null
  scheduleId?: number | null
  organizationApplicationId?: number | null
  candidates?: UjatPartnerRecommendationCandidate[] | null
  items?: UjatPartnerRecommendationCandidate[] | null
}

/**
 * GET /api/admin/program-execution/programs/{programId}/schedules/{scheduleId}/ujat/partner-recommendation
 * organizationApplicationId 는 선택 쿼리.
 */
export async function fetchUjatPartnerRecommendation(
  programId: string,
  scheduleId: string | number,
  organizationApplicationId?: number
): Promise<UjatPartnerRecommendationCandidate[]> {
  const body = await unwrapApiBody<
    | UjatPartnerRecommendationCandidate[]
    | UjatPartnerRecommendationResponse
  >(
    await customInstance({
      url: executionProgramPath(
        programId,
        `/schedules/${encodeURIComponent(String(scheduleId))}/ujat/partner-recommendation`
      ),
      method: 'GET',
      params:
        organizationApplicationId != null
          ? { organizationApplicationId }
          : undefined,
    })
  )
  if (Array.isArray(body)) return body
  return body.candidates ?? body.items ?? []
}

export async function fetchUjatPartnerAssignments(
  programId: string,
  scheduleId: string | number,
  organizationApplicationId?: number
): Promise<UjatPartnerAssignmentResponse[]> {
  const body = await unwrapApiBody<
    UjatPartnerAssignmentResponse[] | { items?: UjatPartnerAssignmentResponse[] }
  >(
    await customInstance({
      url: executionProgramPath(
        programId,
        `/schedules/${encodeURIComponent(String(scheduleId))}/ujat/partner-assignments`
      ),
      method: 'GET',
      params:
        organizationApplicationId != null
          ? { organizationApplicationId }
          : undefined,
    })
  )
  if (Array.isArray(body)) return body
  return body.items ?? []
}

export async function postUjatPartnerAssignmentConfirm(
  programId: string,
  scheduleId: string | number,
  body: UjatPartnerAssignmentConfirmRequest
): Promise<UjatPartnerAssignmentResponse> {
  return unwrapApiBody(
    await customInstance({
      url: executionProgramPath(
        programId,
        `/schedules/${encodeURIComponent(String(scheduleId))}/ujat/partner-assignments`
      ),
      method: 'POST',
      data: body,
    })
  )
}

export async function postUjatPartnerAssignmentCancel(
  programId: string,
  scheduleId: string | number,
  assignmentGroupId: string,
  body: UjatAssignmentCancelRequest = {}
): Promise<UjatPartnerAssignmentResponse> {
  return unwrapApiBody(
    await customInstance({
      url: executionProgramPath(
        programId,
        `/schedules/${encodeURIComponent(String(scheduleId))}/ujat/partner-assignments/${encodeURIComponent(assignmentGroupId)}/cancel`
      ),
      method: 'POST',
      data: body,
    })
  )
}

export async function fetchUjatScheduleAttendances(
  programId: string,
  scheduleId: string | number
): Promise<UjatAttendanceItemDto[]> {
  const body = await unwrapApiBody<
    UjatAttendanceItemDto[] | { items?: UjatAttendanceItemDto[] }
  >(
    await customInstance({
      url: executionProgramPath(
        programId,
        `/schedules/${encodeURIComponent(String(scheduleId))}/attendances`
      ),
      method: 'GET',
    })
  )
  if (Array.isArray(body)) return body
  return body.items ?? []
}

/** 프로그램 단위 출석 Bulk GET — scheduleIds 필터(빈 배열이면 호출 없음) */
export async function fetchUjatProgramAttendancesBulk(
  programId: string,
  scheduleIds: readonly number[]
): Promise<UjatAttendanceItemDto[]> {
  const items = await fetchProgramAttendancesBulkRemote(programId, scheduleIds)
  return items as UjatAttendanceItemDto[]
}

export async function fetchUjatAttendancesByScheduleIds(
  programId: string,
  scheduleIds: readonly number[]
): Promise<Record<string, UjatAttendanceItemDto[]>> {
  const grouped = await fetchAttendancesByScheduleIdsRemote(programId, scheduleIds, {
    includeEmptyScheduleKeys: true,
  })
  return grouped as Record<string, UjatAttendanceItemDto[]>
}

export async function bulkUpsertUjatAttendances(
  programId: string,
  body: UjatAttendanceBulkUpsertRequest
): Promise<unknown> {
  return unwrapApiBody(
    await customInstance({
      url: executionProgramPath(programId, '/attendances:bulk-upsert'),
      method: 'POST',
      data: body,
    })
  )
}

/** GET /api/admin/program-execution/programs/{programId}/ujat/assignment-submissions */
export async function fetchUjatAssignmentSubmissions(
  programId: string,
  params: {
    semesterType: UjatSemesterType
    educationRegionCode: string
    isoDate?: string
  },
  options?: { signal?: AbortSignal }
): Promise<UjatAssignmentSubmissionsResponse> {
  return unwrapApiBody(
    await customInstance({
      url: executionUjatPath(programId, '/assignment-submissions'),
      method: 'GET',
      params: {
        semesterType: params.semesterType,
        educationRegionCode: params.educationRegionCode,
        isoDate: params.isoDate,
      },
      signal: options?.signal,
    })
  )
}
