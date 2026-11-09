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
export type InstructorAssignmentListItemEnriched = Omit<
  InstructorAssignmentListItemResponse,
  'settlementStatus'
> & {
  /** OpenAPI는 number|undefined지만 BE는 개인 출강지일 때 null */
  organizationId?: number | null
  lectureDate?: string
  instructorName?: string
  organizationName?: string
  distanceKm?: number
  longDistance?: boolean
  homeAddress?: string
  lectureLocationName?: string | null
  lecturePlaceAddress?: string | null
  /**
   * 배정 단위 정산 상태(OpenAPI 8종 소문자 키). 구 대문자·알 수 없는 값은 resolve 시 none.
   * 판정은 서버 필드만 쓴다. FE에서 다른 정산 API로 다시 계산하지 않는다.
   */
  settlementStatus?: string | null
  /** 일정 진행 상태 UNSCHEDULED | SCHEDULED | IN_PROGRESS | COMPLETED */
  scheduleProgressStatus?: string | null
  settlementId?: number | null
  settlementApplicationId?: number | null
}

/** requested-schedules — resolvedScheduleId null = 일정 미생성 */
export type RequestedScheduleWithResolved = Omit<
  RequestedScheduleResponse,
  'resolvedScheduleId'
> & {
  resolvedScheduleId?: number | null
}

export type InstructorAssignmentCalendarItem = {
  instructorMemberId?: number | null
  lectureDate?: string | null
  organizationApplicationId?: number | null
  assignmentId?: number | null
  scheduleId?: number | null
  activeYn?: boolean
}

export type InstructorAssignmentCalendarResponse = {
  items: InstructorAssignmentCalendarItem[]
}

/** 레거시 화면 내부 상태 표시용 타입. 조회 API 계약에는 사용하지 않는다. */
export type InstructorAssignmentAvailabilityStatus =
  | 'AVAILABLE'
  | 'UNAVAILABLE'
  | 'ASSIGNED'
  | 'ASSIGNMENT_CANCELLED'

export type InstructorAssignmentAvailabilityReason =
  | 'CAPACITY_FULL'
  | 'TIME_CONFLICT_OTHER_PROGRAM'
  | 'TIME_CONFLICT_OTHER_ORGANIZATION'
  | 'SAME_ORGANIZATION_OTHER_SCHEDULE_ASSIGNED'

export type InstructorAssignmentAvailabilityConflict = {
  programId: number
  scheduleId: number | null
  organizationApplicationId: number | null
  startAt: string | null
  endAt: string | null
}

export type InstructorAssignmentAvailabilityItem = {
  organizationApplicationId: number | null
  scheduleId: number
  startAt: string | null
  endAt: string | null
  status: InstructorAssignmentAvailabilityStatus
  reasons: InstructorAssignmentAvailabilityReason[]
  assignedInstructorCount: number | null
  maxAssignableInstructors: number | null
  conflicts: InstructorAssignmentAvailabilityConflict[]
}

export type InstructorAssignmentAvailabilityResponse = {
  programId: number
  instructorMemberId: number
  items: InstructorAssignmentAvailabilityItem[]
}

/** 지정은 scheduleLead 생략. 강등은 `scheduleLead: false` 또는 `role: 'ASSISTANT'` */
export type RepresentativeInstructorBody = RepresentativeInstructorRequest & {
  scheduleLead?: boolean
  role?: 'ASSISTANT' | 'REPRESENTATIVE'
}
