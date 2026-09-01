/**
 * 일반 프로그램 신청 폼 — 진행 희망 교육 일정 (CMS institution-application-program-bridge 와 동일).
 *
 * - 일정형 + 복수 회차: 단락 숨김
 * - 날짜 지정 + 고유 달력일 ≤ 1: 단락 숨김 (같은 날 AM/PM은 하루)
 * - 기간 지정 + (커리큘럼형 또는 일정형 단일): 1지망·2지망 추가 UI
 * - 그 외(날짜 지정, 고유 일자 2일 이상): 등록된 교육 진행 예정일 체크박스
 */

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

const SCHEDULE_DATE_PART_RE = /(\d{2,4})년\s*(\d{1,2})월\s*(\d{1,2})일/

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

/**
 * CMS `countUniqueEducationScheduleCalendarDays` 와 동일 — 시작일 YYYY-MM-DD 집합 크기.
 * `26년` / `2026년` 표기, 기간 줄(시작일만), 같은 날 복수 슬롯을 처리한다.
 */
export function countUniqueEducationScheduleCalendarDays(
  lines: readonly string[] | undefined
): number {
  if (!lines?.length) return 0
  const seen = new Set<string>()
  for (const line of lines) {
    const match = line.trim().match(SCHEDULE_DATE_PART_RE)
    if (!match) continue
    const yearRaw = Number(match[1])
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw
    const month = Number(match[2])
    const day = Number(match[3])
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) continue
    if (month < 1 || month > 12 || day < 1 || day > 31) continue
    seen.add(`${year}-${pad2(month)}-${pad2(day)}`)
  }
  return seen.size
}

export type ApplyScheduleVisibilityFields = {
  educationStructure?: ProgramEducationStructure
  sessionRound?: ProgramSessionRound
  educationScheduleMode?: ProgramEducationScheduleMode
  educationScheduleLines?: readonly string[]
}

export function shouldShowApplyScheduleParagraph(program: ApplyScheduleVisibilityFields): boolean {
  if (program.educationStructure === 'schedule' && program.sessionRound === 'multi') {
    return false
  }
  if (program.educationScheduleMode !== 'period') {
    return countUniqueEducationScheduleCalendarDays(program.educationScheduleLines) > 1
  }
  return true
}

function isPeriodScheduleMode(mode: ProgramEducationScheduleMode | undefined): boolean {
  return mode === 'period'
}

/** CMS `shouldShowInstitutionApplicationPreferredScheduleParagraph` */
export function shouldShowApplyPreferredSchedule(program: {
  educationStructure?: ProgramEducationStructure
  sessionRound?: ProgramSessionRound
  educationScheduleMode?: ProgramEducationScheduleMode
  educationScheduleLines?: readonly string[]
}): boolean {
  if (!shouldShowApplyScheduleParagraph(program)) return false
  if (!isPeriodScheduleMode(program.educationScheduleMode)) return false
  const structure = program.educationStructure
  const round = program.sessionRound
  if (structure === 'curriculum' && (round === 'single' || round === 'multi')) return true
  if (structure === 'schedule' && round === 'single') return true
  return false
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
