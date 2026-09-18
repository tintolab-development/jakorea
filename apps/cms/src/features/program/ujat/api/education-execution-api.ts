/**
 * UJAT education-progress execution APIs (allocation-matrix / partner / attendance).
 * OpenAPI는 rich schema로 채워졌으나 dashboard orval subset 미포함 → 수동 타입 유지
 * (backend.openapi.json AllocationMatrixResponse 등과 동기).
 */

import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'

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

export type UjatAutoAssignmentResponse = {
  programId?: number | null
  educationRegionCode?: string | null
  targetSlotCount?: number | null
  pairAssignedCount?: number | null
  singleAssignedCount?: number | null
  unassignedCount?: number | null
  results?: UjatAutoAssignmentSlotResult[] | null
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
}

export type UjatDirectAssignmentResponse = {
  programId?: number | null
  educationSlotId?: number | null
  movedParticipantId?: number | null
  movedFromExistingPair?: boolean | null
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
