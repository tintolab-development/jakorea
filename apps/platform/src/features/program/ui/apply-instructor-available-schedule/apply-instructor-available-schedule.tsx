import { Fragment, useEffect, useMemo, useState } from 'react'
import {
  formatDisplayClockLabel,
  formatDisplayDate,
  isScheduleDateLikeText,
  parseScheduleDisplayLabel,
} from '@/shared/lib/format-display-date'
import { PFDatePickerCalendar } from '@/shared/ui/pf-date-input'
import {
  PFFormField,
  PFFormFieldHintText,
  PFFormFieldRow,
  PFFormFieldTable,
  PFFormFieldValueText,
  PFFormInlineRow,
  PFFormInlineSegment,
  PFFormInlineSeparator,
  PFText,
} from '@/shared/ui'
import styles from './apply-instructor-available-schedule.module.css'

export type ApplyInstructorScheduleSlot = {
  id: string
  label: string
  /** 일정 시작일 `YYYY-MM-DD` (Asia/Seoul) — 있으면 달력에서 날짜별로 노출 */
  dateKey?: string
  /** 카드 1행 — CMS `학교 | 지역` */
  title?: string
  /** 카드 2행 — CMS `차시 | 시간` */
  detail?: string
}

const SEOUL_PARTS_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const ISO_DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/

function readIsoDateOnly(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return ISO_DATE_ONLY_RE.test(trimmed) ? trimmed : undefined
}

function isEducationPeriodScheduleValue(id: string): boolean {
  return /:education-period:\d+$/i.test(id)
}

function optionMetadata(option: Record<string, unknown>): Record<string, unknown> {
  const meta = option.metadata
  return meta && typeof meta === 'object' && !Array.isArray(meta)
    ? (meta as Record<string, unknown>)
    : option
}

const SCHEDULE_DISPLAY_PLACEHOLDER = '미지정'

function isScheduleDisplayPlaceholder(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.length === 0 || trimmed === SCHEDULE_DISPLAY_PLACEHOLDER
}

function readScheduleMetaString(
  option: Record<string, unknown>,
  meta: Record<string, unknown>,
  keys: readonly string[],
): string {
  for (const key of keys) {
    const raw = option[key] ?? meta[key]
    if (typeof raw !== 'string') continue
    const trimmed = raw.trim()
    if (!isScheduleDisplayPlaceholder(trimmed)) return trimmed
  }
  return ''
}

function readScheduleRegion(
  option: Record<string, unknown>,
  meta: Record<string, unknown>,
): string {
  const direct = readScheduleMetaString(option, meta, [
    'region',
    'organizationRegion',
    'regionLabel',
    'location',
    'locationName',
  ])
  if (direct) return direct
  const sido = String(option.regionSido ?? meta.regionSido ?? '').trim()
  const sigungu = String(option.regionSigungu ?? meta.regionSigungu ?? '').trim()
  const parts = [sido, sigungu].filter(part => !isScheduleDisplayPlaceholder(part))
  return parts.join(' ')
}

function formatScheduleClockTime(hhmm: string): string {
  return formatDisplayClockLabel(hhmm)
}

function buildScheduleTimeRangeLabel(
  option: Record<string, unknown>,
  meta: Record<string, unknown>,
  start: { time: string },
  end: { time: string; dateKey: string } | null,
  startDateKey: string,
): string {
  const fromApi = readScheduleMetaString(option, meta, ['timeRange', 'timeLabel', 'time'])
  if (fromApi) return fromApi
  const allDay =
    end != null &&
    start.time === '00:00' &&
    end.time === '00:00' &&
    end.dateKey > startDateKey
  if (allDay) return '종일'
  if (end) {
    return `${formatScheduleClockTime(start.time)} ~ ${formatScheduleClockTime(end.time)}`
  }
  return formatScheduleClockTime(start.time)
}

function readScheduleSessionLabel(
  option: Record<string, unknown>,
  meta: Record<string, unknown>,
): string {
  const direct = readScheduleMetaString(option, meta, [
    'sessionLabel',
    'sessionName',
    'roundLabel',
    'curriculumSessionLabel',
  ])
  if (direct) return direct
  const round = option.sessionRound ?? meta.sessionRound ?? option.roundNumber ?? meta.roundNumber
  if (typeof round === 'number' && Number.isFinite(round) && round > 0) {
    return `${round}차시`
  }
  if (typeof round === 'string' && /^\d+$/.test(round.trim())) {
    return `${round.trim()}차시`
  }
  return ''
}

