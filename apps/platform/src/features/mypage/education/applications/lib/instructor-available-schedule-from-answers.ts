import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-instructor-draft'
import { PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-volunteer-draft'
import { GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_IDS } from '@jakorea/form-schema/paragraph-ids/gemini-visiting-training-application-form-instructor-draft'
import { coerceApplicationFormDocument } from '@/features/program/lib/application-form-draft'
import {
  formatApplyScheduleSummarySegment,
  readPortalApplicationBindingOptionSlots,
  readRuntimeInstructorScheduleSlots,
  type ApplyInstructorScheduleSlot,
} from '@/features/program/ui/apply-instructor-available-schedule/apply-instructor-available-schedule'
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

const SLOT_PICKER_KEY_HINT_RE = /(available-schedule|activity-schedule)/i

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function readTrimmedString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

function readAnswerToken(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value))
  }
  return readTrimmedString(value)
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
  if (!Array.isArray(raw)) {
    const single = readAnswerToken(raw)
    return single ? [single] : []
  }
  return raw
    .map(item => {
      const direct = readAnswerToken(item)
      if (direct) return direct
      const row = asRecord(item)
      if (!row) return undefined
      return (
        readAnswerToken(row.option_value) ||
        readAnswerToken(row.id) ||
        readAnswerToken(row.value) ||
        readAnswerToken(row.scheduleId)
      )
    })
    .filter((value): value is string => Boolean(value))
}

function isSlotPickerScheduleKey(key: string): boolean {
  return (
    (SLOT_PICKER_SCHEDULE_ANSWER_KEYS as readonly string[]).includes(key) ||
    SLOT_PICKER_KEY_HINT_RE.test(key)
  )
}

function readSlotPickerScheduleAnswerRow(
  answers: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!answers) return null
  const keys = [
    ...SLOT_PICKER_SCHEDULE_ANSWER_KEYS,
    ...Object.keys(answers).filter(key => isSlotPickerScheduleKey(key)),
  ]
  const seen = new Set<string>()
  for (const key of keys) {
    if (seen.has(key) || !(key in answers)) continue
    seen.add(key)
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

export function readSelectedSlotIdsFromAnswers(
  answers: Record<string, unknown> | null | undefined,
): string[] {
  const row = readSlotPickerScheduleAnswerRow(answers)
  if (!row) return []
  const fromSelected = readSlotIdList(row.selectedSlotIds)
  if (fromSelected.length > 0) return fromSelected
  return readSlotIdList(row.selectedOptionIds)
}

function slotMatchesSelectedId(slot: ApplyInstructorScheduleSlot, token: string): boolean {
  if (slot.id === token) return true
  if (`schedule:${token}` === slot.id) return true
  const scheduleMatch = token.match(/^schedule:(\d+)/i)
  if (scheduleMatch && slot.id === scheduleMatch[1]) return true
  return false
}

function linesFromBindingSlots(
  selectedIds: readonly string[],
  slots: readonly ApplyInstructorScheduleSlot[],
): string[] {
  if (selectedIds.length === 0 || slots.length === 0) return []
  return selectedIds.flatMap(token => {
    const slot = slots.find(item => slotMatchesSelectedId(item, token))
    if (!slot) return []
    const line = convertApplyScheduleSummarySegmentToMypageLine(
      formatApplyScheduleSummarySegment(slot),
    )
    return line ? [line] : []
  })
}

function isSlotPickerParagraphId(id: string): boolean {
  return isSlotPickerScheduleKey(id)
}

export function readInstructorScheduleBindingSlotsFromFormDocument(
  form: unknown,
): ApplyInstructorScheduleSlot[] {
  const document = coerceApplicationFormDocument(form)
  const paragraphs = Array.isArray(document?.paragraphs) ? document.paragraphs : []
  for (const paragraph of paragraphs) {
    if (!paragraph || typeof paragraph !== 'object') continue
    const row = paragraph as Record<string, unknown>
    const id = readTrimmedString(row.id)
    if (!id || !isSlotPickerParagraphId(id)) continue
    const runtime = readRuntimeInstructorScheduleSlots(paragraph) ?? []
    if (runtime.length > 0) return runtime
    const options = readPortalApplicationBindingOptionSlots(paragraph)
    if (options.length > 0) return options
  }
  return []
}

export function instructorAvailableScheduleHasSubmittedSelection(input: {
  answers?: Record<string, unknown> | null
  preferredEducationScheduleLabel?: string
  preferredScheduleOptionValues?: readonly string[]
}): boolean {
  const row = readSlotPickerScheduleAnswerRow(input.answers ?? undefined)
  if (row) {
    if (linesFromSlotPickerScheduleAnswerRow(row).length > 0) return true
    if (readSlotIdList(row.selectedSlotIds).length > 0) return true
    if (readSlotIdList(row.selectedOptionIds).length > 0) return true
  }
  const stored = input.preferredEducationScheduleLabel?.trim()
  if (stored) return true
  return (input.preferredScheduleOptionValues?.length ?? 0) > 0
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
  bindingSlots?: readonly ApplyInstructorScheduleSlot[]
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

  const fromBinding = linesFromBindingSlots(optionValues, input.bindingSlots ?? [])
  if (fromBinding.length > 0) return fromBinding

  const resolved = resolvePreferredScheduleLabelsFromAnswers({
    answers: input.answers ?? undefined,
    preferredScheduleOptionValues: optionValues,
    educationScheduleLines: input.program?.educationScheduleLines,
    schedules: input.program?.schedules,
  })
  return resolved
}
