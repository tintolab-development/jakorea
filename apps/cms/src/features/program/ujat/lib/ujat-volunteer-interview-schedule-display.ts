import dayjs from 'dayjs'
import type { Program } from '@/types/domain'
import type { UjatVolunteerRecruitHalf } from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props'
import { ujatVolunteerRecruitInterviewNamespace } from '@/features/program/ujat/lib/ujat-recruit-volunteer-half-overlay'
import { pickUjatVolunteerRecruitmentRow } from '@/features/program/ujat/lib/ujat-recruit-display-program'
import {
  interviewConfigFromLegacyOverlay,
  interviewConfigToLegacyOverlayRecord,
} from '@/features/program/ujat/lib/recruitment-typed-contract'
import type { RecruitmentInterviewConfig } from '@/types/domain'
import {
  buildVolunteerInterviewScheduleEditSeed,
  type VolunteerInterviewScheduleEditSeed,
} from '@/features/program/shared/lib/volunteer-interview-schedule-edit-seed'
import {
  EMPTY_UJAT_VOLUNTEER_INTERVIEW_SCHEDULE,
  type UjatVolunteerInterviewScheduleData,
} from '@/features/program/ujat/model/ujat-volunteer-interview-schedule'
import { formatDateOnly } from '@/features/program/shared/lib/program-detail-info-constants'
import {
  buildRecurringUnavailableLabel,
  type UnavailableDatesExclusionState,
} from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'
import { mapVolunteerInterviewExceptionsFromOverlay } from '@/features/program/shared/lib/volunteer-interview-exception-overlay'

function readExclusionState(value: unknown): UnavailableDatesExclusionState | undefined {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return undefined
  const row = value as Partial<UnavailableDatesExclusionState>
  return {
    excludeNone: row.excludeNone === true,
    excludeSaturday: row.excludeSaturday === true,
    excludeSunday: row.excludeSunday === true,
    excludeHoliday: row.excludeHoliday === true,
  }
}

function formatAvailableTimeSlotsFromSelectedKeys(keys: unknown): string | undefined {
  if (!Array.isArray(keys) || keys.length === 0) return undefined
  const labels = keys
    .map(key => {
      if (typeof key !== 'string' || !key.trim()) return null
      const match = /^(\d+)-(\d+)$/.exec(key.trim())
      if (!match) return null
      const start = dayjs(Number(match[1]))
      const end = dayjs(Number(match[2]))
      if (!start.isValid() || !end.isValid()) return null
      return `${start.format('HH:mm')} ~ ${end.format('HH:mm')}`
    })
    .filter((label): label is string => label != null)
  return labels.length > 0 ? labels.join(', ') : undefined
}

function formatSpecificUnavailableDates(value: unknown): { label?: string; isos: string[] } {
  const isos = Array.isArray(value)
    ? value.map(String).map(item => item.trim()).filter(Boolean)
    : []
  if (isos.length === 0) return { isos }
  const labels = isos.map(iso => {
    const formatted = formatDateOnly(iso)
    return formatted === '-' ? iso : formatted
  })
  return { isos, label: labels.join(', ') }
}

function recurringUnavailableLabel(exclusion: UnavailableDatesExclusionState | undefined): string {
  if (exclusion == null) return '-'
  if (exclusion.excludeNone) return '진행 불가일 없음'
  return buildRecurringUnavailableLabel(exclusion).trim() || '-'
}

function readInterviewTimeRange(
  value: unknown
): VolunteerInterviewScheduleEditSeed['interviewTimeRange'] | undefined {
  if (!Array.isArray(value) || value.length < 2) return undefined
  const start = dayjs(value[0] as string | number | Date)
  const end = dayjs(value[1] as string | number | Date)
  if (!start.isValid() || !end.isValid()) return undefined
  return {
    startHour: start.hour(),
    startMinute: start.minute(),
    endHour: end.hour(),
    endMinute: end.minute(),
  }
}

