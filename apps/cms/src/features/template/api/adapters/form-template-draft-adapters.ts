import {
  normalizeWritingFormDraft,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'

const SCHEMA_VERSION = 1 as const

export type FormTemplateExtensionPayload = {
  overlay?: Record<string, unknown>
  editorState?: Record<string, unknown>
  uiState?: Record<string, unknown>
}

function parseJsonTextField(
  value: string | Record<string, unknown> | null | undefined
): unknown | null {
  if (value == null) return null
  if (typeof value === 'object') return value
  if (typeof value !== 'string' || value.trim() === '') return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export function writingFormDraftToSchemaJson(draft: WritingFormDraft): string {
  const normalized = normalizeWritingFormDraft(draft)
  return JSON.stringify({
    schemaVersion: SCHEMA_VERSION,
    formSettings: normalized.formSettings,
    paragraphs: normalized.paragraphs,
  })
}

export function schemaJsonToWritingFormDraft(
  schemaJson: string | Record<string, unknown> | null | undefined
): WritingFormDraft | null {
  const parsed = parseJsonTextField(schemaJson)
  if (parsed == null || typeof parsed !== 'object') return null
  const draft = parsed as Partial<WritingFormDraft>
  return normalizeWritingFormDraft({
    schemaVersion: SCHEMA_VERSION,
    formSettings: draft.formSettings ?? { titleNumbering: 'numeric' },
    paragraphs: Array.isArray(draft.paragraphs) ? draft.paragraphs : [],
  })
}

export function extensionJsonToExtensionPayload(
  extensionJson: string | Record<string, unknown> | null | undefined
): FormTemplateExtensionPayload | null {
  const parsed = parseJsonTextField(extensionJson)
  if (parsed == null || typeof parsed !== 'object') return null
  const row = parsed as Record<string, unknown>
  const overlay =
    row.overlay != null && typeof row.overlay === 'object'
      ? (row.overlay as Record<string, unknown>)
      : undefined
  const editorState =
    row.editorState != null && typeof row.editorState === 'object'
      ? (row.editorState as Record<string, unknown>)
      : undefined
  const uiState =
    row.uiState != null && typeof row.uiState === 'object'
      ? (row.uiState as Record<string, unknown>)
      : undefined
  if (overlay == null && editorState == null && uiState == null) return null
  return { overlay, editorState, uiState }
}

export function extensionPayloadToExtensionJson(payload: FormTemplateExtensionPayload): string {
  return JSON.stringify({
    overlay: payload.overlay ?? {},
    editorState: payload.editorState ?? {},
    uiState: payload.uiState ?? {},
  })
}

export function settingsJsonToSettingsPayload(
  settingsJson: string | Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  const parsed = parseJsonTextField(settingsJson)
  if (parsed == null || typeof parsed !== 'object') return null
  return parsed as Record<string, unknown>
}

export function settingsPayloadToSettingsJson(settings: Record<string, unknown>): string {
  return JSON.stringify(settings)
}
