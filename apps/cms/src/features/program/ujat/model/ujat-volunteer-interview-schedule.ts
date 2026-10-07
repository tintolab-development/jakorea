/**
 * UJAT 봉사자 면접 진행 가능 일정 — 타입·빈 stub
 * @see apps/cms/.cursor/rules/process/program-no-fe-mock.mdc
 */

import type { UjatVolunteerRecruitHalf } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'

export type { UjatVolunteerRecruitHalf }

export type UjatVolunteerInterviewScheduleCommon = {
  recurringUnavailable: string
  specificUnavailableDates: string
  availableTimeSlots: string
}

export type UjatVolunteerInterviewScheduleException = {
  exceptionDate: string
  availableTimeSlots: string
}

export type UjatVolunteerInterviewScheduleData = {
  common: UjatVolunteerInterviewScheduleCommon
  exceptions: UjatVolunteerInterviewScheduleException[]
}

export const EMPTY_UJAT_VOLUNTEER_INTERVIEW_SCHEDULE: UjatVolunteerInterviewScheduleData = {
  common: {
    recurringUnavailable: '-',
    specificUnavailableDates: '-',
    availableTimeSlots: '-',
  },
  exceptions: [],
}
