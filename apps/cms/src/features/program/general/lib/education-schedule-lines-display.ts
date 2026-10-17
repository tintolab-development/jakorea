/**
 * 일반 프로그램 상세 — 교육 진행 예정일 조회.
 * 등록 화면과 같은 `26년 M월 D일(요일) H:mm ~ H:mm` 표기를 맞춘다.
 */

import {
  flattenGroupTimeSlotsByDetail,
  formatEducationScheduleLineFromRange,
  isCompleteEducationScheduleGroupTimeSlot,
  parseEducationScheduleLineToRange,
  parseStoredEducationScheduleRange,
  normalizeEducationSchedulePeriodLineDateOnly,
  rebuildEducationScheduleLinesFromGroupTimes,
  educationScheduleRangeHasClock,
  type EducationScheduleGroupTimeSlot,
} from '@/features/template/lib/format-education-schedule-line'
import {
  GENERAL_REGISTRATION_OVERLAY_GROUP_TIMES_KEY,
  GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'

const SINGLE_DATE_ISO_KEY = 'generalRegistration.educationScheduleSettings.singleDateIso'
const PERIOD_DATE_ISO_KEY = 'generalRegistration.educationScheduleSettings.periodDateIso'

function normalizeEducationScheduleLines(lines: unknown): string[] {
  if (!Array.isArray(lines)) return []
  return lines
    .filter((line): line is string => typeof line === 'string')
    .map(line => line.trim())
    .filter(Boolean)
}

/** 등록 예정일 한 줄 표기로 정규화 (`26년 9월 16일(수) 9:22 ~ 10:22`) */
export function normalizeEducationScheduleLineForView(line: string): string {
  const trimmed = line.trim()
  if (!trimmed) return ''
  const korean = parseEducationScheduleLineToRange(trimmed)
  if (korean) return formatEducationScheduleLineFromRange(korean)
  const stored = parseStoredEducationScheduleRange(trimmed)
  if (!stored) return trimmed
  if (!educationScheduleRangeHasClock(stored)) {
    const start = stored[0].startOf('day')
    const end = stored[1].startOf('day')
    return formatEducationScheduleLineFromRange([start, end])
  }
  return formatEducationScheduleLineFromRange(stored)
}

function normalizeEducationScheduleLinesForView(lines: string[]): string[] {
  return lines.map(normalizeEducationScheduleLineForView).filter(Boolean)
}

function formatEducationScheduleLineFromIso(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || !raw.trim()) return undefined
  return normalizeEducationScheduleLineForView(raw)
}

function educationScheduleLinesFromOverlayDates(
  overlay: Record<string, unknown> | undefined
): string[] {
  if (!overlay) return []
  const fromSingle = formatEducationScheduleLineFromIso(overlay[SINGLE_DATE_ISO_KEY])
  if (fromSingle) return [fromSingle]
  const fromPeriod = formatEducationScheduleLineFromIso(overlay[PERIOD_DATE_ISO_KEY])
  return fromPeriod ? [fromPeriod] : []
}

function slotsFromProgressTimeSummary(
  summary: string | undefined
): EducationScheduleGroupTimeSlot[] {
  if (!summary?.trim()) return []
  const slots: EducationScheduleGroupTimeSlot[] = []
  for (const part of summary.split(/\s*\|\s*/)) {
    const match = part
      .trim()
      .match(/(?:그룹\s+[A-Z]\s*:\s*)?(\d{1,2}:\d{2})\s*~\s*(\d{1,2}:\d{2})/)
    if (match) slots.push({ startTime: match[1], endTime: match[2] })
  }
  return slots
}

export type EducationScheduleGroupTimeSlotSourceDetail = {
  groupTimes?: Array<EducationScheduleGroupTimeSlot | null | undefined>
  progressTimeSummary?: string
}

