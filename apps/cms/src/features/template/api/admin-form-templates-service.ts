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
import { buildLocalDuplicateWritingTemplateCode } from '@/features/template/lib/form-template-delete-policy'
import {
  getFormTemplateVersionCacheEntry,
  removeFormTemplateVersionCacheEntry,
  upsertFormTemplateVersionCacheEntry,
  upsertFormTemplateVersionCacheFromListItems,
} from '@/features/template/api/form-template-version-cache'
import {
  copyFormTemplateVersionRemote,
  createFormTemplateRemote,
  deleteFormTemplateRemote,
  fetchFormTemplatePayloadByCodeRemote,
  fetchFormTemplateVersionRemote,
  fetchFormTemplateVersionsRemote,
  fetchFormTemplatesRemote,
  publishFormTemplateVersionRemote,
  updateFormTemplateRemote,
  updateFormTemplateVersionRemote,
} from '@/features/template/api/form-templates-api-client'
import { normalizeWritingFormDraftFromApi } from '@/features/template/lib/form-template-seed-registry'
import {
  isFormTemplateLocalFallbackEnabled,
  shouldUseRemoteDraftApiForTemplateCode,
} from '@/features/template/lib/form-template-remote-draft'
import {
  loadWritingFormTemplateSave,
  removeWritingFormTemplateSave,
  type WritingFormTemplateSaveRecord,
} from '@/features/template/lib/writing-form-template-local-save'
import { issuanceFormSections } from '@/features/template/model/issuance-form.schema'
import { writingSections, type TemplateSection } from '@/features/template/model/template.schema'
import {
  createDefaultDirectAgreementDraft,
  createNewSurveyDraft,
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
      '양식 템플릿 API가 활성화되지 않았습니다. VITE_API_SERVER(또는 VITE_API_BASE_URL)로 백엔드를 설정해 주세요.'
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

async function warmTemplateListCaches(): Promise<void> {
  try {
    await getWritingFormSectionsRemote()
  } catch {
    /* issuance-only codes may miss writing list */
  }
  try {
    await getIssuanceFormSectionsRemote()
  } catch {
    /* ignore */
  }
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

  if (cached?.templateId == null) {
    await warmTemplateListCaches()
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

export async function resolveFormTemplateCatalogIds(
  templateCode: string
): Promise<{ templateId: number; templateVersionId: number } | null> {
  const versionId = await resolveTemplateVersionId(templateCode)
  const cached = getFormTemplateVersionCacheEntry(templateCode)
  if (cached?.templateId != null && versionId != null) {
    return { templateId: cached.templateId, templateVersionId: versionId }
  }

  try {
    const payload = await fetchFormTemplatePayloadByCodeRemote(templateCode)
    if (payload.templateId == null || payload.templateVersionId == null) return null
    upsertFormTemplateVersionCacheEntry({
      templateCode,
      templateId: payload.templateId,
      templateVersionId: payload.templateVersionId,
      latestVersionId: payload.templateVersionId,
      latestVersionNo: payload.versionNo,
    })
    return { templateId: payload.templateId, templateVersionId: payload.templateVersionId }
  } catch {
    return null
  }
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

/**
 * Remote SSOT load. Dev-only local fallback when `VITE_FORM_TEMPLATE_LOCAL_FALLBACK=1`.
 * 프로그램 등록 `localOnly`는 `loadWritingFormTemplateDraft(..., { localOnly: true })` 경로.
 * remote 실패 시 local을 쓰지 않고 `null`(에디터 seed hydrate).
 */
export async function loadFormTemplateVersionDraft(
  templateCode: string
): Promise<WritingFormTemplateSaveRecord | null> {
  const allowLocalFallback = isFormTemplateLocalFallbackEnabled()
  const local = allowLocalFallback ? loadWritingFormTemplateSave(templateCode) : null

  if (!shouldUseRemoteDraftApiForTemplate(templateCode)) {
    return allowLocalFallback ? local : null
  }

  try {
    const versionId = await resolveTemplateVersionId(templateCode)
    if (versionId == null) {
      return allowLocalFallback ? local : null
    }

    const version = await fetchFormTemplateVersionRemote(versionId)
    const remote = buildSaveRecordFromVersionResponse({
      templateCode,
      schemaJson: version.schemaJson,
      extensionJson: version.extensionJson,
      settingsJson: version.settingsJson,
      updatedAt: version.updatedAt,
    })
    if (remote == null) {
      return allowLocalFallback ? local : null
    }

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

    return remote
  } catch (error) {
    if (allowLocalFallback) return local
    console.warn('[form-templates] remote draft load failed; using seed (no local fallback)', error)
    return null
  }
}

export async function loadFormTemplateVersionDraftByVersionId(
  templateCode: string,
  versionId: number
): Promise<WritingFormTemplateSaveRecord | null> {
  assertFormsSurveysRemoteReady()
  const version = await fetchFormTemplateVersionRemote(versionId)
  return buildSaveRecordFromVersionResponse({
    templateCode,
    schemaJson: version.schemaJson,
    extensionJson: version.extensionJson,
    settingsJson: version.settingsJson,
    updatedAt: version.updatedAt,
  })
}

function buildVersionUpdateBody(args: {
  draft: WritingFormDraft
  overlay?: Record<string, unknown>
  editorState?: Record<string, unknown>
  uiState?: Record<string, unknown>
  settingsJson?: Record<string, unknown>
}): {
  schemaJson: string
  extensionJson?: string
  settingsJson?: string
} {
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
  return body
}

export async function saveFormTemplateVersionDraftByVersionId(args: {
  versionId: number
  draft: WritingFormDraft
  overlay?: Record<string, unknown>
  editorState?: Record<string, unknown>
  uiState?: Record<string, unknown>
  settingsJson?: Record<string, unknown>
}): Promise<void> {
  assertFormsSurveysRemoteReady()
  await updateFormTemplateVersionRemote(args.versionId, buildVersionUpdateBody(args))
}

/**
 * Remote SSOT save — PUT 성공만 임시저장 성공.
 * 양식 관리 경로에서는 localStorage에 쓰지 않는다.
 */
export async function saveFormTemplateVersionDraft(args: {
  templateCode: string
  draft: WritingFormDraft
  overlay?: Record<string, unknown>
  editorState?: Record<string, unknown>
  uiState?: Record<string, unknown>
  settingsJson?: Record<string, unknown>
}): Promise<void> {
  assertFormsSurveysRemoteReady()

  if (!shouldUseRemoteDraftApiForTemplateCode(args.templateCode)) {
    throw new Error('이 템플릿은 원격 draft API 대상이 아닙니다.')
  }

  const versionId = await resolveTemplateVersionId(args.templateCode)
  if (versionId == null) {
    throw new Error('저장할 템플릿 버전 ID를 찾을 수 없습니다. 작성 양식 목록을 먼저 조회해 주세요.')
  }

  await updateFormTemplateVersionRemote(versionId, buildVersionUpdateBody(args))
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

/** 프로그램 form-binding은 PUBLISHED version만 허용 (`PROGRAM_FORM_BINDING_REQUIRES_PUBLISHED_VERSION`) */
export async function publishFormTemplateVersionById(versionId: number): Promise<number> {
  assertFormsSurveysRemoteReady()
  const published = await publishFormTemplateVersionRemote(versionId)
  return published.templateVersionId ?? versionId
}

export async function duplicateFormTemplateVersionRemote(args: {
  sourceTemplateCode: string
  versionLabel?: string
  /** 동명 회피용 — 복제 후 PATCH로 적용 */
  templateName?: string
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

  let newCode = copied.templateCode?.trim() || args.sourceTemplateCode
  if (newCode === args.sourceTemplateCode) {
    newCode = buildLocalDuplicateWritingTemplateCode(args.sourceTemplateCode)
  }
  if (copied.templateId != null && copied.templateVersionId != null) {
    upsertFormTemplateVersionCacheEntry({
      templateCode: newCode,
      templateId: copied.templateId,
      templateVersionId: copied.templateVersionId,
      latestVersionId: copied.templateVersionId,
      latestVersionNo: copied.versionNo,
    })
  }

  const nextName = args.templateName?.trim()
  if (nextName != null && nextName !== '' && copied.templateId != null) {
    try {
      await updateFormTemplateRemote(copied.templateId, { templateName: nextName })
    } catch (error) {
      console.warn('[form-templates] rename after copy failed', error)
    }
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
    (args.target === 'survey' ? '신규 설문 양식' : '동의 양식 신규 폼')
  const draft =
    args.target === 'survey' ? createNewSurveyDraft() : createDefaultDirectAgreementDraft()

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

/**
 * 템플릿 코드 기준 표시명(templateName) 변경.
 * 목록 조회로 캐시된 templateId가 필요하며, 없으면 작성 양식 목록을 한 번 워밍한다.
 */
export async function renameFormTemplateByCode(
  templateCode: string,
  templateName: string
): Promise<void> {
  const nextName = templateName.trim()
  if (nextName === '') {
    throw new Error('템플릿 이름을 입력해 주세요.')
  }

  if (!shouldUseFormsSurveysRemoteApi()) {
    return
  }

  assertFormsSurveysRemoteReady()

  let cached = getFormTemplateVersionCacheEntry(templateCode)
  if (cached?.templateId == null) {
    try {
      await getWritingFormSectionsRemote()
    } catch {
      /* issuance-only 등 — 아래 issuance 워밍 */
    }
    cached = getFormTemplateVersionCacheEntry(templateCode)
  }
  if (cached?.templateId == null) {
    try {
      await getIssuanceFormSectionsRemote()
    } catch {
      /* ignore */
    }
    cached = getFormTemplateVersionCacheEntry(templateCode)
  }
  if (cached?.templateId == null) {
    throw new Error('이름 변경할 템플릿 ID를 찾을 수 없습니다. 목록을 먼저 조회해 주세요.')
  }

  await updateFormTemplateRemote(cached.templateId, { templateName: nextName })
}

export async function deleteFormTemplate(templateCode: string): Promise<void> {
  assertFormsSurveysRemoteReady()

  const cached = getFormTemplateVersionCacheEntry(templateCode)
  const templateId = cached?.templateId
  if (templateId == null) {
    throw new Error('삭제할 템플릿 ID를 찾을 수 없습니다. 목록을 먼저 조회해 주세요.')
  }

  await deleteFormTemplateRemote(templateId)
  removeFormTemplateVersionCacheEntry(templateCode)
  removeWritingFormTemplateSave(templateCode)
}
