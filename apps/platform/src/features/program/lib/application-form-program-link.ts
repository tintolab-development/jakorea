/**
 * form-bindings remote draft → 프로그램·CMS 미리보기와 동일한 단락·선택지 정규화.
 */

import {
  readApplicationScheduleRecruitmentLimitsFromRuntime,
  readEducationScheduleLinesForApplicationForm,
  syncApplicationScheduleChoiceParagraphsInDraft,
} from '@jakorea/form-schema/program-application'
import type { WritingFormDraft } from '@jakorea/form-schema/writing-form'
import { readApplyScheduleMetaFromProgram } from './apply-form-schedule-meta.ts'
import { isInstitutionApplyScheduleChoiceParagraphId } from './apply-form-schedule.ts'
import type { ProgramApplyFormCase } from './apply-form-case.ts'
import type { ProgramDetail } from '../model/types.ts'

export type ApplyProgramLinkedDraftPatchInput = {
  applyCase: ProgramApplyFormCase
  program: ProgramDetail
  runtimeContext?: unknown
}

function findInstitutionScheduleParagraphRaw(draft: WritingFormDraft): unknown {
  const found = draft.paragraphs.find(paragraph =>
    isInstitutionApplyScheduleChoiceParagraphId(paragraph.id)
  )
  return found ?? null
}

/** remote `writingFormDraftFromApplicationForm` 직후 호출 */
export function applyProgramLinkedApplicationDraftPatches(
  draft: WritingFormDraft,
  input: ApplyProgramLinkedDraftPatchInput
): WritingFormDraft {
  const { applyCase, program, runtimeContext } = input
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

  const scheduleParagraphRaw =
    applyCase === 'institution-general' ? findInstitutionScheduleParagraphRaw(draft) : null

  const scheduleMeta = readApplyScheduleMetaFromProgram(program)
  const recruitLimits = readApplicationScheduleRecruitmentLimitsFromRuntime(runtimeContext)

  return syncApplicationScheduleChoiceParagraphsInDraft(draft, {
    educationStructure: program.educationStructure ?? 'curriculum',
    sessionRound: program.sessionRound ?? 'single',
    educationScheduleMode: program.educationScheduleMode ?? 'date',
    educationScheduleLines:
      readEducationScheduleLinesForApplicationForm(
        runtimeContext,
        program.educationScheduleLines,
      ) ?? [],
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
