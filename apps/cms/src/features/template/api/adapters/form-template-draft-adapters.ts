import {
  normalizeWritingFormDraft,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'

const SCHEMA_VERSION = 1 as const

export function writingFormDraftToSchemaJson(draft: WritingFormDraft): string {
  const normalized = normalizeWritingFormDraft(draft)
  return JSON.stringify({
    schemaVersion: SCHEMA_VERSION,
    formSettings: normalized.formSettings,
    paragraphs: normalized.paragraphs,
  })
}

export function schemaJsonToWritingFormDraft(schemaJson: string | undefined | null): WritingFormDraft | null {
  if (schemaJson == null || schemaJson.trim() === '') return null
  try {
    const parsed = JSON.parse(schemaJson) as Partial<WritingFormDraft>
    if (parsed == null || typeof parsed !== 'object') return null
    return normalizeWritingFormDraft({
      schemaVersion: SCHEMA_VERSION,
      formSettings: parsed.formSettings ?? { titleNumbering: 'numeric' },
      paragraphs: Array.isArray(parsed.paragraphs) ? parsed.paragraphs : [],
    })
  } catch {
    return null
  }
}
