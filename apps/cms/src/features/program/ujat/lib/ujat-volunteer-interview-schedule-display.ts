import type { Program } from '@/types/domain'
import type { UjatVolunteerRecruitHalf } from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props'
import {
  buildVolunteerInterviewScheduleEditSeed,
  type VolunteerInterviewScheduleEditSeed,
} from '@/features/program/shared/lib/volunteer-interview-schedule-edit-seed'
import {
  getUjatVolunteerInterviewScheduleMock,
  type UjatVolunteerInterviewScheduleData,
} from '@/data/mock/ujat-volunteer-interview-schedule'

export function resolveUjatVolunteerInterviewScheduleDisplay(
  program: Program,
  half?: UjatVolunteerRecruitHalf
): UjatVolunteerInterviewScheduleData {
  const info = program.generalCommonInfo?.volunteerInterviewScheduleInfo
  const availableTimeSlots = info?.availableTimeSlots?.trim()

  if (availableTimeSlots && availableTimeSlots !== '-') {
    return {
      common: {
        recurringUnavailable: info?.recurringUnavailable?.trim() || '-',
        specificUnavailableDates: info?.specificUnavailableDates?.trim() || '-',
        availableTimeSlots,
      },
      exceptions: [],
    }
  }

  return getUjatVolunteerInterviewScheduleMock(program.id, half)
}

export function resolveUjatVolunteerInterviewScheduleEditSeed(
  program: Program,
  half?: UjatVolunteerRecruitHalf
): VolunteerInterviewScheduleEditSeed | undefined {
  const info = program.generalCommonInfo?.volunteerInterviewScheduleInfo
  const availableTimeSlots = info?.availableTimeSlots?.trim()

  if (availableTimeSlots && availableTimeSlots !== '-') {
    return buildVolunteerInterviewScheduleEditSeed({
      recurringUnavailable: info?.recurringUnavailable ?? '',
      specificUnavailableDateIsos: info?.specificUnavailableDateIsos,
      availableTimeSlots,
    })
  }

  const mock = getUjatVolunteerInterviewScheduleMock(program.id, half)
  return buildVolunteerInterviewScheduleEditSeed({
    recurringUnavailable: mock.common.recurringUnavailable,
    availableTimeSlots: mock.common.availableTimeSlots,
  })
}

/** UJAT는 봉사자 면접이 항상 있으므로 면접 진행 가능 일정을 상시 노출 */
export function isUjatVolunteerInterviewScheduleVisible(
  _program: Program,
  _overrides?: { interviewStartDate?: string; interviewEndDate?: string }
): boolean {
  return true
}
