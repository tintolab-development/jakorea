/**
 * 일반 프로그램 — 면접일 배정 모달용 면접 진행 가능 일정 mock
 * TODO(api): 프로그램·기관별 면접 가능 일정 API 연동
 */

export type GeneralVolunteerInterviewScheduleMock = {
  recurringUnavailable: string
  specificUnavailableDates: string
  availableTimeSlots: string
}

/** 면접·서류·배정 전 과정 mock 기간 (2026.09 초 ~ 10.말) */
export const GENERAL_INTERVIEW_MOCK_RANGE = {
  startIso: '2026-09-01',
  endIso: '2026-10-31',
} as const

export const GENERAL_INTERVIEW_MOCK_TIME_SLOTS =
  '09:00 ~ 09:30, 14:00 ~ 14:30, 15:00 ~ 15:30, 16:00 ~ 16:30' as const

/**
 * 봉사자/참여자가 선택한 면접 가능일 — 목록 `면접 가능 일정 수`와 배정 팝업 연민트 일자·슬롯 정합.
 * 3일 × 2슬롯 = 6개 (모두 프로그램 면접 기간·클릭 가능일 안).
 */
export const GENERAL_INTERVIEW_ASSIGN_CALENDAR_DEMO_AVAILABILITY = [
  { dateLabel: '26. 09. 08(화)', slots: ['09:00 ~ 09:30', '14:00 ~ 14:30'] },
  { dateLabel: '26. 09. 15(화)', slots: ['09:00 ~ 09:30', '15:00 ~ 15:30'] },
  { dateLabel: '26. 09. 22(화)', slots: ['09:00 ~ 09:30', '14:00 ~ 14:30'] },
] as const

/** 타 지원자 배정 완료일 (캘린더 회색) — 기간 내 평일 */
export const GENERAL_INTERVIEW_ASSIGNED_DATE_LABELS = [
  '26. 09. 10(목)',
  '26. 09. 11(금)',
  '26. 09. 17(목)',
  '26. 09. 23(수)',
  '26. 10. 05(월)',
] as const

/**
 * 프로그램 상세에 면접 일정 미등록 시 fallback.
 * - 지정 불가일(9/18): 기간 내 disabled + opacity
 * - 슬롯: 목록·팝업 공통
 */
export const DEFAULT_GENERAL_VOLUNTEER_INTERVIEW_SCHEDULE_MOCK: GeneralVolunteerInterviewScheduleMock =
  {
    recurringUnavailable: '일요일, 공휴일',
    specificUnavailableDates: '26년 9월 18일(금)',
    availableTimeSlots: GENERAL_INTERVIEW_MOCK_TIME_SLOTS,
  }
