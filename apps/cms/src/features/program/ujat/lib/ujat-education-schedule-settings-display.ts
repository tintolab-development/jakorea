import dayjs from 'dayjs'
import {
  EMPTY_UJAT_HALF_EVENT_RANGE_SEAL,
  type UjatHalfEventRangeSeal,
  type UjatHalfSemesterKey,
  ujatHalfScheduleOverlayKeys,
} from '@/features/program/ujat/lib/ujat-half-education-schedule-types'
import {
  ujatEducationScheduleSettingsOverlayKeys,
  type UjatEducationScheduleSettingsExclusionOverlay,
} from '@/features/program/ujat/lib/ujat-education-schedule-settings-types'
import { buildUjatHalfEducationScheduleOverlayDefaults } from '@/features/program/ujat/lib/ujat-half-education-schedule-display'
import { resolveUjatRegistrationBasicInfoOverlay } from '@/features/program/ujat/lib/ujat-registration-basic-info-display'
import { buildRecurringUnavailableLabel } from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'
import { createDefaultUnavailableDatesExclusionState } from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'

export type UjatEducationScheduleSettingsSemesterDisplay = {
  semesterLabel: string
  scheduleRangeText: string
  unavailableDatesText: string
  unavailableRecurringText: string
  exclusion: UjatEducationScheduleSettingsExclusionOverlay
  unavailableDates: string[]
  eventRange: UjatHalfEventRangeSeal
}

function formatScheduleDateLabel(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = dayjs(iso)
  if (!d.isValid()) return ''
  const yy = String(d.year()).slice(-2)
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  return `${yy}년 ${d.month() + 1}월 ${d.date()}일(${weekdays[d.day()]})`
}

export function formatUjatEventRangeLabel(seal: UjatHalfEventRangeSeal): string {
  if (!seal.start && !seal.end) return '-'
  const start = seal.start ? dayjs(seal.start) : null
  const end = seal.end ? dayjs(seal.end) : null
  if (start?.isValid() && end?.isValid()) {
    return `${start.format('YYYY년 M월 D일(ddd)')} ~ ${formatScheduleDateLabel(seal.end)}`
  }
  if (start?.isValid()) return start.format('YYYY년 M월 D일(ddd)')
  return formatScheduleDateLabel(seal.end) || '-'
}

function readEventRange(overlay: Record<string, unknown>, key: string): UjatHalfEventRangeSeal {
  const raw = overlay[key]
  if (!raw || typeof raw !== 'object') return EMPTY_UJAT_HALF_EVENT_RANGE_SEAL
  const o = raw as UjatHalfEventRangeSeal
  return { start: o.start ?? null, end: o.end ?? null }
}

function readUnavailableDates(overlay: Record<string, unknown>, key: string): string[] {
  const legacyFirst = overlay['ujat.eduScheduleSettings.unavailable.first']
  const legacySecond = overlay['ujat.eduScheduleSettings.unavailable.second']
  const raw = overlay[key]
  const source = Array.isArray(raw)
    ? raw
    : key.includes('.h1.') && Array.isArray(legacyFirst)
      ? legacyFirst
      : key.includes('.h2.') && Array.isArray(legacySecond)
        ? legacySecond
        : raw
  if (!Array.isArray(source)) return []
  return source.filter((v): v is string => typeof v === 'string')
}

function readExclusion(
  overlay: Record<string, unknown>,
  key: string,
  unavailableDates: string[]
): UjatEducationScheduleSettingsExclusionOverlay {
  const raw = overlay[key]
  if (raw && typeof raw === 'object') {
    const o = raw as UjatEducationScheduleSettingsExclusionOverlay
    return {
      excludeNone: Boolean(o.excludeNone),
      excludeSaturday: Boolean(o.excludeSaturday),
      excludeSunday: Boolean(o.excludeSunday),
      excludeHoliday: Boolean(o.excludeHoliday),
    }
  }
  if (unavailableDates.length > 0) {
    return createDefaultUnavailableDatesExclusionState({ excludeNone: false, excludeHoliday: true })
  }
  return createDefaultUnavailableDatesExclusionState({ excludeNone: false, excludeHoliday: true })
}

export function resolveUjatEducationScheduleSettingsSemesterDisplay(
  half: UjatHalfSemesterKey,
  overlayInput?: Record<string, unknown>
): UjatEducationScheduleSettingsSemesterDisplay {
  const overlay = {
    ...buildUjatHalfEducationScheduleOverlayDefaults(half),
    ...buildUjatEducationScheduleSettingsOverlayDefaults(half),
    ...(overlayInput ?? resolveUjatRegistrationBasicInfoOverlay()),
  }
  const eventKeys = ujatHalfScheduleOverlayKeys(half)
  const settingsKeys = ujatEducationScheduleSettingsOverlayKeys(half)
  const eventRange = readEventRange(overlay, eventKeys.eventRange)
  const unavailableDates = readUnavailableDates(overlay, settingsKeys.unavailableDates)
  const exclusion = readExclusion(overlay, settingsKeys.exclusion, unavailableDates)

  const unavailableDatesText = exclusion.excludeNone
    ? '진행 불가일 없음'
    : unavailableDates.map(iso => formatScheduleDateLabel(iso)).filter(Boolean).join(', ') || '-'

  const unavailableRecurringText = buildRecurringUnavailableLabel(exclusion)

  return {
    semesterLabel: half === 'h1' ? '상반기 (1학기)' : '하반기 (2학기)',
    scheduleRangeText: formatUjatEventRangeLabel(eventRange),
    unavailableDatesText,
    unavailableRecurringText,
    exclusion,
    unavailableDates,
    eventRange,
  }
}

export function buildUjatEducationScheduleSettingsOverlayDefaults(
  half: UjatHalfSemesterKey
): Record<string, unknown> {
  const keys = ujatEducationScheduleSettingsOverlayKeys(half)
  if (half === 'h1') {
    return {
      [keys.unavailableDates]: ['2026-05-15', '2026-06-12'],
      [keys.exclusion]: createDefaultUnavailableDatesExclusionState({
        excludeNone: false,
        excludeHoliday: true,
      }),
    }
  }
  return {
    [keys.unavailableDates]: ['2026-10-23', '2026-10-30'],
    [keys.exclusion]: createDefaultUnavailableDatesExclusionState({
      excludeNone: false,
      excludeHoliday: true,
    }),
  }
}
