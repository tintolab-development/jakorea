/** 봉사자 면접 진행 가능 일정 — 프로그램 상세 수정 모드 초기값 */
import {
  resolveUnavailableDatesExclusionState,
  type UnavailableDatesExclusionState,
} from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'

export type VolunteerInterviewScheduleEditSeed = UnavailableDatesExclusionState & {
  appliedUnavailableDates: string[]
  selectedTimeSlotLabels: string[]
  interviewTimeRange: {
    startHour: number
    startMinute: number
    endHour: number
    endMinute: number
  }
  timeUnit: '15' | '30' | '60'
}

function parseTimeSlotLabels(slots: string): string[] {
  return slots
    .split(',')
    .map(label => label.trim())
    .filter(Boolean)
}

function inferTimeRangeFromSlotLabels(
  labels: string[]
): VolunteerInterviewScheduleEditSeed['interviewTimeRange'] | null {
  const parsed = labels
    .map(label => {
      const match = label.match(/^(\d{2}):(\d{2})\s*~\s*(\d{2}):(\d{2})$/)
      if (!match) return null
      return {
        startHour: Number(match[1]),
        startMinute: Number(match[2]),
        endHour: Number(match[3]),
        endMinute: Number(match[4]),
      }
    })
    .filter((value): value is NonNullable<typeof value> => value != null)

  if (parsed.length === 0) return null

  const first = parsed[0]
  const last = parsed[parsed.length - 1]
  return {
    startHour: first.startHour,
    startMinute: first.startMinute,
    endHour: last.endHour,
    endMinute: last.endMinute,
  }
}

export function buildVolunteerInterviewScheduleEditSeed(input: {
  recurringUnavailable: string
  specificUnavailableDateIsos?: string[]
  availableTimeSlots: string
}): VolunteerInterviewScheduleEditSeed | undefined {
  if (!input.availableTimeSlots.trim() || input.availableTimeSlots === '-') return undefined

  const selectedTimeSlotLabels = parseTimeSlotLabels(input.availableTimeSlots)
  const interviewTimeRange = inferTimeRangeFromSlotLabels(selectedTimeSlotLabels)
  if (!interviewTimeRange) return undefined

  const recurring = input.recurringUnavailable
  const exclusion = resolveUnavailableDatesExclusionState({
    recurringUnavailable: recurring,
    hasSpecificUnavailableDates: (input.specificUnavailableDateIsos?.length ?? 0) > 0,
  })

  return {
    appliedUnavailableDates: input.specificUnavailableDateIsos ?? [],
    ...exclusion,
    selectedTimeSlotLabels,
    interviewTimeRange,
    timeUnit: '30',
  }
}
