import {
  UJAT_MOCK_PROGRAM_ID_VOLUNTEER_INTERVIEW_COMMON_ONLY,
  UJAT_MOCK_PROGRAM_ID_VOLUNTEER_INTERVIEW_WITH_EXCEPTIONS,
} from '@/data/mock/ujat-volunteer-interview-schedule-demo'
import type { UjatVolunteerRecruitHalf } from './ujat-recruit-paragraph-props'
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
  availableTimeSlots: COMMON_SLOTS }
const WITH_EXCEPTION: UjatVolunteerInterviewScheduleData = {
  common: COMMON_UNAVAILABLE,
  exceptions: [
    {
      exceptionDate: '26년 3월 22일(금)',
      availableTimeSlots: '09:00 ~ 09:30, 11:00 ~ 11:30, 16:00 ~ 16:30, 20:30 ~ 21:00' },
  ] }
const WITHOUT_EXCEPTION: UjatVolunteerInterviewScheduleData = {
  common: COMMON_UNAVAILABLE,
  exceptions: [] }
const BY_PROGRAM_ID: Record<string, UjatVolunteerInterviewScheduleData> = {
  [UJAT_MOCK_PROGRAM_ID_VOLUNTEER_INTERVIEW_WITH_EXCEPTIONS]: WITH_EXCEPTION,
  [UJAT_MOCK_PROGRAM_ID_VOLUNTEER_INTERVIEW_COMMON_ONLY]: WITHOUT_EXCEPTION }
export function getUjatVolunteerInterviewScheduleMock(
  programId: string,
  _half?: UjatVolunteerRecruitHalf
): UjatVolunteerInterviewScheduleData {
  return BY_PROGRAM_ID[programId] ?? WITHOUT_EXCEPTION
}