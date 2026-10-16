import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '../paragraph-ids/program-application-form-institution-draft.js'
import {
  readCurriculumMultiDateFixedScheduleMeta,
  resolveFixedScheduleLinesToChoiceItems,
  shouldUseCurriculumMultiDateFixedScheduleMatrix,
  type CurriculumMultiDateFixedScheduleMetaInput,
} from './curriculum-multi-date-fixed-schedule.js'
import { readApplicationScheduleInputMode } from './schedule-form-binding.js'
import {
  expandEducationScheduleChoiceSlots,
  type ApplicationScheduleVisibilityInput,
} from './schedule-paragraph-visibility.js'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const OPAQUE_SCHEDULE_OPTION_TOKEN_RE =
  /^(schedule:\d+(?::organization-application:\d+)?(?::education-period:\d+)?|line:\d+(?::education-round:\d+)?)$/i

function isOpaqueScheduleOptionToken(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (OPAQUE_SCHEDULE_OPTION_TOKEN_RE.test(trimmed)) return true
  if (/^\d{4,}$/.test(trimmed)) return true
  return false
}

function toRawScheduleOptionRecords(
  raw: unknown[] | null
): ReadonlyArray<Record<string, unknown>> | null {
  if (!raw || raw.length === 0) return null
  const items: Record<string, unknown>[] = []
  for (const item of raw) {
    if (isRecord(item)) items.push(item)
  }
  return items.length > 0 ? items : null
}

function pickLongestScheduleOptionList(
  ...candidates: Array<unknown[] | null | undefined>
): unknown[] | null {
  let best: unknown[] | null = null
  for (const candidate of candidates) {
    if (!candidate || candidate.length === 0) continue
    if (!best || candidate.length > best.length) best = candidate
  }
  return best
}

function readInstitutionFixedScheduleRawItems(
  runtime: unknown,
  paragraph: unknown
): ReadonlyArray<Record<string, unknown>> | null {
  if (!isRecord(paragraph)) return null
  const mode = readApplicationScheduleInputMode(runtime, paragraph)
  const fromParagraphItems = Array.isArray(paragraph.items) ? paragraph.items : null
  const fromParagraphOptions = Array.isArray(paragraph.options) ? paragraph.options : null
  const fromParagraph =
    fromParagraphItems && fromParagraphItems.length > 0
      ? fromParagraphItems
      : fromParagraphOptions && fromParagraphOptions.length > 0
        ? fromParagraphOptions
        : null
  const fromRuntime =
    isRecord(runtime) && Array.isArray(runtime.scheduleOptions) ? runtime.scheduleOptions : null
  const fromParagraphRuntime = Array.isArray(paragraph.scheduleOptions)
    ? paragraph.scheduleOptions
    : null

  const boundOptions = pickLongestScheduleOptionList(fromRuntime, fromParagraphRuntime)

  if (mode === 'fixed_schedule_options') {
    return (
      toRawScheduleOptionRecords(boundOptions) ??
      toRawScheduleOptionRecords(fromParagraph as unknown[] | null)
    )
  }

  if (boundOptions && fromParagraph && boundOptions.length > fromParagraph.length) {
    return toRawScheduleOptionRecords(boundOptions)
  }

  return (
    toRawScheduleOptionRecords(fromParagraph as unknown[] | null) ??
    toRawScheduleOptionRecords(boundOptions)
  )
}

function choiceItemsFromEducationScheduleLines(
  lines: readonly string[]
): Array<{ id: string; label: string }> {
  return expandEducationScheduleChoiceSlots(lines).map((label, index) => ({
    id: `line:${index}`,
    label,
  }))
}

