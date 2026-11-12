import { Fragment, useEffect, useMemo, useState } from 'react'
import { GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_IDS } from '@jakorea/form-schema/paragraph-ids/gemini-visiting-training-application-form-instructor-draft'
import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-instructor-draft'
import {
  formatDisplayClockLabel,
  formatDisplayDate,
  isScheduleDateLikeText,
  parseScheduleDisplayLabel,
} from '@/shared/lib/format-display-date'
import {
  isAutoMaterializedScheduleName,
  isDefaultEducationSlotName,
  stripAutoMaterializedScheduleNameFromLabel,
  stripDefaultEducationSlotNameFromLabel,
} from '@/shared/lib/education-schedule-name'
import {
  clampIsoMinDateToToday,
  isSeoulScheduleStartPassed,
} from '../../lib/apply-form-schedule'
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

function readIsoDateLike(value: unknown): string | undefined {
  return readIsoDateOnly(value) ?? seoulDateTimeParts(value)?.dateKey
}

function isEducationPeriodScheduleValue(id: string): boolean {
  return /:education-period:\d+$/i.test(id)
}

function optionMetadata(option: Record<string, unknown>): Record<string, unknown> {
  const meta = option.metadata
  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    return { ...option, ...(meta as Record<string, unknown>) }
  }
  return option
}

const SCHEDULE_DISPLAY_PLACEHOLDER = '미지정'

function isScheduleDisplayPlaceholder(value: string): boolean {
  const trimmed = value.trim()
  // 백엔드 자동 기본명(`공통 교육 예정 N`)도 표시하지 않는다.
  return (
    trimmed.length === 0 ||
    trimmed === SCHEDULE_DISPLAY_PLACEHOLDER ||
    isDefaultEducationSlotName(trimmed)
  )
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
  // 1순위: 서버 `timeRange`("HH:mm ~ HH:mm", Asia/Seoul). 기관 승인 일정(APPLICATION_MATERIALIZED)에만 오고,
  // 종일이면 키가 없다. 2순위: startAt·endAt을 서울 시각으로 계산. (label 파싱은 호출부 마지막 대체값)
  const serverTimeRange = readScheduleMetaString(option, meta, ['timeRange'])
  if (isTimeRangeLikeText(serverTimeRange)) return serverTimeRange.trim()
  const fromApi = readScheduleMetaString(option, meta, ['timeRange', 'timeLabel', 'time'])
  if (!end && fromApi) return fromApi
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
    (!isScheduleDateLikeText(labelParts.head) && !isAutoMaterializedScheduleName(labelParts.head)
      ? labelParts.head
      : '') ||
    ''
  const region =
    readScheduleRegion(option, meta) || readRegionFromLabelTail(labelParts.tail)
  const sessionLabel =
    sanitizeScheduleSessionLabel(readScheduleSessionLabel(option, meta)) ||
    sanitizeScheduleSessionLabel(parsedLabel.sessionLabel ?? '')
  const orgTitle = joinScheduleCardLine([schoolName, region])
  const serverTimeRange = readScheduleMetaString(option, meta, ['timeRange'])
  // 서버 라벨에 적힌 시각 범위(기관이 신청한 희망 일정 그대로)를 startAt 재계산보다 먼저 쓴다.
  // startAt 오프셋이 어긋나도(예: 09:00 → 18:00) 기관 희망 일정과 같은 시각을 보여 준다(QA 2026-11-13 1사1교 #11).
  const labelTimeRange =
    parsedLabel.timeRange && isTimeRangeLikeText(parsedLabel.timeRange) ? parsedLabel.timeRange : ''
  const timeRange = isTimeRangeLikeText(serverTimeRange)
    ? serverTimeRange.trim()
    : labelTimeRange
      ? labelTimeRange
      : parsedLabel.timeRange &&
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
  if (isAutoMaterializedScheduleName(trimmed)) return false
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
  // 카드 2행(detail)은 startAt·endAt 서울 시각 기준이다. 기관명이 없으면 1행으로 올라가므로 detail을 먼저 본다.
  const lines = resolveScheduleSlotCardLines(slot)
  for (const source of [slot.detail ?? '', lines.secondary ?? '', lines.primary ?? '']) {
    for (const part of source.split('|').map(value => value.trim())) {
      if (isTimeRangeLikeText(part)) return part
    }
  }
  const parsed = parseKoreanEducationScheduleLabel(slot.label)
  return parsed.timeRange ?? ''
}

