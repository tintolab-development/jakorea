import { getApprovedInstitutionLectureScheduleSlots } from '@/features/program/general/lib/instructor-lecture-assign-schedule'

export type InstructorAvailableScheduleSlot = {
  id: string
  dateKey: string
  school: string
  region: string
  sessionLabel: string
  timeRange: string
}

/** 승인된 기관이 신청한 희망 교육 일정 → 강사 신청 폼 일정 슬롯 */
export function buildInstructorAvailableScheduleSlots(
  programId: string
): InstructorAvailableScheduleSlot[] {
  return getApprovedInstitutionLectureScheduleSlots(programId).map(slot => ({
    id: slot.key,
    dateKey: slot.dateKey,
    school: slot.schoolName,
    region: slot.region,
    sessionLabel: slot.sessionLabel,
    timeRange: slot.timeRange,
  }))
}