export function institutionFixedScheduleOptionToken(item: Record<string, unknown>): string {
  for (const key of ['option_value', 'value'] as const) {
    const candidate = String(item[key] ?? '').trim()
    if (candidate && isOpaqueScheduleOptionToken(candidate)) return candidate
  }
  const scheduleIdRaw = item.scheduleId
  if (scheduleIdRaw != null && String(scheduleIdRaw).trim() !== '') {
    const scheduleId = Number(scheduleIdRaw)
    if (Number.isFinite(scheduleId)) {
      const periodRaw = item.educationPeriodIndex
      const period =
        periodRaw != null && String(periodRaw).trim() !== '' ? Number(periodRaw) : null
      const orgAppRaw = item.organizationApplicationId
      const orgApp =
        orgAppRaw != null && String(orgAppRaw).trim() !== '' ? Number(orgAppRaw) : null
      if (period != null && Number.isFinite(period)) {
        if (orgApp != null && Number.isFinite(orgApp)) {
          return `schedule:${scheduleId}:organization-application:${orgApp}:education-period:${period}`
        }
        return `schedule:${scheduleId}:education-period:${period}`
      }
      if (orgApp != null && Number.isFinite(orgApp)) {
        return `schedule:${scheduleId}:organization-application:${orgApp}`
      }
      return `schedule:${scheduleId}`
    }
  }
  return String(item.id ?? '').trim()
}

function institutionFixedScheduleOptionAliases(item: Record<string, unknown>): string[] {
  const canonical = institutionFixedScheduleOptionToken(item)
  const aliases = new Set<string>()
  if (canonical) aliases.add(canonical)
  for (const key of ['id', 'option_value', 'value'] as const) {
    const value = String(item[key] ?? '').trim()
    if (value) aliases.add(value)
  }
  const scheduleId = item.scheduleId
  if (scheduleId != null && String(scheduleId).trim()) {
    aliases.add(String(scheduleId).trim())
  }
  return [...aliases]
}

export type ReadInstitutionFixedScheduleChoiceOptions = ApplicationScheduleVisibilityInput &
  CurriculumMultiDateFixedScheduleMetaInput & {
    educationScheduleLines?: readonly string[]
  }

export function readInstitutionFixedScheduleChoiceItems(
  runtime: unknown,
  paragraph: unknown,
  options?: ReadInstitutionFixedScheduleChoiceOptions
): ReadonlyArray<{ id: string; label: string }> | null {
  const rawItems = readInstitutionFixedScheduleRawItems(runtime, paragraph)
  const items: Array<{ id: string; label: string }> = []
  if (rawItems) {
    for (const item of rawItems) {
      const id = institutionFixedScheduleOptionToken(item)
      if (!id) continue
      const label = String(
        item.label ?? item.option_label ?? item.scheduleId ?? item.startAt ?? id
      ).trim()
      items.push({ id, label: label || id })
    }
  }

  const lines = options?.educationScheduleLines ?? []
  const visibility: ApplicationScheduleVisibilityInput = {
    educationStructure: options?.educationStructure,
    sessionRound: options?.sessionRound,
    educationScheduleMode: options?.educationScheduleMode,
    educationScheduleLines: lines,
  }
  const meta = readCurriculumMultiDateFixedScheduleMeta(options ?? {})
  const expandedFallback = shouldUseCurriculumMultiDateFixedScheduleMatrix(visibility)
    ? resolveFixedScheduleLinesToChoiceItems(visibility, lines, meta)
    : choiceItemsFromEducationScheduleLines(lines)

  if (items.length === 0) {
    return expandedFallback.length > 0 ? expandedFallback : null
  }
  if (expandedFallback.length > items.length) {
    return expandedFallback
  }
  return items
}

export function normalizeInstitutionFixedScheduleAnswerTokens(
  selectedIds: readonly string[],
  runtime: unknown,
  paragraph: unknown
): string[] {
  const rawItems = readInstitutionFixedScheduleRawItems(runtime, paragraph)
  if (!rawItems || selectedIds.length === 0) return [...selectedIds]
  const aliasToCanonical = new Map<string, string>()
  for (const item of rawItems) {
    const canonical = institutionFixedScheduleOptionToken(item)
    if (!canonical) continue
    for (const alias of institutionFixedScheduleOptionAliases(item)) {
      aliasToCanonical.set(alias, canonical)
    }
  }
  const out: string[] = []
  const seen = new Set<string>()
  for (const selected of selectedIds) {
    const trimmed = selected.trim()
    if (!trimmed) continue
    const canonical = aliasToCanonical.get(trimmed) ?? trimmed
    if (seen.has(canonical)) continue
    seen.add(canonical)
    out.push(canonical)
  }
  return out
}

export function isInstitutionApplyScheduleChoiceParagraphId(id: string): boolean {
  return id === PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice
}
