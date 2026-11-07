import { getSeoulCalendarDate } from '@/shared/utils/date'
import type { ProgramFormBindingResponse } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingResponse'
import {
  isTitleWithPeriodParagraph,
  normalizeTitleWithPeriodParagraph,
} from '@/features/template/lib/title-with-period-settings'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import {
  DEFAULT_SATISFACTION_WINDOW_DAYS,
  readSatisfactionWindowDays,
} from './satisfaction-binding-contract'

export type SatisfactionFormEditSchedule = {
  id?: number | string | null
  startAt?: string | null
  endAt?: string | null
  startDate?: string | null
  endDate?: string | null
}

export type ResolveSatisfactionFormEditPeriodContext = {
  windowDays?: unknown
  targetScope?: string | null
  targetScopeId?: number | string | null
}

export type SatisfactionFormEditPeriod = {
  startAt: string
  endAt: string
}

const SEOUL_MIDNIGHT_PARTS = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Seoul',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

function readIso(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function coercePositiveInt(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 1) {
    return Math.trunc(value)
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed >= 1) return Math.trunc(parsed)
  }
  return undefined
}

function readScheduleInstant(schedule: SatisfactionFormEditSchedule): string | undefined {
  return (
    readIso(schedule.endAt) ??
    readIso(schedule.endDate) ??
    readIso(schedule.startAt) ??
    readIso(schedule.startDate)
  )
}

function addDaysToYmd(ymd: string, days: number): string | null {
  const [year, month, day] = ymd.split('-').map(Number)
  if (!year || !month || !day) return null
  const next = new Date(Date.UTC(year, month - 1, day + days))
  if (Number.isNaN(next.getTime())) return null
  return next.toISOString().slice(0, 10)
}

function seoulEndOfDayIso(ymd: string): string {
  return `${ymd}T23:59:59.999+09:00`
}

function isSeoulMidnight(iso: string): boolean {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return false
  const parts = SEOUL_MIDNIGHT_PARTS.formatToParts(date)
  const hour = Number(parts.find(part => part.type === 'hour')?.value)
  const minute = Number(parts.find(part => part.type === 'minute')?.value)
  const second = Number(parts.find(part => part.type === 'second')?.value)
  return (hour === 0 || hour === 24) && minute === 0 && second === 0
}

/** BE exclusive next-day 00:00 → 화면 마감 23:59:59 KST */
export function exclusiveMidnightToDisplayDeadline(iso: string): string {
  if (!isSeoulMidnight(iso)) return iso
  const ymd = getSeoulCalendarDate(new Date(iso))
  const previous = addDaysToYmd(ymd, -1)
  return previous ? seoulEndOfDayIso(previous) : iso
}

export function addSeoulCalendarDaysEndOfDay(iso: string, days: number): string | null {
  const ymd = getSeoulCalendarDate(new Date(iso))
  const next = addDaysToYmd(ymd, days)
  return next ? seoulEndOfDayIso(next) : null
}

export function findSatisfactionScheduleById(
  schedules: ReadonlyArray<SatisfactionFormEditSchedule>,
  id: number | string | null | undefined
): SatisfactionFormEditSchedule | undefined {
  const scopeId = coercePositiveInt(id)
  if (scopeId == null) return undefined
  return schedules.find(schedule => coercePositiveInt(schedule.id) === scopeId)
}

/** 일정별 등록 — 해당 슬롯 종료 시각부터 windowDays일째 23:59:59(KST). 템플릿 작성 기간은 쓰지 않는다. */
export function resolveSatisfactionCreateSubmissionPeriod(
  schedule: SatisfactionFormEditSchedule | null | undefined,
  windowDays: unknown
): { submissionStartAt: string; submissionEndAt: string } | null {
  const days = readSatisfactionWindowDays(windowDays)
  if (schedule == null || days == null) return null
  const sessionEnd = readScheduleInstant(schedule)
  if (sessionEnd == null) return null
  const endAt = addSeoulCalendarDaysEndOfDay(sessionEnd, days)
  if (endAt == null) return null
  return { submissionStartAt: sessionEnd, submissionEndAt: endAt }
}

function pickLatestSessionEndIso(
  schedules: ReadonlyArray<SatisfactionFormEditSchedule>
): string | undefined {
  let latest: { iso: string; time: number } | null = null
  for (const schedule of schedules) {
    const iso = readScheduleInstant(schedule)
    if (!iso) continue
    const time = new Date(iso).getTime()
    if (Number.isNaN(time)) continue
    if (latest == null || time > latest.time) latest = { iso, time }
  }
  return latest?.iso
}

