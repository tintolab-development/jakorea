/**
 * 일반 프로그램 신청 폼 — 진행 희망 교육 일정.
 * SSOT: `@jakorea/form-schema/program-application`
 */

import {
  APPLICATION_SCHEDULE_CHOICE_PARAGRAPH_IDS,
  applicationScheduleVisibilityFromRuntimeContext,
  countUniqueEducationScheduleCalendarDays,
  expandEducationScheduleChoiceSlots,
  extractEducationScheduleCalendarDates,
  institutionFixedScheduleOptionToken,
  isApplicationScheduleChoiceParagraphId,
  isInstitutionApplyScheduleChoiceParagraphId,
  mergeApplicationScheduleVisibilityInput,
  normalizeInstitutionFixedScheduleAnswerTokens as normalizeInstitutionFixedScheduleAnswerTokensFromSchema,
  readApplicationScheduleInputMode,
  readApplicationScheduleRecruitmentLimitsFromRuntime,
  readInstitutionFixedScheduleChoiceItems as readInstitutionFixedScheduleChoiceItemsFromSchema,
  readRuntimeFixedScheduleChoiceItems as readRuntimeFixedScheduleChoiceItemsFromSchema,
  shouldShowApplicationMaxSessionsPerDayField,
  shouldShowApplicationPreferredScheduleSessionSelect,
  isApplicationScheduleParagraphForcedHidden,
  shouldShowApplicationPreferredScheduleParagraph,
  shouldShowApplicationScheduleParagraph,
  shouldShowApplicationSchedulePeriodDateOnlyPreferred,
  syncApplicationScheduleChoiceParagraphsInDraft,
  type ReadInstitutionFixedScheduleChoiceOptions,
  type RuntimeFixedScheduleChoiceItem,
} from '@jakorea/form-schema/program-application'
import {
  appendEducationRoundSuffix,
  stripDefaultEducationSlotNameFromLabel,
} from '../../../shared/lib/education-schedule-name.ts'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-individual-draft'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import type { WritingFormDraft } from '@jakorea/form-schema/writing-form'
import { readApplyScheduleMetaFromProgram } from './apply-form-schedule-meta.ts'
import type { ApplyPreferredScheduleBlock } from '../ui/apply-preferred-schedule/apply-preferred-schedule'
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
  | 'maxSessionsPerDay'
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

export function isApplyScheduleParagraphForcedHidden(
  program: ApplyScheduleVisibilityFields,
): boolean {
  return isApplicationScheduleParagraphForcedHidden(program)
}

function uniqueTrimmedIds(values: readonly string[]): string[] {
  const seen = new Set<string>()
  const ids: string[] = []
  for (const value of values) {
    const id = value.trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
  }
  return ids
}

function readParagraphItemIds(paragraph: unknown): string[] {
  if (!paragraph || typeof paragraph !== 'object' || Array.isArray(paragraph)) return []
  const items = (paragraph as { items?: unknown }).items
  if (!Array.isArray(items)) return []
  return uniqueTrimmedIds(
    items.map(item => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return ''
      const id = (item as { id?: unknown }).id
      return typeof id === 'string' ? id : ''
    }),
  )
}

/** 렌더와 같은 순서로 고정 일정 선택지 id를 모은다. */
export function readApplyFixedScheduleChoiceIds(input: {
  runtime?: unknown
  paragraph?: unknown
  runtimeChoices?: readonly { id: string }[] | null
  program?: ApplyScheduleVisibilityFields
  educationScheduleLines?: readonly string[]
}): string[] {
  const fromRuntimeChoices = uniqueTrimmedIds(
    (input.runtimeChoices ?? []).map(choice => choice.id),
  )
  if (fromRuntimeChoices.length > 0) return fromRuntimeChoices

  const fromItems = readInstitutionFixedScheduleChoiceItems(input.runtime, input.paragraph, {
    educationStructure: input.program?.educationStructure,
    sessionRound: input.program?.sessionRound,
    educationScheduleMode: input.program?.educationScheduleMode,
    educationScheduleLines:
      input.educationScheduleLines ?? input.program?.educationScheduleLines,
  })
  if (fromItems && fromItems.length > 0) {
    return uniqueTrimmedIds(fromItems.map(item => item.id))
  }

  return readParagraphItemIds(input.paragraph)
}

