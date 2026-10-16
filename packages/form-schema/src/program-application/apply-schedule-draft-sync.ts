import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '../paragraph-ids/program-application-form-individual-draft.js'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '../paragraph-ids/program-application-form-institution-draft.js'
import type { MultipleChoiceParagraph, WritingFormDraft } from '../writing-form/index.js'
import { readInstitutionFixedScheduleChoiceItems } from './fixed-schedule-choice-items.js'
import { readApplicationScheduleInputMode } from './schedule-form-binding.js'
import { shouldShowApplicationScheduleParagraphResolved } from './application-schedule-visibility-input.js'
import {
  readApplicationScheduleRecruitmentLimitsFromRuntime,
  resolveApplicationScheduleParagraphDescription,
} from './application-schedule-paragraph-copy.js'
import { resolveFixedScheduleLinesToChoiceItems } from './curriculum-multi-date-fixed-schedule.js'
import {
  shouldShowApplicationPreferredScheduleParagraph,
  type ApplicationScheduleVisibilityInput,
} from './schedule-paragraph-visibility.js'

export const APPLICATION_SCHEDULE_CHOICE_PARAGRAPH_IDS = new Set<string>([
  PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice,
  PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice,
])

export function isApplicationScheduleChoiceParagraphId(id: string): boolean {
  return APPLICATION_SCHEDULE_CHOICE_PARAGRAPH_IDS.has(id)
}

export type ApplyScheduleDraftSyncInput = ApplicationScheduleVisibilityInput & {
  runtimeContext?: unknown
  scheduleParagraphRaw?: unknown
  /** Platform `maxPreferredScheduleCount` · CMS `maxScheduleCount` */
  maxScheduleCount?: number
  maxSessionsPerDay?: number
  educationRoundCount?: number
  sessionsPerRound?: number
  curriculumChartSessionCount?: number
  curriculumSessions?: ReadonlyArray<{ sessionLabel?: string; title?: string }>
}

/**
 * 시드·remote draft의 schedule choice 단락 items를 프로그램·binding SSOT에 맞춘다.
 */
function scheduleCopyInputFromSync(
  input: ApplyScheduleDraftSyncInput
): ApplyScheduleDraftSyncInput {
  const fromRuntime = readApplicationScheduleRecruitmentLimitsFromRuntime(input.runtimeContext)
  return {
    ...input,
    maxScheduleCount: input.maxScheduleCount ?? fromRuntime.maxScheduleCount,
    maxSessionsPerDay: input.maxSessionsPerDay ?? fromRuntime.maxSessionsPerDay,
  }
}

export function syncApplicationScheduleChoiceParagraphsInDraft(
  draft: WritingFormDraft,
  input: ApplyScheduleDraftSyncInput
): WritingFormDraft {
  const copyInput = scheduleCopyInputFromSync(input)
  const scheduleParagraphDescription =
    resolveApplicationScheduleParagraphDescription(copyInput)

  const scheduleParagraphRaw =
    input.scheduleParagraphRaw ??
    draft.paragraphs.find(
      paragraph => isApplicationScheduleChoiceParagraphId(paragraph.id)
    )

  if (
    !shouldShowApplicationScheduleParagraphResolved({
      ...input,
      runtimeContext: input.runtimeContext,
      scheduleParagraphRaw,
    })
  ) {
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
          paragraphDescription: scheduleParagraphDescription,
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
            {
              educationScheduleLines: lines,
              educationStructure: input.educationStructure,
              sessionRound: input.sessionRound,
              educationScheduleMode: input.educationScheduleMode,
              educationRoundCount: input.educationRoundCount,
              sessionsPerRound: input.sessionsPerRound,
              curriculumChartSessionCount: input.curriculumChartSessionCount,
              curriculumSessions: input.curriculumSessions,
            }
          ) ?? []
        if (choiceItems.length === 0) return paragraph
        return {
          ...paragraph,
          paragraphDescription: scheduleParagraphDescription,
          items: choiceItems.map(item => ({ id: item.id, label: item.label })),
          selectedPreviewSingleId: null,
        }
      }

      if (lines.length === 0) {
        if (!scheduleParagraphDescription) return paragraph
        return { ...paragraph, paragraphDescription: scheduleParagraphDescription }
      }
      const choiceItems = resolveFixedScheduleLinesToChoiceItems(input, lines, input)
      return {
        ...paragraph,
        paragraphDescription: scheduleParagraphDescription,
        items: choiceItems.map(item => ({ id: item.id, label: item.label })),
        selectedPreviewSingleId: null,
        selectedPreviewMultipleIds: [],
      }
    }),
  }
}
