import { settingsJsonToSettingsPayload } from '@/features/template/api/adapters/form-template-draft-adapters'
import { fetchFormTemplateVersionRemote } from '@/features/template/api/form-templates-api-client'
import { putFormTemplateVersionJson } from '@/features/template/api/admin-form-templates-service'
import { AGREEMENT_CRIME_TEMPLATE_CODE } from '@/features/template/lib/agreement-crime-consent-settings'
import { downloadAdminFile, uploadAdminFile } from '@/shared/lib/admin-file-upload'
import type { FormTemplateVersionResponse } from '@/shared/api/generated/forms-surveys/schemas'

export const FORM_CATALOG_DOCUMENT_FILE_PURPOSE = 'FORM_CATALOG_DOCUMENT'

export type CatalogDocumentVersion = {
  versionNo: number
  fileObjectId: number
  activatedAt: string
  replacedAt?: string
}

export type CatalogDocumentSettings = {
  kind?: string
  templateCode?: string
  activeFileObjectId?: number
  activeVersionNo?: number
  activatedAt?: string
  versions?: CatalogDocumentVersion[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function readVersion(value: unknown): CatalogDocumentVersion | null {
  if (!isRecord(value)) return null
  const versionNo = value.versionNo
  const fileObjectId = value.fileObjectId
  const activatedAt = value.activatedAt
  if (typeof versionNo !== 'number' || typeof fileObjectId !== 'number') return null
  if (typeof activatedAt !== 'string' || activatedAt.trim() === '') return null
  const replacedAt = typeof value.replacedAt === 'string' ? value.replacedAt : undefined
  return { versionNo, fileObjectId, activatedAt, replacedAt }
}

export function parseCatalogDocumentSettings(
  settings: Record<string, unknown> | null | undefined
): CatalogDocumentSettings | null {
  if (settings == null) return null
  const raw = settings.catalogDocument
  if (!isRecord(raw)) return null
  const versions = Array.isArray(raw.versions)
    ? raw.versions.flatMap(item => {
        const version = readVersion(item)
        return version == null ? [] : [version]
      })
    : undefined
  const activeFileObjectId =
    typeof raw.activeFileObjectId === 'number' ? raw.activeFileObjectId : undefined
  const activeVersionNo = typeof raw.activeVersionNo === 'number' ? raw.activeVersionNo : undefined
  const activatedAt = typeof raw.activatedAt === 'string' ? raw.activatedAt : undefined
  const kind = typeof raw.kind === 'string' ? raw.kind : undefined
  const templateCode = typeof raw.templateCode === 'string' ? raw.templateCode : undefined
  return { kind, templateCode, activeFileObjectId, activeVersionNo, activatedAt, versions }
}

export function settingsWithActiveCatalogDocument(
  settings: Record<string, unknown> | null | undefined,
  activeFileObjectId: number
): Record<string, unknown> {
  const base = settings ?? {}
  const current = parseCatalogDocumentSettings(base)
  return {
    ...base,
    catalogDocument: {
      ...(current ?? {}),
      templateCode: current?.templateCode ?? AGREEMENT_CRIME_TEMPLATE_CODE,
      activeFileObjectId,
    },
  }
}

function jsonText(value: unknown): string | undefined {
  if (value == null) return undefined
  return typeof value === 'string' ? value : JSON.stringify(value)
}

export async function replaceAgreementCrimeCatalogDocument(args: {
  templateId: number
  versionId: number
  file: File
  version: Pick<FormTemplateVersionResponse, 'schemaJson' | 'extensionJson' | 'settingsJson'>
}): Promise<CatalogDocumentSettings | null> {
  const uploaded = await uploadAdminFile({
    file: args.file,
    owner: {
      ownerDomain: 'FORM',
      ownerType: 'FORM_TEMPLATE',
      ownerId: args.templateId,
      filePurpose: FORM_CATALOG_DOCUMENT_FILE_PURPOSE,
    },
  })
  const settings = settingsJsonToSettingsPayload(args.version.settingsJson) ?? {}
  await putFormTemplateVersionJson(args.versionId, {
    schemaJson: jsonText(args.version.schemaJson),
    extensionJson: jsonText(args.version.extensionJson),
    settingsJson: JSON.stringify(
      settingsWithActiveCatalogDocument(settings, uploaded.fileObjectId)
    ),
  })
  const refreshed = await fetchFormTemplateVersionRemote(args.versionId)
  return parseCatalogDocumentSettings(settingsJsonToSettingsPayload(refreshed.settingsJson))
}

export async function downloadCatalogDocumentFile(args: {
  fileObjectId: number
  fileName: string
}): Promise<void> {
  await downloadAdminFile({
    fileObjectId: args.fileObjectId,
    fileName: args.fileName,
  })
}