function joinScheduleCardLine(parts: readonly string[]): string {
  const seen = new Set<string>()
  return parts
    .map(part => part.trim())
    .filter(part => !isScheduleDisplayPlaceholder(part))
    .filter(part => {
      const key = part.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .join(' | ')
}

function isTimeRangeLikeText(value: string): boolean {
  return /\d{1,2}:\d{2}\s*~\s*\d{1,2}:\d{2}/.test(value.trim())
}

function readRegionFromLabelTail(tail: string): string {
  const trimmed = tail.trim()
  if (!trimmed || isScheduleDateLikeText(trimmed) || isTimeRangeLikeText(trimmed)) return ''
  return trimmed
}

function splitPipeLabel(label: string): { head: string; tail: string } {
  const segments = label
    .split('|')
    .map(part => part.trim())
    .filter(part => !isScheduleDisplayPlaceholder(part))
  if (segments.length >= 2) {
    const head = segments[0]!
    const tail = segments.slice(1).join(' | ')
    if (isScheduleDateLikeText(head)) return { head: '', tail: '' }
    return { head, tail }
  }
  if (segments.length === 1) return { head: segments[0]!, tail: '' }
  return { head: '', tail: '' }
}

function parseKoreanEducationScheduleLabel(raw: string) {
  return parseScheduleDisplayLabel(raw)
}

function sanitizeScheduleSessionLabel(value: string): string {
  const trimmed = value.trim()
  if (!trimmed || isScheduleDisplayPlaceholder(trimmed)) return ''
  if (isScheduleDateLikeText(trimmed) || isTimeRangeLikeText(trimmed)) return ''
  return trimmed
}

function buildScheduleSlotCardDisplay(
  option: Record<string, unknown>,
  meta: Record<string, unknown>,
  displayLabel: string,
  start: { dateKey: string; time: string } | null,
  end: { dateKey: string; time: string } | null,
): { dateKey?: string; title: string; detail?: string } {
  const parsedLabel = parseKoreanEducationScheduleLabel(displayLabel)
  const labelParts = splitPipeLabel(displayLabel)
  const schoolName =
    readScheduleMetaString(option, meta, ['organizationName', 'schoolName', 'school']) ||
    (!isScheduleDateLikeText(labelParts.head) ? labelParts.head : '') ||
    ''
  const region =
    readScheduleRegion(option, meta) || readRegionFromLabelTail(labelParts.tail)
  const sessionLabel =
    sanitizeScheduleSessionLabel(readScheduleSessionLabel(option, meta)) ||
    sanitizeScheduleSessionLabel(parsedLabel.sessionLabel ?? '')
  const orgTitle = joinScheduleCardLine([schoolName, region])
  const timeRange =
    parsedLabel.timeRange &&
    start &&
    start.time === '00:00' &&
    (end == null || end.time === '00:00')
      ? parsedLabel.timeRange
      : start
        ? buildScheduleTimeRangeLabel(option, meta, start, end, start.dateKey)
        : parsedLabel.timeRange ?? ''
  const detail = joinScheduleCardLine([sessionLabel, timeRange])
  const dateKey = start?.dateKey ?? parsedLabel.dateKey

  return {
    dateKey,
    title: orgTitle,
    detail: detail || undefined,
  }
}

function isOrgScheduleChipTitle(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (isScheduleDateLikeText(trimmed) || isTimeRangeLikeText(trimmed)) return false
  return true
}

function resolveSlotChipTimeRange(slot: ApplyInstructorScheduleSlot): string {
  const parsed = parseKoreanEducationScheduleLabel(slot.label)
  const candidates = [
    slot.detail ?? '',
    parsed.timeRange ?? '',
    slot.label,
  ]
  for (const candidate of candidates) {
    const timeRange = extractClockTimeRangeForSummary(candidate)
    if (isTimeRangeLikeText(timeRange)) return timeRange
    if (/^\d{1,2}:\d{2}$/.test(timeRange.trim())) {
      return formatScheduleClockTime(timeRange.trim())
    }
  }
  return ''
}

export function resolveScheduleSlotCardLines(slot: ApplyInstructorScheduleSlot): {
  primary: string
  secondary?: string
} {
  const title = slot.title?.trim() ?? ''
  const detail = slot.detail?.trim() ?? ''
  if (isOrgScheduleChipTitle(title)) {
    return { primary: title, secondary: detail || undefined }
  }

  const timeRange = resolveSlotChipTimeRange(slot)
  if (timeRange) return { primary: timeRange }

  if (detail && !isScheduleDateLikeText(detail)) return { primary: detail }
  return { primary: '' }
}

/** CMS `extractClockTimeRangeForScheduleSummary` — 요약 괄호 안 시각만 */
function extractClockTimeRangeForSummary(timeRange: string): string {
  const trimmed = timeRange.trim()
  let lastParenContent: string | undefined
  for (const match of trimmed.matchAll(/\(([^)]+)\)/g)) {
    lastParenContent = match[1]?.trim()
  }
  if (lastParenContent != null && /\d{1,2}:\d{2}/.test(lastParenContent)) {
    return lastParenContent.replace(/–/g, '-').replace(/\s*-\s*/g, ' ~ ')
  }
  const direct = trimmed.match(/(\d{1,2}:\d{2})\s*[-–~]\s*(\d{1,2}:\d{2})/)
  if (direct) {
    return `${formatScheduleClockTime(direct[1]!)} ~ ${formatScheduleClockTime(direct[2]!)}`
  }
  return trimmed.replace(/–/g, '-').replace(/\s*-\s*/g, ' ~ ')
}

function formatScheduleSummaryDateLabel(dateKey: string): string {
  return formatDisplayDate(dateKey)
}

function readSchoolNameForScheduleSummary(slot: ApplyInstructorScheduleSlot): string {
  const title = slot.title?.trim()
  if (title) {
    const school = title.split('|')[0]?.trim() ?? ''
    if (school && isOrgScheduleChipTitle(school)) return school
  }
  const labelHead = splitPipeLabel(slot.label).head
  if (labelHead && isOrgScheduleChipTitle(labelHead)) return labelHead
  return ''
}

function readTimeRangeForScheduleSummary(slot: ApplyInstructorScheduleSlot): string {
  const secondary = resolveScheduleSlotCardLines(slot).secondary ?? ''
  for (const part of secondary.split('|').map(value => value.trim())) {
    if (isTimeRangeLikeText(part)) return part
  }
  const parsed = parseKoreanEducationScheduleLabel(slot.label)
  return parsed.timeRange ?? ''
}

function readSessionLabelForScheduleSummary(slot: ApplyInstructorScheduleSlot): string {
  const secondary = resolveScheduleSlotCardLines(slot).secondary ?? ''
  for (const part of secondary.split('|').map(value => value.trim())) {
    const session = sanitizeScheduleSessionLabel(part)
    if (session) return session
  }
  const parsed = parseKoreanEducationScheduleLabel(slot.label)
  return sanitizeScheduleSessionLabel(parsed.sessionLabel ?? '')
}

function resolveScheduleSummaryDateKey(slot: ApplyInstructorScheduleSlot): string | undefined {
  if (slot.dateKey) return slot.dateKey
  return parseKoreanEducationScheduleLabel(slot.label).dateKey
}

/**
 * 하단 「강의 진행 가능일」 — `강서초등학교 : 2026년 3월 9일(월) 09:20 ~ 12:00`
 * (면접 등 기관명 없으면 `3차시 : …` 형태)
 */
export function formatApplyScheduleSummarySegment(slot: ApplyInstructorScheduleSlot): string {
  const dateKey = resolveScheduleSummaryDateKey(slot)
  const datePart = dateKey ? formatScheduleSummaryDateLabel(dateKey) : ''
  const timePart = extractClockTimeRangeForSummary(readTimeRangeForScheduleSummary(slot))
  const timeSuffix = timePart ? ` ${timePart}` : ''

  const school = readSchoolNameForScheduleSummary(slot)
  if (school && datePart) {
    return `${school} : ${datePart}${timeSuffix}`
  }

  const sessionLabel = readSessionLabelForScheduleSummary(slot)
  if (sessionLabel && datePart) {
    return `${sessionLabel} : ${datePart}${timeSuffix}`
  }

  if (datePart) {
    return `${datePart}${timeSuffix}`.trim()
  }

  return slot.label.trim()
}

function seoulDateTimeParts(value: unknown): { dateKey: string; time: string } | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const parts = Object.fromEntries(
    SEOUL_PARTS_FORMAT.formatToParts(date).map(part => [part.type, part.value]),
  )
  return {
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  }
}