function slotsFromScheduleDetailsGroupTimes(
  details: Array<EducationScheduleGroupTimeSlotSourceDetail> | undefined
): EducationScheduleGroupTimeSlot[] {
  if (!details?.length) return []
  const slots: EducationScheduleGroupTimeSlot[] = []
  for (const detail of details) {
    for (const slot of detail.groupTimes ?? []) {
      if (isCompleteEducationScheduleGroupTimeSlot(slot)) {
        slots.push({ startTime: slot!.startTime, endTime: slot!.endTime })
      }
    }
  }
  return slots
}

function slotsFromScheduleDetails(
  details: Array<EducationScheduleGroupTimeSlotSourceDetail> | undefined
): EducationScheduleGroupTimeSlot[] {
  if (!details?.length) return []
  return details.flatMap(detail => slotsFromProgressTimeSummary(detail.progressTimeSummary))
}

function slotsFromOverlayGroupTimes(
  overlay: Record<string, unknown> | undefined
): EducationScheduleGroupTimeSlot[] {
  if (!overlay) return []
  const raw = overlay[GENERAL_REGISTRATION_OVERLAY_GROUP_TIMES_KEY]
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return []
  return flattenGroupTimeSlotsByDetail(
    raw as Record<number, Array<EducationScheduleGroupTimeSlot | null | undefined>>
  )
}

/**
 * 진행 시간 슬롯 SSOT — apply / effect / 조회 동일 우선순위.
 * 1. scheduleDetails.groupTimes (완전한 슬롯만)
 * 2. scheduleDetails.progressTimeSummary
 * 3. 등록 overlay groupTimesByDetail
 */
export function resolveEducationScheduleGroupTimeSlots(input: {
  scheduleDetails?: Array<EducationScheduleGroupTimeSlotSourceDetail>
  overlay?: Record<string, unknown>
}): EducationScheduleGroupTimeSlot[] {
  const fromGroupTimes = slotsFromScheduleDetailsGroupTimes(input.scheduleDetails)
  if (fromGroupTimes.length > 0) return fromGroupTimes
  const fromSummary = slotsFromScheduleDetails(input.scheduleDetails)
  if (fromSummary.length > 0) return fromSummary
  return slotsFromOverlayGroupTimes(input.overlay)
}

/**
 * 등록 overlay를 우선한다. 개인·일정형·단일 회차는 진행 시간으로 예정일 시각을 다시 입힌다.
 */
export function resolveEducationScheduleLinesForView(input: {
  educationScheduleLines?: readonly string[]
  overlay?: Record<string, unknown>
  autoFillFromScheduleGroupTimes?: boolean
  /** 기관 · 일정형 · 단일 · 기간 — 예정일 표시는 날짜만 */
  dateOnlyPeriodLines?: boolean
  scheduleDetails?: Array<EducationScheduleGroupTimeSlotSourceDetail>
}): string[] {
  const fromCommon = normalizeEducationScheduleLines(input.educationScheduleLines)
  const fromOverlay = normalizeEducationScheduleLines(
    input.overlay?.[GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY]
  )
  const fromIso = educationScheduleLinesFromOverlayDates(input.overlay)
  const picked =
    fromOverlay.length > 0 ? fromOverlay : fromCommon.length > 0 ? fromCommon : fromIso
  let normalized = normalizeEducationScheduleLinesForView(picked)
  if (input.dateOnlyPeriodLines) {
    normalized = normalized.map(normalizeEducationSchedulePeriodLineDateOnly).filter(Boolean)
    return normalized
  }

  if (!input.autoFillFromScheduleGroupTimes || normalized.length === 0) {
    return normalized
  }

  const slots = resolveEducationScheduleGroupTimeSlots({
    scheduleDetails: input.scheduleDetails,
    overlay: input.overlay,
  })
  if (slots.length === 0) return normalized

  return normalizeEducationScheduleLinesForView(
    rebuildEducationScheduleLinesFromGroupTimes(normalized, slots)
  )
}
