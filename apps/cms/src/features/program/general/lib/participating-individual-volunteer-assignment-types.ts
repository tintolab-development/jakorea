import type { WaitingInstructorAssignmentStatus } from '@/features/program/general/lib/waiting-instructor-assignment'
import type { WaitingInstructorHopeSchedule } from '@/features/program/general/lib/waiting-instructor-assignment'

export type ParticipatingIndividualVolunteerAssignedScheduleRow = {
  id: string
  no: number
  slotKey: string
  /** 봉사 지역 (시·도 + 구·군) */
  serviceRegion: string
  /** 자택과의 거리 표시 (예: 5km). API 없으면 '-' */
  distanceFromHome: string
  scheduleLabel: string
  scheduleId?: number
}

export type ParticipatingIndividualVolunteerWaitingScheduleRow = {
  id: string
  no: number
  slotKey: string
  /** 봉사 지역 (시·도 + 구·군) */
  serviceRegion: string
  /** 자택과의 거리 표시 (예: 5km). API 없으면 '-' */
  distanceFromHome: string
  scheduleLabel: string
  hopeSchedule: WaitingInstructorHopeSchedule
  assignmentStatus: WaitingInstructorAssignmentStatus
  assignedVolunteerCountLabel: string
  scheduleId?: number
}