function readSessionLabelForScheduleSummary(slot: ApplyInstructorScheduleSlot): string {
  const secondary = resolveScheduleSlotCardLines(slot).secondary ?? ''
  for (const part of secondary.split('|').map(value => value.trim())) {
    const session = sanitizeScheduleSessionLabel(part)
    if (session && !isAutoMaterializedScheduleName(session)) return session
  }
  const parsed = parseKoreanEducationScheduleLabel(slot.label)
  const session = sanitizeScheduleSessionLabel(parsed.sessionLabel ?? '')
  return isAutoMaterializedScheduleName(session) ? '' : session
}

function resolveScheduleSummaryDateKey(slot: ApplyInstructorScheduleSlot): string | undefined {
  if (slot.dateKey) return slot.dateKey
  return parseKoreanEducationScheduleLabel(slot.label).dateKey
}

function slotStartHHmm(slot: ApplyInstructorScheduleSlot): string | null {
  const range = resolveSlotChipTimeRange(slot)
  const match = range.match(/(\d{1,2}:\d{2})/)
  return match?.[1] ?? null
}

export function isApplyInstructorScheduleSlotPast(slot: ApplyInstructorScheduleSlot): boolean {
  const dateKey = resolveScheduleSummaryDateKey(slot) ?? null
  return isSeoulScheduleStartPassed(dateKey, slotStartHHmm(slot))
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

function readGeminiScheduleSource(
  option: Record<string, unknown>,
  meta: Record<string, unknown>,
): string {
  return String(option.source ?? meta.source ?? '')
    .trim()
    .toUpperCase()
}

/** 기관 승인 후 확정 연수·희망 일정 후보 모두 Gemini 강사 선택지로 본다. */
function isGeminiInstructorScheduleOption(
  id: string,
  option: Record<string, unknown>,
  meta: Record<string, unknown>,
): boolean {
  const source = readGeminiScheduleSource(option, meta)
  if (source === GEMINI_PREFERRED_SCHEDULE_SOURCE || source.startsWith('GEMINI')) return true
  if (/^gemini-preferred:/i.test(id)) return true
  if (option.trainingDate != null || meta.trainingDate != null) return true
  return false
}

function readGeminiScheduleDateKey(
  option: Record<string, unknown>,
  meta: Record<string, unknown>,
  start: { dateKey: string } | null,
  displayLabel: string,
): string | undefined {
  return (
    readIsoDateLike(meta.date) ??
    readIsoDateLike(option.date) ??
    readIsoDateLike(meta.trainingDate) ??
    readIsoDateLike(option.trainingDate) ??
    start?.dateKey ??
    parseKoreanEducationScheduleLabel(displayLabel).dateKey
  )
}

/** Gemini 승인 연수·희망 일정 — `기관 | n지망` / `n차시 | 10:00 ~ 12:00` */
function geminiPreferredScheduleSlotFromOption(
  option: Record<string, unknown>,
  meta: Record<string, unknown>,
  id: string,
  displayLabel: string,
): ApplyInstructorScheduleSlot | null {
  if (!isGeminiInstructorScheduleOption(id, option, meta)) return null
  const start = seoulDateTimeParts(option.startAt ?? meta.startAt)
  const end = seoulDateTimeParts(option.endAt ?? meta.endAt)
  const dateKey = readGeminiScheduleDateKey(option, meta, start, displayLabel)
  const rank = readPositiveInteger(option.preferenceRank ?? meta.preferenceRank)
  const sessionCount = readPositiveInteger(option.sessionCount ?? meta.sessionCount)
  const trainingTimeText = readScheduleMetaString(option, meta, [
    'trainingTimeText',
    'timeRange',
    'timeLabel',
  ])
  const timeRange =
    trainingTimeText ||
    (start ? buildScheduleTimeRangeLabel(option, meta, start, end, start.dateKey) : '')
  const organizationName = readScheduleMetaString(option, meta, ['organizationName'])
  const title = joinScheduleCardLine([organizationName, rank ? `${rank}지망` : ''])
  const detail = joinScheduleCardLine([sessionCount ? `${sessionCount}차시` : '', timeRange])
  return {
    id,
    label: displayLabel,
    dateKey,
    title: title || undefined,
    detail: detail || undefined,
  }
}

function runtimeScheduleSlotFromOption(
  option: Record<string, unknown>,
  id: string,
  label: string,
): ApplyInstructorScheduleSlot {
  const meta = optionMetadata(option)
  const rawLabel = label || String(option.label ?? option.option_label ?? '').trim()
  // 서버 라벨 끝의 자동 기본명(`| 공통 교육 예정 N`)·기관 승인 일정 내부명(`| 기관 확정 YYYY-MM-DD`)은 제거한다.
  // 신청 제출 시 selectedLabels가 이 라벨을 쓰므로 저장 문구에도 남지 않는다.
  const displayLabel = rawLabel
    ? stripAutoMaterializedScheduleNameFromLabel(stripDefaultEducationSlotNameFromLabel(rawLabel)) ||
      '교육 일정'
    : id
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

function readBindingOptionId(option: Record<string, unknown>): string {
  return String(
    option.id ?? option.option_value ?? option.optionValue ?? option.value ?? '',
  ).trim()
}

function readBindingOptionLabel(option: Record<string, unknown>): string {
  return String(
    option.label ?? option.option_label ?? option.optionLabel ?? '',
  ).trim()
}

function bindingOptionRows(row: Record<string, unknown>): Record<string, unknown>[] {
  const buckets = [row.items, row.options, row.scheduleOptions]
  const out: Record<string, unknown>[] = []
  const seen = new Set<string>()
  for (const bucket of buckets) {
    if (!Array.isArray(bucket)) continue
    for (const item of bucket) {
      if (!item || typeof item !== 'object') continue
      const option = item as Record<string, unknown>
      const id = readBindingOptionId(option)
      if (!id || seen.has(id)) continue
      seen.add(id)
      out.push(option)
    }
  }
  return out
}

function bindingOptionSlotsFromParagraphRow(
  row: Record<string, unknown>,
): ApplyInstructorScheduleSlot[] {
  return bindingOptionRows(row).map(option => {
    const id = readBindingOptionId(option)
    return runtimeScheduleSlotFromOption(option, id, readBindingOptionLabel(option) || id)
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
const GEMINI_INSTRUCTOR_AVAILABLE_SCHEDULE_ID =
  GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule
const GENERAL_INSTRUCTOR_AVAILABLE_SCHEDULE_ID =
  PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule

function paragraphIdOf(paragraph: unknown): string {
  if (!paragraph || typeof paragraph !== 'object') return ''
  return String((paragraph as { id?: unknown }).id ?? '').trim()
}

/** Gemini 강사 문항 키를 공통 강사 키보다 우선한다. 공통 키 optionCount=0 이어도 Gemini items를 쓴다. */
export function pickInstructorAvailableScheduleParagraph(
  paragraphs: readonly unknown[],
  preferGemini: boolean,
): unknown {
  const matches = paragraphs.filter(paragraph => {
    const id = paragraphIdOf(paragraph)
    return (
      id === GEMINI_INSTRUCTOR_AVAILABLE_SCHEDULE_ID ||
      id === GENERAL_INSTRUCTOR_AVAILABLE_SCHEDULE_ID
    )
  })
  if (preferGemini) {
    return (
      matches.find(paragraph => paragraphIdOf(paragraph) === GEMINI_INSTRUCTOR_AVAILABLE_SCHEDULE_ID) ??
      matches[0] ??
      null
    )
  }
  return (
    matches.find(paragraph => paragraphIdOf(paragraph) === GENERAL_INSTRUCTOR_AVAILABLE_SCHEDULE_ID) ??
    matches[0] ??
    null
  )
}

function collectBindingQuestionOptions(form: unknown, questionId: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = []
  const visit = (value: unknown, depth: number) => {
    if (!value || depth > 6) return
    if (Array.isArray(value)) {
      for (const item of value) visit(item, depth + 1)
      return
    }
    if (typeof value !== 'object') return
    const row = value as Record<string, unknown>
    const id = String(row.question_id ?? row.questionId ?? row.id ?? '').trim()
    if (id === questionId && (Array.isArray(row.options) || Array.isArray(row.items))) {
      out.push(row)
    }
    for (const nested of Object.values(row)) {
      if (nested && typeof nested === 'object') visit(nested, depth + 1)
    }
  }
  visit(form, 0)
  return out
}

export function readGeminiInstructorAvailableScheduleSlots(form: unknown): ApplyInstructorScheduleSlot[] {
  const paragraphBuckets: unknown[] = []
  const visitParagraphs = (value: unknown, depth: number) => {
    if (!value || depth > 5) return
    if (Array.isArray(value)) {
      if (value.some(item => paragraphIdOf(item) === GEMINI_INSTRUCTOR_AVAILABLE_SCHEDULE_ID)) {
        paragraphBuckets.push(...value)
      }
      for (const item of value) visitParagraphs(item, depth + 1)
      return
    }
    if (typeof value !== 'object') return
    const row = value as Record<string, unknown>
    if (Array.isArray(row.paragraphs)) visitParagraphs(row.paragraphs, depth + 1)
    if (row.form) visitParagraphs(row.form, depth + 1)
    if (row.data) visitParagraphs(row.data, depth + 1)
  }
  visitParagraphs(form, 0)
  const paragraph = pickInstructorAvailableScheduleParagraph(paragraphBuckets, true)
  const fromParagraph = readRuntimeInstructorScheduleSlots(paragraph) ?? []
  const fromQuestions = collectBindingQuestionOptions(
    form,
    GEMINI_INSTRUCTOR_AVAILABLE_SCHEDULE_ID,
  ).flatMap(row => bindingOptionSlotsFromParagraphRow(row))
  const byId = new Map<string, ApplyInstructorScheduleSlot>()
  for (const slot of [...fromParagraph, ...fromQuestions]) {
    if (!byId.has(slot.id)) byId.set(slot.id, slot)
  }
  return [...byId.values()]
}

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

export const GEMINI_INSTRUCTOR_AVAILABLE_SCHEDULE_EMPTY_MESSAGE =
  '선택 가능한 승인 연수가 없습니다.'

export const VOLUNTEER_ACTIVITY_SCHEDULE_EMPTY_MESSAGE =
  '선택 가능한 봉사 일정이 없습니다. 관리자에게 문의해 주세요.'

export function findIncompleteInstructorAvailableScheduleMessage(
  values: ApplyInstructorAvailableScheduleValues,
  slots: readonly ApplyInstructorScheduleSlot[],
  emptyMessage: string = INSTRUCTOR_AVAILABLE_SCHEDULE_EMPTY_MESSAGE,
): string | null {
  if (slots.length === 0) {
    return emptyMessage
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
  /** 선택지가 없을 때 슬롯 영역 안내. 없으면 `emptyMessage` */
  emptyHint?: string
  /** 선택 전 요약 힌트 */
  summaryEmptyHint?: string
  /** 강의·봉사(lecture) vs 면접(interview) 칩 시안 */
  slotChipStyle?: ApplyScheduleSlotChipStyle
}

const INSTRUCTOR_SCHEDULE_COPY: ApplyScheduleSlotPickerCopy = {
  calendarAriaLabel: '강의 진행 가능 일정 날짜',
  summaryLabel: '강의 진행 가능일',
  emptyMessage: INSTRUCTOR_AVAILABLE_SCHEDULE_EMPTY_MESSAGE,
  emptyHint:
    '기관 프로그램은 기관이 신청한 희망 일정 중 강의 진행이 가능한 일정을 모두 선택해 주세요.',
  summaryEmptyHint: '일정을 먼저 선택해 주세요.',
  slotChipStyle: 'lecture',
}

export const GEMINI_INSTRUCTOR_SCHEDULE_COPY: ApplyScheduleSlotPickerCopy = {
  calendarAriaLabel: '강의 진행 가능 일정 날짜',
  summaryLabel: '강의 진행 가능일',
  emptyMessage: GEMINI_INSTRUCTOR_AVAILABLE_SCHEDULE_EMPTY_MESSAGE,
  emptyHint: GEMINI_INSTRUCTOR_AVAILABLE_SCHEDULE_EMPTY_MESSAGE,
  summaryEmptyHint: '일정을 먼저 선택해 주세요.',
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
  minDate?: string | null
  maxDate?: string | null
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
  minDate = null,
  maxDate = null,
}: ApplyInstructorAvailableScheduleProps) {
  const selected = slots.filter(slot => value.selectedSlotIds.includes(slot.id))
  const showCalendar = slots.length > 0 && slots.every(slot => slot.dateKey != null)
  const selectableMinDate = clampIsoMinDateToToday(minDate)
  const anchorDateKey = firstSlotDateKey(slots) ?? selectableMinDate
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
    const slot = slots.find(item => item.id === slotId)
    if (slot && isApplyInstructorScheduleSlotPast(slot) && !value.selectedSlotIds.includes(slotId)) {
      return
    }
    const next = value.selectedSlotIds.includes(slotId)
      ? value.selectedSlotIds.filter(id => id !== slotId)
      : [...value.selectedSlotIds, slotId]
    onChange({ selectedSlotIds: next })
  }

  const noSlots = slots.length === 0
  const emptyMessage = noSlots
    ? (copy.emptyHint ?? copy.emptyMessage)
    : '이 날짜에 선택할 수 있는 일정이 없습니다.'
  const summaryEmptyHint = copy.summaryEmptyHint ?? '선택한 일정이 여기에 표시됩니다.'
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
            minDate={selectableMinDate}
            maxDate={maxDate}
            onSelectDate={setSelectedDateKey}
          />
        ) : null}
        <div
          className={[
            styles.slotGrid,
            slotChipInterview ? styles.slotGridInterview : undefined,
            noSlots ? styles.slotGridEmpty : undefined,
          ]
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
              const past = isApplyInstructorScheduleSlotPast(slot)
              const cardLines = resolveScheduleSlotCardLines(slot)
              return (
                <button
                  key={slot.id}
                  type="button"
                  role="listitem"
                  aria-pressed={active}
                  disabled={past && !active}
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
              <PFFormFieldHintText as="p">{summaryEmptyHint}</PFFormFieldHintText>
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
