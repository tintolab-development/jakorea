import {
  UJAT_MOCK_PROGRAM_ID_VOLUNTEER_INTERVIEW_COMMON_ONLY,
  UJAT_MOCK_PROGRAM_ID_VOLUNTEER_INTERVIEW_WITH_EXCEPTIONS,
} from '@/data/mock/ujat-volunteer-interview-schedule-demo'

/** 상·하반기 봉사자 모집 구분 — API 연동 시 half별 분기 확장 */
export type UjatVolunteerRecruitHalf = 'h1' | 'h2'

/** 면접 진행 가능 일정 — 공통 블록 */
export type UjatVolunteerInterviewScheduleCommon = {
  /** 반복 불가 (예: 일요일, 공휴일) */
  recurringUnavailable: string
  /** 지정 불가일 (표시 문자열, 쉼표 구분) */
  specificUnavailableDates: string
  /** 면접 진행 가능 시간 (표시 문자열) */
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

const COMMON_SLOTS =
  '09:00 ~ 09:30, 09:30 ~ 10:00, 10:00 ~ 10:30, 10:30 ~ 11:00, 11:00 ~ 11:30, 16:00 ~ 16:30, 20:30 ~ 21:00'

const COMMON_UNAVAILABLE: UjatVolunteerInterviewScheduleCommon = {
  recurringUnavailable: '일요일, 공휴일',
  specificUnavailableDates: '26년 3월 6일(금), 26년 3월 15일(금)',
  availableTimeSlots: COMMON_SLOTS,
}

/** 시안 기준 — 공통 + 예외 일정 01 (3/22) */
export const UJAT_VOLUNTEER_INTERVIEW_SCHEDULE_WITH_EXCEPTION: UjatVolunteerInterviewScheduleData =
  {
    common: COMMON_UNAVAILABLE,
    exceptions: [
      {
        exceptionDate: '26년 3월 22일(금)',
        availableTimeSlots:
          '09:00 ~ 09:30, 11:00 ~ 11:30, 16:00 ~ 16:30, 20:30 ~ 21:00',
      },
    ],
  }

/** 공통 일정만 (예외 없음) */
export const UJAT_VOLUNTEER_INTERVIEW_SCHEDULE_COMMON_ONLY: UjatVolunteerInterviewScheduleData =
  {
    common: COMMON_UNAVAILABLE,
    exceptions: [],
  }

const BY_PROGRAM_ID: Record<string, UjatVolunteerInterviewScheduleData> = {
  [UJAT_MOCK_PROGRAM_ID_VOLUNTEER_INTERVIEW_WITH_EXCEPTIONS]:
    UJAT_VOLUNTEER_INTERVIEW_SCHEDULE_WITH_EXCEPTION,
  [UJAT_MOCK_PROGRAM_ID_VOLUNTEER_INTERVIEW_COMMON_ONLY]:
    UJAT_VOLUNTEER_INTERVIEW_SCHEDULE_COMMON_ONLY,
}

/** TODO(api): 프로그램·회차별 면접 진행 가능 일정 API 연동 */
export function getUjatVolunteerInterviewScheduleMock(
  programId: string,
  _half?: UjatVolunteerRecruitHalf
): UjatVolunteerInterviewScheduleData {
  return BY_PROGRAM_ID[programId] ?? UJAT_VOLUNTEER_INTERVIEW_SCHEDULE_WITH_EXCEPTION
}
