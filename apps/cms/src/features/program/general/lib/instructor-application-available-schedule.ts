import { getApprovedInstitutionLectureScheduleSlots } from '@/features/program/general/lib/instructor-lecture-assign-schedule'
import { parseIndividualInstructorLectureAssignSchedule } from '@/features/program/general/lib/instructor-lecture-assign-schedule'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'
import type { Program } from '@/types/domain'

export type InstructorAvailableScheduleSlot = {
  id: string
  dateKey: string
  school: string
  region: string
  sessionLabel: string
  timeRange: string
  /** 개인 프로그램 슬롯 — 카드·요약 포맷 분기 */
  isIndividualProgram?: boolean
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

/** 프로그램 유형(기관/개인)에 따라 강사·봉사자 일정 슬롯 생성 */
export function buildInstructorAvailableScheduleSlotsFromProgram(
  program: Program
): InstructorAvailableScheduleSlot[] {
  if (isGeneralIndividualProgram(program)) {
    return parseIndividualInstructorLectureAssignSchedule(program).map(slot => ({
      id: slot.key,
      dateKey: slot.dateKey,
      school: slot.schoolName,
      region: slot.region,
      sessionLabel: slot.sessionLabel,
      timeRange: slot.timeRange,
      isIndividualProgram: true,
    }))
  }
  return buildInstructorAvailableScheduleSlots(program.id)
}

/** 봉사 진행 가능 일정 — 강사 일정 슬롯과 동일 데이터 소스 */
export function buildVolunteerActivityAvailableScheduleSlots(
  program: Program
): InstructorAvailableScheduleSlot[] {
  return buildInstructorAvailableScheduleSlotsFromProgram(program)
}
