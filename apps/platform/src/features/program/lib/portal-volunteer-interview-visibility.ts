/**
 * 봉사자 신청 면접 단락 노출 — form-binding runtime이 SSOT.
 * 프로그램 상세 `interviewEnabled`만으로 숨기면 모집·바인딩과 어긋날 수 있다.
 */

import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-instructor-draft'
import { PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-volunteer-draft'
import { UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@jakorea/form-schema/paragraph-ids/ujat-program-application-form-volunteer-draft'
import { shouldIncludeInterviewStages } from './detail-case.ts'
import {
  collectRuntimeHiddenAnswerKeys,
  coerceApplicationFormDocument,
  resolvePortalApplicationFormRuntimeContext,
} from './application-form-draft.ts'
import {
  isDynamicVolunteerActivityScheduleParagraph,
  isDynamicVolunteerInterviewParagraph,
  isInstructorAvailableScheduleParagraphId,
  isVolunteerInterviewScheduleParagraphId,
} from './apply-form-paragraph-ids.ts'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function readDynamicQuestionOptionCount(
  runtimeContext: unknown,
  questionKey: string,
): number | null {
  if (!isRecord(runtimeContext)) return null
  const audience = runtimeContext.audienceApplication
  if (!isRecord(audience) || !isRecord(audience.dynamicQuestions)) return null
  const raw = audience.dynamicQuestions[questionKey]
  if (!isRecord(raw)) return null
  const count = raw.optionCount
  return typeof count === 'number' && Number.isFinite(count) ? count : null
}

function resolveVolunteerDynamicQuestionEnabledForHidden(
  input: {
    formBinding?: unknown
    runtimeContext?: unknown
    program?: Parameters<typeof shouldIncludeInterviewStages>[1] | null
  },
  questionKey: string,
  paragraphMatcher: (paragraph: unknown) => boolean,
  options?: { hideWhenOptionCountZero?: boolean },
): boolean | undefined {
  const interviewId = questionKey
  const document = input.formBinding != null
    ? coerceApplicationFormDocument(input.formBinding)
    : input.runtimeContext != null
      ? { runtimeContext: input.runtimeContext, paragraphs: [] as unknown[] }
      : null

  const runtimeContext =
    document?.runtimeContext ?? resolvePortalApplicationFormRuntimeContext(input.formBinding)

  if (document || runtimeContext) {
    const hiddenKeys = document ? collectRuntimeHiddenAnswerKeys(document) : new Set<string>()
    if (hiddenKeys.has(interviewId)) return false

    const optionCount = readDynamicQuestionOptionCount(runtimeContext, interviewId)
    const hideWhenOptionCountZero = options?.hideWhenOptionCountZero !== false
    if (optionCount === 0 && hideWhenOptionCountZero) return false
    if (optionCount != null && optionCount > 0) return true

    const paragraphs = document?.paragraphs
    if (Array.isArray(paragraphs)) {
      const paragraph = paragraphs.find(
        paragraph =>
          isRecord(paragraph) &&
          typeof paragraph.id === 'string' &&
          paragraph.id === questionKey,
      )
      if (paragraph && paragraphMatcher(paragraph)) return true
      if (
        paragraph &&
        isRecord(paragraph) &&
        (paragraph.runtimeHidden === true || paragraph.hidden === true)
      ) {
        return false
      }
    }

    return undefined
  }

  if (!input.program) return undefined
  return shouldIncludeInterviewStages('volunteer', input.program)
}

/**
 * `getVolunteerApplicationFormHiddenParagraphIds({ interviewEnabled })` 에 넘길 값.
 * - `false` → 면접 단락 숨김
 * - `true` → 면접 단락 노출(프로그램 플래그로 숨기지 않음)
 * - `undefined` → 프로그램 상세 플래그만 사용
 */
function readRuntimeInterviewEnabled(runtimeContext: unknown): boolean | undefined {
  if (!isRecord(runtimeContext) || typeof runtimeContext.interviewEnabled !== 'boolean') {
    return undefined
  }
  return runtimeContext.interviewEnabled
}

function resolveVolunteerInterviewQuestionKey(input: {
  formBinding?: unknown
  runtimeContext?: unknown
}): string {
  const document = input.formBinding != null
    ? coerceApplicationFormDocument(input.formBinding)
    : input.runtimeContext != null
      ? { runtimeContext: input.runtimeContext, paragraphs: [] as unknown[] }
      : null
  const paragraphs = document?.paragraphs
  if (Array.isArray(paragraphs)) {
    const found = paragraphs.find(
      paragraph =>
        isRecord(paragraph) &&
        typeof paragraph.id === 'string' &&
        isVolunteerInterviewScheduleParagraphId(paragraph.id),
    )
    if (isRecord(found) && typeof found.id === 'string') return found.id
  }
  return PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.interviewSchedule
}

export function resolveVolunteerPortalInterviewEnabledForHidden(input: {
  formBinding?: unknown
  runtimeContext?: unknown
  program?: Parameters<typeof shouldIncludeInterviewStages>[1] | null
}): boolean | undefined {
  const document = input.formBinding != null
    ? coerceApplicationFormDocument(input.formBinding)
    : input.runtimeContext != null
      ? { runtimeContext: input.runtimeContext, paragraphs: [] as unknown[] }
      : null
  const runtimeContext =
    document?.runtimeContext ?? resolvePortalApplicationFormRuntimeContext(input.formBinding)
  const interviewFlag = readRuntimeInterviewEnabled(runtimeContext)
  const interviewId = resolveVolunteerInterviewQuestionKey(input)
  const paragraphs = document?.paragraphs
  if (Array.isArray(paragraphs)) {
    const paragraph = paragraphs.find(
      row => isRecord(row) && typeof row.id === 'string' && row.id === interviewId,
    )
    if (isRecord(paragraph) && (paragraph.runtimeHidden === true || paragraph.hidden === true)) {
      return false
    }
  }
  if (interviewFlag === false) return false
  if (interviewFlag === true) return true
  return resolveVolunteerDynamicQuestionEnabledForHidden(
    input,
    interviewId,
    paragraph =>
      isVolunteerInterviewScheduleParagraphId(String((paragraph as { id?: string }).id ?? '')) &&
      (isDynamicVolunteerInterviewParagraph(paragraph) ||
        interviewId === UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.interviewSchedule),
  )
}

/** 봉사 진행 가능 일정 — 면접 optionCount와 독립. optionCount 0만으로 숨기지 않는다. */
export function resolveVolunteerPortalActivityScheduleEnabledForHidden(input: {
  formBinding?: unknown
  runtimeContext?: unknown
}): boolean | undefined {
  const activityId = PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.activitySchedule
  return resolveVolunteerDynamicQuestionEnabledForHidden(
    input,
    activityId,
    paragraph =>
      isDynamicVolunteerActivityScheduleParagraph(paragraph) ||
      (typeof (paragraph as { id?: unknown }).id === 'string' &&
        (paragraph as { id: string }).id === activityId),
    { hideWhenOptionCountZero: false },
  )
}

/** 강사 강의 진행 가능 일정 — hiddenQuestionKeys / runtimeHidden 만 숨김. optionCount 0은 노출 후 제출 차단. */
export function resolveInstructorPortalAvailableScheduleEnabledForHidden(input: {
  formBinding?: unknown
  runtimeContext?: unknown
}): boolean | undefined {
  const scheduleId = PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule
  return resolveVolunteerDynamicQuestionEnabledForHidden(
    input,
    scheduleId,
    paragraph =>
      isInstructorAvailableScheduleParagraphId(
        String((paragraph as { id?: string }).id ?? ''),
      ),
    { hideWhenOptionCountZero: false },
  )
}
