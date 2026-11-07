import dayjs from 'dayjs'
import { formatShortYearMdWithKoreanWeekday } from '@/shared/lib/format-date-korean-weekday'
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
import { resolveUjatRegistrationBasicInfoOverlay } from '@/features/program/ujat/lib/ujat-registration-basic-info-display'
import { buildRecurringUnavailableLabel } from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'
import { createDefaultUnavailableDatesExclusionState } from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'
import type { UjatTypedDetail } from '@/features/program/ujat/api/typed-detail-client'
import { holidayExcludedFromTyped } from '@/features/program/ujat/lib/ujat-typed-detail'

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
  return formatShortYearMdWithKoreanWeekday(d)
}

export function formatUjatEventRangeLabel(seal: UjatHalfEventRangeSeal): string {
  if (!seal.start && !seal.end) return '-'
  const start = seal.start ? dayjs(seal.start) : null
  const end = seal.end ? dayjs(seal.end) : null
  if (start?.isValid() && end?.isValid()) {
    return `${formatScheduleDateLabel(seal.start)} ~ ${formatScheduleDateLabel(seal.end)}`
  }
  if (start?.isValid()) return formatScheduleDateLabel(seal.start)
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
  _unavailableDates: string[]
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
  // 버그 수정: 저장된 값이 없는 신규 등록 폼에서는 「공휴일 제외」가 미리 체크되어
  // 노출되지 않도록 중립(모두 미선택) 상태로 둔다.
  return createDefaultUnavailableDatesExclusionState({ excludeNone: false, excludeHoliday: false })
}

export function resolveUjatEducationScheduleSettingsSemesterDisplay(
  half: UjatHalfSemesterKey,
  overlayInput?: Record<string, unknown>
): UjatEducationScheduleSettingsSemesterDisplay {
  // 버그 수정: 신규 등록 폼 진입 시 이 단락에 목업 기본값(교육 진행 일정·진행 불가일)이
  // 미리 채워져 노출되던 문제 — 실제 저장된 overlay 값만 사용하고, 없으면 빈 값으로 둔다.
  const overlay = {
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

export function hasUjatTypedMainEducationRange(
  detail: UjatTypedDetail | null | undefined
): boolean {
  if (!detail) return false
  for (const half of ['h1', 'h2'] as const) {
    const range = resolveUjatEducationScheduleSettingsSemesterDisplayFromTypedDetail(
      half,
      detail
    ).eventRange
    if (range.start && range.end) return true
  }
  return false
}

/** Canonical Typed detail projection. This display path never reads registration.overlay. */
export function resolveUjatEducationScheduleSettingsSemesterDisplayFromTypedDetail(
  half: UjatHalfSemesterKey,
  detail: UjatTypedDetail | null | undefined
): UjatEducationScheduleSettingsSemesterDisplay {
  const semesterType = half === 'h1' ? 'FIRST_HALF' : 'SECOND_HALF'
  const row = detail?.halfPlans
    ?.find(item => item.semesterType === semesterType)
    ?.stages?.find(item => item.stage === 'MAIN_EDUCATION')?.rows?.[0]
  const eventRange = {
    start: row?.startDate ?? null,
    end: row?.endDate ?? null,
  }
  const unavailableDates = row?.excludedDates ?? []
  const exclusion: UjatEducationScheduleSettingsExclusionOverlay = {
    excludeNone: row?.exclusion?.excludeNone === true,
    excludeSaturday: row?.exclusion?.excludeSaturday === true,
    excludeSunday: row?.exclusion?.excludeSunday === true,
    excludeHoliday: holidayExcludedFromTyped(row?.exclusion),
  }
  const unavailableDatesText = exclusion.excludeNone
    ? '진행 불가일 없음'
    : unavailableDates.map(iso => formatScheduleDateLabel(iso)).filter(Boolean).join(', ') || '-'
  return {
    semesterLabel: half === 'h1' ? '상반기 (1학기)' : '하반기 (2학기)',
    scheduleRangeText: formatUjatEventRangeLabel(eventRange),
    unavailableDatesText,
    unavailableRecurringText: buildRecurringUnavailableLabel(exclusion),
    exclusion,
    unavailableDates,
    eventRange,
  }
}

export function buildUjatEducationScheduleSettingsOverlayDefaults(
  half: UjatHalfSemesterKey
): Record<string, unknown> {
  // 버그 수정: 신규 등록 폼에 목업 진행 불가일·제외 옵션이 미리 채워져 노출되던 문제 —
  // 기본값은 빈 상태로 두고, 실제 사용자가 선택한 값만 반영한다.
  const keys = ujatEducationScheduleSettingsOverlayKeys(half)
  return {
    [keys.unavailableDates]: [],
    [keys.exclusion]: createDefaultUnavailableDatesExclusionState({
      excludeNone: false,
      excludeHoliday: false,
    }),
  }
}
