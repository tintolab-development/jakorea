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
  assignmentStatus?: string | null
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
}

export type UjatAllocationVolunteerRowDto = {
  participantId?: number | null
  memberId?: number | null
  volunteerName?: string | null
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
  /** 1인 슬롯이면 기존 배정 봉사자 participantId(선택 후보는 SECONDARY로 추가), 빈 슬롯이면 null */
  existingPrimaryParticipantId?: number | null
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
  participantId: number
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
}

export type UjatAssignmentCancelRequest = {
  reason?: string | null
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
  | 'REVISED'
  | 'DEADLINE_MISSED'

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
  return unwrapApiBody(
    await customInstance({
      url: executionUjatPath(
        programId,
        `/education-slots/${encodeURIComponent(String(educationSlotId))}/direct-assignment-candidates`
      ),
      method: 'GET',
    })
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
  await customInstance({
    url: executionUjatPath(
      programId,
      `/schedules/${encodeURIComponent(String(scheduleId))}/attendance-manager`
    ),
    method: 'PUT',
    data: body,
  })
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
  }
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
    })
  )
}
