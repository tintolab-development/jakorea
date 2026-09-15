/**
 * 강사 배정 Admin API
 * - list: GET /api/admin/program-execution/instructor-assignments
 * - create: POST /api/admin/programs/{programId}/instructor-assignments
 * - cancel: POST /api/admin/program-execution/instructor-assignments/{id}/cancel
 * - calendar: GET /api/admin/programs/{programId}/instructor-assignment-calendar
 * - representative: PUT /api/admin/programs/{programId}/representative-instructor
 *
 * P0/P1 확장 필드는 OpenAPI codegen 전 — `instructor-assignment-types` 사용.
 */

import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { InstructorAssignmentDecisionResponse } from '@/shared/api/generated/dashboard/schemas/instructorAssignmentDecisionResponse'
import type { PageResponseInstructorAssignmentListItemResponse } from '@/shared/api/generated/dashboard/schemas/pageResponseInstructorAssignmentListItemResponse'
import type {
  InstructorAssignmentCalendarResponse,
  InstructorAssignmentCreateBody,
  InstructorAssignmentListItemEnriched,
  RepresentativeInstructorBody,
} from '@/features/program/general/api/instructor-assignment-types'

export type InstructorAssignmentsListQuery = {
  programId?: string | number
  scheduleId?: string | number
  organizationApplicationId?: string | number
  status?: string
  page?: number
  size?: number
}

export interface InstructorAssignmentsPageDto {
  items?: InstructorAssignmentListItemEnriched[]
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
  ) as InstructorAssignmentsPageDto
}

export async function createInstructorAssignmentRemote(
  programId: string,
  payload: InstructorAssignmentCreateBody
): Promise<InstructorAssignmentDecisionResponse> {
  if (payload.scheduleId == null && payload.requestedScheduleId == null) {
    throw new Error('scheduleId 또는 requestedScheduleId가 필요합니다.')
  }
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

export async function fetchInstructorAssignmentCalendarRemote(
  programId: string,
  params: { from: string; to: string; instructorMemberId?: string | number }
): Promise<InstructorAssignmentCalendarResponse> {
  return unwrapApiBody(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/instructor-assignment-calendar`,
      method: 'GET',
      params,
    })
  )
}

export async function putRepresentativeInstructorRemote(
  programId: string,
  payload: RepresentativeInstructorBody
): Promise<unknown> {
  return unwrapApiBody(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/representative-instructor`,
      method: 'PUT',
      data: payload,
    })
  )
}
