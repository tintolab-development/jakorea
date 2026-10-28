/**
 * Portal 신청 상세 `answers` → 신청 내용 탭 표시 문구.
 * Notion: 교육/봉사 신청 내용 = 자기소개 및 지원동기 + 진행 희망 교육 일정.
 */

import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-individual-draft'
import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-instructor-draft'
import { PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-volunteer-draft'
import { GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_IDS } from '@jakorea/form-schema/paragraph-ids/gemini-visiting-training-application-form-instructor-draft'
import { GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/gemini-visiting-training-application-form-institution-draft'
import { PROGRAM_APPLICATION_FORM_ECONOMY_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-economy-draft'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import { PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-trained-teachers-draft'
import { UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@jakorea/form-schema/paragraph-ids/ujat-program-application-form-volunteer-draft'
import { expandEducationScheduleChoiceSlots } from '@jakorea/form-schema/program-application'
import {
  formatDisplayDate,
  formatDisplayDateTime,
  formatDisplayDateTimeRange,
  formatDisplayClockLabel,
  normalizeScheduleDisplayLabel,
} from '@/shared/lib/format-display-date'
import { toDisplayEducationScheduleName } from '@/shared/lib/education-schedule-name'

const SELF_INTRO_ANSWER_KEYS = [
  PROGRAM_PARTICIPANT_APPLICATION_IDS.selfIntro,
  /** BE handoff 예시 단축 키 */
  'selfIntro',
  'selfIntroMotivation',
  'selfIntroduction',
] as const

const PREFERRED_SCHEDULE_ANSWER_KEYS = [
  PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice,
  PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice,
  /** BE handoff 예시 단축 키 */
  'scheduleChoice',
  PROGRAM_APPLICATION_FORM_ECONOMY_IDS.preferredSchedule,
  PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.preferredSchedule,
  PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.activitySchedule,
  PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule,
  GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule,
  GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.preferredEducationSchedule,
  'preferredEducationSchedule',
  'preferredScheduleBlocks',
] as const

const VOLUNTEER_FREE_TEXT_KEYS = [
  PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.freeTextItems,
  UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.freeTextItems,
] as const

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function pickAnswer(answers: Record<string, unknown>, keys: readonly string[]): unknown {
  for (const key of keys) {
    if (key in answers) return answers[key]
  }
  return undefined
}

function readTrimmedString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || undefined
  }
  return undefined
}

function parseVolunteerFreeTextIntro(raw: unknown): string | undefined {
  const record =
    typeof raw === 'string'
      ? (() => {
          try {
            return asRecord(JSON.parse(raw))
          } catch {
            return null
          }
        })()
      : asRecord(raw)
  const items = record?.items
  if (!Array.isArray(items)) return undefined
  for (const item of items) {
    const row = asRecord(item)
    if (!row) continue
    if (row.id !== 'intro') continue
    return readTrimmedString(row.bodyText)
  }
  return undefined
}

/** 서류 합격 배너용 — `2026년 3월 15일(일) 09:00` */
export function formatInterviewAtLabel(startAt: string | null | undefined): string | undefined {
  if (!startAt?.trim()) return undefined
  return formatDisplayDateTime(startAt) || undefined
}

function formatPreferredScheduleBlock(block: Record<string, unknown>): string | undefined {
  const dateRaw =
    readTrimmedString(block.date) ||
    readTrimmedString(block.dateText) ||
    readTrimmedString(block.startAt) ||
    readTrimmedString(block.startDate)
  if (!dateRaw) return undefined

  const sessions = Array.isArray(block.sessionTimes)
    ? block.sessionTimes
    : Array.isArray(block.times)
      ? block.times
      : []
  const first = asRecord(sessions[0])
  const startTime =
    readTrimmedString(first?.startTime) ||
    readTrimmedString(first?.start) ||
    readTrimmedString(block.startTime)
  const endTime =
    readTrimmedString(first?.endTime) ||
    readTrimmedString(first?.end) ||
    readTrimmedString(block.endTime)
  const timeRange =
    readTrimmedString(first?.timeRange) ||
    (startTime && endTime
      ? `${formatDisplayClockLabel(startTime)} ~ ${formatDisplayClockLabel(endTime)}`
      : undefined)

  const dateLabel = formatDisplayDate(dateRaw.includes('T') ? dateRaw : dateRaw)
  let core = ''
  if (dateLabel && timeRange) {
    core = normalizeScheduleDisplayLabel(`${dateLabel} ${timeRange}`)
  } else if (dateLabel) {
    core = dateLabel
  } else {
    core = timeRange ? normalizeScheduleDisplayLabel(`${dateRaw} ${timeRange}`) : dateRaw
  }
  const org =
    readTrimmedString(block.organizationName) ||
    readTrimmedString(block.institutionName) ||
    readTrimmedString(block.schoolName)
  const rankRaw = block.preferenceRank
  const rank =
    typeof rankRaw === 'number' && Number.isFinite(rankRaw)
      ? rankRaw
      : typeof rankRaw === 'string' && /^\d+$/.test(rankRaw.trim())
        ? Number(rankRaw.trim())
        : null
  const parts = [
    rank != null && rank > 0 ? `${rank}지망` : '',
    core,
    org ?? '',
  ].filter(Boolean)
  return parts.join(' | ')
}

/**
 * 제출 option_value — 사람이 읽는 라벨이 아님.
 * 예: `schedule:186626`, `gemini-preferred:organization-application:1:rank:1`, `line:0`, `interview-slot:…`, 순수 scheduleId 숫자 문자열
 */
export function isOpaqueScheduleOptionToken(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (
    /^schedule:\d+(?::organization-application:\d+)?(?::education-period:\d+)?$/i.test(trimmed)
  ) {
    return true
  }
  if (/^schedule:\d+(?::organization-application:\d+)?$/i.test(trimmed)) return true
  if (/^gemini-preferred:organization-application:\d+:rank:\d+$/i.test(trimmed)) return true
  if (/^line:\d+$/i.test(trimmed)) return true
  if (/^interview-slot:/i.test(trimmed)) return true
  if (/^\d{4,}$/.test(trimmed)) return true
  return false
}

function displayScheduleText(raw: string): string {
  return raw
    .split('\n')
    .map(line => {
      const trimmed = line.trim()
      if (!trimmed || isOpaqueScheduleOptionToken(trimmed)) return trimmed
      return normalizeScheduleDisplayLabel(trimmed)
    })
    .filter(Boolean)
    .join('\n')
}

const CLOCK_RE = /(\d{1,2}):(\d{2})/g
const DATE_DOT_RE = /(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/g
const DATE_ISO_RE = /(\d{4})-(\d{2})-(\d{2})/g
const DATE_KO_RE = /(\d{2,4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/g

function pad2(value: number | string): string {
  return String(value).padStart(2, '0')
}

function dateKeysFromText(text: string): string[] {
  const keys: string[] = []
  const push = (yearRaw: string, month: string, day: string) => {
    const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw
    keys.push(`${year}-${pad2(month)}-${pad2(day)}`)
  }
  for (const match of text.matchAll(DATE_DOT_RE)) {
    push(match[1] ?? '', match[2] ?? '', match[3] ?? '')
  }
  for (const match of text.matchAll(DATE_ISO_RE)) {
    push(match[1] ?? '', match[2] ?? '', match[3] ?? '')
  }
  for (const match of text.matchAll(DATE_KO_RE)) {
    push(match[1] ?? '', match[2] ?? '', match[3] ?? '')
  }
  return [...new Set(keys)]
}

function clocksFromText(text: string): string[] {
  return [...text.matchAll(CLOCK_RE)].map(
    match => `${pad2(match[1] ?? '0')}:${match[2] ?? '00'}`,
  )
}

/**
 * 날짜만 저장된 희망 일정을 신청 폼 고정 선택지(교육 진행 예정일) 문구로 되돌린다.
 * 시각이 있거나 날짜가 둘 이상이면 저장 문구를 유지한다.
 */
function resolveFormOptionLabelForStoredLine(
  storedLine: string,
  lines: readonly string[] | undefined,
): string | undefined {
  const trimmed = storedLine.trim()
  if (!trimmed || clocksFromText(trimmed).length > 0) return undefined
  const storedDates = dateKeysFromText(trimmed)
  if (storedDates.length !== 1) return undefined
  const storedDate = storedDates[0]
  const slots = expandEducationScheduleChoiceSlots(lines)
    .map(slot => slot.trim())
    .filter(Boolean)
  if (slots.length === 0) return undefined
  const sameDate = slots.filter(slot => dateKeysFromText(slot)[0] === storedDate)
  if (sameDate.length !== 1) return undefined
  const slot = sameDate[0]
  if (!slot) return undefined
  return normalizeScheduleDisplayLabel(withSourceSessionSuffix(slot, lines))
}

function mapStoredScheduleLabelToFormOptions(
  stored: string,
  lines: readonly string[] | undefined,
): string {
  return stored
    .split('\n')
    .map(line => {
      const trimmed = line.trim()
      if (!trimmed) return ''
      if (isOpaqueScheduleOptionToken(trimmed)) return trimmed
      return resolveFormOptionLabelForStoredLine(trimmed, lines) ?? displayScheduleText(trimmed)
    })
    .filter(Boolean)
    .join('\n')
}

function readAnswerToken(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value))
  }
  return readTrimmedString(value)
}

function flattenAnswerStrings(raw: unknown): string[] {
  if (typeof raw === 'string' || typeof raw === 'number') {
    const token = readAnswerToken(raw)
    return token ? [token] : []
  }
  if (Array.isArray(raw)) {
    const out: string[] = []
    for (const item of raw) {
      const direct = readAnswerToken(item)
      if (direct) {
        out.push(direct)
        continue
      }
      const row = asRecord(item)
      if (!row) continue
      const value =
        readAnswerToken(row.value) ||
        readAnswerToken(row.option_value) ||
        readAnswerToken(row.id) ||
        readTrimmedString(row.label) ||
        readTrimmedString(row.displayLabel)
      if (value) out.push(value)
    }
    return out
  }
  const row = asRecord(raw)
  if (!row) return []
  const value =
    readAnswerToken(row.value) ||
    readAnswerToken(row.option_value) ||
    readAnswerToken(row.id)
  return value ? [value] : []
}

function formatPreferredScheduleAnswer(raw: unknown): string | undefined {
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return undefined
    if (trimmed.includes('\n')) {
      const lines = trimmed
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
      const visible = lines.filter(line => !isOpaqueScheduleOptionToken(line))
      if (visible.length > 0) return visible.join('\n')
      return undefined
    }
    if (isOpaqueScheduleOptionToken(trimmed)) return undefined
    return trimmed
  }
  if (Array.isArray(raw)) {
    if (raw.every(item => typeof item === 'string')) {
      const labels = raw
        .map(item => String(item).trim())
        .filter(value => value && !isOpaqueScheduleOptionToken(value))
      return labels.length > 0 ? labels.join('\n') : undefined
    }
    const labels = raw
      .map(item => {
        const row = asRecord(item)
        if (!row) {
          const asString = readTrimmedString(item)
          return asString && !isOpaqueScheduleOptionToken(asString) ? asString : undefined
        }
        const labeled =
          readTrimmedString(row.label) ||
          readTrimmedString(row.displayLabel) ||
          formatPreferredScheduleBlock(row)
        if (labeled && !isOpaqueScheduleOptionToken(labeled)) return labeled
        return undefined
      })
      .filter((value): value is string => Boolean(value))
    return labels.length > 0 ? labels.join('\n') : undefined
  }
  const row = asRecord(raw)
  if (!row) return undefined
  if (Array.isArray(row.selectedLabels)) {
    const labels = row.selectedLabels
      .map(item => readTrimmedString(item))
      .filter((value): value is string => Boolean(value && !isOpaqueScheduleOptionToken(value)))
    if (labels.length > 0) return labels.join('\n')
  }
  const summary = readTrimmedString(row.summary)
  if (summary && !isOpaqueScheduleOptionToken(summary)) return summary
  const labeled =
    readTrimmedString(row.label) ||
    readTrimmedString(row.displayLabel) ||
    formatPreferredScheduleBlock(row)
  if (labeled && !isOpaqueScheduleOptionToken(labeled)) return labeled
  return undefined
}

/** answers의 scheduleChoice 등에서 opaque option_value 수집 */
export function collectPreferredScheduleOptionValues(
  answers: Record<string, unknown> | null | undefined,
): string[] {
  if (!answers) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const key of PREFERRED_SCHEDULE_ANSWER_KEYS) {
    if (key === 'preferredScheduleBlocks' || !(key in answers)) continue
    const row = asRecord(answers[key])
    const selectedIds = [
      ...(Array.isArray(row?.selectedSlotIds) ? row.selectedSlotIds : []),
      ...(Array.isArray(row?.selectedOptionIds) ? row.selectedOptionIds : []),
    ]
    if (selectedIds.length > 0) {
      for (const id of selectedIds) {
        const token = readAnswerToken(id)
        if (!token || !isOpaqueScheduleOptionToken(token) || seen.has(token)) continue
        seen.add(token)
        out.push(token)
      }
    }
    for (const value of flattenAnswerStrings(answers[key])) {
      if (!isOpaqueScheduleOptionToken(value) || seen.has(value)) continue
      seen.add(value)
      out.push(value)
    }
  }
  return out
}

