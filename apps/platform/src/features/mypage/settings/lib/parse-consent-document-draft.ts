import { createConsentTemplateSeedDraft } from '@jakorea/form-schema/consent'
import type { WritingFormDraft } from '@jakorea/form-schema/writing-form'
import { coerceApplicationFormDocument } from '@/features/program/lib/application-form-draft'
import type { PortalConsentDocumentDetail } from '../api/consents'

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function isWritingFormDraft(value: unknown): value is WritingFormDraft {
  return (
    value != null &&
    typeof value === 'object' &&
    Array.isArray((value as WritingFormDraft).paragraphs) &&
    (value as WritingFormDraft).paragraphs.length > 0
  )
}

function coerceDraftFromPayload(payload: unknown): WritingFormDraft | null {
  if (payload == null) return null
  const document = coerceApplicationFormDocument(payload)
  if (document != null && isWritingFormDraft(document)) {
    return document
  }
  if (isWritingFormDraft(payload)) return payload
  return null
}

/** API `content`·중첩 `schemaJson`·`filledDocument` 등에서 WritingFormDraft를 추출한다. */
export function parseWritingFormDraftFromUnknown(payload: unknown): WritingFormDraft | null {
  if (payload == null) return null

  if (typeof payload === 'string') {
    const trimmed = payload.trim()
    if (!trimmed) return null
    try {
      return parseWritingFormDraftFromUnknown(JSON.parse(trimmed) as unknown)
    } catch {
      return null
    }
  }

  const direct = coerceDraftFromPayload(payload)
  if (direct != null) return direct

  if (!isRecord(payload)) return null

  const candidates: unknown[] = [
    payload.schemaJson,
    payload.filledDocument,
    payload.draft,
    payload.writingForm,
    payload.document,
    payload.form,
    payload.data,
    payload.content,
  ]

  let best: WritingFormDraft | null = null
  for (const candidate of candidates) {
    const parsed = parseWritingFormDraftFromUnknown(candidate)
    if (parsed == null) continue
    if (best == null || parsed.paragraphs.length >= best.paragraphs.length) {
      best = parsed
    }
  }

  return best
}

export type ResolveConsentPreviewDraftOptions = {
  /** 로컬 mock(비 remote) 세션에서만 API 없을 때 seed 양식 사용 */
  allowTemplateSeedFallback?: boolean
}

function draftFromPortalConsentDocumentDetail(
  detail: PortalConsentDocumentDetail,
): WritingFormDraft | null {
  return (
    parseWritingFormDraftFromUnknown(detail.content) ??
    parseWritingFormDraftFromUnknown(detail.schemaJson) ??
    parseWritingFormDraftFromUnknown(detail)
  )
}

/**
 * 제출 동의서 상세 → 미리보기 draft.
 * remote에서 상세를 받았는데 파싱 실패 시 seed로 대체하지 않는다.
 */
export function resolveConsentPreviewDraft(
  detail: PortalConsentDocumentDetail | null | undefined,
  templateId: string,
  options: ResolveConsentPreviewDraftOptions = {},
): WritingFormDraft | null {
  const { allowTemplateSeedFallback = false } = options

  if (detail != null) {
    return draftFromPortalConsentDocumentDetail(detail)
  }

  if (allowTemplateSeedFallback) {
    return createConsentTemplateSeedDraft(templateId)
  }

  return null
}