/**
 * FE가 진행 희망 교육 일정을 숨긴 경우 서버 필수 검증용 자동 제출 id.
 * 강제 숨김(일정형+복수)은 슬롯을 전부, 그 외 숨김은 유일한 슬롯 1개만 보낸다.
 */
export function resolveHiddenScheduleAutoSubmitIds(input: {
  hidden: boolean
  forcedHidden: boolean
  choiceIds: readonly string[]
}): string[] | null {
  if (!input.hidden) return null
  const ids = uniqueTrimmedIds(input.choiceIds)
  if (ids.length === 0) return null
  if (input.forcedHidden) return ids
  if (ids.length === 1) return ids
  return null
}

function readUnknownParagraphId(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ''
  const id = (value as { id?: unknown }).id
  return typeof id === 'string' ? id.trim() : ''
}

/** hidden set에 개인·기관 일정 단락 id가 있으면 draft에서 빠져도 숨김으로 본다. */
export function isApplyScheduleChoiceHiddenInSet(
  hiddenParagraphIds: ReadonlySet<string>,
  paragraphOrId?: unknown,
): boolean {
  const paragraphId = readUnknownParagraphId(paragraphOrId)
  if (paragraphId && hiddenParagraphIds.has(paragraphId)) return true
  for (const id of APPLY_SCHEDULE_CHOICE_PARAGRAPH_IDS) {
    if (hiddenParagraphIds.has(id)) return true
  }
  return false
}

/** display draft에 없으면 form-bindings 원본 단락을 쓴다. */
export function pickApplyScheduleChoiceParagraph(
  draftParagraphs: readonly { id: string }[] | null | undefined,
  formParagraphs: readonly unknown[] | null | undefined,
): unknown {
  const fromDraft = draftParagraphs?.find(paragraph =>
    isApplyScheduleChoiceParagraphId(paragraph.id),
  )
  if (fromDraft) return fromDraft
  if (!Array.isArray(formParagraphs)) return undefined
  return formParagraphs.find(paragraph => {
    if (!paragraph || typeof paragraph !== 'object' || Array.isArray(paragraph)) return false
    return isApplyScheduleChoiceParagraphId(String((paragraph as { id?: unknown }).id ?? ''))
  })
}

