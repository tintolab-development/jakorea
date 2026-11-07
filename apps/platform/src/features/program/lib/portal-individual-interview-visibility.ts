/**
 * 개인 참여자 신청 면접 단락 노출 — INDIVIDUAL flavor 전용.
 * 봉사자 면접 키·로직을 복사하지 않는다.
 */

import { coerceApplicationFormDocument } from './application-form-draft.ts'
import { isIndividualInterviewScheduleParagraphId } from './apply-form-paragraph-ids.ts'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function readRuntimeInterviewEnabled(runtimeContext: unknown): boolean | undefined {
  if (!isRecord(runtimeContext) || typeof runtimeContext.interviewEnabled !== 'boolean') {
    return undefined
  }
  return runtimeContext.interviewEnabled
}

function readDynamicOptionCount(runtimeContext: unknown, questionKey: string): number | null {
  if (!isRecord(runtimeContext)) return null
  const audience = runtimeContext.audienceApplication
  if (!isRecord(audience) || !isRecord(audience.dynamicQuestions)) return null
  const raw = audience.dynamicQuestions[questionKey]
  if (!isRecord(raw)) return null
  if (typeof raw.optionCount === 'number' && Number.isFinite(raw.optionCount)) {
    return raw.optionCount
  }
  return null
}

function readParagraphOptionCount(paragraph: Record<string, unknown>): number {
  if (Array.isArray(paragraph.items)) return paragraph.items.length
  if (Array.isArray(paragraph.options)) return paragraph.options.length
  return 0
}

function resolveIndividualInterviewQuestionKey(input: {
  formBinding?: unknown
  runtimeContext?: unknown
}): string | null {
  const document =
    input.formBinding != null
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
        isIndividualInterviewScheduleParagraphId(paragraph.id),
    )
    if (isRecord(found) && typeof found.id === 'string') return found.id
  }
  return null
}

/**
 * `true` — 면접 문항 노출 (interviewEnabled 이고 동적 옵션이 있음).
 * `false` — 숨김·미제출.
 */
export function resolveIndividualPortalInterviewEnabledForHidden(input: {
  formBinding?: unknown
  runtimeContext?: unknown
}): boolean {
  const document =
    input.formBinding != null
      ? coerceApplicationFormDocument(input.formBinding)
      : input.runtimeContext != null
        ? { runtimeContext: input.runtimeContext, paragraphs: [] as unknown[] }
        : null
  const runtimeContext = document?.runtimeContext ?? input.runtimeContext
  const interviewId = resolveIndividualInterviewQuestionKey(input)
  const paragraphs = document?.paragraphs
  let paragraph: Record<string, unknown> | null = null
  if (interviewId && Array.isArray(paragraphs)) {
    const found = paragraphs.find(
      row => isRecord(row) && typeof row.id === 'string' && row.id === interviewId,
    )
    paragraph = isRecord(found) ? found : null
  }
  if (paragraph && (paragraph.runtimeHidden === true || paragraph.hidden === true)) {
    return false
  }
  if (readRuntimeInterviewEnabled(runtimeContext) !== true) return false
  if (!interviewId) return false
  const optionCount =
    readDynamicOptionCount(runtimeContext, interviewId) ??
    (paragraph ? readParagraphOptionCount(paragraph) : 0)
  return optionCount > 0
}
