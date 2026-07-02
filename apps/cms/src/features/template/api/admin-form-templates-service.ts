import { buildWritingFormSectionsFromApiItems } from '@/features/template/api/adapters/form-template-adapters'
import {
  schemaJsonToWritingFormDraft,
  writingFormDraftToSchemaJson,
} from '@/features/template/api/adapters/form-template-draft-adapters'
import { WRITING_FORM_TYPE } from '@/features/template/api/form-template-catalog'
import {
  getFormTemplateVersionCacheEntry,
  upsertFormTemplateVersionCacheEntry,
  upsertFormTemplateVersionCacheFromListItems,
} from '@/features/template/api/form-template-version-cache'
import {
  copyFormTemplateVersionRemote,
  fetchFormTemplateVersionRemote,
  fetchFormTemplateVersionsRemote,
  fetchFormTemplatesRemote,
  publishFormTemplateVersionRemote,
  updateFormTemplateVersionRemote,
} from '@/features/template/api/form-templates-api-client'
import {
  loadWritingFormTemplateSave,
  persistWritingFormTemplateSave,
  type WritingFormTemplateSaveRecord,
} from '@/features/template/lib/writing-form-template-local-save'
import { writingSections, type TemplateSection } from '@/features/template/model/template.schema'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

function assertFormsSurveysRemoteReady(): void {
  if (!isRealApiModuleEnabled('formsSurveys')) {
    throw new Error(
      '양식 템플릿 API가 활성화되지 않았습니다. VITE_REAL_API_MODULES에 formsSurveys를 추가해 주세요.'
    )
  }
  if (!hasRemoteAdminJwt()) {
    throw new Error('양식 템플릿 조회는 관리자 로그인 후 이용할 수 있습니다.')
  }
}

export function shouldUseFormsSurveysRemoteApi(): boolean {
  return isRealApiModuleEnabled('formsSurveys') && hasRemoteAdminJwt()
}

export async function getWritingFormSectionsRemote(): Promise<TemplateSection[]> {
  assertFormsSurveysRemoteReady()
  const page = await fetchFormTemplatesRemote({
    formType: WRITING_FORM_TYPE,
    page: 0,
    size: 200,
    useYn: true,
  })
  const items = page.items ?? []
  upsertFormTemplateVersionCacheFromListItems(items)
  return buildWritingFormSectionsFromApiItems(items)
}

export function getMockWritingFormSections(): TemplateSection[] {
  return writingSections
}

async function resolveTemplateVersionId(templateCode: string): Promise<number | null> {
  const cached = getFormTemplateVersionCacheEntry(templateCode)
  if (cached?.templateVersionId != null) return cached.templateVersionId
  if (cached?.templateId == null) return null

  const versions = await fetchFormTemplateVersionsRemote(cached.templateId)
  const latest =
    versions.find(version => version.versionStatus === 'DRAFT') ??
    versions.at(-1)
  const versionId = latest?.templateVersionId
  if (versionId == null || latest == null) return null

  upsertFormTemplateVersionCacheEntry({
    templateCode,
    templateId: cached.templateId,
    templateVersionId: versionId,
    latestVersionNo: latest.versionNo,
  })
  return versionId
}

export async function loadFormTemplateVersionDraft(
  templateCode: string
): Promise<WritingFormTemplateSaveRecord | null> {
  if (shouldUseFormsSurveysRemoteApi()) {
    try {
      const versionId = await resolveTemplateVersionId(templateCode)
      if (versionId != null) {
        const version = await fetchFormTemplateVersionRemote(versionId)
        const draft = schemaJsonToWritingFormDraft(version.schemaJson)
        if (draft != null) {
          const cached = getFormTemplateVersionCacheEntry(templateCode)
          if (cached?.templateId != null && version.templateVersionId != null) {
            upsertFormTemplateVersionCacheEntry({
              templateCode,
              templateId: cached.templateId,
              templateVersionId: version.templateVersionId,
              latestVersionNo: version.versionNo,
            })
          }
          return {
            version: 1,
            templateId: templateCode,
            savedAt: version.updatedAt ?? new Date().toISOString(),
            draft,
          }
        }
      }
    } catch {
      // remote 실패 시 localStorage fallback
    }
  }

  return loadWritingFormTemplateSave(templateCode)
}

export async function saveFormTemplateVersionDraft(args: {
  templateCode: string
  draft: WritingFormDraft
  overlay?: Record<string, unknown>
  editorState?: Record<string, unknown>
}): Promise<void> {
  persistWritingFormTemplateSave({
    templateId: args.templateCode,
    draft: args.draft,
    overlay: args.overlay,
    editorState: args.editorState,
  })

  if (!shouldUseFormsSurveysRemoteApi()) return

  try {
    const versionId = await resolveTemplateVersionId(args.templateCode)
    if (versionId == null) return
    await updateFormTemplateVersionRemote(versionId, {
      schemaJson: writingFormDraftToSchemaJson(args.draft),
    })
  } catch (error) {
    console.warn('[form-templates] remote draft save failed; localStorage kept', error)
  }
}

export async function publishFormTemplateVersion(templateCode: string): Promise<void> {
  if (!shouldUseFormsSurveysRemoteApi()) {
    throw new Error('양식 게시는 formsSurveys API 활성화 후 이용할 수 있습니다.')
  }

  const versionId = await resolveTemplateVersionId(templateCode)
  if (versionId == null) {
    throw new Error('게시할 버전을 찾을 수 없습니다.')
  }

  await publishFormTemplateVersionRemote(versionId)
}

export async function duplicateFormTemplateVersionRemote(args: {
  sourceTemplateCode: string
  versionLabel?: string
}): Promise<string> {
  assertFormsSurveysRemoteReady()
  const cached = getFormTemplateVersionCacheEntry(args.sourceTemplateCode)
  if (cached?.templateId == null) {
    throw new Error('복제할 템플릿 ID를 찾을 수 없습니다. 목록을 먼저 조회해 주세요.')
  }

  const sourceVersionId = await resolveTemplateVersionId(args.sourceTemplateCode)
  const copied = await copyFormTemplateVersionRemote(cached.templateId, {
    sourceVersionId: sourceVersionId ?? undefined,
    versionLabel: args.versionLabel,
  })

  const newCode = args.sourceTemplateCode
  if (copied.templateId != null && copied.templateVersionId != null) {
    upsertFormTemplateVersionCacheEntry({
      templateCode: newCode,
      templateId: copied.templateId,
      templateVersionId: copied.templateVersionId,
      latestVersionNo: copied.versionNo,
    })
  }

  return newCode
}
