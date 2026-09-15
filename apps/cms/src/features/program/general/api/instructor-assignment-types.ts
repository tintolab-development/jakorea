/**
 * 1사1교 강사 배정 Admin API — P0/P1 핸드오프 확장 타입
 * (로컬 OpenAPI codegen 미반영 필드. BE contract 2026-09-15 기준)
 */

import type { InstructorAssignmentCreateRequest } from '@/shared/api/generated/dashboard/schemas/instructorAssignmentCreateRequest'
import type { InstructorAssignmentListItemResponse } from '@/shared/api/generated/dashboard/schemas/instructorAssignmentListItemResponse'
import type { RequestedScheduleResponse } from '@/shared/api/generated/dashboard/schemas/requestedScheduleResponse'
import type { RepresentativeInstructorRequest } from '@/shared/api/generated/dashboard/schemas/representativeInstructorRequest'

/** create: scheduleId 또는 requestedScheduleId 중 하나 필수 */
export type InstructorAssignmentCreateBody = Omit<
  InstructorAssignmentCreateRequest,
  'scheduleId'
> & {
  scheduleId?: number
  requestedScheduleId?: number
}

/** list enrich (P0) */
export type InstructorAssignmentListItemEnriched = InstructorAssignmentListItemResponse & {
  lectureDate?: string
  instructorName?: string
  organizationName?: string
  distanceKm?: number
  longDistance?: boolean
  homeAddress?: string
}

/** requested-schedules — resolvedScheduleId null = 일정 미생성 */
export type RequestedScheduleWithResolved = RequestedScheduleResponse & {
  resolvedScheduleId?: number | null
}

export type InstructorAssignmentCalendarItem = {
  instructorMemberId?: number
  lectureDate?: string
  organizationApplicationId?: number
  assignmentId?: number
  scheduleId?: number
  activeYn?: boolean
}

export type InstructorAssignmentCalendarResponse = {
  items?: InstructorAssignmentCalendarItem[]
}

export type RepresentativeInstructorBody = RepresentativeInstructorRequest
