import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '../paragraph-ids/program-application-form-individual-draft.js'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '../paragraph-ids/program-application-form-institution-draft.js'
import type { MultipleChoiceParagraph, WritingFormDraft } from '../writing-form/index.js'
import { readInstitutionFixedScheduleChoiceItems } from './fixed-schedule-choice-items.js'
import { readApplicationScheduleInputMode } from './schedule-form-binding.js'
import {
  shouldShowApplicationPreferredScheduleParagraph,
  shouldShowApplicationScheduleParagraph,
  type ApplicationScheduleVisibilityInput,
} from './schedule-paragraph-visibility.js'

export const APPLICATION_SCHEDULE_CHOICE_PARAGRAPH_IDS = new Set<string>([
  PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice,
  PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice,
])

export function isApplicationScheduleChoiceParagraphId(id: string): boolean {
  return APPLICATION_SCHEDULE_CHOICE_PARAGRAPH_IDS.has(id)
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

export type ApplyScheduleDraftSyncInput = ApplicationScheduleVisibilityInput & {
  runtimeContext?: unknown
  scheduleParagraphRaw?: unknown
}

/**
 * 시드·remote draft의 schedule choice 단락 items를 프로그램·binding SSOT에 맞춘다.
 */
export function syncApplicationScheduleChoiceParagraphsInDraft(
  draft: WritingFormDraft,
  input: ApplyScheduleDraftSyncInput
): WritingFormDraft {
  if (!shouldShowApplicationScheduleParagraph(input)) {
    return {
      ...draft,
      paragraphs: draft.paragraphs.filter(
        paragraph => !isApplicationScheduleChoiceParagraphId(paragraph.id)
      ),
    }
  }

  if (shouldShowApplicationPreferredScheduleParagraph(input)) {
    return {
      ...draft,
      paragraphs: draft.paragraphs.map(paragraph => {
        if (
          paragraph.kind !== 'single_item' ||
          paragraph.variant !== 'multiple_choice' ||
          !isApplicationScheduleChoiceParagraphId(paragraph.id)
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

  const mode = readApplicationScheduleInputMode(input.runtimeContext, input.scheduleParagraphRaw)
  const lines = (input.educationScheduleLines ?? []).filter(line => line.trim())

  return {
    ...draft,
    paragraphs: draft.paragraphs.map(paragraph => {
      if (
        paragraph.kind !== 'single_item' ||
        paragraph.variant !== 'multiple_choice' ||
        !isApplicationScheduleChoiceParagraphId(paragraph.id)
      ) {
        return paragraph
      }

      if (mode === 'fixed_schedule_options') {
        const choiceItems =
          readInstitutionFixedScheduleChoiceItems(
            input.runtimeContext,
            input.scheduleParagraphRaw ?? paragraph,
            { educationScheduleLines: lines }
          ) ?? []
        if (choiceItems.length === 0) return paragraph
        return {
          ...paragraph,
          items: choiceItems.map(item => ({ id: item.id, label: item.label })),
          selectedPreviewSingleId: null,
        }
      }

      if (lines.length === 0) return paragraph
      return applyDateScheduleItems(paragraph as MultipleChoiceParagraph, lines)
    }),
  }
}
