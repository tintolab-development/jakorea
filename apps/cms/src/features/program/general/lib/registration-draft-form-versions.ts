import type { WritingFormTemplateSaveRecord } from '@/features/template/lib/writing-form-template-local-save'
import type { FormTemplateVersionResponse } from '@/shared/api/generated/forms-surveys/schemas/formTemplateVersionResponse'
import {
  copyFormTemplateVersionRemote,
  fetchFormTemplateVersionRemote,
  updateFormTemplateRemote,
} from '@/features/template/api/form-templates-api-client'
import {
  buildSaveRecordFromVersionResponse,
  loadFormTemplateVersionDraftByVersionId,
  resolveFormTemplateCatalogIds,
  saveFormTemplateVersionDraftByVersionId,
} from '@/features/template/api/admin-form-templates-service'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { coalesceScopedFormDraftForPut } from '@/features/program/general/lib/coalesce-scoped-form-draft-for-put'
import type { RegistrationProgramDraftFormVersionRef } from '@/features/program/general/lib/registration-program-draft-payload'

export type DraftOwnedFormVersion = RegistrationProgramDraftFormVersionRef & {
  templateCode: string
}

const versionsByDraftId = new Map<number, Map<string, DraftOwnedFormVersion>>()

function draftMap(programDraftId: number): Map<string, DraftOwnedFormVersion> {
  const existing = versionsByDraftId.get(programDraftId)
  if (existing) return existing
  const created = new Map<string, DraftOwnedFormVersion>()
  versionsByDraftId.set(programDraftId, created)
  return created
}

export function rememberDraftOwnedFormVersion(
  programDraftId: number,
  ref: DraftOwnedFormVersion
): void {
  draftMap(programDraftId).set(ref.templateCode, ref)
}

export function getDraftOwnedFormVersion(
  programDraftId: number,
  templateCode: string
): DraftOwnedFormVersion | undefined {
  return versionsByDraftId.get(programDraftId)?.get(templateCode)
}

export function listDraftOwnedFormVersions(programDraftId: number): DraftOwnedFormVersion[] {
  return [...(versionsByDraftId.get(programDraftId)?.values() ?? [])]
}

export function hydrateDraftOwnedFormVersions(
  programDraftId: number,
  formVersions: Record<string, RegistrationProgramDraftFormVersionRef>
): void {
  const map = draftMap(programDraftId)
  map.clear()
  for (const [templateCode, ref] of Object.entries(formVersions)) {
    map.set(templateCode, { templateCode, ...ref })
  }
}

export function clearDraftOwnedFormVersions(programDraftId?: number): void {
  if (programDraftId != null) {
    versionsByDraftId.delete(programDraftId)
    return
  }
  versionsByDraftId.clear()
}

function isVersionMutable(version: FormTemplateVersionResponse): boolean {
  return version.versionStatus == null || version.versionStatus === 'DRAFT'
}

function baselineFromVersionResponse(
  templateCode: string,
  version: FormTemplateVersionResponse
): WritingFormTemplateSaveRecord | null {
  return buildSaveRecordFromVersionResponse({
    templateCode,
    schemaJson: version.schemaJson,
    extensionJson: version.extensionJson,
    settingsJson: version.settingsJson,
    updatedAt: version.updatedAt,
    skipSeedMigration: true,
  })
}

async function copyFreshDraftOwnedFormVersion(args: {
  programDraftId: number
  templateCode: string
}): Promise<DraftOwnedFormVersion> {
  const catalog = await resolveFormTemplateCatalogIds(args.templateCode)
  if (catalog == null) {
    throw new Error(`카탈로그 양식을 찾을 수 없습니다: ${args.templateCode}`)
  }

  const copied = await copyFormTemplateVersionRemote(catalog.templateId, {
    sourceVersionId: catalog.templateVersionId,
    versionLabel: `draft-${args.programDraftId}-${args.templateCode}`,
    ownerProgramDraftId: args.programDraftId,
  })

  const templateId = copied.templateId ?? catalog.templateId
  const draftVersionId = copied.templateVersionId
  if (draftVersionId == null) {
    throw new Error(`프로그램 등록 draft copy 실패: ${args.templateCode}`)
  }

  // 주의: `useYn:false`로 숨기지 않는다 — BE의 program create/binding 검증(`COALESCE(t.use_yn,true)=true`)이
  // 이 scoped 복사본을 "존재/활성" 판정에 그대로 쓰므로, false로 두면 발행 후 create 시
  // `templateVersionId does not exist or is inactive`로 거절된다(2026-09-21 BE 확인).
  // description만 남겨 어떤 program-draft가 소유한 복사본인지 추적한다.
  if (templateId !== catalog.templateId) {
    try {
      await updateFormTemplateRemote(templateId, {
        description: `program-draft:${args.programDraftId}`,
      })
    } catch (error) {
      console.warn('[registration-draft-form-versions] label scoped template failed', error)
    }
  }

  const ref: DraftOwnedFormVersion = {
    templateCode: args.templateCode,
    templateId,
    draftVersionId,
  }
  rememberDraftOwnedFormVersion(args.programDraftId, ref)
  return ref
}

