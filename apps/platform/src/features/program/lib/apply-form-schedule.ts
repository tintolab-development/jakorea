/**
 * 일반 프로그램 신청 폼 — 진행 희망 교육 일정.
 * 노출 규칙 SSOT: `@jakorea/form-schema/program-application` (CMS와 공유)
 */

import {
  countUniqueEducationScheduleCalendarDays,
  shouldShowApplicationPreferredScheduleParagraph,
  shouldShowApplicationScheduleParagraph,
} from '@jakorea/form-schema/program-application'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-individual-draft'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import type { MultipleChoiceParagraph, WritingFormDraft } from '@jakorea/form-schema/writing-form'
import type {
  ProgramDetail,
  ProgramEducationScheduleMode,
  ProgramEducationStructure,
  ProgramSessionRound,
} from '../model/types.ts'

export const APPLY_SCHEDULE_CHOICE_PARAGRAPH_IDS = new Set<string>([
  PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice,
  PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice,
])

export function isApplyScheduleChoiceParagraphId(id: string): boolean {
  return APPLY_SCHEDULE_CHOICE_PARAGRAPH_IDS.has(id)
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function mapRuntimeEducationStructure(value: unknown): ProgramEducationStructure | undefined {
  const raw = String(value ?? '').trim().toUpperCase()
  if (raw === 'SCHEDULE') return 'schedule'
  if (raw === 'CURRICULUM') return 'curriculum'
  return undefined
}

function mapRuntimeSessionRound(value: unknown): ProgramSessionRound | undefined {
  const raw = String(value ?? '').trim().toUpperCase()
  if (raw === 'MULTI') return 'multi'
  if (raw === 'SINGLE') return 'single'
  return undefined
}

function mapRuntimeScheduleMode(value: unknown): ProgramEducationScheduleMode | undefined {
  const raw = String(value ?? '').trim().toUpperCase()
  if (raw === 'PERIOD' || raw === 'DATE_PERIOD') return 'period'
  if (raw === 'DATE' || raw === 'FIXED_DATE') return 'date'
  return undefined
}

/**
 * form-bindings `runtimeContext` → CMS `shouldShowInstitutionApplicationScheduleParagraph` 입력.
 * Portal 프로그램 GET 매퍼의 curricula/schedules 추론보다 신청 런타임 값을 우선한다.
 */
export function applyScheduleVisibilityFieldsFromRuntimeContext(
  runtime: unknown
): ApplyScheduleVisibilityFields | null {
  if (!isRecord(runtime)) return null
  const educationStructure = mapRuntimeEducationStructure(runtime.educationStructure)
  const sessionRound = mapRuntimeSessionRound(runtime.sessionRound)
  const educationScheduleMode = mapRuntimeScheduleMode(
    runtime.educationScheduleMode ?? runtime.scheduleMode
  )
  if (!educationStructure && !sessionRound && !educationScheduleMode) return null
  return { educationStructure, sessionRound, educationScheduleMode }
}

/** Portal render — 희망 일정 입력 모드 */
export type ApplyScheduleInputMode = 'date_time_requests' | 'fixed_schedule_options'

export type ApplyScheduleDateBounds = {
  /** `YYYY-MM-DD` 또는 null(제한 없음). 빈 문자열로 바꾸지 않는다. */
  minScheduleDate: string | null
  maxScheduleDate: string | null
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function readIsoDateOrNull(value: unknown): string | null {
  if (value == null) return null
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return ISO_DATE_RE.test(trimmed) ? trimmed : null
}

/**
 * form-bindings render `scheduleInputMode`.
 * 문항·루트 runtimeContext 순으로 읽고, 없으면 null(기존 educationScheduleMode 추론 유지).
 */
export function readApplyScheduleInputMode(
  runtime: unknown,
  paragraph?: unknown
): ApplyScheduleInputMode | null {
  const fromParagraph =
    isRecord(paragraph) && typeof paragraph.scheduleInputMode === 'string'
      ? paragraph.scheduleInputMode
      : isRecord(paragraph) && typeof paragraph.runtimeInputMode === 'string'
        ? paragraph.runtimeInputMode
        : null
  const fromRuntime =
    isRecord(runtime) && typeof runtime.scheduleInputMode === 'string'
      ? runtime.scheduleInputMode
      : null
  const raw = String(fromParagraph ?? fromRuntime ?? '')
    .trim()
    .toLowerCase()
  if (raw === 'date_time_requests') return 'date_time_requests'
  if (raw === 'fixed_schedule_options') return 'fixed_schedule_options'
  return null
}

/**
 * 참여기관 「진행 희망 교육 일정」달력 범위.
 * 문항 `runtimeMinDate`/`runtimeMaxDate` → 루트 `minScheduleDate`/`maxScheduleDate`.
 * null이면 제한하지 않는다(빈 문자열로 치환 금지).
 */
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

/** 참여기관 일정 단락 id만 — 개인 `program-participant-application-seed-schedule` 제외 */
export function isInstitutionApplyScheduleChoiceParagraphId(id: string): boolean {
  return id === PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice
}

/**
 * 지정일 선택지 — 응답 `items`/`options`/`scheduleOptions` 의 value·id 를 그대로 쓴다.
 * 원본 `line:N` 인덱스를 앞에서부터 다시 매기지 않는다. educationScheduleLines 로 재구성하지 않는다.
 */
export function readInstitutionFixedScheduleChoiceItems(
  runtime: unknown,
  paragraph: unknown
): ReadonlyArray<{ id: string; label: string }> | null {
  if (!isRecord(paragraph)) return null
  const fromParagraph = Array.isArray(paragraph.items)
    ? paragraph.items
    : Array.isArray(paragraph.options)
      ? paragraph.options
      : null
  const fromRuntime =
    isRecord(runtime) && Array.isArray(runtime.scheduleOptions) ? runtime.scheduleOptions : null
  const rawItems = fromParagraph && fromParagraph.length > 0 ? fromParagraph : fromRuntime
  if (!rawItems) return null
  const items: Array<{ id: string; label: string }> = []
  for (const item of rawItems) {
    if (!isRecord(item)) continue
    const id = String(item.id ?? item.option_value ?? item.value ?? item.scheduleId ?? '').trim()
    if (!id) continue
    const label = String(
      item.label ?? item.option_label ?? item.scheduleId ?? item.startAt ?? id
    ).trim()
    items.push({ id, label: label || id })
  }
  return items
}

export function shouldShowApplyPreferredSchedule(program: ApplyScheduleVisibilityFields): boolean {
  return shouldShowApplicationPreferredScheduleParagraph(program)
}

function applyDateScheduleItems(
  paragraph: MultipleChoiceParagraph,
  lines: readonly string[]
): MultipleChoiceParagraph {
  const items = lines.map((line, index) => ({
    id: `line:${index}`,
    label: line,
  }))
  return {
    ...paragraph,
    items,
    selectedPreviewSingleId: null,
    selectedPreviewMultipleIds: [],
  }
}

/**
 * CMS hiddenParagraphIds + 날짜 지정 선택지를 시드 draft에 반영.
 * 기간 지정은 단락을 유지하고 Platform slot이 지망 UI를 렌더한다.
 */
export function applyScheduleParagraphsForProgram(
  draft: WritingFormDraft,
  program: ApplyScheduleProgramFields
): WritingFormDraft {
  if (!shouldShowApplyScheduleParagraph(program)) {
    return {
      ...draft,
      paragraphs: draft.paragraphs.filter(
        paragraph => !isApplyScheduleChoiceParagraphId(paragraph.id)
      ),
    }
  }

  if (shouldShowApplyPreferredSchedule(program)) {
    return {
      ...draft,
      paragraphs: draft.paragraphs.map(paragraph => {
        if (
          paragraph.kind !== 'single_item' ||
          paragraph.variant !== 'multiple_choice' ||
          !isApplyScheduleChoiceParagraphId(paragraph.id)
        ) {
          return paragraph
        }
        return {
          ...paragraph,
          paragraphDescription: '',
          items: [],
          selectedPreviewMultipleIds: [],
        }
      }),
    }
  }

  const lines = program.educationScheduleLines.filter(line => line.trim())
  return {
    ...draft,
    paragraphs: draft.paragraphs.map(paragraph => {
      if (
        paragraph.kind !== 'single_item' ||
        paragraph.variant !== 'multiple_choice' ||
        !isApplyScheduleChoiceParagraphId(paragraph.id)
      ) {
        return paragraph
      }
      return applyDateScheduleItems(paragraph, lines)
    }),
  }
}
