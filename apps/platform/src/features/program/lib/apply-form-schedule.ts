/**
 * 일반 프로그램 신청 폼 — 진행 희망 교육 일정.
 * SSOT: `@jakorea/form-schema/program-application`
 */

import {
  APPLICATION_SCHEDULE_CHOICE_PARAGRAPH_IDS,
  applicationScheduleVisibilityFromRuntimeContext,
  countUniqueEducationScheduleCalendarDays,
  institutionFixedScheduleOptionToken,
  isApplicationScheduleChoiceParagraphId,
  isInstitutionApplyScheduleChoiceParagraphId,
  mergeApplicationScheduleVisibilityInput,
  normalizeInstitutionFixedScheduleAnswerTokens,
  readApplicationScheduleInputMode,
  readInstitutionFixedScheduleChoiceItems,
  shouldShowApplicationPreferredScheduleParagraph,
  shouldShowApplicationScheduleParagraph,
  syncApplicationScheduleChoiceParagraphsInDraft,
  type ReadInstitutionFixedScheduleChoiceOptions,
} from '@jakorea/form-schema/program-application'
import type { WritingFormDraft } from '@jakorea/form-schema/writing-form'
import type {
  ProgramDetail,
  ProgramEducationScheduleMode,
  ProgramEducationStructure,
  ProgramSessionRound,
} from '../model/types.ts'

export const APPLY_SCHEDULE_CHOICE_PARAGRAPH_IDS = APPLICATION_SCHEDULE_CHOICE_PARAGRAPH_IDS

export function isApplyScheduleChoiceParagraphId(id: string): boolean {
  return isApplicationScheduleChoiceParagraphId(id)
}

export type ApplyScheduleProgramFields = Pick<
  ProgramDetail,
  | 'educationStructure'
  | 'sessionRound'
  | 'educationScheduleMode'
  | 'educationScheduleLines'
  | 'maxPreferredScheduleCount'
>

export { countUniqueEducationScheduleCalendarDays }

export type ApplyScheduleVisibilityFields = {
  educationStructure?: ProgramEducationStructure
  sessionRound?: ProgramSessionRound
  educationScheduleMode?: ProgramEducationScheduleMode
  educationScheduleLines?: readonly string[]
}

export function shouldShowApplyScheduleParagraph(program: ApplyScheduleVisibilityFields): boolean {
  return shouldShowApplicationScheduleParagraph(program)
}

export function applyScheduleVisibilityFieldsFromRuntimeContext(runtime: unknown) {
  return applicationScheduleVisibilityFromRuntimeContext(runtime)
}

export function mergeApplyScheduleVisibilityFields(
  runtime: unknown,
  program?: ApplyScheduleVisibilityFields
): ApplyScheduleVisibilityFields {
  return mergeApplicationScheduleVisibilityInput({
    runtime,
    program,
    educationScheduleLines: program?.educationScheduleLines,
  })
}

export type ApplyScheduleInputMode = 'date_time_requests' | 'fixed_schedule_options'

export type ApplyScheduleDateBounds = {
  minScheduleDate: string | null
  maxScheduleDate: string | null
}

export type ApplySchedulePeriodBounds = {
  startDate: string
  endDate: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function readIsoDateOrNull(value: unknown): string | null {
  if (value == null) return null
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return ISO_DATE_RE.test(trimmed) ? trimmed : null
}

export function readApplyScheduleInputMode(
  runtime: unknown,
  paragraph?: unknown
): ApplyScheduleInputMode | null {
  return readApplicationScheduleInputMode(runtime, paragraph)
}

function parseLocalIsoDate(iso: string): Date | null {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
  return new Date(year, month - 1, day)
}

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function readSchedulePeriodBoundsList(raw: unknown): ApplySchedulePeriodBounds[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const periods: ApplySchedulePeriodBounds[] = []
  for (const item of raw) {
    if (!isRecord(item)) continue
    const startDate = readIsoDateOrNull(item.startDate)
    const endDate = readIsoDateOrNull(item.endDate)
    if (startDate && endDate) periods.push({ startDate, endDate })
  }
  return periods
}

export function readInstitutionAllowedSchedulePeriods(
  runtime: unknown,
  paragraph?: unknown
): ApplySchedulePeriodBounds[] | null {
  const fromParagraph =
    isRecord(paragraph) && 'runtimeAllowedSchedulePeriods' in paragraph
      ? readSchedulePeriodBoundsList(paragraph.runtimeAllowedSchedulePeriods)
      : undefined
  const fromRuntime =
    isRecord(runtime) && 'allowedSchedulePeriods' in runtime
      ? readSchedulePeriodBoundsList(runtime.allowedSchedulePeriods)
      : undefined
  const raw = fromParagraph !== undefined ? fromParagraph : fromRuntime
  if (raw === undefined) return null
  return raw
}

export function shouldUseInstitutionAllowedSchedulePeriodDates(
  periods: ApplySchedulePeriodBounds[] | null
): boolean {
  return periods != null && periods.length > 0
}

export function buildEnabledDatesFromAllowedSchedulePeriods(
  periods: readonly ApplySchedulePeriodBounds[]
): ReadonlySet<string> {
  const set = new Set<string>()
  for (const period of periods) {
    let cursor = parseLocalIsoDate(period.startDate)
    const end = parseLocalIsoDate(period.endDate)
    if (!cursor || !end) continue
    while (cursor <= end) {
      set.add(toLocalIsoDate(cursor))
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)
    }
  }
  return set
}

export function readInstitutionApplyScheduleDateBounds(
  runtime: unknown,
  paragraph?: unknown
): ApplyScheduleDateBounds {
  const paragraphMin = isRecord(paragraph) ? readIsoDateOrNull(paragraph.runtimeMinDate) : null
  const paragraphMax = isRecord(paragraph) ? readIsoDateOrNull(paragraph.runtimeMaxDate) : null
  const runtimeMin = isRecord(runtime) ? readIsoDateOrNull(runtime.minScheduleDate) : null
  const runtimeMax = isRecord(runtime) ? readIsoDateOrNull(runtime.maxScheduleDate) : null
  return {
    minScheduleDate: paragraphMin ?? runtimeMin,
    maxScheduleDate: paragraphMax ?? runtimeMax,
  }
}

export {
  isInstitutionApplyScheduleChoiceParagraphId,
  institutionFixedScheduleOptionToken,
  normalizeInstitutionFixedScheduleAnswerTokens,
  readInstitutionFixedScheduleChoiceItems,
  type ReadInstitutionFixedScheduleChoiceOptions,
}

export function shouldShowApplyPreferredSchedule(program: ApplyScheduleVisibilityFields): boolean {
  return shouldShowApplicationPreferredScheduleParagraph(program)
}

export function applyScheduleParagraphsForProgram(
  draft: WritingFormDraft,
  program: ApplyScheduleProgramFields
): WritingFormDraft {
  return syncApplicationScheduleChoiceParagraphsInDraft(draft, {
    educationStructure: program.educationStructure ?? 'curriculum',
    sessionRound: program.sessionRound ?? 'single',
    educationScheduleMode: program.educationScheduleMode ?? 'date',
    educationScheduleLines: program.educationScheduleLines ?? [],
  })
}
