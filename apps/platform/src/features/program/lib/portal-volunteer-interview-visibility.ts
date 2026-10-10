/**
 * 봉사자 신청 면접 단락 노출 — form-binding runtime이 SSOT.
 * 프로그램 상세 `interviewEnabled`만으로 숨기면 모집·바인딩과 어긋날 수 있다.
 */

import { PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-volunteer-draft'
import { shouldIncludeInterviewStages } from './detail-case.ts'
import {
  collectRuntimeHiddenAnswerKeys,
  coerceApplicationFormDocument,
} from './application-form-draft.ts'
import {
  isDynamicVolunteerInterviewParagraph,
  isVolunteerInterviewScheduleParagraphId,
} from './apply-form-paragraph-ids.ts'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function readDynamicQuestionOptionCount(runtimeContext: unknown, questionKey: string): number | null {
  if (!isRecord(runtimeContext)) return null
  const audience = runtimeContext.audienceApplication
  if (!isRecord(audience) || !isRecord(audience.dynamicQuestions)) return null
  const raw = audience.dynamicQuestions[questionKey]
  if (!isRecord(raw)) return null
  const count = raw.optionCount
  return typeof count === 'number' && Number.isFinite(count) ? count : null
}

/**
 * `getVolunteerApplicationFormHiddenParagraphIds({ interviewEnabled })` 에 넘길 값.
 * - `false` → 면접 단락 숨김
 * - `true` → 면접 단락 노출(프로그램 플래그로 숨기지 않음)
 * - `undefined` → 프로그램 상세 플래그만 사용
 */
export function resolveVolunteerPortalInterviewEnabledForHidden(input: {
  formBinding?: unknown
  runtimeContext?: unknown
  program?: Parameters<typeof shouldIncludeInterviewStages>[1] | null
}): boolean | undefined {
  const interviewId = PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.interviewSchedule
  const document = input.formBinding != null
    ? coerceApplicationFormDocument(input.formBinding)
    : input.runtimeContext != null
      ? { runtimeContext: input.runtimeContext, paragraphs: [] as unknown[] }
      : null

  if (document) {
    const hiddenKeys = collectRuntimeHiddenAnswerKeys(document)
    if (hiddenKeys.has(interviewId)) return false

    const optionCount = readDynamicQuestionOptionCount(document.runtimeContext, interviewId)
    if (optionCount === 0) return false
    if (optionCount != null && optionCount > 0) return true

    const paragraphs = document.paragraphs
    if (Array.isArray(paragraphs)) {
      const interviewParagraph = paragraphs.find(
        paragraph =>
          isRecord(paragraph) &&
          typeof paragraph.id === 'string' &&
          isVolunteerInterviewScheduleParagraphId(paragraph.id),
      )
      if (interviewParagraph && isDynamicVolunteerInterviewParagraph(interviewParagraph)) {
        return true
      }
      if (
        interviewParagraph &&
        isRecord(interviewParagraph) &&
        (interviewParagraph.runtimeHidden === true || interviewParagraph.hidden === true)
      ) {
        return false
      }
    }

    return undefined
  }

  if (!input.program) return undefined
  return shouldIncludeInterviewStages('volunteer', input.program)
}
