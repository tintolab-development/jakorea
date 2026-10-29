import { settingsJsonToSettingsPayload } from '@/features/template/api/adapters/form-template-draft-adapters'
import { fetchFormTemplateVersionRemote } from '@/features/template/api/form-templates-api-client'
import { putFormTemplateVersionJson } from '@/features/template/api/admin-form-templates-service'
import {
  AGREEMENT_CRIME_TEMPLATE_CODE,
  validateCatalogDocumentUploadFile,
} from '@/features/template/lib/agreement-crime-consent-settings'
import {
  CATALOG_DOCUMENT_FILE_SIZE_ALERT_MESSAGE,
  CATALOG_DOCUMENT_FILE_TYPE_ALERT_MESSAGE,
} from '@/shared/constants/messages'
import {
  deleteFileObject,
  downloadAdminFile,
  getFileStatus,
  uploadAdminFile,
} from '@/shared/lib/admin-file-upload'
import type { FormTemplateVersionResponse } from '@/shared/api/generated/forms-surveys/schemas'

export const FORM_CATALOG_DOCUMENT_FILE_PURPOSE = 'FORM_CATALOG_DOCUMENT'

export type CatalogDocumentVersion = {
  versionNo: number
  fileObjectId: number
  activatedAt: string
  replacedAt?: string
  /** 업로드한 원본 파일명 — 다운로드 파일명에 사용 */
  fileName?: string
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
  const fileName =
    typeof value.fileName === 'string' && value.fileName.trim() !== '' ? value.fileName : undefined
  return {
    versionNo,
    fileObjectId,
    activatedAt,
    ...(replacedAt != null ? { replacedAt } : {}),
    ...(fileName != null ? { fileName } : {}),
  }
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

export type ActiveCatalogDocumentInput = {
  fileObjectId: number
  fileName?: string
}

function stripUndefined(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined))
}

/**
 * 새 활성 문서를 지정한다(C10). 이전 이력은 지우지 않고 versions에 남긴다.
 * - 이전 활성 버전에 replacedAt을 찍고, 새 버전(versionNo = 최대+1)을 추가한다.
 * - activeFileObjectId·activeVersionNo·activatedAt을 함께 갱신한다.
 * - 이미 같은 파일이 활성이면 이력을 중복 추가하지 않는다.
 * - versions 없이 activeFileObjectId만 있던 레거시 값은 이력 1건으로 보존한다.
 */
