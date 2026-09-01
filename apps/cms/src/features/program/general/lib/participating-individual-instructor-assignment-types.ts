import type { InstructorRoleKey } from '@/features/program/general/model/school-detail-types'
import type { WaitingInstructorAssignmentStatus } from '@/features/program/general/lib/waiting-instructor-assignment'

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
}

export type ParticipatingIndividualInstructorWaitingScheduleRow = {
  id: string
  no: number
  slotKey: string
  schoolId: string
  lectureLocation: string
  distanceFromHome: string
  scheduleLabel: string
  assignmentStatus: WaitingInstructorAssignmentStatus
  assignedInstructorCountLabel: string
}
