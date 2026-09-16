/**
 * UJAT 봉사자 면접 진행 가능 일정 — 타입·빈 stub
 * @see apps/cms/.cursor/rules/process/program-no-fe-mock.mdc
 */

import type { UjatVolunteerRecruitHalf } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'

export type { UjatVolunteerRecruitHalf }
import {
  DEFAULT_GENERAL_VOLUNTEER_INTERVIEW_SCHEDULE_MOCK,
  GENERAL_INTERVIEW_MOCK_TIME_SLOTS,
} from '@/features/program/general/model/volunteer-interview-schedule'

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

/** 레거시 mock 프로그램 id — 분기 제거용으로만 유지 */
export const UJAT_MOCK_PROGRAM_ID_VOLUNTEER_INTERVIEW_WITH_EXCEPTIONS =
  'ujat-progress-volunteer-recruiting' as const
export const UJAT_MOCK_PROGRAM_ID_VOLUNTEER_INTERVIEW_COMMON_ONLY =
  'ujat-progress-education-scheduled' as const

const EMPTY_SCHEDULE: UjatVolunteerInterviewScheduleData = {
  common: {
    recurringUnavailable: DEFAULT_GENERAL_VOLUNTEER_INTERVIEW_SCHEDULE_MOCK.recurringUnavailable,
    specificUnavailableDates:
      DEFAULT_GENERAL_VOLUNTEER_INTERVIEW_SCHEDULE_MOCK.specificUnavailableDates,
    availableTimeSlots: GENERAL_INTERVIEW_MOCK_TIME_SLOTS,
  },
  exceptions: [],
}

export const UJAT_VOLUNTEER_INTERVIEW_SCHEDULE_WITH_EXCEPTION = EMPTY_SCHEDULE
export const UJAT_VOLUNTEER_INTERVIEW_SCHEDULE_COMMON_ONLY = EMPTY_SCHEDULE

/** TODO(api): 프로그램·회차별 면접 진행 가능 일정 API 연동 */
export function getUjatVolunteerInterviewScheduleMock(
  _programId: string,
  _half?: UjatVolunteerRecruitHalf
): UjatVolunteerInterviewScheduleData {
  return EMPTY_SCHEDULE
}