function inferTimeUnit(keys: unknown, fallback?: unknown): '15' | '30' | '60' {
  if (fallback === '15' || fallback === '30' || fallback === '60') return fallback
  if (!Array.isArray(keys) || typeof keys[0] !== 'string') return '30'
  const match = /^(\d+)-(\d+)$/.exec(keys[0])
  if (!match) return '30'
  const minutes = Math.round((Number(match[2]) - Number(match[1])) / 60_000)
  if (minutes === 15 || minutes === 30 || minutes === 60) return String(minutes) as '15' | '30' | '60'
  return '30'
}

function interviewScheduleFromConfig(
  config: RecruitmentInterviewConfig | null | undefined,
  half?: UjatVolunteerRecruitHalf
): ReturnType<typeof interviewScheduleFromOverlay> {
  if (config == null) return null
  const ns = ujatVolunteerRecruitInterviewNamespace(half ?? 'h1')
  return interviewScheduleFromOverlay(interviewConfigToLegacyOverlayRecord(config, ns), half)
}

function interviewScheduleFromOverlay(
  overlay: Record<string, unknown> | undefined,
  half?: UjatVolunteerRecruitHalf
): {
  display: UjatVolunteerInterviewScheduleData
  seed?: VolunteerInterviewScheduleEditSeed
} | null {
  if (overlay == null) return null
  const ns = ujatVolunteerRecruitInterviewNamespace(half ?? 'h1')
  const exclusion = readExclusionState(overlay[`${ns}.exclusionState`])
  const dates = formatSpecificUnavailableDates(overlay[`${ns}.appliedUnavailableDates`])
  const availableTimeSlots = formatAvailableTimeSlotsFromSelectedKeys(
    overlay[`${ns}.selectedSlotKeys`]
  )
  const exceptions = mapVolunteerInterviewExceptionsFromOverlay(overlay, 'recruit', ns).map(
    exception => ({
      exceptionDate: exception.exceptionDate?.trim() || '-',
      availableTimeSlots: exception.availableTimeSlots?.trim() || '-',
    })
  )
  const hasSchedule =
    availableTimeSlots != null ||
    exclusion != null ||
    dates.isos.length > 0 ||
    overlay[`${ns}.interviewTimeRange`] != null ||
    exceptions.length > 0
  if (!hasSchedule) return null

  const display: UjatVolunteerInterviewScheduleData = {
    common: {
      recurringUnavailable: recurringUnavailableLabel(exclusion),
      specificUnavailableDates: dates.label ?? '',
      availableTimeSlots: availableTimeSlots ?? '-',
    },
    exceptions,
  }

  if (availableTimeSlots == null) return { display }

  const selectedTimeSlotLabels = availableTimeSlots.split(',').map(label => label.trim())
  const interviewTimeRange =
    readInterviewTimeRange(overlay[`${ns}.interviewTimeRange`]) ??
    buildVolunteerInterviewScheduleEditSeed({
      recurringUnavailable: '',
      selectedTimeSlotLabels,
    })?.interviewTimeRange
  if (interviewTimeRange == null) return { display }

  return {
    display,
    seed: {
      excludeNone: exclusion?.excludeNone ?? false,
      excludeSaturday: exclusion?.excludeSaturday ?? false,
      excludeSunday: exclusion?.excludeSunday ?? false,
      excludeHoliday: exclusion?.excludeHoliday ?? false,
      appliedUnavailableDates: dates.isos,
      selectedTimeSlotLabels,
      interviewTimeRange,
      timeUnit: inferTimeUnit(overlay[`${ns}.selectedSlotKeys`], overlay[`${ns}.timeUnit`]),
    },
  }
}

/**
 * 면접 가능 시간·예외 일정 표시.
 * 활성 모집은 모집 행 interviewConfig가 SSOT다. typed 컬럼이 없을 때만 GET overlay를 읽기 변환한다.
 */