export function settingsWithActiveCatalogDocument(
  settings: Record<string, unknown> | null | undefined,
  active: number | ActiveCatalogDocumentInput,
  now: string = new Date().toISOString()
): Record<string, unknown> {
  const base = settings ?? {}
  const next = typeof active === 'number' ? { fileObjectId: active } : active
  const raw = isRecord(base.catalogDocument) ? base.catalogDocument : {}
  const current = parseCatalogDocumentSettings(base)
  const versions: CatalogDocumentVersion[] = [...(current?.versions ?? [])]
  const maxVersionNo = () => versions.reduce((max, item) => Math.max(max, item.versionNo), 0)

  const previousActiveId = current?.activeFileObjectId
  if (previousActiveId != null && !versions.some(item => item.fileObjectId === previousActiveId)) {
    versions.push({
      versionNo: current?.activeVersionNo ?? maxVersionNo() + 1,
      fileObjectId: previousActiveId,
      activatedAt: current?.activatedAt ?? now,
    })
  }

  const activeEntry =
    versions.find(item => item.versionNo === current?.activeVersionNo) ??
    versions.find(item => item.fileObjectId === previousActiveId)
  if (activeEntry != null && activeEntry.fileObjectId === next.fileObjectId) {
    return {
      ...base,
      catalogDocument: stripUndefined({
        ...raw,
        templateCode: current?.templateCode ?? AGREEMENT_CRIME_TEMPLATE_CODE,
        activeFileObjectId: activeEntry.fileObjectId,
        activeVersionNo: activeEntry.versionNo,
        activatedAt: activeEntry.activatedAt,
        versions,
      }),
    }
  }

  const versionNo = maxVersionNo() + 1
  const nextVersions = versions.map(item =>
    item.replacedAt == null ? { ...item, replacedAt: now } : item
  )
  nextVersions.push({
    versionNo,
    fileObjectId: next.fileObjectId,
    activatedAt: now,
    ...(next.fileName != null && next.fileName.trim() !== '' ? { fileName: next.fileName } : {}),
  })
  return {
    ...base,
    catalogDocument: stripUndefined({
      ...raw,
      templateCode: current?.templateCode ?? AGREEMENT_CRIME_TEMPLATE_CODE,
      activeFileObjectId: next.fileObjectId,
      activeVersionNo: versionNo,
      activatedAt: now,
      versions: nextVersions,
    }),
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
  // 결정 5: FORM_CATALOG_DOCUMENT는 PDF·20MB 이하만 — 업로드 전에 막는다(BE 정책은 아직 더 넓음).
  const validation = validateCatalogDocumentUploadFile(args.file)
  if (validation !== 'ok') {
    throw new Error(
      validation === 'size' ? CATALOG_DOCUMENT_FILE_SIZE_ALERT_MESSAGE : CATALOG_DOCUMENT_FILE_TYPE_ALERT_MESSAGE
    )
  }
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
  const fileName = uploaded.file?.originalFileName?.trim() || args.file.name
  // BE b3d400868 mergeSexOffenseDocumentSettings는 activeFileObjectId만 읽고 versions를 서버에서 다시 만든다.
  // FE versions·fileName은 서버에 저장되지 않으며, 다운로드 파일명은 getFileStatus로 보완한다.
  try {
    await putFormTemplateVersionJson(args.versionId, {
      schemaJson: jsonText(args.version.schemaJson),
      extensionJson: jsonText(args.version.extensionJson),
      settingsJson: JSON.stringify(
        settingsWithActiveCatalogDocument(settings, {
          fileObjectId: uploaded.fileObjectId,
          fileName,
        })
      ),
    })
  } catch (error) {
    // 버전 PUT 실패 → 이전 활성 문서는 서버에 그대로 남는다. 업로드만 된 파일은 정리한다.
    await cleanupOrphanCatalogDocument(uploaded.fileObjectId)
    throw error
  }
  const refreshed = await fetchFormTemplateVersionRemote(args.versionId)
  return parseCatalogDocumentSettings(settingsJsonToSettingsPayload(refreshed.settingsJson))
}

/** PUT 실패 후 남은 업로드 파일 정리 — 실패하면 fileObjectId를 남겨 수동 정리 대상으로 보고한다. */
async function cleanupOrphanCatalogDocument(fileObjectId: number): Promise<void> {
  try {
    await deleteFileObject(fileObjectId)
  } catch {
    console.warn(
      '[agreement-crime-catalog-document] 버전 저장 실패 후 업로드 파일을 정리하지 못했습니다. 수동 정리가 필요합니다.',
      { orphanFileObjectId: fileObjectId }
    )
  }
}

/** 다운로드 파일명: 이력의 원본 파일명 → 파일 메타 originalFileName → 기존 fallback */
export async function resolveCatalogDocumentFileName(args: {
  fileObjectId: number
  fileName?: string
  fallback: string
}): Promise<string> {
  if (args.fileName != null && args.fileName.trim() !== '') return args.fileName
  try {
    const status = await getFileStatus(args.fileObjectId)
    const original = status.originalFileName?.trim()
    if (original) return original
  } catch {
    // 메타 조회 실패 시 기존 파일명 유지
  }
  return args.fallback
}

export async function downloadCatalogDocumentFile(args: {
  fileObjectId: number
  fileName: string
  /** 이력에 저장된 원본 파일명(있으면 우선) */
  originalFileName?: string
}): Promise<void> {
  const fileName = await resolveCatalogDocumentFileName({
    fileObjectId: args.fileObjectId,
    fileName: args.originalFileName,
    fallback: args.fileName,
  })
  await downloadAdminFile({
    fileObjectId: args.fileObjectId,
    fileName,
  })
}
