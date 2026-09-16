/**
 * 일반 프로그램 봉사자 면접 진행 가능 일정 — 타입·표시용 상수
 * (목록/상세 row 시드 아님. API 연동 전 fallback 문구)
 * @see apps/cms/.cursor/rules/process/program-no-fe-mock.mdc
 */

export type GeneralVolunteerInterviewAvailabilityDay = {
  dateLabel: string
  slots: string[]
}

export type GeneralVolunteerInterviewScheduleMock = {
  recurringUnavailable: string
  specificUnavailableDates: string
  availableTimeSlots: string
}

/** 면접 배정 UI 기간 fallback (API 미연동) */
export const GENERAL_INTERVIEW_MOCK_RANGE = {
  startIso: '2026-09-01',
  endIso: '2026-10-31',
} as const

export const GENERAL_INTERVIEW_MOCK_TIME_SLOTS =
  '09:00 ~ 09:30, 14:00 ~ 14:30, 15:00 ~ 15:30, 16:00 ~ 16:30' as const

/** 데모용 빈 가용 일정 — 시드 제거 */
export const GENERAL_INTERVIEW_ASSIGN_CALENDAR_DEMO_AVAILABILITY: readonly GeneralVolunteerInterviewAvailabilityDay[] =
  []

/** 타 지원자 배정 완료일 표시용 — 시드 제거 */
export const GENERAL_INTERVIEW_ASSIGNED_DATE_LABELS: readonly string[] = []

/** 프로그램 상세에 면접 일정 미등록 시 fallback 문구 */
export const DEFAULT_GENERAL_VOLUNTEER_INTERVIEW_SCHEDULE_MOCK: GeneralVolunteerInterviewScheduleMock =
  {
    recurringUnavailable: '일요일, 공휴일',
    specificUnavailableDates: '',
    availableTimeSlots: GENERAL_INTERVIEW_MOCK_TIME_SLOTS,
  }
