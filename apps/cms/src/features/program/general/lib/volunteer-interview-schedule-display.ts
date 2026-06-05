/**
 * 일반 프로그램 상세 — 봉사자 면접 진행 가능 일정 표시값 (등록 양식·스크린샷 mock)
 */

import type { Program } from '@/types/domain'
import {
  buildVolunteerInterviewScheduleEditSeed,
  type VolunteerInterviewScheduleEditSeed,
} from '@/features/program/shared/lib/volunteer-interview-schedule-edit-seed'
import { GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID } from '@/features/program/general/lib/detail-common-info-display'
import { DEFAULT_GENERAL_VOLUNTEER_INTERVIEW_SCHEDULE_MOCK } from '@/data/mock/general-volunteer-interview-schedule-mock'

export type { VolunteerInterviewScheduleEditSeed }

export type GeneralProgramVolunteerInterviewScheduleDisplay = {
  recurringUnavailable: string
  specificUnavailableDates: string
  availableTimeSlots: string
}

const JOB담_VOLUNTEER_INTERVIEW_SCHEDULE_MOCK: GeneralProgramVolunteerInterviewScheduleDisplay = {
  recurringUnavailable: '일요일, 공휴일',
  specificUnavailableDates: '2026년 2월 10일(화)',
  availableTimeSlots:
    '09:00 ~ 09:30, 09:30 ~ 10:00, 10:00 ~ 10:30, 10:30 ~ 11:00, 11:00 ~ 11:30, 16:00 ~ 16:30, 20:30 ~ 21:00',
}

const JOB담_VOLUNTEER_INTERVIEW_SCHEDULE_UNAVAILABLE_DATE_ISOS = ['2026-02-10'] as const

export function resolveGeneralProgramVolunteerInterviewScheduleDisplay(
  program: Program
): GeneralProgramVolunteerInterviewScheduleDisplay {
  if (program.id === GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID) {
    return JOB담_VOLUNTEER_INTERVIEW_SCHEDULE_MOCK
  }

  const info = program.generalCommonInfo?.volunteerInterviewScheduleInfo
  const availableTimeSlots = info?.availableTimeSlots?.trim()

  if (!availableTimeSlots || availableTimeSlots === '-') {
    return DEFAULT_GENERAL_VOLUNTEER_INTERVIEW_SCHEDULE_MOCK
  }

  return {
    recurringUnavailable:
      info?.recurringUnavailable ?? DEFAULT_GENERAL_VOLUNTEER_INTERVIEW_SCHEDULE_MOCK.recurringUnavailable,
    specificUnavailableDates:
      info?.specificUnavailableDates ?? DEFAULT_GENERAL_VOLUNTEER_INTERVIEW_SCHEDULE_MOCK.specificUnavailableDates,
    availableTimeSlots,
  }
}

export function resolveGeneralProgramVolunteerInterviewScheduleEditSeed(
  program: Program
): VolunteerInterviewScheduleEditSeed | undefined {
  const display = resolveGeneralProgramVolunteerInterviewScheduleDisplay(program)
  const info = program.generalCommonInfo?.volunteerInterviewScheduleInfo

  return buildVolunteerInterviewScheduleEditSeed({
    recurringUnavailable: display.recurringUnavailable,
    specificUnavailableDateIsos:
      info?.specificUnavailableDateIsos ??
      (program.id === GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID
        ? [...JOB담_VOLUNTEER_INTERVIEW_SCHEDULE_UNAVAILABLE_DATE_ISOS]
        : undefined),
    availableTimeSlots: display.availableTimeSlots,
  })
}

export function isGeneralProgramVolunteerInterviewScheduleVisible(program: Program): boolean {
  return program.generalVolunteerInterviewEnabled !== false
}