export function resolveApplyScheduleChoiceAnswerKey(
  applyCase: string | null | undefined,
  paragraph?: unknown,
): string {
  if (paragraph && typeof paragraph === 'object' && !Array.isArray(paragraph)) {
    const row = paragraph as Record<string, unknown>
    for (const name of ['questionKey', 'fieldKey', 'key', 'name', 'id'] as const) {
      const value = row[name]
      if (typeof value === 'string' && value.trim()) return value.trim()
    }
  }
  if (applyCase === 'institution-general') {
    return PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice
  }
  if (applyCase === 'individual-general' || applyCase === 'individual-team') {
    return PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice
  }
  return ''
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

export type ApplyRuntimeScheduleConfig = {
  scheduleInputMode: ApplyScheduleInputMode | null
  allowedSchedulePeriods: ApplySchedulePeriodBounds[] | null
  minScheduleDate: string | null
  maxScheduleDate: string | null
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

/**
 * Portal form-bindings 일정 계약만 읽는다.
 * 프로그램 상세 `educationScheduleLines` / 사업기간 / `schedules[].startAt|endAt` 은 사용하지 않는다.
 * 단락·runtimeContext 중 비어 있지 않은 `allowedSchedulePeriods`를 우선한다.
 */
export function readRuntimeScheduleConfig(
  runtime: unknown,
  paragraph?: unknown
): ApplyRuntimeScheduleConfig {
  const record = isRecord(runtime) ? runtime : null
  const paragraphRecord = isRecord(paragraph) ? paragraph : null
  const fromParagraphPeriods =
    paragraphRecord && 'runtimeAllowedSchedulePeriods' in paragraphRecord
      ? readSchedulePeriodBoundsList(paragraphRecord.runtimeAllowedSchedulePeriods)
      : undefined
  const fromRuntimePeriods =
    record && 'allowedSchedulePeriods' in record
      ? readSchedulePeriodBoundsList(record.allowedSchedulePeriods)
      : undefined
  const allowedSchedulePeriods =
    fromParagraphPeriods != null && fromParagraphPeriods.length > 0
      ? fromParagraphPeriods
      : fromRuntimePeriods != null && fromRuntimePeriods.length > 0
        ? fromRuntimePeriods
        : fromParagraphPeriods !== undefined
          ? (fromParagraphPeriods ?? [])
          : fromRuntimePeriods !== undefined
            ? (fromRuntimePeriods ?? [])
            : null
  const paragraphMin = paragraphRecord
    ? readIsoDateOrNull(paragraphRecord.runtimeMinDate)
    : null
  const paragraphMax = paragraphRecord
    ? readIsoDateOrNull(paragraphRecord.runtimeMaxDate)
    : null
  return {
    scheduleInputMode: readApplyScheduleInputMode(runtime, paragraph),
    allowedSchedulePeriods,
    minScheduleDate: paragraphMin ?? (record ? readIsoDateOrNull(record.minScheduleDate) : null),
    maxScheduleDate: paragraphMax ?? (record ? readIsoDateOrNull(record.maxScheduleDate) : null),
  }
}

function hasRuntimeAllowedSchedulePeriods(
  config: ApplyRuntimeScheduleConfig
): config is ApplyRuntimeScheduleConfig & {
  allowedSchedulePeriods: ApplySchedulePeriodBounds[]
} {
  return (config.allowedSchedulePeriods?.length ?? 0) > 0
}

export function isDateInAllowedSchedulePeriods(
  date: string,
  periods: readonly ApplySchedulePeriodBounds[]
): boolean {
  return periods.some(period => date >= period.startDate && date <= period.endDate)
}

function readRuntimeScheduleMode(runtime: unknown): 'date' | 'period' | null {
  if (!isRecord(runtime)) return null
  const raw = String(runtime.scheduleMode ?? runtime.educationScheduleMode ?? '')
    .trim()
    .toUpperCase()
  if (raw === 'PERIOD' || raw === 'DATE_PERIOD') return 'period'
  if (raw === 'DATE' || raw === 'FIXED_DATE') return 'date'
  return null
}

function readRuntimeApplicationFlavor(runtime: unknown): string | null {
  if (!isRecord(runtime)) return null
  const raw = String(runtime.applicationFlavor ?? '').trim().toUpperCase()
  return raw || null
}

function readRuntimeProgramType(runtime: unknown): string | null {
  if (!isRecord(runtime)) return null
  const raw = String(runtime.programType ?? '').trim().toUpperCase()
  return raw || null
}

function schedulePeriodBoundsEqual(
  a: readonly ApplySchedulePeriodBounds[] | null | undefined,
  b: readonly ApplySchedulePeriodBounds[] | null | undefined
): boolean {
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  if (a.length !== b.length) return false
  return a.every(
    (period, index) =>
      period.startDate === b[index]?.startDate && period.endDate === b[index]?.endDate
  )
}

/**
 * TRAINED_TEACHER · ORGANIZATION · PERIOD · date_time_requests
 * — 희망 교육일 date picker 기간형 경로 활성화 조건 (허용 기간 유무와 별개).
 */
export function isTrainedTeachersOrganizationPeriodDateRequests(
  runtime: unknown,
  paragraph?: unknown
): boolean {
  const config = readRuntimeScheduleConfig(runtime, paragraph)
  return (
    readRuntimeProgramType(runtime) === 'TRAINED_TEACHER' &&
    readRuntimeApplicationFlavor(runtime) === 'ORGANIZATION' &&
    readRuntimeScheduleMode(runtime) === 'period' &&
    config.scheduleInputMode === 'date_time_requests'
  )
}

/**
 * form.runtimeContext 와 희망 일정 단락 runtime 필드가 동일 계약인지 확인한다.
 * 불일치면 FE는 비어 있지 않은 쪽을 우선하지만, 계약 검증·테스트는 실패로 본다.
 */
export function areTrainedTeachersScheduleRuntimeFieldsInSync(
  runtime: unknown,
  paragraph: unknown
): boolean {
  if (!isRecord(paragraph)) return false
  const config = readRuntimeScheduleConfig(runtime)
  const paragraphMode = readApplyScheduleInputMode(runtime, paragraph)
  const paragraphPeriods =
    'runtimeAllowedSchedulePeriods' in paragraph
      ? (readSchedulePeriodBoundsList(paragraph.runtimeAllowedSchedulePeriods) ?? [])
      : null
  const paragraphMin = readIsoDateOrNull(paragraph.runtimeMinDate)
  const paragraphMax = readIsoDateOrNull(paragraph.runtimeMaxDate)
  return (
    config.scheduleInputMode === paragraphMode &&
    schedulePeriodBoundsEqual(config.allowedSchedulePeriods, paragraphPeriods) &&
    config.minScheduleDate === paragraphMin &&
    config.maxScheduleDate === paragraphMax
  )
}

/** `date_time_requests` 인데 허용 기간이 없으면 fail-closed. min/max만으로는 날짜를 열지 않는다. */
export function isRuntimeScheduleNotConfigured(
  runtime: unknown,
  paragraph?: unknown
): boolean {
  const config = readRuntimeScheduleConfig(runtime, paragraph)
  return (
    config.scheduleInputMode === 'date_time_requests' && !hasRuntimeAllowedSchedulePeriods(config)
  )
}

export function resolveRuntimeScheduleDateBounds(
  runtime: unknown,
  paragraph?: unknown
): ApplyScheduleDateBounds {
  const config = readRuntimeScheduleConfig(runtime, paragraph)
  return {
    minScheduleDate: config.minScheduleDate,
    maxScheduleDate: config.maxScheduleDate,
  }
}

export function resolveRuntimeScheduleEnabledDates(
  runtime: unknown,
  restrictWhenUnavailable = false,
  paragraph?: unknown
): ReadonlySet<string> | null {
  const config = readRuntimeScheduleConfig(runtime, paragraph)
  if (hasRuntimeAllowedSchedulePeriods(config)) {
    return buildEnabledDatesFromAllowedSchedulePeriods(config.allowedSchedulePeriods)
  }
  return restrictWhenUnavailable && isRuntimeScheduleNotConfigured(runtime, paragraph)
    ? new Set<string>()
    : null
}

export function shouldUseInstitutionAllowedSchedulePeriodDates(
  periods: ApplySchedulePeriodBounds[] | null
): boolean {
  return periods != null && periods.length > 0
}

/**
 * 기간 지정형 기관 신청은 서버가 허용 기간을 내려준 경우에만 날짜를 연다.
 * 런타임 계약이 없을 때 null을 반환하면 날짜 선택기가 전체 범위를 허용하므로,
 * 해당 모드에서는 빈 Set으로 fail closed 한다.
 */
export function resolveInstitutionAllowedScheduleEnabledDates(
  periods: ApplySchedulePeriodBounds[] | null,
  restrictWhenUnavailable = false
): ReadonlySet<string> | null {
  if (!shouldUseInstitutionAllowedSchedulePeriodDates(periods)) {
    return restrictWhenUnavailable ? new Set<string>() : null
  }
  return buildEnabledDatesFromAllowedSchedulePeriods(periods!)
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

/** 날짜 지정형 교육받은 교사 신청 — 등록된 교육일만 선택 가능하게 한다. */
export function buildEnabledDatesFromEducationScheduleLines(
  lines: readonly string[] | undefined
): ReadonlySet<string> {
  return extractEducationScheduleCalendarDates(lines)
}

export type TrainedTeachersFixedScheduleOption = {
  value: string
  label: string
  date: string
  classPeriod: string
  startTime: string
  endTime: string
  session?: string
}

const FIXED_SCHEDULE_DATE_RE = /(\d{2,4})년\s*(\d{1,2})월\s*(\d{1,2})일/
const FIXED_SCHEDULE_TIME_RE = /(\d{1,2}:\d{2})\s*~\s*(\d{1,2}:\d{2})/

/** 교육받은 교사 날짜 지정형 — 원본 일정 line의 날짜·시간·회차를 선택지로 유지한다. */
export function buildTrainedTeachersFixedScheduleOptions(
  lines: readonly string[] | undefined
): TrainedTeachersFixedScheduleOption[] {
  const options: TrainedTeachersFixedScheduleOption[] = []
  for (const [index, raw] of expandEducationScheduleChoiceSlots(lines).entries()) {
    const label = raw.trim()
    const dateMatch = label.match(FIXED_SCHEDULE_DATE_RE)
    const timeMatch = label.match(FIXED_SCHEDULE_TIME_RE)
    if (!dateMatch || !timeMatch) continue
    const yearRaw = Number(dateMatch[1])
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw
    const month = Number(dateMatch[2])
    const day = Number(dateMatch[3])
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) continue
    options.push({
      value: `line:${index}`,
      label,
      date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      classPeriod: '',
      startTime: timeMatch[1],
      endTime: timeMatch[2],
      ...(label.match(/(\d+)회차/)?.[1] ? { session: `${label.match(/(\d+)회차/)?.[1]}회차` } : {}),
    })
  }
  return options
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

export function hasPreferredScheduleDateOutsideRuntime(
  blocks: readonly Pick<ApplyPreferredScheduleBlock, 'date'>[],
  runtime: unknown,
  paragraph?: unknown
): boolean {
  const config = readRuntimeScheduleConfig(runtime, paragraph)
  return blocks.some(block => {
    const date = readIsoDateOrNull(block.date)
    if (!date) return false
    if (isRuntimeScheduleNotConfigured(runtime, paragraph)) return true
    if (hasRuntimeAllowedSchedulePeriods(config)) {
      return !isDateInAllowedSchedulePeriods(date, config.allowedSchedulePeriods)
    }
    return (
      (config.minScheduleDate != null && date < config.minScheduleDate) ||
      (config.maxScheduleDate != null && date > config.maxScheduleDate)
    )
  })
}

export const TRAINED_TEACHERS_REQUIRED_CONSENT_IDS = [
  'program-application-trained-teachers-seed-personal-info',
  'program-application-trained-teachers-seed-third-party',
] as const

export function findMissingRequiredBottomConsentId(
  draft: WritingFormDraft | null | undefined
): string | null {
  if (!draft) return TRAINED_TEACHERS_REQUIRED_CONSENT_IDS[0]
  return (
    TRAINED_TEACHERS_REQUIRED_CONSENT_IDS.find(id => {
      const paragraph = draft.paragraphs.find(item => item.id === id)
      return (
        !paragraph ||
        !('showBottomConsent' in paragraph) ||
        paragraph.showBottomConsent !== true ||
        paragraph.bottomConsent !== 'agree'
      )
    }) ?? null
  )
}

export function hasMissingRequiredBottomConsent(draft: WritingFormDraft | null | undefined): boolean {
  return findMissingRequiredBottomConsentId(draft) != null
}

export {
  isInstitutionApplyScheduleChoiceParagraphId,
  institutionFixedScheduleOptionToken,
  readApplicationScheduleRecruitmentLimitsFromRuntime,
  type ReadInstitutionFixedScheduleChoiceOptions,
  type RuntimeFixedScheduleChoiceItem,
}

const DEFAULT_ONLY_SCHEDULE_CHOICE_LABEL = '교육 일정'

function readRuntimeEnumText(runtime: unknown, key: string): string {
  if (runtime == null || typeof runtime !== 'object') return ''
  const value = (runtime as Record<string, unknown>)[key]
  return typeof value === 'string' ? value.trim().toUpperCase() : ''
}

/**
 * 커리큘럼·다회차·날짜 고정 일정(③)이면 선택지에 `N회차`를 붙인다. 기간 지정(④)은 회차 없음.
 * N은 교육 진행 예정일 입력 순서(`line:N` → N+1, 아니면 선택지 순서)다. 기본명 번호와 무관.
 */
export function shouldShowRuntimeScheduleChoiceRound(runtime: unknown): boolean {
  const mode =
    readRuntimeEnumText(runtime, 'educationScheduleMode') ||
    readRuntimeEnumText(runtime, 'scheduleMode')
  return (
    readRuntimeEnumText(runtime, 'educationStructure') === 'CURRICULUM' &&
    readRuntimeEnumText(runtime, 'sessionRound') === 'MULTI' &&
    mode !== 'PERIOD' &&
    mode !== 'DATE_PERIOD'
  )
}

const RUNTIME_LINE_CHOICE_ID_RE = /^line:(\d+)$/i

function readRuntimeScheduleChoiceRoundNumber(id: unknown, index: number): number {
  const match = typeof id === 'string' ? RUNTIME_LINE_CHOICE_ID_RE.exec(id.trim()) : null
  return match ? Number(match[1]) + 1 : index + 1
}

/**
 * 서버 선택지 라벨에서 자동 기본명(`공통 교육 예정 N`)을 제거한다. id는 그대로 둔다.
 * ③이면 제거 후 `일시 | (입력순)회차`를 붙인다.
 */
function withDisplayScheduleChoiceLabels<T extends { id?: string; label: string }>(
  items: ReadonlyArray<T> | null,
  runtime?: unknown
): ReadonlyArray<T> | null {
  if (items == null) return items
  const showRound = shouldShowRuntimeScheduleChoiceRound(runtime)
  return items.map((item, index) => {
    const label = showRound
      ? appendEducationRoundSuffix(
          stripDefaultEducationSlotNameFromLabel(item.label),
          readRuntimeScheduleChoiceRoundNumber(item.id, index)
        )
      : stripDefaultEducationSlotNameFromLabel(item.label)
    if (label === item.label) return item
    return { ...item, label: label || DEFAULT_ONLY_SCHEDULE_CHOICE_LABEL }
  })
}

export function readRuntimeFixedScheduleChoiceItems(
  ...args: Parameters<typeof readRuntimeFixedScheduleChoiceItemsFromSchema>
): ReturnType<typeof readRuntimeFixedScheduleChoiceItemsFromSchema> {
  return withDisplayScheduleChoiceLabels(
    readRuntimeFixedScheduleChoiceItemsFromSchema(...args),
    args[0]
  )
}

export function readInstitutionFixedScheduleChoiceItems(
  ...args: Parameters<typeof readInstitutionFixedScheduleChoiceItemsFromSchema>
): ReturnType<typeof readInstitutionFixedScheduleChoiceItemsFromSchema> {
  return withDisplayScheduleChoiceLabels(
    readInstitutionFixedScheduleChoiceItemsFromSchema(...args),
    args[0]
  )
}

const INSTITUTION_SCHEDULE_PREVIEW_SLOT_RE = /^institution-schedule-slot-(\d+)$/i

function isInstitutionSchedulePreviewSlotId(value: string): boolean {
  return INSTITUTION_SCHEDULE_PREVIEW_SLOT_RE.test(value.trim())
}

/** 시드 미리보기 ID(`institution-schedule-slot-N`) → 런타임 `line:N-1`. */
export function remapInstitutionSchedulePreviewSlotIds(selectedIds: readonly string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const selected of selectedIds) {
    const trimmed = selected.trim()
    if (!trimmed) continue
    const match = trimmed.match(INSTITUTION_SCHEDULE_PREVIEW_SLOT_RE)
    const token = match ? `line:${Number(match[1]) - 1}` : trimmed
    if (!token || isInstitutionSchedulePreviewSlotId(token) || seen.has(token)) continue
    seen.add(token)
    out.push(token)
  }
  return out
}

export function normalizeInstitutionFixedScheduleAnswerTokens(
  selectedIds: readonly string[],
  runtime: unknown,
  paragraph: unknown
): string[] {
  return normalizeInstitutionFixedScheduleAnswerTokensFromSchema(
    remapInstitutionSchedulePreviewSlotIds(selectedIds),
    runtime,
    paragraph
  )
}

export function shouldShowApplyPreferredSchedule(program: ApplyScheduleVisibilityFields): boolean {
  return shouldShowApplicationPreferredScheduleParagraph(program)
}

export function shouldShowApplyPreferredScheduleSessionSelect(
  program: ApplyScheduleVisibilityFields
): boolean {
  return shouldShowApplicationPreferredScheduleSessionSelect(program)
}

export function shouldShowApplySchedulePeriodDateOnlyPreferred(
  program: ApplyScheduleVisibilityFields
): boolean {
  return shouldShowApplicationSchedulePeriodDateOnlyPreferred(program)
}

const DEFAULT_MAX_SESSIONS_PER_DAY = 16

function clampPreferredScheduleBlockCount(maxScheduleCount?: number | null): number {
  if (maxScheduleCount == null || maxScheduleCount < 1) return 1
  return Math.min(maxScheduleCount, 10)
}

/** CMS `resolveInstitutionPreferredScheduleMaxBlocks`와 동일 — runtime·program·기간 지망 fallback */
export function resolveApplyPreferredScheduleMaxBlocks(
  program: ApplyScheduleVisibilityFields & { maxPreferredScheduleCount?: number },
  runtimeContext?: unknown
): number {
  const fromRuntime = readApplicationScheduleRecruitmentLimitsFromRuntime(runtimeContext)
  const preferredUi = shouldShowApplicationPreferredScheduleParagraph(program)
  const recruitmentFallback = preferredUi ? 10 : undefined
  const fromProgramLimit =
    program.maxPreferredScheduleCount != null && program.maxPreferredScheduleCount >= 1
      ? program.maxPreferredScheduleCount
      : undefined
  return clampPreferredScheduleBlockCount(
    fromRuntime.maxScheduleCount ?? fromProgramLimit ?? recruitmentFallback
  )
}

/** 고정 일정형은 CMS 기간형 상한이 아니라 Runtime의 유효 선택지 수가 지망 상한이다. */
export function resolveApplyPreferredScheduleMaxBlocksFromFixedOptions(
  options: readonly Pick<RuntimeFixedScheduleChoiceItem, 'id'>[] | null | undefined
): number {
  const uniqueIds = new Set(
    (options ?? []).map(option => option.id.trim()).filter(Boolean)
  )
  return clampPreferredScheduleBlockCount(uniqueIds.size > 0 ? uniqueIds.size : 1)
}

/** 모집 1일 최대 차시 — CMS `buildInstitutionSessionCountOptions`와 동일 상한 */

/** 기관 복수+기간(모집 1일 최대 차시)만 기본 2지망 — CMS와 동일 */
export function resolveApplyPreferredScheduleInitialBlockCount(
  program: ApplyScheduleVisibilityFields & { maxPreferredScheduleCount?: number }
): number {
  if (!shouldShowApplicationMaxSessionsPerDayField(program)) return 1
  const maxBlocks = Math.max(1, Math.min(program.maxPreferredScheduleCount ?? 3, 10))
  return Math.min(2, maxBlocks)
}

export function createEmptyApplyPreferredScheduleBlocks(
  count: number
): ApplyPreferredScheduleBlock[] {
  const n = Math.max(1, Math.min(count, 10))
  return Array.from({ length: n }, () => ({
    date: '',
    classPeriod: '',
    startTime: '',
    endTime: '',
  }))
}

export function resolveApplyPreferredMaxSessionsPerDay(
  program: Pick<ProgramDetail, 'maxSessionsPerDay'>,
  runtimeContext?: unknown
): number | undefined {
  const fromRuntime = readApplicationScheduleRecruitmentLimitsFromRuntime(runtimeContext)
  return fromRuntime.maxSessionsPerDay ?? program.maxSessionsPerDay
}

export function buildApplyPreferredSessionSelectOptions(maxSessionsPerDay?: number | null) {
  const cap =
    maxSessionsPerDay != null && maxSessionsPerDay > 0
      ? Math.min(maxSessionsPerDay, DEFAULT_MAX_SESSIONS_PER_DAY)
      : DEFAULT_MAX_SESSIONS_PER_DAY
  return Array.from({ length: cap }, (_, index) => ({
    value: String(index + 1),
    label: `${index + 1}차시`,
  }))
}

export type ApplyScheduleParagraphsForProgramInput = ApplyScheduleProgramFields & {
  maxScheduleCount?: number
  maxSessionsPerDay?: number
  runtimeContext?: unknown
  sessions?: ProgramDetail['sessions']
}

export function applyScheduleParagraphsForProgram(
  draft: WritingFormDraft,
  program: ApplyScheduleParagraphsForProgramInput
): WritingFormDraft {
  const scheduleMeta = readApplyScheduleMetaFromProgram(program)
  const visibility = mergeApplicationScheduleVisibilityInput({
    runtime: program.runtimeContext,
    program: {
      educationStructure: program.educationStructure,
      sessionRound: program.sessionRound,
      educationScheduleMode: program.educationScheduleMode,
      educationScheduleLines: program.educationScheduleLines,
    },
    educationScheduleLines: program.educationScheduleLines,
  })
  return syncApplicationScheduleChoiceParagraphsInDraft(draft, {
    educationStructure: visibility.educationStructure ?? 'curriculum',
    sessionRound: visibility.sessionRound ?? 'single',
    educationScheduleMode: visibility.educationScheduleMode ?? 'date',
    educationScheduleLines:
      visibility.educationScheduleLines ?? program.educationScheduleLines ?? [],
    maxScheduleCount: program.maxScheduleCount ?? program.maxPreferredScheduleCount,
    maxSessionsPerDay: program.maxSessionsPerDay,
    educationRoundCount: scheduleMeta.educationRoundCount,
    sessionsPerRound: scheduleMeta.sessionsPerRound,
    curriculumChartSessionCount: scheduleMeta.curriculumChartSessionCount,
    curriculumSessions: scheduleMeta.curriculumSessions,
    runtimeContext: program.runtimeContext,
  })
}
