import type { WaitingInstructorAssignmentStatus } from '@/features/program/general/lib/waiting-instructor-assignment'
import type { WaitingInstructorHopeSchedule } from '@/features/program/general/lib/waiting-instructor-assignment'

export type ParticipatingIndividualVolunteerAssignedScheduleRow = {
  id: string
  no: number
  slotKey: string
  scheduleLabel: string
}

export type ParticipatingIndividualVolunteerWaitingScheduleRow = {
  id: string
  no: number
  slotKey: string
  scheduleLabel: string
  hopeSchedule: WaitingInstructorHopeSchedule
  assignmentStatus: WaitingInstructorAssignmentStatus
  assignedVolunteerCountLabel: string
}