export type PreferredScheduleProgramLookup = {
  educationScheduleLines?: readonly string[]
  schedules?: ReadonlyArray<{
    scheduleId?: number
    startAt?: string
    endAt?: string
    scheduleName?: string
    /** 이미 포맷된 일시 문구가 있으면 우선 */
    dateLabel?: string
    educationPeriodIndex?: number
    periodStartDate?: string
    periodEndDate?: string
    periodLabel?: string
  }>
}

/** 시안형: `2026년 4월 20일(월) 09:30 ~ 12:20` (+ 선택적 일정명) */
function formatScheduleRangeLabel(input: {
  startAt?: string
  endAt?: string
  scheduleName?: string
  dateLabel?: string
}): string | undefined {
  const ready = readTrimmedString(input.dateLabel)
  if (ready && !isOpaqueScheduleOptionToken(ready)) {
    const normalized = normalizeScheduleDisplayLabel(ready)
    const name = toDisplayEducationScheduleName(input.scheduleName)
    return name && !normalized.includes(name) ? `${normalized} | ${name}` : normalized
  }
  if (!input.startAt?.trim()) {
    return toDisplayEducationScheduleName(input.scheduleName)
  }
  const range = input.endAt?.trim()
    ? formatDisplayDateTimeRange(input.startAt, input.endAt)
    : formatDisplayDateTime(input.startAt)
  if (!range) return toDisplayEducationScheduleName(input.scheduleName)
  const name = toDisplayEducationScheduleName(input.scheduleName)
  return name ? `${range} | ${name}` : range
}