export function resolveUjatVolunteerInterviewScheduleDisplay(
  program: Program,
  half?: UjatVolunteerRecruitHalf,
  options?: { allowOverlayFallback?: boolean }
): UjatVolunteerInterviewScheduleData {
  const row = half ? pickUjatVolunteerRecruitmentRow(program, half) : undefined
  const fromTyped = interviewScheduleFromConfig(row?.interviewConfig, half)
  if (fromTyped) return fromTyped.display
  const fromLegacyColumn =
    row && !Object.prototype.hasOwnProperty.call(row, 'interviewConfig')
      ? interviewScheduleFromConfig(
          interviewConfigFromLegacyOverlay(
            program.ujatRegistrationOverlay,
            ujatVolunteerRecruitInterviewNamespace(half ?? 'h1')
          ),
          half
        )
      : null
  if (fromLegacyColumn) return fromLegacyColumn.display
  const fromOverlay = options?.allowOverlayFallback
    ? interviewScheduleFromOverlay(program.ujatRegistrationOverlay, half)
    : null
  if (fromOverlay && fromOverlay.display.common.availableTimeSlots !== '-') {
    return fromOverlay.display
  }

  if (options?.allowOverlayFallback) {
    const info = program.generalCommonInfo?.volunteerInterviewScheduleInfo
    const availableTimeSlots = info?.availableTimeSlots?.trim()
    if (availableTimeSlots && availableTimeSlots !== '-') {
      return {
        common: {
          recurringUnavailable: info?.recurringUnavailable?.trim() || '-',
          specificUnavailableDates: info?.specificUnavailableDates?.trim() || '-',
          availableTimeSlots,
        },
        exceptions: (info?.exceptions ?? []).map(exception => ({
          exceptionDate: exception.exceptionDate?.trim() || '-',
          availableTimeSlots: exception.availableTimeSlots?.trim() || '-',
        })),
      }
    }
  }

  if (fromOverlay) return fromOverlay.display
  return EMPTY_UJAT_VOLUNTEER_INTERVIEW_SCHEDULE
}

export function resolveUjatVolunteerInterviewScheduleEditSeed(
  program: Program,
  half?: UjatVolunteerRecruitHalf,
  options?: { allowOverlayFallback?: boolean }
): VolunteerInterviewScheduleEditSeed | undefined {
  const row = half ? pickUjatVolunteerRecruitmentRow(program, half) : undefined
  const fromTyped = interviewScheduleFromConfig(row?.interviewConfig, half)
  if (fromTyped?.seed) return fromTyped.seed
  if (row && !Object.prototype.hasOwnProperty.call(row, 'interviewConfig')) {
    const fromLegacy = interviewScheduleFromConfig(
      interviewConfigFromLegacyOverlay(
        program.ujatRegistrationOverlay,
        ujatVolunteerRecruitInterviewNamespace(half ?? 'h1')
      ),
      half
    )
    if (fromLegacy?.seed) return fromLegacy.seed
  }
  const fromOverlay = options?.allowOverlayFallback
    ? interviewScheduleFromOverlay(program.ujatRegistrationOverlay, half)
    : null
  if (fromOverlay?.seed) return fromOverlay.seed

  if (options?.allowOverlayFallback) {
    const info = program.generalCommonInfo?.volunteerInterviewScheduleInfo
    const availableTimeSlots = info?.availableTimeSlots?.trim()
    if (availableTimeSlots && availableTimeSlots !== '-') {
      return buildVolunteerInterviewScheduleEditSeed({
        recurringUnavailable: info?.recurringUnavailable ?? '',
        specificUnavailableDateIsos: info?.specificUnavailableDateIsos,
        selectedTimeSlotLabels: availableTimeSlots.split(',').map(label => label.trim()).filter(Boolean),
      })
    }
  }

  return undefined
}

/** UJAT는 봉사자 면접이 항상 있으므로 면접 진행 가능 일정을 상시 노출 */
export function isUjatVolunteerInterviewScheduleVisible(
  _program: Program,
  _overrides?: { interviewStartDate?: string; interviewEndDate?: string }
): boolean {
  return true
}
