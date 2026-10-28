import type { InstructorRoleKey } from '@/features/program/general/model/school-detail-types'
import {
  WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS,
  type WaitingInstructorAssignmentStatus,
} from '@/features/program/general/lib/waiting-instructor-assignment'

/** 개인형 배정 대기 — 공통 대기 상태 + 이 강사의 배정 취소 이력(배정 취소, 선택 불가) */
export type ParticipatingIndividualInstructorWaitingStatus =
  | WaitingInstructorAssignmentStatus
  | 'assignment_cancelled'

export const PARTICIPATING_INDIVIDUAL_INSTRUCTOR_WAITING_STATUS_LABELS: Record<
  ParticipatingIndividualInstructorWaitingStatus,
  string
> = {
  ...WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS,
  assignment_cancelled: '배정 취소',
}

export type ParticipatingIndividualInstructorAssignedScheduleRow = {
  id: string
  no: number
  role: InstructorRoleKey
  /** 기관 일정 슬롯 — 역할 변경·배정 시 동일 슬롯 판별 */
  slotKey: string
  schoolId: string
  lectureLocation: string
  distanceFromHome: string
  scheduleLabel: string
  assignmentId?: string
  instructorMemberId?: string
  scheduleId?: string
  organizationApplicationId?: string
}

export type ParticipatingIndividualInstructorWaitingScheduleRow = {
  id: string
  no: number
  slotKey: string
  schoolId: string
  lectureLocation: string
  distanceFromHome: string
  scheduleLabel: string
  assignmentStatus: ParticipatingIndividualInstructorWaitingStatus
  assignedInstructorCountLabel: string
  organizationApplicationId?: string
  instructorApplicationId?: string
  instructorMemberId?: string
  requestedScheduleId?: number
  resolvedScheduleId?: number | null
  scheduleUnresolved?: boolean
  sessions?: import('@/features/program/general/model/participating-schools').ParticipatingSchoolSession[]
}
