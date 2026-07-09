import type { FileUploadResult } from '@/entities/application/api/file-upload-service'
import {
  createDefaultParticipantRowVisibility,
  DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES,
  TEMPLATE_FIELD_CERTIFICATE_BACKGROUND,
  TEMPLATE_FIELD_CHAIRMAN_SEAL,
  TEMPLATE_FIELD_ORG_LOGO,
  TEMPLATE_FIELD_ORG_LOGO_02,
} from '@/features/template/ui/template-management/template-custom-fields-form'
import {
  normalizeWritingFormDraft,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'

export const EMPTY_CERTIFICATE_SCHEMA_DRAFT: WritingFormDraft = normalizeWritingFormDraft({
  schemaVersion: 1,
  formSettings: { titleNumbering: 'none' },
  paragraphs: [],
})

const IMAGE_FIELD_NAMES = [
  TEMPLATE_FIELD_ORG_LOGO,
  TEMPLATE_FIELD_ORG_LOGO_02,
  TEMPLATE_FIELD_CERTIFICATE_BACKGROUND,
  TEMPLATE_FIELD_CHAIRMAN_SEAL,
] as const

const STRING_FIELD_NAMES = [
  'titleName',
  'bodyContent',
  'chairmanName',
  'orgAddress',
  'orgPhone',
  'orgFax',
  'orgWebsite',
  'participantInfo',
] as const

type ImageFieldName = (typeof IMAGE_FIELD_NAMES)[number]
type StringFieldName = (typeof STRING_FIELD_NAMES)[number]

export type CertificateFormSettingsState = {
  stringPreviewValues: Record<string, string>
  logoUploadResults: Record<string, FileUploadResult>
  participantRowVisibility: boolean[]
}

function isFileUploadResult(value: unknown): value is FileUploadResult {
  if (value == null || typeof value !== 'object') return false
  const row = value as Record<string, unknown>
  return typeof row.url === 'string' && typeof row.fileName === 'string'
}

function parseImageField(value: unknown): FileUploadResult | undefined {
  if (isFileUploadResult(value)) return value
  return undefined
}

function parseParticipantRowVisibility(value: unknown): boolean[] | undefined {
  if (!Array.isArray(value)) return undefined
  const rows = value.filter((item): item is boolean => typeof item === 'boolean')
  return rows.length > 0 ? rows : undefined
}

export function parseCertificateFormSettings(
  settingsJson: Record<string, unknown> | undefined,
  fallbackTitleName?: string
): CertificateFormSettingsState {
  const stringPreviewValues: Record<string, string> = {
    ...DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES,
    ...(fallbackTitleName != null ? { titleName: fallbackTitleName } : {}),
  }

  if (settingsJson != null) {
    for (const fieldName of STRING_FIELD_NAMES) {
      const value = settingsJson[fieldName]
      if (typeof value === 'string') {
        stringPreviewValues[fieldName] = value
      }
    }
  }

  const logoUploadResults: Record<string, FileUploadResult> = {}
  if (settingsJson != null) {
    for (const fieldName of IMAGE_FIELD_NAMES) {
      const parsed = parseImageField(settingsJson[fieldName])
      if (parsed != null) {
        logoUploadResults[fieldName] = parsed
      }
    }
  }

  return {
    stringPreviewValues,
    logoUploadResults,
    participantRowVisibility:
      parseParticipantRowVisibility(settingsJson?.participantRowVisibility) ??
      createDefaultParticipantRowVisibility(),
  }
}

/** 프로그램 실발급 — 강사 활동 인증서 */
export const INSTRUCTOR_ACTIVITY_CERTIFICATE_TEMPLATE_CODE = 'document-4' as const
/** 프로그램 실발급 — 봉사 활동 인증서 */
export const VOLUNTEER_ACTIVITY_CERTIFICATE_TEMPLATE_CODE = 'document-5' as const

export function mergeCertificateRuntimeStringValues(
  templateValues: Record<string, string>,
  runtimeValues: Record<string, string>,
  overrideKeys: readonly string[]
): Record<string, string> {
  const merged = { ...templateValues }
  for (const key of overrideKeys) {
    const value = runtimeValues[key]
    if (typeof value === 'string') {
      merged[key] = value
    }
  }
  return merged
}

export function resolveCertificateStringPreviewValues(args: {
  hydrated: CertificateFormSettingsState | null
  fallbackTitleName?: string
  prefillStringValues?: Record<string, string>
  runtimeStringValues?: Record<string, string>
  runtimeStringOverrideKeys?: readonly string[]
  templateCode?: string
  open: boolean
}): Record<string, string> {
  if (args.hydrated != null) {
    let strings = { ...args.hydrated.stringPreviewValues }
    if (args.runtimeStringValues != null && (args.runtimeStringOverrideKeys?.length ?? 0) > 0) {
      strings = mergeCertificateRuntimeStringValues(
        strings,
        args.runtimeStringValues,
        args.runtimeStringOverrideKeys!
      )
    }
    return strings
  }

  const base = parseCertificateFormSettings(undefined, args.fallbackTitleName)
  let strings = { ...base.stringPreviewValues }

  const awaitingApi =
    args.open && args.templateCode != null && args.templateCode !== ''

  if (awaitingApi && args.runtimeStringValues != null) {
    return { ...strings, ...args.runtimeStringValues }
  }

  if (args.prefillStringValues != null) {
    strings = { ...strings, ...args.prefillStringValues }
  }

  if (args.runtimeStringValues != null && (args.runtimeStringOverrideKeys?.length ?? 0) > 0) {
    strings = mergeCertificateRuntimeStringValues(
      strings,
      args.runtimeStringValues,
      args.runtimeStringOverrideKeys!
    )
  }

  return strings
}

export function buildCertificateLogoPreviewUrls(
  logoUploadResults: Record<string, FileUploadResult>
): Record<string, string> {
  const urls: Record<string, string> = {}
  for (const [fieldName, result] of Object.entries(logoUploadResults)) {
    if (result?.url) {
      urls[fieldName] = result.url
    }
  }
  return urls
}

export function buildCertificateFormSettings(
  state: CertificateFormSettingsState
): Record<string, unknown> {
  const settings: Record<string, unknown> = {
    participantRowVisibility: state.participantRowVisibility,
  }

  for (const fieldName of STRING_FIELD_NAMES) {
    const value = state.stringPreviewValues[fieldName as StringFieldName]
    if (typeof value === 'string') {
      settings[fieldName] = value
    }
  }

  for (const fieldName of IMAGE_FIELD_NAMES) {
    const result = state.logoUploadResults[fieldName as ImageFieldName]
    settings[fieldName] = result ?? null
  }

  return settings
}