const FIXED_SCHEDULE_SESSION_SUFFIX_RE = /\|\s*\d+\s*차시\s*$/

function withSourceSessionSuffix(
  slot: string,
  lines: readonly string[] | undefined,
): string {
  if (FIXED_SCHEDULE_SESSION_SUFFIX_RE.test(slot)) return slot
  const suffix = (lines ?? [])
    .map(line => line.trim().match(FIXED_SCHEDULE_SESSION_SUFFIX_RE)?.[0])
    .find((value): value is string => Boolean(value))
  return suffix ? `${slot} ${suffix}` : slot
}

/**
 * 신청 폼 `line:N`과 동일하게 예정일 줄을 `|` 슬롯으로 펼친 뒤 인덱스를 본다.
 * 한 줄에 날짜가 두 개인 날짜지정 선택지를 원본 배열 인덱스로 찾으면 `line:1`이 빠진다.
 */
function resolveEducationScheduleLineLabel(
  index: number,
  lines: readonly string[] | undefined,
): string | undefined {
  const slot = expandEducationScheduleChoiceSlots(lines)[index]?.trim()
  if (!slot) return undefined
  return normalizeScheduleDisplayLabel(withSourceSessionSuffix(slot, lines))
}

function resolveOneScheduleOptionToken(
  token: string,
  lookup: PreferredScheduleProgramLookup,
): string | undefined {
  const lineMatch = token.trim().match(/^line:(\d+)$/i)
  if (lineMatch) {
    const index = Number(lineMatch[1])
    return resolveEducationScheduleLineLabel(index, lookup.educationScheduleLines)
  }
  const trimmed = token.trim()
  /** `schedule:123` · `schedule:123:organization-application:9` · `schedule:123:education-period:0` */
  const scheduleMatch = trimmed.match(
    /^schedule:(\d+)(?::organization-application:\d+)?(?::education-period:(\d+))?$/i,
  )
  const bareId = /^\d{4,}$/.test(trimmed) ? Number(trimmed) : null
  const scheduleId = scheduleMatch ? Number(scheduleMatch[1]) : bareId
  if (scheduleId == null || !Number.isFinite(scheduleId)) return undefined

  const periodRaw = scheduleMatch?.[2]
  const periodIndex = periodRaw != null ? Number(periodRaw) : undefined
  const hit = lookup.schedules?.find(row => {
    if (row.scheduleId !== scheduleId) return false
    if (periodIndex == null || !Number.isFinite(periodIndex)) return true
    return row.educationPeriodIndex == null || row.educationPeriodIndex === periodIndex
  })
  if (!hit) return undefined
  const periodLabel = readTrimmedString(hit.periodLabel)
  if (periodLabel) return normalizeScheduleDisplayLabel(periodLabel)
  return formatScheduleRangeLabel(hit)
}

