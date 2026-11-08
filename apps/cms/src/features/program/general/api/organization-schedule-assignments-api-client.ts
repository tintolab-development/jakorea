/**
 * GENERAL_ORGANIZATION 기관 신청 교육 일정 배정 (OSA, schedule-only)
 * GET/PUT /api/admin/programs/{programId}/organization-applications/{applicationId}/schedule-assignments
 */

import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { AssignmentResponse } from '@/shared/api/generated/dashboard/schemas/assignmentResponse'
import type { SlotResponse } from '@/shared/api/generated/dashboard/schemas/slotResponse'

/** GENERAL_ORGANIZATION 일정 배정 — scheduleId만 전송 (grade/className 미사용) */
export type OrganizationScheduleAssignmentSlotRequest = {
  scheduleId: number
}

export type OrganizationScheduleAssignmentReplaceRequest = {
  slots?: OrganizationScheduleAssignmentSlotRequest[]
  changeReason?: string
  /**
   * GENERAL_ORGANIZATION + PERIOD 승인 후 희망 일정 확정. program_application_requested_schedule.id 목록.
   * 아직 시작 안 된 기관 일정 배정을 이 목록으로 교체한다. slots와 동시 전송 금지(400 SELECTOR_CONFLICT).
   * BE 신규 필드 — 저장소 OpenAPI 미동기화라 수동 반영.
   */
  requestedScheduleIds?: number[]
}

export async function fetchOrganizationScheduleAssignmentsRemote(
  programId: string,
  organizationApplicationId: string
): Promise<SlotResponse[]> {
  const body = unwrapApiBody<AssignmentResponse>(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/organization-applications/${encodeURIComponent(organizationApplicationId)}/schedule-assignments`,
      method: 'GET',
    })
  )
  return body.slots ?? []
}

export async function replaceOrganizationScheduleAssignmentsRemote(
  programId: string,
  organizationApplicationId: string,
  payload: OrganizationScheduleAssignmentReplaceRequest
): Promise<AssignmentResponse> {
  return unwrapApiBody<AssignmentResponse>(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/organization-applications/${encodeURIComponent(organizationApplicationId)}/schedule-assignments`,
      method: 'PUT',
      data: payload,
    })
  )
}
