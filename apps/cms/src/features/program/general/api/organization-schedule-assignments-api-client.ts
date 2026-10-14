/**
 * GENERAL_ORGANIZATION 기관 신청 교육일정·학급 임시배정 조회
 * GET /api/admin/programs/{programId}/organization-applications/{applicationId}/schedule-assignments
 */

import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { AssignmentResponse } from '@/shared/api/generated/dashboard/schemas/assignmentResponse'
import type { SlotResponse } from '@/shared/api/generated/dashboard/schemas/slotResponse'

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