/**
 * 신청 내용 「진행 희망 교육 일정」표시 문구.
 * opaque option_value는 프로그램 일정·교육 진행 예정일 라인으로 해석한다.
 */
export function resolvePreferredScheduleLabelsFromAnswers(input: {
  answers?: Record<string, unknown> | null
  preferredScheduleOptionValues?: readonly string[]
  educationScheduleLines?: readonly string[]
  schedules?: PreferredScheduleProgramLookup['schedules']
}): string[] {
  const lookup: PreferredScheduleProgramLookup = {
    educationScheduleLines: input.educationScheduleLines,
    schedules: input.schedules,
  }
  const optionValues =
    input.preferredScheduleOptionValues && input.preferredScheduleOptionValues.length > 0
      ? input.preferredScheduleOptionValues
      : collectPreferredScheduleOptionValues(input.answers)
  if (optionValues.length > 0) {
    return optionValues
      .map(value => resolveOneScheduleOptionToken(value, lookup))
      .filter((value): value is string => Boolean(value))
      .map(displayScheduleText)
  }
  const fallback = resolvePreferredEducationScheduleLabelFromAnswers(input.answers ?? undefined)
  if (!fallback) return []
  return fallback
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !isOpaqueScheduleOptionToken(line))
    .map(displayScheduleText)
}