const GEMINI_PREFERRED_SCHEDULE_SOURCE = 'GEMINI_PREFERRED_SCHEDULE'

function readPositiveInteger(value: unknown): number | undefined {
  const parsed = typeof value === 'string' && value.trim() ? Number(value) : value
  return typeof parsed === 'number' && Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

/** Gemini 승인 연수 희망 일정 후보 — `기관 | n지망` / `n차시 | 10:00 ~ 12:00` (scheduleId 없음) */
function geminiPreferredScheduleSlotFromOption(
  option: Record<string, unknown>,
  meta: Record<string, unknown>,
  id: string,
  displayLabel: string,
): ApplyInstructorScheduleSlot | null {
  if (meta.source !== GEMINI_PREFERRED_SCHEDULE_SOURCE) return null
  const start = seoulDateTimeParts(option.startAt ?? meta.startAt)
  const end = seoulDateTimeParts(option.endAt ?? meta.endAt)
  const dateKey = readIsoDateOnly(meta.date) ?? start?.dateKey
  const rank = readPositiveInteger(meta.preferenceRank)
  const sessionCount = readPositiveInteger(meta.sessionCount)
  const timeRange = start ? buildScheduleTimeRangeLabel(option, meta, start, end, start.dateKey) : ''
  const title = joinScheduleCardLine([
    readScheduleMetaString(option, meta, ['organizationName']),
    rank ? `${rank}지망` : '',
  ])
  const detail = joinScheduleCardLine([sessionCount ? `${sessionCount}차시` : '', timeRange])
  return {
    id,
    label: displayLabel,
    dateKey,
    title,
    detail: detail || undefined,
  }
}

function runtimeScheduleSlotFromOption(
  option: Record<string, unknown>,
  id: string,
  label: string,
): ApplyInstructorScheduleSlot {
  const meta = optionMetadata(option)
  const displayLabel = label || String(option.label ?? option.option_label ?? '').trim() || id
  const geminiPreferred = geminiPreferredScheduleSlotFromOption(option, meta, id, displayLabel)
  if (geminiPreferred) return geminiPreferred
  const isEducationPeriod =
    isEducationPeriodScheduleValue(id) || meta.educationPeriodIndex != null

  if (isEducationPeriod) {
    const periodStart =
      readIsoDateOnly(meta.periodStartDate) ?? readIsoDateOnly(option.periodStartDate)
    return {
      id,
      label: displayLabel,
      dateKey: periodStart,
      title: displayLabel,
    }
  }

  const start = seoulDateTimeParts(option.startAt ?? meta.startAt)
  const end = seoulDateTimeParts(option.endAt ?? meta.endAt)
  const card = buildScheduleSlotCardDisplay(option, meta, displayLabel, start, end)
  if (!card.dateKey && !start) {
    return { id, label: displayLabel }
  }
  return {
    id,
    label: displayLabel,
    dateKey: card.dateKey,
    title: card.title,
    detail: card.detail,
  }
}

export type ApplyInstructorAvailableScheduleValues = {
  selectedSlotIds: string[]
}

export function emptyInstructorAvailableSchedule(): ApplyInstructorAvailableScheduleValues {
  return { selectedSlotIds: [] }
}

export function buildInstructorApplyScheduleSlots(input: {
  educationScheduleLines?: readonly string[]
  educationSchedules?: readonly { label?: string; value?: string }[]
}): ApplyInstructorScheduleSlot[] {
  const lines = (input.educationScheduleLines ?? [])
    .map(line => line.trim())
    .filter(Boolean)
  if (lines.length > 0) {
    return lines.map((label, index) => {
      const parsed = parseKoreanEducationScheduleLabel(label)
      const detail = joinScheduleCardLine([parsed.sessionLabel ?? '', parsed.timeRange ?? ''])
      return {
        id: `line:${index}`,
        label,
        dateKey: parsed.dateKey,
        detail: detail || undefined,
      }
    })
  }
  return (input.educationSchedules ?? [])
    .map((row, index) => {
      const label = [row.label?.trim(), row.value?.trim()].filter(Boolean).join(' · ')
      if (!label) return null
      return { id: `edu:${index}`, label }
    })
    .filter((row): row is ApplyInstructorScheduleSlot => row != null)
}

function bindingOptionSlotsFromParagraphRow(
  row: Record<string, unknown>,
): ApplyInstructorScheduleSlot[] {
  const rawItems = Array.isArray(row.items)
    ? row.items
    : Array.isArray(row.options)
      ? row.options
      : []
  return rawItems.flatMap(item => {
    if (!item || typeof item !== 'object') return []
    const option = item as Record<string, unknown>
    const id = String(option.id ?? option.option_value ?? '').trim()
    const label = String(option.label ?? option.option_label ?? '').trim()
    return id ? [runtimeScheduleSlotFromOption(option, id, label || id)] : []
  })
}

/**
 * form-bindings 동적 선택지 — 면접·봉사 일정 등 (`items[].id` / `options[].option_value`).
 * `runtimeResolved` 없이도 items가 있으면 파싱한다.
 */
export function readPortalApplicationBindingOptionSlots(
  paragraph: unknown,
): ApplyInstructorScheduleSlot[] {
  if (!paragraph || typeof paragraph !== 'object') return []
  return bindingOptionSlotsFromParagraphRow(paragraph as Record<string, unknown>)
}

/**
 * form-bindings 응답의 강사 일정 런타임 선택지 (`items[].id/label` 또는 `options[].option_value/option_label`).
 * `runtimeResolved`가 없는 문항은 런타임 선택지 대상이 아니므로 null.
 * GENERAL_ORGANIZATION 강사/봉사는 호출측에서 null을 프로그램 공통 일정으로 대체하지 않는다.
 */
export function readRuntimeInstructorScheduleSlots(
  paragraph: unknown,
): ApplyInstructorScheduleSlot[] | null {
  if (!paragraph || typeof paragraph !== 'object') return null
  const row = paragraph as Record<string, unknown>
  if (typeof row.runtimeResolved !== 'boolean') {
    const fromItems = bindingOptionSlotsFromParagraphRow(row)
    return fromItems.length > 0 ? fromItems : null
  }
  return bindingOptionSlotsFromParagraphRow(row)
}

/**
 * 강사·봉사자 일정 선택지.
 * remote / OSA 는 프로그램 상세 표시용 일정을 fallback 하지 않는다.
 */
export function resolveApplyAvailableScheduleSlots(input: {
  runtimeSlots: ApplyInstructorScheduleSlot[] | null
  allowProgramDisplayFallback: boolean
  program?: {
    educationScheduleLines?: readonly string[]
    educationSchedules?: readonly { label?: string; value?: string }[]
  } | null
}): ApplyInstructorScheduleSlot[] {
  if (!input.allowProgramDisplayFallback) return input.runtimeSlots ?? []
  return (
    input.runtimeSlots ??
    (input.program
      ? buildInstructorApplyScheduleSlots({
          educationScheduleLines: input.program.educationScheduleLines,
          educationSchedules: input.program.educationSchedules,
        })
      : [])
  )
}

/** 런타임 선택지 제출값 — 백엔드는 목록에 있는 `option_value` 배열만 받는다. */
export function instructorAvailableScheduleOptionValues(
  values: ApplyInstructorAvailableScheduleValues,
  slots: readonly ApplyInstructorScheduleSlot[],
): string[] {
  return slots.filter(slot => values.selectedSlotIds.includes(slot.id)).map(slot => slot.id)
}

export const INSTRUCTOR_AVAILABLE_SCHEDULE_EMPTY_MESSAGE =
  '선택 가능한 강의 일정이 없습니다. 관리자에게 문의해 주세요.'

export const VOLUNTEER_ACTIVITY_SCHEDULE_EMPTY_MESSAGE =
  '선택 가능한 봉사 일정이 없습니다. 관리자에게 문의해 주세요.'

export function findIncompleteInstructorAvailableScheduleMessage(
  values: ApplyInstructorAvailableScheduleValues,
  slots: readonly ApplyInstructorScheduleSlot[],
): string | null {
  if (slots.length === 0) {
    return INSTRUCTOR_AVAILABLE_SCHEDULE_EMPTY_MESSAGE
  }
  if (!slots.some(slot => values.selectedSlotIds.includes(slot.id))) {
    return '강의 진행이 가능한 일정을 하나 이상 선택해 주세요.'
  }
  return null
}

export function instructorAvailableScheduleAnswerFromValues(
  values: ApplyInstructorAvailableScheduleValues,
  slots: readonly ApplyInstructorScheduleSlot[],
): Record<string, unknown> {
  const selected = slots.filter(slot => values.selectedSlotIds.includes(slot.id))
  const selectedLabels = selected.map(slot => slot.label)
  const summarySegments = selected.map(slot => formatApplyScheduleSummarySegment(slot))
  return {
    selectedSlotIds: selected.map(slot => slot.id),
    selectedLabels,
    summary: summarySegments.join(' | '),
  }
}

export function instructorAvailableScheduleValuesFromDraftAnswer(
  answer: unknown,
): ApplyInstructorAvailableScheduleValues | null {
  if (typeof answer === 'string' && answer.trim()) {
    return null
  }
  if (Array.isArray(answer)) {
    const ids = answer.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    return ids.length > 0 ? { selectedSlotIds: ids } : null
  }
  if (!answer || typeof answer !== 'object') return null
  const row = answer as Record<string, unknown>
  const ids = Array.isArray(row.selectedSlotIds)
    ? row.selectedSlotIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    : []
  if (ids.length === 0) return null
  return { selectedSlotIds: ids }
}

export type ApplyScheduleSlotChipStyle = 'lecture' | 'interview'

export type ApplyScheduleSlotPickerCopy = {
  calendarAriaLabel: string
  summaryLabel: string
  emptyMessage: string
  /** 강의·봉사(lecture) vs 면접(interview) 칩 시안 */
  slotChipStyle?: ApplyScheduleSlotChipStyle
}

const INSTRUCTOR_SCHEDULE_COPY: ApplyScheduleSlotPickerCopy = {
  calendarAriaLabel: '강의 진행 가능 일정 날짜',
  summaryLabel: '강의 진행 가능일',
  emptyMessage: INSTRUCTOR_AVAILABLE_SCHEDULE_EMPTY_MESSAGE,
  slotChipStyle: 'lecture',
}

export const INDIVIDUAL_INTERVIEW_SCHEDULE_COPY: ApplyScheduleSlotPickerCopy = {
  calendarAriaLabel: '면접 진행 가능 일정 날짜',
  summaryLabel: '면접 진행 가능일',
  emptyMessage: '선택 가능한 면접 일정이 없습니다.',
  slotChipStyle: 'interview',
}

/** 봉사자 신청 — CMS `VolunteerActivityAvailableScheduleParagraph` (강사 일정 UI 재사용) */
export const VOLUNTEER_ACTIVITY_SCHEDULE_COPY: ApplyScheduleSlotPickerCopy = {
  calendarAriaLabel: '봉사 진행 가능 일정 날짜',
  summaryLabel: '봉사 진행 가능일',
  emptyMessage: VOLUNTEER_ACTIVITY_SCHEDULE_EMPTY_MESSAGE,
  slotChipStyle: 'lecture',
}

export function findIncompleteVolunteerActivityScheduleMessage(
  values: ApplyInstructorAvailableScheduleValues,
  slots: readonly ApplyInstructorScheduleSlot[],
): string | null {
  if (slots.length === 0) {
    return VOLUNTEER_ACTIVITY_SCHEDULE_EMPTY_MESSAGE
  }
  if (!slots.some(slot => values.selectedSlotIds.includes(slot.id))) {
    return '봉사 진행이 가능한 일정을 하나 이상 선택해 주세요.'
  }
  return null
}

/** 개인 신청 면접 — 선택지는 `interview-slot:{id}` 문자열 그대로 제출 */
export function findIncompleteInterviewScheduleMessage(
  values: ApplyInstructorAvailableScheduleValues,
  slots: readonly ApplyInstructorScheduleSlot[],
): string | null {
  if (slots.length === 0) {
    return '선택 가능한 면접 일정이 없습니다. 관리자에게 문의해 주세요.'
  }
  if (!slots.some(slot => values.selectedSlotIds.includes(slot.id))) {
    return '면접 진행이 가능한 일정을 하나 이상 선택해 주세요.'
  }
  return null
}

type ApplyInstructorAvailableScheduleProps = {
  slots: readonly ApplyInstructorScheduleSlot[]
  value: ApplyInstructorAvailableScheduleValues
  onChange: (next: ApplyInstructorAvailableScheduleValues) => void
  copy?: ApplyScheduleSlotPickerCopy
}

function firstSlotDateKey(slots: readonly ApplyInstructorScheduleSlot[]): string | null {
  const keys = slots.flatMap(slot => (slot.dateKey ? [slot.dateKey] : [])).sort()
  return keys[0] ?? null
}

function monthStartOf(dateKey: string | null): Date {
  const now = new Date()
  if (!dateKey) return new Date(now.getFullYear(), now.getMonth(), 1)
  const [year, month] = dateKey.split('-').map(Number)
  return new Date(year!, month! - 1, 1)
}

export function ApplyInstructorAvailableSchedule({
  slots,
  value,
  onChange,
  copy = INSTRUCTOR_SCHEDULE_COPY,
}: ApplyInstructorAvailableScheduleProps) {
  const selected = slots.filter(slot => value.selectedSlotIds.includes(slot.id))
  const showCalendar = slots.length > 0 && slots.every(slot => slot.dateKey != null)
  const anchorDateKey = firstSlotDateKey(slots)
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(anchorDateKey)

  useEffect(() => {
    setSelectedDateKey(anchorDateKey)
  }, [anchorDateKey])

  const markedDates = useMemo(
    () => new Set(slots.flatMap(slot => (slot.dateKey ? [slot.dateKey] : []))),
    [slots],
  )
  const visibleSlots = showCalendar
    ? slots.filter(slot => slot.dateKey === selectedDateKey)
    : slots

  const toggle = (slotId: string) => {
    const next = value.selectedSlotIds.includes(slotId)
      ? value.selectedSlotIds.filter(id => id !== slotId)
      : [...value.selectedSlotIds, slotId]
    onChange({ selectedSlotIds: next })
  }

  const emptyMessage =
    slots.length === 0 ? copy.emptyMessage : '이 날짜에 선택할 수 있는 일정이 없습니다.'
  const slotChipStyle = copy.slotChipStyle ?? 'lecture'
  const slotChipInterview = slotChipStyle === 'interview'

  return (
    <div className={styles.root}>
      <div className={showCalendar ? styles.scheduleTop : undefined}>
        {showCalendar ? (
          <PFDatePickerCalendar
            key={anchorDateKey ?? 'empty'}
            inline
            variant="applySchedule"
            className={styles.calendar}
            aria-label={copy.calendarAriaLabel}
            selectedDate={selectedDateKey}
            initialViewMonth={monthStartOf(anchorDateKey)}
            markedDates={markedDates}
            enabledDates={markedDates}
            onSelectDate={setSelectedDateKey}
          />
        ) : null}
        <div
          className={[styles.slotGrid, slotChipInterview ? styles.slotGridInterview : undefined]
            .filter(Boolean)
            .join(' ')}
          role="list"
        >
          {visibleSlots.length === 0 ? (
            <PFText as="p" typo="bd-md-md" color="neutral-cool-600" className={styles.empty}>
              {emptyMessage}
            </PFText>
          ) : (
            visibleSlots.map(slot => {
              const active = value.selectedSlotIds.includes(slot.id)
              const cardLines = resolveScheduleSlotCardLines(slot)
              return (
                <button
                  key={slot.id}
                  type="button"
                  role="listitem"
                  aria-pressed={active}
                  className={[
                    styles.slotCard,
                    slotChipInterview ? styles.slotCardInterview : undefined,
                    active ? styles.slotCardActive : undefined,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => toggle(slot.id)}
                >
                  {cardLines.primary ? (
                    <span className={styles.slotCardTitle}>{cardLines.primary}</span>
                  ) : null}
                  {cardLines.secondary ? (
                    <span className={styles.slotCardDetail}>{cardLines.secondary}</span>
                  ) : null}
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* CMS DetailInfoForm.Row type="single" + TdDivider 요약 */}
      <PFFormFieldTable className={styles.summary}>
        <PFFormFieldRow type="single">
          <PFFormField label={copy.summaryLabel}>
            {selected.length === 0 ? (
              <PFFormFieldHintText as="p">선택한 일정이 여기에 표시됩니다.</PFFormFieldHintText>
            ) : (
              <PFFormInlineRow>
                {selected.map((slot, index) => (
                  <Fragment key={slot.id}>
                    {index > 0 ? <PFFormInlineSeparator /> : null}
                    <PFFormInlineSegment>
                      <PFFormFieldValueText>
                        {formatApplyScheduleSummarySegment(slot)}
                      </PFFormFieldValueText>
                    </PFFormInlineSegment>
                  </Fragment>
                ))}
              </PFFormInlineRow>
            )}
          </PFFormField>
        </PFFormFieldRow>
      </PFFormFieldTable>
    </div>
  )
}