/**
 * 캐시된 scoped 버전이 여전히 DRAFT(수정 가능)인지 확인한다.
 * publish-only 경로 — baseline GET 없음.
 */
export async function ensureDraftOwnedFormVersion(args: {
  programDraftId: number
  templateCode: string
}): Promise<DraftOwnedFormVersion> {
  const cached = getDraftOwnedFormVersion(args.programDraftId, args.templateCode)
  if (cached) {
    try {
      const version = await fetchFormTemplateVersionRemote(cached.draftVersionId)
      if (isVersionMutable(version)) return cached
    } catch {
      return cached
    }
    draftMap(args.programDraftId).delete(args.templateCode)
  }

  return copyFreshDraftOwnedFormVersion(args)
}

/**
 * ensure + baseline — version GET 1회로 mutable 확인과 coalesce baseline을 함께 처리.
 */
export async function ensureDraftOwnedFormVersionWithBaseline(args: {
  programDraftId: number
  templateCode: string
}): Promise<{
  owned: DraftOwnedFormVersion
  baseline: WritingFormTemplateSaveRecord | null
}> {
  const cached = getDraftOwnedFormVersion(args.programDraftId, args.templateCode)
  if (cached) {
    let version: FormTemplateVersionResponse
    try {
      version = await fetchFormTemplateVersionRemote(cached.draftVersionId)
    } catch {
      return {
        owned: cached,
        baseline: await loadFormTemplateVersionDraftByVersionId(
          args.templateCode,
          cached.draftVersionId
        ),
      }
    }
    if (isVersionMutable(version)) {
      return {
        owned: cached,
        baseline: baselineFromVersionResponse(args.templateCode, version),
      }
    }
    draftMap(args.programDraftId).delete(args.templateCode)
  }

  const owned = await copyFreshDraftOwnedFormVersion(args)
  const version = await fetchFormTemplateVersionRemote(owned.draftVersionId)
  return {
    owned,
    baseline: baselineFromVersionResponse(args.templateCode, version),
  }
}

export async function loadDraftOwnedFormVersionRecord(args: {
  programDraftId: number
  templateCode: string
}): Promise<WritingFormTemplateSaveRecord | null> {
  const { baseline } = await ensureDraftOwnedFormVersionWithBaseline(args)
  return baseline
}

export async function persistDraftOwnedFormVersion(args: {
  programDraftId: number
  templateCode: string
  draft: WritingFormDraft
  overlay?: Record<string, unknown>
  editorState?: Record<string, unknown>
  settingsJson?: Record<string, unknown>
  /** 호출측에서 이미 resolve한 owned — ensure/mutable GET 생략 */
  owned?: DraftOwnedFormVersion
  /** 호출측에서 이미 GET한 baseline — 재조회 생략 */
  baseline?: WritingFormTemplateSaveRecord | null
}): Promise<DraftOwnedFormVersion> {
  const owned =
    args.owned ??
    (await ensureDraftOwnedFormVersion({
      programDraftId: args.programDraftId,
      templateCode: args.templateCode,
    }))

  const baseline =
    args.baseline !== undefined
      ? args.baseline
      : await loadFormTemplateVersionDraftByVersionId(
          args.templateCode,
          owned.draftVersionId
        )
  const draftForPut =
    baseline?.draft != null
      ? coalesceScopedFormDraftForPut(baseline.draft, args.draft)
      : args.draft

  await saveFormTemplateVersionDraftByVersionId({
    versionId: owned.draftVersionId,
    draft: draftForPut,
    overlay: args.overlay,
    editorState: args.editorState,
    settingsJson: args.settingsJson,
  })

  return owned
}