export function resolvePreferredEducationScheduleDisplayLabel(input: {
  preferredEducationScheduleLabel?: string
  preferredScheduleOptionValues?: readonly string[]
  educationScheduleLines?: readonly string[]
  schedules?: PreferredScheduleProgramLookup['schedules']
}): string | undefined {
  const stored = input.preferredEducationScheduleLabel?.trim()
  if (stored && !isOpaqueScheduleOptionToken(stored)) {
    return mapStoredScheduleLabelToFormOptions(stored, input.educationScheduleLines) || undefined
  }

  const optionValues =
    input.preferredScheduleOptionValues && input.preferredScheduleOptionValues.length > 0
      ? input.preferredScheduleOptionValues
      : stored && isOpaqueScheduleOptionToken(stored)
        ? [stored]
        : []

  const lookup: PreferredScheduleProgramLookup = {
    educationScheduleLines: input.educationScheduleLines,
    schedules: input.schedules,
  }
  const labels = optionValues
    .map(value => resolveOneScheduleOptionToken(value, lookup))
    .filter((value): value is string => Boolean(value))
  return labels.length > 0 ? labels.join('\n') : undefined
}

export function resolveSelfIntroMotivationFromAnswers(
  answers: Record<string, unknown> | null | undefined,
): string | undefined {
  if (!answers) return undefined
  const direct = readTrimmedString(pickAnswer(answers, SELF_INTRO_ANSWER_KEYS))
  if (direct) return direct
  for (const key of VOLUNTEER_FREE_TEXT_KEYS) {
    const intro = parseVolunteerFreeTextIntro(answers[key])
    if (intro) return intro
  }
  return undefined
}

export function resolvePreferredEducationScheduleLabelFromAnswers(
  answers: Record<string, unknown> | null | undefined,
): string | undefined {
  if (!answers) return undefined
  for (const key of PREFERRED_SCHEDULE_ANSWER_KEYS) {
    if (!(key in answers)) continue
    const label = formatPreferredScheduleAnswer(answers[key])
    if (label) return displayScheduleText(label)
  }
  return undefined
}

export function resolveApplicationContentFromAnswers(
  answers: Record<string, unknown> | null | undefined,
): {
  selfIntroMotivation?: string
  preferredEducationScheduleLabel?: string
  preferredScheduleOptionValues?: string[]
} {
  const preferredScheduleOptionValues = collectPreferredScheduleOptionValues(answers)
  return {
    selfIntroMotivation: resolveSelfIntroMotivationFromAnswers(answers),
    preferredEducationScheduleLabel: resolvePreferredEducationScheduleLabelFromAnswers(answers),
    ...(preferredScheduleOptionValues.length > 0 ? { preferredScheduleOptionValues } : {}),
  }
}
