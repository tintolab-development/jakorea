import {
  buildIssuanceFormSectionsFromApiItems,
  buildWritingFormSectionsFromApiItems,
} from '@/features/template/api/adapters/form-template-adapters'
import {
  extensionJsonToExtensionPayload,
  extensionPayloadToExtensionJson,
  schemaJsonToWritingFormDraft,
  settingsJsonToSettingsPayload,
  settingsPayloadToSettingsJson,
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
  createFormTemplateRemote,
  fetchFormTemplateVersionRemote,
  fetchFormTemplateVersionsRemote,
  fetchFormTemplatesRemote,
  publishFormTemplateVersionRemote,
  updateFormTemplateVersionRemote,
} from '@/features/template/api/form-templates-api-client'
import { normalizeWritingFormDraftFromApi } from '@/features/template/lib/form-template-seed-registry'
import { shouldUseRemoteDraftApiForTemplateCode } from '@/features/template/lib/form-template-remote-draft'
import {
  loadWritingFormTemplateSave,
  persistWritingFormTemplateSave,
  type WritingFormTemplateSaveRecord,
} from '@/features/template/lib/writing-form-template-local-save'
import { issuanceFormSections } from '@/features/template/model/issuance-form.schema'
import { writingSections, type TemplateSection } from '@/features/template/model/template.schema'
import {
  createDefaultDirectAgreementDraft,
  createDefaultSurveyDraft,
  normalizeWritingFormDraft,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

function shouldUseRemoteDraftApiForTemplate(templateCode: string): boolean {
  return (
    shouldUseFormsSurveysRemoteApi() && shouldUseRemoteDraftApiForTemplateCode(templateCode)
  )
}

function hasExtensionPayload(args: {
  overlay?: Record<string, unknown>
  editorState?: Record<string, unknown>
  uiState?: Record<string, unknown>
}): boolean {
  return args.overlay != null || args.editorState != null || args.uiState != null
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
    size: 50,
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
    size: 50,
    useYn: true,
  })
  const items = page.items ?? []
  upsertFormTemplateVersionCacheFromListItems(items)
  return buildIssuanceFormSectionsFromApiItems(items)
}

export function getMockIssuanceFormSections(): TemplateSection[] {
  return issuanceFormSections
}

async function resolveTemplateVersionId(templateCode: string): Promise<number | null> {
  let cached = getFormTemplateVersionCacheEntry(templateCode)
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

  // 작성 양식 목록을 아직 안 본 경우 — 목록 조회로 캐시 워밍 후 재시도
  if (cached?.templateId == null) {
    try {
      await getWritingFormSectionsRemote()
    } catch {
      return null
    }
    cached = getFormTemplateVersionCacheEntry(templateCode)
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
  }

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

const EMPTY_SCHEMA_DRAFT: WritingFormDraft = normalizeWritingFormDraft({
  schemaVersion: 1,
  formSettings: { titleNumbering: 'none' },
  paragraphs: [],
})

function buildSaveRecordFromVersionResponse(args: {
  templateCode: string
  schemaJson?: string | Record<string, unknown> | null
  extensionJson?: string | Record<string, unknown> | null
  settingsJson?: string | Record<string, unknown> | null
  updatedAt?: string
}): WritingFormTemplateSaveRecord | null {
  const extension = extensionJsonToExtensionPayload(args.extensionJson)
  const settings = settingsJsonToSettingsPayload(args.settingsJson)

  let draft = schemaJsonToWritingFormDraft(args.schemaJson)
  if (draft == null) {
    if (settings == null) return null
    draft = EMPTY_SCHEMA_DRAFT
  } else {
    draft = normalizeWritingFormDraftFromApi(args.templateCode, draft)
  }

  return {
    version: 1,
    templateId: args.templateCode,
    savedAt: args.updatedAt ?? new Date().toISOString(),
    draft,
    overlay: extension?.overlay,
    editorState: extension?.editorState,
    settingsJson: settings ?? undefined,
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
          settingsJson: version.settingsJson,
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
            settingsJson: record.settingsJson,
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
  uiState?: Record<string, unknown>
  settingsJson?: Record<string, unknown>
}): Promise<void> {
  persistWritingFormTemplateSave({
    templateId: args.templateCode,
    draft: args.draft,
    overlay: args.overlay,
    editorState: args.editorState,
    settingsJson: args.settingsJson,
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
      settingsJson?: string
    } = {
      schemaJson: writingFormDraftToSchemaJson(args.draft),
    }

    if (
      hasExtensionPayload({
        overlay: args.overlay,
        editorState: args.editorState,
        uiState: args.uiState,
      })
    ) {
      body.extensionJson = extensionPayloadToExtensionJson({
        overlay: args.overlay,
        editorState: args.editorState,
        uiState: args.uiState,
      })
    }

    if (args.settingsJson != null) {
      body.settingsJson = settingsPayloadToSettingsJson(args.settingsJson)
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

  const newCode = copied.templateCode?.trim() || args.sourceTemplateCode
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

export async function createWritingFormTemplateRemote(args: {
  target: 'survey' | 'agreement'
  templateName?: string
}): Promise<string> {
  assertFormsSurveysRemoteReady()

  const category = args.target === 'survey' ? 'SURVEY' : 'AGREEMENT'
  const templateName =
    args.templateName?.trim() ||
    (args.target === 'survey' ? '신규 설문 양식' : '신규 동의 양식')
  const draft =
    args.target === 'survey' ? createDefaultSurveyDraft() : createDefaultDirectAgreementDraft()

  const created = await createFormTemplateRemote({
    templateName,
    formType: WRITING_FORM_TYPE,
    category,
    useYn: true,
    versionLabel: 'v1',
    schemaJson: writingFormDraftToSchemaJson(draft),
  })

  const newCode = created.templateCode?.trim()
  if (newCode == null || newCode === '') {
    throw new Error('생성된 템플릿 코드를 응답에서 찾을 수 없습니다.')
  }

  const firstVersion = created.versions?.[0]
  if (created.templateId != null && firstVersion?.templateVersionId != null) {
    upsertFormTemplateVersionCacheEntry({
      templateCode: newCode,
      templateId: created.templateId,
      templateVersionId: firstVersion.templateVersionId,
      latestVersionId: firstVersion.templateVersionId,
      latestVersionNo: firstVersion.versionNo,
    })
  } else if (created.templateId != null) {
    upsertFormTemplateVersionCacheEntry({
      templateCode: newCode,
      templateId: created.templateId,
    })
  }

  return newCode
}
