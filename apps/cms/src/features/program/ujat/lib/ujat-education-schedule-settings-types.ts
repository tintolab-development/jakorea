import type { UjatHalfSemesterKey } from '@/features/program/ujat/lib/ujat-half-education-schedule-types'
import type { UnavailableDatesExclusionState } from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'

export type UjatEducationScheduleSettingsSemesterKey = UjatHalfSemesterKey

export const UJAT_EDUCATION_SCHEDULE_SETTINGS_SEMESTER_LABEL: Record<
  UjatEducationScheduleSettingsSemesterKey,
  string
> = {
  h1: '■ 상반기 (1학기)',
  h2: '■ 하반기 (2학기)',
}

export function ujatEducationScheduleSettingsOverlayKeys(half: UjatEducationScheduleSettingsSemesterKey) {
  return {
    unavailableDates: `ujat.${half}.eduSchedule.unavailableDates`,
    exclusion: `ujat.${half}.eduSchedule.exclusion`,
  } as const
}

export type UjatEducationScheduleSettingsExclusionOverlay = UnavailableDatesExclusionState
