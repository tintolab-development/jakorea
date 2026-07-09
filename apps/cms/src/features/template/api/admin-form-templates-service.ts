import {
  buildIssuanceFormSectionsFromApiItems,
  buildWritingFormSectionsFromApiItems,
} from '@/features/template/api/adapters/form-template-adapters'
import {
  extensionJsonToExtensionPayload,
  extensionPayloadToExtensionJson,
  schemaJsonToWritingFormDraft,
  writingFormDraftToSchemaJson,
} from '@/features/template/api/adapters/form-template-draft-adapters'
import { ISSUANCE_FORM_TYPE, WRITING_FORM_TYPE } from '@/features/template/api/form-template-catalog'
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
import {
  PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE,
  shouldUseRegistrationGeneralRemoteDraftApi,
} from '@/features/template/lib/program-registration-editor-state'
import { createProgramRegistrationDraft } from '@/features/template/model/program-registration-draft'
import { issuanceFormSections } from '@/features/template/model/issuance-form.schema'
import { writingSections, type TemplateSection } from '@/features/template/model/template.schema'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

function shouldUseRemoteDraftApiForTemplate(templateCode: string): boolean {
  return (
    shouldUseFormsSurveysRemoteApi() && shouldUseRegistrationGeneralRemoteDraftApi(templateCode)
  )
}

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

export async function getIssuanceFormSectionsRemote(): Promise<TemplateSection[]> {
  assertFormsSurveysRemoteReady()
  const page = await fetchFormTemplatesRemote({
    formType: ISSUANCE_FORM_TYPE,
    page: 0,
    size: 200,
    useYn: true,
  })
  const items = page.items ?? []
  upsertFormTemplateVersionCacheFromListItems(items)
  return buildIssuanceFormSectionsFromApiItems(items)
}

export function getMockIssuanceFormSections(): TemplateSection[] {
  return issuanceFormSections
}

function normalizeRegistrationGeneralDraftFromApi(draft: WritingFormDraft): WritingFormDraft {
  if (draft.paragraphs.length > 0) return draft
  const seed = createProgramRegistrationDraft('general')
  return {
    ...draft,
    paragraphs: seed.paragraphs,
  }
}

async function resolveTemplateVersionId(templateCode: string): Promise<number | null> {
  const cached = getFormTemplateVersionCacheEntry(templateCode)
  if (cached?.templateVersionId != null) return cached.templateVersionId
  if (cached?.latestVersionId != null) {
    upsertFormTemplateVersionCacheEntry({
      templateCode,
      templateId: cached.templateId,
      templateVersionId: cached.latestVersionId,
      latestVersionId: cached.latestVersionId,
      latestVersionNo: cached.latestVersionNo,
    })
    return cached.latestVersionId
  }
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
    latestVersionId: versionId,
    latestVersionNo: latest.versionNo,
  })
  return versionId
}

function buildSaveRecordFromVersionResponse(args: {
  templateCode: string
  schemaJson?: string | Record<string, unknown> | null
  extensionJson?: string | Record<string, unknown> | null
  updatedAt?: string
}): WritingFormTemplateSaveRecord | null {
  let draft = schemaJsonToWritingFormDraft(args.schemaJson)
  if (draft == null) return null

  if (args.templateCode === PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE) {
    draft = normalizeRegistrationGeneralDraftFromApi(draft)
  }

  const extension = extensionJsonToExtensionPayload(args.extensionJson)

  return {
    version: 1,
    templateId: args.templateCode,
    savedAt: args.updatedAt ?? new Date().toISOString(),
    draft,
    overlay: extension?.overlay,
    editorState: extension?.editorState,
  }
}

export async function loadFormTemplateVersionDraft(
  templateCode: string
): Promise<WritingFormTemplateSaveRecord | null> {
  if (shouldUseRemoteDraftApiForTemplate(templateCode)) {
    try {
      const versionId = await resolveTemplateVersionId(templateCode)
      if (versionId != null) {
        const version = await fetchFormTemplateVersionRemote(versionId)
        const record = buildSaveRecordFromVersionResponse({
          templateCode,
          schemaJson: version.schemaJson,
          extensionJson: version.extensionJson,
          updatedAt: version.updatedAt,
        })
        if (record != null) {
          const cached = getFormTemplateVersionCacheEntry(templateCode)
          if (cached?.templateId != null && version.templateVersionId != null) {
            upsertFormTemplateVersionCacheEntry({
              templateCode,
              templateId: cached.templateId,
              templateVersionId: version.templateVersionId,
              latestVersionId: version.templateVersionId,
              latestVersionNo: version.versionNo,
            })
          }
          persistWritingFormTemplateSave({
            templateId: templateCode,
            draft: record.draft,
            overlay: record.overlay,
            editorState: record.editorState,
          })
          return record
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

  if (!shouldUseRemoteDraftApiForTemplate(args.templateCode)) return

  try {
    const versionId = await resolveTemplateVersionId(args.templateCode)
    if (versionId == null) {
      throw new Error('저장할 템플릿 버전 ID를 찾을 수 없습니다. 작성 양식 목록을 먼저 조회해 주세요.')
    }

    const body: {
      schemaJson: string
      extensionJson?: string
    } = {
      schemaJson: writingFormDraftToSchemaJson(args.draft),
    }

    if (args.templateCode === PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE) {
      body.extensionJson = extensionPayloadToExtensionJson({
        overlay: args.overlay,
        editorState: args.editorState,
      })
    }

    await updateFormTemplateVersionRemote(versionId, body)
  } catch (error) {
    console.warn('[form-templates] remote draft save failed; localStorage kept', error)
    throw error
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
      latestVersionId: copied.templateVersionId,
      latestVersionNo: copied.versionNo,
    })
  }

  return newCode
}