function pickSessionEndIso(
  binding: ProgramFormBindingResponse,
  schedules: ReadonlyArray<SatisfactionFormEditSchedule>,
  context?: ResolveSatisfactionFormEditPeriodContext
): string | undefined {
  const scope = (context?.targetScope ?? binding.targetScope)?.trim().toUpperCase()
  const scopeId = coercePositiveInt(context?.targetScopeId ?? binding.targetScopeId)
  if (scope === 'SCHEDULE' && scopeId != null) {
    const matched = schedules.find(schedule => coercePositiveInt(schedule.id) === scopeId)
    const matchedIso = matched != null ? readScheduleInstant(matched) : undefined
    if (matchedIso) return matchedIso
  }

  return pickLatestSessionEndIso(schedules)
}

/**
 * 만족도조사 양식 편집에 넣을 진행일.
 * 바인딩 기간이 있으면 그것을 쓰고, exclusive 00:00 마감은 전날 23:59로 보여 준다.
 * 기간이 비어 있으면 교육 일정 종료 + 참여 기간(일)로 계산한다.
 */
export function resolveSatisfactionFormEditPeriod(
  binding: ProgramFormBindingResponse,
  schedules: ReadonlyArray<SatisfactionFormEditSchedule> = [],
  context?: ResolveSatisfactionFormEditPeriodContext
): SatisfactionFormEditPeriod | null {
  const start = readIso(binding.submissionStartAt)
  const displayEnd = readIso(binding.displayDeadlineAt)
  const storedEnd = readIso(binding.submissionEndAt)
  const endFromBinding = displayEnd ?? (storedEnd ? exclusiveMidnightToDisplayDeadline(storedEnd) : undefined)
  if (start && endFromBinding) return { startAt: start, endAt: endFromBinding }

  const formType = binding.formType?.trim().toUpperCase()
  const windowDays =
    readSatisfactionWindowDays(context?.windowDays) ??
    readSatisfactionWindowDays(
      (binding as { satisfactionWindowDays?: unknown }).satisfactionWindowDays
    ) ??
    (formType === 'SATISFACTION' ? DEFAULT_SATISFACTION_WINDOW_DAYS : null)
  const sessionEnd = pickSessionEndIso(binding, schedules, context)
  if (windowDays == null || sessionEnd == null) {
    if (start && storedEnd) return { startAt: start, endAt: exclusiveMidnightToDisplayDeadline(storedEnd) }
    return null
  }

  const computedEnd = addSeoulCalendarDaysEndOfDay(sessionEnd, windowDays)
  if (computedEnd == null) return null
  return {
    startAt: start ?? sessionEnd,
    endAt: endFromBinding ?? computedEnd,
  }
}

export function resolveSatisfactionPreviewPeriod(
  survey: {
    targetScope?: string | null
    targetScopeId?: number | string | null
    displayDeadlineAt?: string | null
    satisfactionWindowDays?: number | null
    submissionStartAt?: string | null
    submissionEndAt?: string | null
  },
  schedules: ReadonlyArray<SatisfactionFormEditSchedule> = []
): SatisfactionFormEditPeriod | null {
  return resolveSatisfactionFormEditPeriod(
    {
      formType: 'SATISFACTION',
      targetScope: survey.targetScope ?? undefined,
      targetScopeId:
        typeof survey.targetScopeId === 'number' ? survey.targetScopeId : undefined,
      displayDeadlineAt: survey.displayDeadlineAt,
      submissionStartAt: survey.submissionStartAt ?? undefined,
      submissionEndAt: survey.submissionEndAt ?? undefined,
      satisfactionWindowDays: survey.satisfactionWindowDays,
    },
    schedules,
    {
      windowDays: survey.satisfactionWindowDays,
      targetScope: survey.targetScope,
      targetScopeId: survey.targetScopeId,
    }
  )
}

export function applySurveyTitleCustomPeriodToDraft(
  draft: WritingFormDraft,
  period: SatisfactionFormEditPeriod | null | undefined
): WritingFormDraft {
  if (period == null) return draft
  let changed = false
  const paragraphs = draft.paragraphs.map(paragraph => {
    if (!isTitleWithPeriodParagraph(paragraph)) return paragraph
    changed = true
    return normalizeTitleWithPeriodParagraph({
      ...paragraph,
      showWritingPeriodOnForm: true,
      startPeriodMode: 'custom',
      endPeriodMode: 'custom',
      periodMode: 'custom',
      startAt: period.startAt,
      endAt: period.endAt,
      startPeriodPresetLabel: null,
      endPeriodPresetLabel: null,
    })
  })
  return changed ? { ...draft, paragraphs } : draft
}
