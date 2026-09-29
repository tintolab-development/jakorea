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

export function shouldShowApplyPreferredSchedule(program: ApplyScheduleVisibilityFields): boolean {
  return shouldShowApplicationPreferredScheduleParagraph(program)
}

function applyDateScheduleItems(
  paragraph: MultipleChoiceParagraph,
  lines: readonly string[]
): MultipleChoiceParagraph {
  const items = lines.map((line, index) => ({
    id: `${paragraph.id}-line-${index}`,
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
