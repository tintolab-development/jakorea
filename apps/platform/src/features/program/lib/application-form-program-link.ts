/**
 * form-bindings remote draft → 프로그램·CMS 미리보기와 동일한 단락·선택지 정규화.
 */

import {
  isApplicationScheduleChoiceParagraphId,
  mergeApplicationScheduleVisibilityInput,
  readApplicationScheduleRecruitmentLimitsFromRuntime,
  readEducationScheduleLinesForApplicationForm,
  syncApplicationScheduleChoiceParagraphsInDraft,
} from '@jakorea/form-schema/program-application'
import { migrateGeminiVisitingTrainingApplicationInstitutionParagraphs } from '@jakorea/form-schema/paragraph-ids/gemini-visiting-training-application-form-institution-draft'
import type { WritingFormDraft } from '@jakorea/form-schema/writing-form'
import { readApplyScheduleMetaFromProgram } from './apply-form-schedule-meta.ts'
import type { ProgramApplyFormCase } from './apply-form-case.ts'
import type { ProgramDetail } from '../model/types.ts'

export type ApplyProgramLinkedDraftPatchInput = {
  applyCase: ProgramApplyFormCase
  program: ProgramDetail
  runtimeContext?: unknown
}

function findApplicationScheduleParagraphRaw(draft: WritingFormDraft): unknown {
  const found = draft.paragraphs.find(paragraph =>
    isApplicationScheduleChoiceParagraphId(paragraph.id)
  )
  return found ?? null
}

/** remote `writingFormDraftFromApplicationForm` 직후 호출 */
export function applyProgramLinkedApplicationDraftPatches(
  draft: WritingFormDraft,
  input: ApplyProgramLinkedDraftPatchInput
): WritingFormDraft {
  const { applyCase, program, runtimeContext } = input
  if (applyCase === 'institution-gemini') {
    return migrateGeminiVisitingTrainingApplicationInstitutionParagraphs(draft)
  }
  if (
    applyCase !== 'institution-general' &&
    applyCase !== 'individual-general' &&
    applyCase !== 'individual-team'
  ) {
    return draft
  }
  if (program.detailCase != null && program.detailCase !== 'general') {
    return draft
  }

  const scheduleParagraphRaw = findApplicationScheduleParagraphRaw(draft)

  const scheduleMeta = readApplyScheduleMetaFromProgram(program)
  const recruitLimits = readApplicationScheduleRecruitmentLimitsFromRuntime(runtimeContext)
  const scheduleLines =
    readEducationScheduleLinesForApplicationForm(
      runtimeContext,
      program.educationScheduleLines,
    ) ?? []
  const visibility = mergeApplicationScheduleVisibilityInput({
    runtime: runtimeContext,
    program: {
      educationStructure: program.educationStructure,
      sessionRound: program.sessionRound,
      educationScheduleMode: program.educationScheduleMode,
      educationScheduleLines: program.educationScheduleLines,
    },
    educationScheduleLines: scheduleLines,
  })

  return syncApplicationScheduleChoiceParagraphsInDraft(draft, {
    educationStructure: visibility.educationStructure ?? 'curriculum',
    sessionRound: visibility.sessionRound ?? 'single',
    educationScheduleMode: visibility.educationScheduleMode ?? 'date',
    educationScheduleLines: visibility.educationScheduleLines ?? scheduleLines,
    maxScheduleCount: recruitLimits.maxScheduleCount ?? program.maxPreferredScheduleCount,
    maxSessionsPerDay: recruitLimits.maxSessionsPerDay ?? program.maxSessionsPerDay,
    educationRoundCount: scheduleMeta.educationRoundCount,
    sessionsPerRound: scheduleMeta.sessionsPerRound,
    curriculumChartSessionCount: scheduleMeta.curriculumChartSessionCount,
    curriculumSessions: scheduleMeta.curriculumSessions,
    runtimeContext,
    scheduleParagraphRaw,
  })
}
