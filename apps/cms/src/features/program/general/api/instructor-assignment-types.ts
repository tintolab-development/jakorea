/**
 * 1사1교 강사 배정 Admin API 확장 타입.
 * timing/scheduledAt은 generated InstructorAssignmentCreateRequest를 사용한다.
 */

import type { InstructorAssignmentCreateRequest } from '@/shared/api/generated/dashboard/schemas/instructorAssignmentCreateRequest'
import type { InstructorAssignmentListItemResponse } from '@/shared/api/generated/dashboard/schemas/instructorAssignmentListItemResponse'
import type { RequestedScheduleResponse } from '@/shared/api/generated/dashboard/schemas/requestedScheduleResponse'
import type { RepresentativeInstructorRequest } from '@/shared/api/generated/dashboard/schemas/representativeInstructorRequest'

/** create: scheduleId 또는 requestedScheduleId 중 하나 필수. timing은 generated 계약 그대로. */
export type InstructorAssignmentCreateBody = Omit<
  InstructorAssignmentCreateRequest,
  'scheduleId'
> & {
  scheduleId?: number
}

/** list enrich (P0) */
export type InstructorAssignmentListItemEnriched = InstructorAssignmentListItemResponse & {
  /** OpenAPI는 number|undefined지만 BE는 개인 출강지일 때 null */
  organizationId?: number | null
  lectureDate?: string
  instructorName?: string
  organizationName?: string
  distanceKm?: number
  longDistance?: boolean
  homeAddress?: string
}

/** requested-schedules — resolvedScheduleId null = 일정 미생성 */
export type RequestedScheduleWithResolved = Omit<
  RequestedScheduleResponse,
  'resolvedScheduleId'
> & {
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

/** 지정은 scheduleLead 생략. 강등은 `scheduleLead: false` 또는 `role: 'ASSISTANT'` */
export type RepresentativeInstructorBody = RepresentativeInstructorRequest & {
  scheduleLead?: boolean
  role?: 'ASSISTANT' | 'REPRESENTATIVE'
}
