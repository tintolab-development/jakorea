import type { WritingFormTemplateSaveRecord } from '@/features/template/lib/writing-form-template-local-save'
import {
  copyFormTemplateVersionRemote,
  fetchFormTemplateVersionRemote,
  updateFormTemplateRemote,
} from '@/features/template/api/form-templates-api-client'
import {
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

/**
 * 캐시된 scoped 버전이 여전히 DRAFT(수정 가능)인지 확인한다.
 * 이전 등록 시도에서 이미 발행(PUBLISHED)·보관(ARCHIVED)된 버전을 재사용하면
 * BE가 `FORM_VERSION_IMMUTABLE`로 거절하므로, 재시도 시 새 scoped 복사본을 받아야 한다.
 * 상태 조회 자체가 실패하면(네트워크 등) 기존 캐시를 신뢰하고 그대로 진행한다(fail-open).
 */
async function isDraftOwnedVersionMutable(versionId: number): Promise<boolean> {
  try {
    const version = await fetchFormTemplateVersionRemote(versionId)
    return version.versionStatus == null || version.versionStatus === 'DRAFT'
  } catch {
    return true
  }
}

export async function ensureDraftOwnedFormVersion(args: {
  programDraftId: number
  templateCode: string
}): Promise<DraftOwnedFormVersion> {
  const cached = getDraftOwnedFormVersion(args.programDraftId, args.templateCode)
  if (cached) {
    const mutable = await isDraftOwnedVersionMutable(cached.draftVersionId)
    if (mutable) return cached
    // 발행/보관됨 — 캐시 무효화 후 카탈로그에서 새 scoped DRAFT 복사본을 받는다.
    draftMap(args.programDraftId).delete(args.templateCode)
  }

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

  if (templateId !== catalog.templateId) {
    try {
      await updateFormTemplateRemote(templateId, {
        useYn: false,
        description: `program-draft:${args.programDraftId}`,
      })
    } catch (error) {
      console.warn('[registration-draft-form-versions] hide scoped template failed', error)
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

export async function loadDraftOwnedFormVersionRecord(args: {
  programDraftId: number
  templateCode: string
}): Promise<WritingFormTemplateSaveRecord | null> {
  const owned = await ensureDraftOwnedFormVersion(args)
  return loadFormTemplateVersionDraftByVersionId(args.templateCode, owned.draftVersionId)
}

export async function persistDraftOwnedFormVersion(args: {
  programDraftId: number
  templateCode: string
  draft: WritingFormDraft
  overlay?: Record<string, unknown>
  editorState?: Record<string, unknown>
  settingsJson?: Record<string, unknown>
  /** 호출측에서 이미 GET한 baseline — 재조회 생략 */
  baseline?: WritingFormTemplateSaveRecord | null
}): Promise<DraftOwnedFormVersion> {
  const owned = await ensureDraftOwnedFormVersion({
    programDraftId: args.programDraftId,
    templateCode: args.templateCode,
  })

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
