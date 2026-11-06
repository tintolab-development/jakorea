import type { WritingFormDraft } from '@jakorea/form-schema/writing-form'
import { resolveApplicationAnswerKey } from './application-answer-key.ts'
import { isApplicationPreferredScheduleParagraphId } from './apply-form-paragraph-ids.ts'

const ANSWER_VALIDATION_CODES = new Set([
  'FORM_ANSWER_REQUIRED',
  'FORM_REQUIRED_CONSENT_NOT_AGREED',
  'FORM_ANSWER_TOO_LONG',
  'FORM_ANSWER_TYPE_INVALID',
  'FORM_ANSWER_TOO_LONG',
  'FORM_REQUIRED_CONSENT_NOT_AGREED',
  'FORM_OPTION_NOT_ALLOWED',
  'FORM_ANSWER_NOT_ALLOWED',
  'RUNTIME_FORM_FIELD_NOT_ALLOWED',
  'INVALID_VALUE',
  'VALIDATION_FAILED',
  'OPERATION_NOT_ALLOWED',
  'PREFERRED_SCHEDULE_OUTSIDE_TRAINING_REQUEST_RANGE',
])

export function isApplicationAnswerValidationErrorCode(code: string | null | undefined): boolean {
  if (!code) return false
  return ANSWER_VALIDATION_CODES.has(code.trim().toUpperCase())
}

export function resolveApplicationErrorParagraphId(
  field: unknown,
  draft: WritingFormDraft | null,
): string | null {
  if (typeof field !== 'string') return null
  const fieldKey = field.trim()
  if (!fieldKey) return null

  const matchedParagraph = draft?.paragraphs.find(
    paragraph => paragraph.id === fieldKey || resolveApplicationAnswerKey(paragraph) === fieldKey,
  )
  if (matchedParagraph) return matchedParagraph.id

  if (fieldKey === 'preferredScheduleBlocks') {
    return (
      draft?.paragraphs.find(paragraph => isApplicationPreferredScheduleParagraphId(paragraph.id))
        ?.id ?? null
    )
  }

  return null
}

function messageFromUnknown(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (value && typeof value === 'object' && !Array.isArray(value) && 'message' in value) {
    const nested = (value as { message?: unknown }).message
    if (typeof nested === 'string' && nested.trim()) return nested.trim()
  }
  return null
}

function addParagraphError(
  out: Record<string, string>,
  draft: WritingFormDraft | null,
  field: unknown,
  message: string,
): void {
  const paragraphId = resolveApplicationErrorParagraphId(field, draft)
  if (!paragraphId || paragraphId in out) return
  out[paragraphId] = message
}

export function collectApplicationSubmitParagraphErrors(
  envelope: { field: unknown; details: unknown; message: string | null },
  draft: WritingFormDraft | null,
  fallbackMessage: string,
): Record<string, string> {
  const out: Record<string, string> = {}
  const fallback = fallbackMessage.trim() || '입력값 또는 요청 조건을 확인해 주세요.'

  addParagraphError(out, draft, envelope.field, messageFromUnknown(envelope.message) ?? fallback)

  const details = envelope.details
  if (typeof details === 'string' && details.trim()) {
    addParagraphError(out, draft, envelope.field, details.trim())
  } else if (Array.isArray(details)) {
    for (const item of details) {
      if (!item || typeof item !== 'object') continue
      const row = item as { field?: unknown; path?: unknown; message?: unknown }
      const message = messageFromUnknown(row.message) ?? fallback
      addParagraphError(out, draft, row.field ?? row.path, message)
    }
  } else if (details && typeof details === 'object') {
    const detailRecord = details as Record<string, unknown>
    addParagraphError(
      out,
      draft,
      detailRecord.answerKey ?? detailRecord.field,
      messageFromUnknown(envelope.message) ?? fallback,
    )
    for (const [key, value] of Object.entries(details)) {
      if (key === 'reason') {
        const reason = messageFromUnknown(value)
        if (reason) addParagraphError(out, draft, envelope.field, reason)
        continue
      }
      if (key === 'answerKey' || key === 'field') continue
      addParagraphError(out, draft, key, messageFromUnknown(value) ?? fallback)
    }
  }

  return out
}
