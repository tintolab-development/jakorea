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
