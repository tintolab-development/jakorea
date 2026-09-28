/**
 * Portal ApplicationFormResponse.form → WritingFormDraft.
 * draftAnswers 를 문단 필드에 병합한다.
 */

import {
  normalizeWritingFormDraft,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import { resolveApplicationAnswerKey } from './application-answer-key.ts'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/**
 * 제출 시 백엔드는 runtime hidden 문항 키가 answers에 있으면
 * "Hidden runtime form question cannot be submitted" → OPERATION_NOT_ALLOWED.
 * 렌더 장식은 단락을 지우지 않고 hidden / runtimeHidden, runtimeContext.hiddenQuestionKeys 만 찍는다.
 */
function isRuntimeHiddenParagraph(paragraph: object): boolean {
  const row = paragraph as Record<string, unknown>
  return row.hidden === true || row.runtimeHidden === true
}

function addStringList(target: Set<string>, value: unknown) {
  if (!Array.isArray(value)) return
  for (const item of value) {
    if (typeof item === 'string' && item.trim()) target.add(item.trim())
  }
}

export function collectRuntimeHiddenAnswerKeys(form: unknown): Set<string> {
  const hidden = new Set<string>()
  const document = coerceApplicationFormDocument(form)
  if (!document) return hidden

  const runtime = document.runtimeContext
  if (isRecord(runtime)) {
    addStringList(hidden, runtime.hiddenQuestionKeys)
    const audience = runtime.audienceApplication
    if (isRecord(audience)) addStringList(hidden, audience.hiddenQuestionKeys)
  }

  const paragraphs = document.paragraphs
  if (!Array.isArray(paragraphs)) return hidden
  for (const paragraph of paragraphs) {
    if (!isRecord(paragraph) || !isRuntimeHiddenParagraph(paragraph)) continue
    const key = resolveApplicationAnswerKey(paragraph)
    if (key) hidden.add(key)
    if (typeof paragraph.id === 'string' && paragraph.id.trim()) hidden.add(paragraph.id.trim())
  }
  return hidden
}

function withoutRuntimeHiddenParagraphs(
  document: Record<string, unknown>,
): Record<string, unknown> {
  const hidden = collectRuntimeHiddenAnswerKeys(document)
  if (hidden.size === 0 || !Array.isArray(document.paragraphs)) return document
  return {
    ...document,
    paragraphs: document.paragraphs.filter(paragraph => {
      if (!isRecord(paragraph)) return true
      const key = resolveApplicationAnswerKey(paragraph)
      const id = typeof paragraph.id === 'string' ? paragraph.id.trim() : ''
      return !(key && hidden.has(key)) && !(id && hidden.has(id))
    }),
  }
}

function hasParagraphs(value: unknown): value is { paragraphs: unknown[] } {
  return isRecord(value) && Array.isArray(value.paragraphs)
}

/** form 이 schemaJson 래퍼면 파싱. 이미 paragraphs 면 그대로. */
export function coerceApplicationFormDocument(
  form: unknown,
): Record<string, unknown> | null {
  if (!form) return null
  if (hasParagraphs(form)) return form as Record<string, unknown>
  if (!isRecord(form)) return null
  const schemaJson = form.schemaJson
  if (typeof schemaJson !== 'string' || !schemaJson.trim()) return null
  try {
    const parsed: unknown = JSON.parse(schemaJson)
    return hasParagraphs(parsed) ? (parsed as Record<string, unknown>) : null
  } catch {
    return null
  }
}

function mergeAnswerIntoParagraph(
  paragraph: WritingFormParagraph,
  answer: unknown,
): WritingFormParagraph {
  if (answer == null) return paragraph

  if (typeof answer === 'string') {
    if (paragraph.kind === 'single_item' && paragraph.variant === 'short_essay') {
      return { ...paragraph, bodyText: answer }
    }
    return paragraph
  }

  if (Array.isArray(answer)) {
    if (
      paragraph.kind === 'single_item' &&
      paragraph.variant === 'multiple_choice' &&
      answer.every(item => typeof item === 'string')
    ) {
      return { ...paragraph, selectedPreviewMultipleIds: answer as string[] }
    }
    return paragraph
  }

  if (!isRecord(answer)) return paragraph

  let next: WritingFormParagraph = paragraph
  if (
    'bottomConsent' in answer &&
    (answer.bottomConsent === 'agree' || answer.bottomConsent === 'disagree') &&
    'showBottomConsent' in next
  ) {
    next = { ...next, bottomConsent: answer.bottomConsent }
  }
  if (
    typeof answer.bodyText === 'string' &&
    next.kind === 'single_item' &&
    next.variant === 'short_essay'
  ) {
    next = { ...next, bodyText: answer.bodyText }
  }
  if (
    Array.isArray(answer.selectedPreviewMultipleIds) &&
    next.kind === 'single_item' &&
    next.variant === 'multiple_choice' &&
    answer.selectedPreviewMultipleIds.every(item => typeof item === 'string')
  ) {
    next = {
      ...next,
      selectedPreviewMultipleIds: answer.selectedPreviewMultipleIds as string[],
    }
  }
  return next
}

export function writingFormDraftFromApplicationForm(
  form: unknown,
  draftAnswers?: Record<string, unknown> | null,
): WritingFormDraft | null {
  const document = coerceApplicationFormDocument(form)
  if (!document) return null
  const visible = withoutRuntimeHiddenParagraphs(document)
  const normalized = normalizeWritingFormDraft(visible as unknown as WritingFormDraft)
  if (!draftAnswers || Object.keys(draftAnswers).length === 0) {
    return normalized
  }
  return {
    ...normalized,
    paragraphs: normalized.paragraphs.map(paragraph => {
      const key = resolveApplicationAnswerKey(paragraph)
      if (!key || !(key in draftAnswers)) return paragraph
      return mergeAnswerIntoParagraph(paragraph, draftAnswers[key])
    }),
  }
}

function extractParagraphAnswer(paragraph: WritingFormParagraph): unknown {
  if ('showBottomConsent' in paragraph && paragraph.showBottomConsent) {
    return { bottomConsent: paragraph.bottomConsent ?? null }
  }
  if (paragraph.kind === 'single_item' && paragraph.variant === 'short_essay') {
    const items = paragraph.items ?? []
    if (items.length === 0) {
      return paragraph.bodyText ?? ''
    }
    return {
      bodyText: paragraph.bodyText ?? '',
      items: items.map(item => ({ id: item.id, bodyText: item.bodyText ?? '' })),
    }
  }
  if (paragraph.kind === 'single_item' && paragraph.variant === 'multiple_choice') {
    return paragraph.selectedPreviewMultipleIds ?? []
  }
  if (paragraph.kind === 'single_item' && paragraph.variant === 'horizontal_table') {
    /** 동의 없는 표(기본 정보 등) — 키가 빠지면 submit REQUIRED 실패 */
    return {
      fieldDataRows: 'fieldDataRows' in paragraph ? paragraph.fieldDataRows : [],
      dataRows: 'dataRows' in paragraph ? paragraph.dataRows : [],
    }
  }
  return undefined
}

function isRequiredParagraph(paragraph: WritingFormParagraph): boolean {
  if ('answerRequired' in paragraph && paragraph.answerRequired === true) return true
  if ('requiredMark' in paragraph && paragraph.requiredMark === true) return true
  return false
}

/** 제출용 answers — 문단 id(키 규칙) → 답 */
export function buildApplicationAnswersFromDraft(
  draft: WritingFormDraft,
  options?: {
    omitParagraphIds?: ReadonlySet<string>
    /** 문단 id → 덮어쓸 답 (예: preferred-schedule 블록) */
    overrides?: Record<string, unknown>
  },
): Record<string, unknown> {
  const omit = options?.omitParagraphIds
  const overrides = options?.overrides
  const answers: Record<string, unknown> = {}
  for (const paragraph of draft.paragraphs) {
    const key = resolveApplicationAnswerKey(paragraph)
    if (!key) continue
    if (isRuntimeHiddenParagraph(paragraph)) continue
    if (omit?.has(key) || omit?.has(paragraph.id)) continue
    if (overrides && key in overrides) {
      answers[key] = overrides[key]
      continue
    }
    const value = extractParagraphAnswer(paragraph)
    if (value !== undefined) {
      answers[key] = value
      continue
    }
    if (isRequiredParagraph(paragraph)) {
      answers[key] = {}
    }
  }
  if (overrides) {
    for (const [key, value] of Object.entries(overrides)) {
      if (omit?.has(key)) continue
      answers[key] = value
    }
  }
  return answers
}
