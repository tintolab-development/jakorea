import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-instructor-draft'
import { PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-volunteer-draft'
import { GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_IDS } from '@jakorea/form-schema/paragraph-ids/gemini-visiting-training-application-form-instructor-draft'
import {
  isOpaqueScheduleOptionToken,
  resolvePreferredScheduleLabelsFromAnswers,
  type PreferredScheduleProgramLookup,
} from './application-content-from-answers'
import {
  isScheduleDateLikeText,
  normalizeScheduleDisplayLabel,
} from '@/shared/lib/format-display-date'

/** 강사 「강의 진행 가능일」·봉사 「봉사 활동 가능 일정」 등 슬롯 피커 제출 형식 */
const SLOT_PICKER_SCHEDULE_ANSWER_KEYS = [
  PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule,
  GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule,
  PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.activitySchedule,
] as const

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function readTrimmedString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

/** 신청 양식 summary — `강서초등학교 : 2026년 3월 9일 (09:30 ~ 12:00)` → `2026년 3월 9일(월) 09:30 ~ 12:00 | 강서초등학교` */
export function convertApplyScheduleSummarySegmentToMypageLine(segment: string): string {
  const trimmed = segment.trim()
  if (!trimmed) return ''
  const colon = trimmed.indexOf(':')
  if (colon > 0) {
    const school = trimmed.slice(0, colon).trim()
    const rest = trimmed.slice(colon + 1).trim()
    if (school && isScheduleDateLikeText(rest)) {
      return `${normalizeScheduleDisplayLabel(rest)} | ${school}`
    }
  }
  return normalizeScheduleDisplayLabel(trimmed)
}

function splitSummarySegments(summary: string): string[] {
  return summary
    .split(' | ')
    .map(part => part.trim())
    .filter(Boolean)
}

function readSlotIdList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(item => readTrimmedString(item))
    .filter((value): value is string => Boolean(value))
}

function readSlotPickerScheduleAnswerRow(
  answers: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!answers) return null
  for (const key of SLOT_PICKER_SCHEDULE_ANSWER_KEYS) {
    const raw = answers[key]
    const row = asRecord(raw)
    if (row) return row
    const ids = readSlotIdList(raw)
    if (ids.length > 0) return { selectedSlotIds: ids }
  }
  return null
}

function linesFromSlotPickerScheduleAnswerRow(row: Record<string, unknown>): string[] {
  const summary = readTrimmedString(row.summary)
  if (summary) {
    return splitSummarySegments(summary)
      .map(convertApplyScheduleSummarySegmentToMypageLine)
      .filter(Boolean)
  }

  const selectedLabels = Array.isArray(row.selectedLabels)
    ? row.selectedLabels
        .map(item => readTrimmedString(item))
        .filter((value): value is string => Boolean(value && !isOpaqueScheduleOptionToken(value)))
    : []
  if (selectedLabels.length > 0) {
    return selectedLabels.map(label => convertApplyScheduleSummarySegmentToMypageLine(label))
  }

  return []
}

function readSelectedSlotIdsFromAnswers(
  answers: Record<string, unknown> | null | undefined,
): string[] {
  const row = readSlotPickerScheduleAnswerRow(answers)
  if (!row) return []
  const fromSelected = readSlotIdList(row.selectedSlotIds)
  if (fromSelected.length > 0) return fromSelected
  return readSlotIdList(row.selectedOptionIds)
}

/**
 * 강의 현황 · 신청 내용 — 「강의 진행 가능일」 한 줄 포맷.
 * `2026년 04월 20일(월) 9:30 ~ 12:20 | 강서초등학교`
 */
export function resolveInstructorAvailableScheduleLines(input: {
  answers?: Record<string, unknown> | null
  preferredEducationScheduleLabel?: string
  preferredScheduleOptionValues?: readonly string[]
  program?: PreferredScheduleProgramLookup
}): string[] {
  const row = readSlotPickerScheduleAnswerRow(input.answers ?? undefined)
  if (row) {
    const fromRow = linesFromSlotPickerScheduleAnswerRow(row)
    if (fromRow.length > 0) return fromRow
  }

  const stored = input.preferredEducationScheduleLabel?.trim()
  if (stored && !isOpaqueScheduleOptionToken(stored)) {
    if (stored.includes(' : ') && stored.includes('년')) {
      return splitSummarySegments(stored)
        .map(convertApplyScheduleSummarySegmentToMypageLine)
        .filter(Boolean)
    }
    return stored
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
  }

  const slotIds = readSelectedSlotIdsFromAnswers(input.answers ?? undefined)
  const optionValues =
    slotIds.length > 0 ? slotIds : (input.preferredScheduleOptionValues ?? [])

  const resolved = resolvePreferredScheduleLabelsFromAnswers({
    answers: input.answers ?? undefined,
    preferredScheduleOptionValues: optionValues,
    educationScheduleLines: input.program?.educationScheduleLines,
    schedules: input.program?.schedules,
  })
  return resolved
}
