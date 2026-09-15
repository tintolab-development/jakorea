/**
 * 강사 배정 Admin API
 * - list: GET /api/admin/program-execution/instructor-assignments
 * - create: POST /api/admin/programs/{programId}/instructor-assignments
 * - cancel: POST /api/admin/program-execution/instructor-assignments/{id}/cancel
 *
 * assignment calendar GET은 OpenAPI에 없음 → 목록+일정 날짜로 1일1교 충돌을 FE에서 유도.
 */

import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { InstructorAssignmentCreateRequest } from '@/shared/api/generated/dashboard/schemas/instructorAssignmentCreateRequest'
import type { InstructorAssignmentDecisionResponse } from '@/shared/api/generated/dashboard/schemas/instructorAssignmentDecisionResponse'
import type { InstructorAssignmentListItemResponse } from '@/shared/api/generated/dashboard/schemas/instructorAssignmentListItemResponse'
import type { PageResponseInstructorAssignmentListItemResponse } from '@/shared/api/generated/dashboard/schemas/pageResponseInstructorAssignmentListItemResponse'

export type InstructorAssignmentsListQuery = {
  programId?: string | number
  scheduleId?: string | number
  organizationApplicationId?: string | number
  status?: string
  page?: number
  size?: number
}

export interface InstructorAssignmentsPageDto {
  items?: InstructorAssignmentListItemResponse[]
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
}

export async function fetchInstructorAssignmentsRemote(
  params: InstructorAssignmentsListQuery
): Promise<InstructorAssignmentsPageDto> {
  return unwrapApiBody<PageResponseInstructorAssignmentListItemResponse>(
    await customInstance({
      url: '/api/admin/program-execution/instructor-assignments',
      method: 'GET',
      params,
    })
  )
}

export async function createInstructorAssignmentRemote(
  programId: string,
  payload: InstructorAssignmentCreateRequest
): Promise<InstructorAssignmentDecisionResponse> {
  return unwrapApiBody(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/instructor-assignments`,
      method: 'POST',
      data: payload,
    })
  )
}

export async function cancelInstructorAssignmentRemote(
  assignmentId: string
): Promise<InstructorAssignmentDecisionResponse> {
  return unwrapApiBody(
    await customInstance({
      url: `/api/admin/program-execution/instructor-assignments/${encodeURIComponent(assignmentId)}/cancel`,
      method: 'POST',
    })
  )
}
