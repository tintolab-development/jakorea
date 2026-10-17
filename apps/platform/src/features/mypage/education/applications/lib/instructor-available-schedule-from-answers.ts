import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-instructor-draft'
import { GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_IDS } from '@jakorea/form-schema/paragraph-ids/gemini-visiting-training-application-form-instructor-draft'
import {
  isOpaqueScheduleOptionToken,
  resolvePreferredScheduleLabelsFromAnswers,
  type PreferredScheduleProgramLookup,
} from './application-content-from-answers'

const INSTRUCTOR_SCHEDULE_ANSWER_KEYS = [
  PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule,
  GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule,
] as const

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

const APPLY_SUMMARY_SEGMENT_RE =
  /^(.+?)\s*:\s*(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*\(([^)]+)\)\s*$/

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function readTrimmedString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

function weekdayKoFromDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(part => Number(part))
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return ''
  const utc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    weekday: 'short',
  }).format(utc)
  const ko = WEEKDAY_KO.find(w => weekday.startsWith(w.slice(0, 1)))
  if (ko) return ko
  const map: Record<string, string> = { Sun: '일', Mon: '월', Tue: '화', Wed: '수', Thu: '목', Fri: '금', Sat: '토' }
  return map[weekday] ?? ''
}

/** 신청 양식 summary — `강서초등학교 : 2026년 3월 9일 (09:30 ~ 12:00)` */
export function convertApplyScheduleSummarySegmentToMypageLine(segment: string): string {
  const trimmed = segment.trim()
  if (!trimmed) return ''
  const match = trimmed.match(APPLY_SUMMARY_SEGMENT_RE)
  if (!match) return trimmed
  const school = match[1]!.trim()
  const year = match[2]!
  const month = match[3]!.padStart(2, '0')
  const day = match[4]!.padStart(2, '0')
  const time = match[5]!.trim()
  const dateKey = `${year}-${month}-${day}`
  const weekday = weekdayKoFromDateKey(dateKey)
  const weekdayPart = weekday ? `(${weekday})` : ''
  return `${year}년 ${month}월 ${day}일${weekdayPart} ${time} | ${school}`
}

function splitSummarySegments(summary: string): string[] {
  return summary
    .split(' | ')
    .map(part => part.trim())
    .filter(Boolean)
}

function readInstructorScheduleAnswerRow(
  answers: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!answers) return null
  for (const key of INSTRUCTOR_SCHEDULE_ANSWER_KEYS) {
    const row = asRecord(answers[key])
    if (row) return row
  }
  return null
}

function linesFromInstructorScheduleAnswerRow(row: Record<string, unknown>): string[] {
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
  const row = readInstructorScheduleAnswerRow(answers)
  if (!row || !Array.isArray(row.selectedSlotIds)) return []
  return row.selectedSlotIds
    .map(item => readTrimmedString(item))
    .filter((value): value is string => Boolean(value))
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
  const row = readInstructorScheduleAnswerRow(input.answers ?? undefined)
  if (row) {
    const fromRow = linesFromInstructorScheduleAnswerRow(row)
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
