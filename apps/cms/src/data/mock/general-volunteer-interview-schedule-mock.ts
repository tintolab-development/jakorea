/**
 * 일반 프로그램 — 면접일 배정 모달용 면접 진행 가능 일정 mock
 * TODO(api): 프로그램·기관별 면접 가능 일정 API 연동
 */

export type GeneralVolunteerInterviewScheduleMock = {
  recurringUnavailable: string
  specificUnavailableDates: string
  availableTimeSlots: string
}

/** 프로그램 상세에 면접 일정 미등록 시 fallback — 2026년 3월 면접 기간 기준 */
export const DEFAULT_GENERAL_VOLUNTEER_INTERVIEW_SCHEDULE_MOCK: GeneralVolunteerInterviewScheduleMock =
  {
    recurringUnavailable: '일요일, 공휴일',
    specificUnavailableDates: '26년 3월 6일(금), 26년 3월 15일(금)',
    availableTimeSlots: '09:00 ~ 09:30, 14:00 ~ 14:30, 15:00 ~ 15:30, 16:00 ~ 16:30',
  }
