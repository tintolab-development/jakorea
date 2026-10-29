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
  parseCatalogSchemaJson,
  writingFormDraftToCatalogSchemaJson,
  writingFormDraftToSchemaJson,
} from '@/features/template/api/adapters/form-template-draft-adapters'
import { ISSUANCE_FORM_TYPE, WRITING_FORM_TYPE } from '@/features/template/api/form-template-catalog'
import {
  CatalogStructureImmutableError,
  applyCatalogAllowedContent,
  catalogExtensionStructureChanged,
  catalogStructureChanged,
} from '@/features/template/lib/catalog-structure-diff'
import { isCatalogOriginalWritingTemplate } from '@/features/template/lib/catalog-original-identity'
import { shouldOmitImmutableFormSchemaJson } from '@/features/template/lib/form-template-delete-policy'
import { getFormTemplateSeedDraft } from '@/features/template/lib/form-template-seed-registry'
import { clearPublishedCatalogDraftCache } from '@/features/template/lib/published-catalog-defaults'
import { buildOperationalImmutableFormSchemaDraft } from '@/features/template/lib/operational-form-schema-copy-merge'
import {
  getFormTemplateVersionCacheEntry,
  removeFormTemplateVersionCacheEntry,
  upsertFormTemplateVersionCacheEntry,
  upsertFormTemplateVersionCacheFromListItems,
} from '@/features/template/api/form-template-version-cache'
import {
  createFormTemplateRemote,
  createFormTemplateVersionRemote,
  deleteFormTemplateRemote,
  duplicateFormTemplateRemote,
  fetchFormTemplatePayloadByCodeRemote,
  fetchFormTemplateVersionRemote,
  fetchFormTemplateVersionsRemote,
  fetchFormTemplatesRemote,
  publishFormTemplateVersionRemote,
  updateFormTemplateRemote,
  updateFormTemplateVersionRemote,
} from '@/features/template/api/form-templates-api-client'
import { normalizeWritingFormDraftFromApi } from '@/features/template/lib/form-template-seed-registry'
import { shouldUseRemoteDraftApiForTemplateCode } from '@/features/template/lib/form-template-remote-draft'
import {
  removeWritingFormTemplateSave,
  type WritingFormTemplateSaveRecord,
} from '@/features/template/lib/writing-form-template-local-save'
import type { TemplateSection } from '@/features/template/model/template.schema'
import {
  createDefaultDirectAgreementDraft,
  createNewSurveyDraft,
  normalizeWritingFormDraft,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import { formTemplateQueryKeys } from '@/features/template/api/form-template-query-keys'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import { getApiErrorCode } from '@/shared/lib/extract-api-error-message'
import { queryClient } from '@/shared/lib/query-client'
import type {
  FormTemplateListItemResponse,
  ListTemplatesParams,
} from '@/shared/api/generated/forms-surveys/schemas'

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

const FORM_TEMPLATE_LIST_PAGE_SIZE = 20
const FORM_TEMPLATE_LIST_MAX_PAGES = 100

async function fetchAllFormTemplateListItems(
  params: Omit<ListTemplatesParams, 'page' | 'size'>
): Promise<FormTemplateListItemResponse[]> {
  const items: FormTemplateListItemResponse[] = []
  let page = 0
  let totalPages = 1
  while (page < totalPages && page < FORM_TEMPLATE_LIST_MAX_PAGES) {
    const result = await fetchFormTemplatesRemote({
      ...params,
      page,
      size: FORM_TEMPLATE_LIST_PAGE_SIZE,
    })
    const pageItems = result.items ?? []
    items.push(...pageItems)
    totalPages = result.totalPages ?? page + 1
    if (pageItems.length === 0) break
    page += 1
  }
  return items
}

export async function getWritingFormSectionsRemote(): Promise<TemplateSection[]> {
  assertFormsSurveysRemoteReady()
  const items = await fetchAllFormTemplateListItems({
    formType: WRITING_FORM_TYPE,
    useYn: true,
  })
  upsertFormTemplateVersionCacheFromListItems(items)
  return buildWritingFormSectionsFromApiItems(items)
}

export async function getIssuanceFormSectionsRemote(): Promise<TemplateSection[]> {
  assertFormsSurveysRemoteReady()
  const items = await fetchAllFormTemplateListItems({
    formType: ISSUANCE_FORM_TYPE,
    useYn: true,
  })
  upsertFormTemplateVersionCacheFromListItems(items)
  return buildIssuanceFormSectionsFromApiItems(items)
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

export function buildSaveRecordFromVersionResponse(args: {
  templateCode: string
  schemaJson?: string | Record<string, unknown> | null
  extensionJson?: string | Record<string, unknown> | null
  settingsJson?: string | Record<string, unknown> | null
  updatedAt?: string
  /** program-scoped version GET — seed migration으로 PUT diff 유발 방지 */
  skipSeedMigration?: boolean
}): WritingFormTemplateSaveRecord | null {
  const extension = extensionJsonToExtensionPayload(args.extensionJson)
  const settings = settingsJsonToSettingsPayload(args.settingsJson)

  let draft = schemaJsonToWritingFormDraft(args.schemaJson)
  if (draft == null) {
    // 모집 양식은 schemaJson을 생략하고 extensionJson(overlay)만 둔다.
    if (settings == null && extension == null) return null
    draft = EMPTY_SCHEMA_DRAFT
  } else if (args.skipSeedMigration) {
    draft = normalizeWritingFormDraft(draft)
  } else {
    draft = normalizeWritingFormDraftFromApi(
      args.templateCode,
      draft,
      getFormTemplateVersionCacheEntry(args.templateCode)?.baseTemplateCode
    )
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
 * Remote SSOT load.
 * 프로그램 등록 `localOnly`는 `loadWritingFormTemplateDraft(..., { localOnly: true })` 경로.
 * remote 실패 시 `null`(에디터 seed hydrate) — localStorage fallback 없음.
 */
export async function loadFormTemplateVersionDraft(
  templateCode: string
): Promise<WritingFormTemplateSaveRecord | null> {
  if (!shouldUseRemoteDraftApiForTemplate(templateCode)) {
    return null
  }

  try {
    const versionId = await resolveTemplateVersionId(templateCode)
    if (versionId == null) {
      return null
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
      return null
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
    console.warn('[form-templates] remote draft load failed; using seed hydrate', error)
    return null
  }
}

export async function loadFormTemplateVersionDraftByVersionId(
  templateCode: string,
  versionId: number,
  options?: { invalidateCache?: boolean }
): Promise<WritingFormTemplateSaveRecord | null> {
  assertFormsSurveysRemoteReady()
  if (options?.invalidateCache === true) {
    await queryClient.invalidateQueries({
      queryKey: formTemplateQueryKeys.versionById(versionId),
    })
  }
  const version = await queryClient.fetchQuery({
    queryKey: formTemplateQueryKeys.versionById(versionId),
    queryFn: () => fetchFormTemplateVersionRemote(versionId),
    staleTime: 30_000,
  })
  return buildSaveRecordFromVersionResponse({
    templateCode,
    schemaJson: version.schemaJson,
    extensionJson: version.extensionJson,
    settingsJson: version.settingsJson,
    updatedAt: version.updatedAt,
    skipSeedMigration: true,
  })
}

function buildVersionUpdateBody(args: {
  templateCode?: string
  draft: WritingFormDraft
  overlay?: Record<string, unknown>
  editorState?: Record<string, unknown>
  uiState?: Record<string, unknown>
  settingsJson?: Record<string, unknown>
  omitSchemaJson?: boolean
  /** CATALOG 원본 — 병합된 schema를 normalize 없이 보낸다 */
  forceSchemaFromDraft?: boolean
  catalogBaseline?: WritingFormDraft | null
}): {
  schemaJson?: string
  extensionJson?: string
  settingsJson?: string
} {
  const body: {
    schemaJson?: string
    extensionJson?: string
    settingsJson?: string
  } = {}

  if (args.forceSchemaFromDraft === true) {
    body.schemaJson = writingFormDraftToCatalogSchemaJson(args.draft)
  } else if (args.omitSchemaJson !== true) {
    body.schemaJson = writingFormDraftToSchemaJson(args.draft)
  } else if (args.templateCode != null && args.templateCode.trim() !== '') {
    const immutableSchemaDraft = buildOperationalImmutableFormSchemaDraft({
      templateCode: args.templateCode,
      editorDraft: args.draft,
      baseTemplateCode: getFormTemplateVersionCacheEntry(args.templateCode)?.baseTemplateCode,
      catalogBaseline: args.catalogBaseline,
    })
    if (immutableSchemaDraft != null) {
      body.schemaJson = writingFormDraftToCatalogSchemaJson(immutableSchemaDraft)
    }
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

async function loadCatalogBaselineForImmutablePut(
  versionId: number
): Promise<WritingFormDraft | null> {
  try {
    const current = await fetchFormTemplateVersionRemote(versionId)
    return parseCatalogSchemaJson(current.schemaJson)
  } catch {
    return null
  }
}

export const CATALOG_ARCHIVED_VERSION_MESSAGE = '보관된 양식 버전은 수정할 수 없습니다.'

type CatalogOriginalVersionBaseline = {
  schema: WritingFormDraft | null
  extension: {
    overlay?: Record<string, unknown>
    editorState?: Record<string, unknown>
    uiState?: Record<string, unknown>
  } | null
  versionStatus?: string
}

/** CATALOG 원본 — 현재 version의 schema·extension·상태를 함께 읽는다. 실패 시 null. */
async function loadCatalogOriginalVersionBaseline(
  versionId: number
): Promise<CatalogOriginalVersionBaseline | null> {
  try {
    const current = await fetchFormTemplateVersionRemote(versionId)
    return {
      schema: parseCatalogSchemaJson(current.schemaJson),
      extension: extensionJsonToExtensionPayload(current.extensionJson),
      versionStatus: current.versionStatus,
    }
  } catch {
    return null
  }
}

/**
 * CATALOG 원본 판별(C3) — 캐시에 BE templateScope가 있으면 그 값을 우선한다.
 * 저장·게시 라우팅과 FORM_VERSION_IMMUTABLE 우회 차단에 같은 기준을 쓴다.
 */
function isCatalogOriginalForSave(templateCode: string): boolean {
  const cached = getFormTemplateVersionCacheEntry(templateCode)
  return isCatalogOriginalWritingTemplate({
    templateCode,
    baseTemplateCode: cached?.baseTemplateCode,
    templateScope: cached?.templateScope,
    sourceTemplateId: cached?.sourceTemplateId,
  })
}

/**
 * HTTP 클라이언트는 ETag를 직접 관리하지 않는다.
 * PUT 성공 후 version·published-payload 쿼리만 무효화하고 같은 versionId를 다시 읽는다.
 */
async function refreshCatalogVersionQueries(templateCode: string, versionId: number): Promise<void> {
  clearPublishedCatalogDraftCache(templateCode)
  await queryClient.invalidateQueries({
    queryKey: formTemplateQueryKeys.versionById(versionId),
  })
  await queryClient.invalidateQueries({
    queryKey: formTemplateQueryKeys.publishedPayload(templateCode),
  })
  const latest = await fetchFormTemplateVersionRemote(versionId)
  if (latest != null) {
    queryClient.setQueryData(formTemplateQueryKeys.versionById(versionId), latest)
  }
}

/**
 * CATALOG 원본 — 현재 versionId에 기본 내용만 PUT한다.
 * PUBLISHED도 새 DRAFT를 만들지 않는다. 구조가 바뀌면 저장하지 않는다.
 */
async function saveCatalogOriginalContent(args: {
  templateCode: string
  versionId: number
  draft: WritingFormDraft
  overlay?: Record<string, unknown>
  editorState?: Record<string, unknown>
  uiState?: Record<string, unknown>
  settingsJson?: Record<string, unknown>
}): Promise<void> {
  const remote = await loadCatalogOriginalVersionBaseline(args.versionId)
  if (remote?.versionStatus === 'ARCHIVED') {
    throw new Error(CATALOG_ARCHIVED_VERSION_MESSAGE)
  }
  const baseline = remote?.schema ?? getFormTemplateSeedDraft(args.templateCode)
  if (baseline == null) {
    throw new Error('카탈로그 원본 스키마를 불러오지 못했습니다.')
  }
  if (catalogStructureChanged(baseline, args.draft)) {
    throw new CatalogStructureImmutableError()
  }
  // extensionJson: 요청에 없는 영역은 현재 version 값을 유지하고, 내용 값 변경만 허용한다(C5).
  const extensionBaseline: NonNullable<CatalogOriginalVersionBaseline['extension']> =
    remote?.extension ?? {}
  const sendsExtension = hasExtensionPayload(args)
  const nextExtension = {
    overlay: args.overlay ?? extensionBaseline.overlay,
    editorState: args.editorState ?? extensionBaseline.editorState,
    uiState: args.uiState ?? extensionBaseline.uiState,
  }
  if (sendsExtension && catalogExtensionStructureChanged(extensionBaseline, nextExtension)) {
    throw new CatalogStructureImmutableError()
  }
  const merged = applyCatalogAllowedContent(baseline, args.draft)
  try {
    await updateFormTemplateVersionRemote(
      args.versionId,
      buildVersionUpdateBody({
        ...args,
        ...(sendsExtension ? nextExtension : {}),
        draft: merged,
        forceSchemaFromDraft: true,
      })
    )
  } catch (error) {
    if (getApiErrorCode(error) === 'FORM_CATALOG_VERSION_IMMUTABLE') {
      throw new CatalogStructureImmutableError()
    }
    // FORM_VERSION_IMMUTABLE 포함 — 별도 DRAFT를 만들지 않고 기존 오류 팝업으로 올린다.
    throw error
  }
  await refreshCatalogVersionQueries(args.templateCode, args.versionId)
}

export async function saveFormTemplateVersionDraftByVersionId(args: {
  versionId: number
  draft: WritingFormDraft
  overlay?: Record<string, unknown>
  editorState?: Record<string, unknown>
  uiState?: Record<string, unknown>
  settingsJson?: Record<string, unknown>
  templateCode?: string
  omitSchemaJson?: boolean
}): Promise<void> {
  assertFormsSurveysRemoteReady()
  const omitSchemaJson =
    args.omitSchemaJson === true || shouldOmitImmutableFormSchemaJson(args.templateCode)
  const catalogBaseline = omitSchemaJson
    ? await loadCatalogBaselineForImmutablePut(args.versionId)
    : null
  await updateFormTemplateVersionRemote(
    args.versionId,
    buildVersionUpdateBody({
      ...args,
      omitSchemaJson,
      catalogBaseline,
    })
  )
  await queryClient.invalidateQueries({
    queryKey: formTemplateQueryKeys.versionById(args.versionId),
  })
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

  if (isCatalogOriginalForSave(args.templateCode)) {
    await saveCatalogOriginalContent({ ...args, versionId })
    return
  }

  const omitSchemaJson = shouldOmitImmutableFormSchemaJson(args.templateCode)
  const catalogBaseline = omitSchemaJson
    ? await loadCatalogBaselineForImmutablePut(versionId)
    : null
  const body = buildVersionUpdateBody({
    ...args,
    omitSchemaJson,
    catalogBaseline,
  })

  try {
    await updateFormTemplateVersionRemote(versionId, body)
  } catch (error) {
    if (!isFormVersionCopyOnPutError(error)) throw error
    // CATALOG 원본은 별도 DRAFT 우회 금지 — 실패를 성공처럼 보이지 않게 그대로 올린다(C1).
    // FE 캐시에 scope가 없어도 409 details.templateScope가 CATALOG면 새 DRAFT를 만들지 않는다.
    if (isCatalogOriginalForSave(args.templateCode) || apiErrorTemplateScope(error) === 'CATALOG') {
      throw error
    }
    await createDraftVersionFromImmutable(args.templateCode, versionId, body)
  }
}

function apiErrorTemplateScope(error: unknown): string | undefined {
  const details = (
    error as { response?: { data?: { error?: { details?: unknown } } } } | null
  )?.response?.data?.error?.details
  if (details == null || typeof details !== 'object' || Array.isArray(details)) return undefined
  const scope = (details as { templateScope?: unknown }).templateScope
  return typeof scope === 'string' ? scope.trim().toUpperCase() : undefined
}

function isFormVersionCopyOnPutError(error: unknown): boolean {
  return getApiErrorCode(error) === 'FORM_VERSION_IMMUTABLE'
}

/**
 * 게시·보관 version은 수정 불가 — 같은 템플릿에 저장 내용으로 새 DRAFT version을 추가한다.
 * `versions/copy`는 새 COPY 템플릿(「복사본」)을 만들므로 쓰지 않는다.
 */
async function createDraftVersionFromImmutable(
  templateCode: string,
  sourceVersionId: number,
  body: ReturnType<typeof buildVersionUpdateBody>
): Promise<void> {
  const cached = getFormTemplateVersionCacheEntry(templateCode)
  if (cached?.templateId == null) {
    throw new Error('템플릿 ID를 찾을 수 없습니다. 작성 양식 목록을 먼저 조회해 주세요.')
  }

  const source =
    body.schemaJson != null && body.extensionJson != null && body.settingsJson != null
      ? null
      : await fetchFormTemplateVersionRemote(sourceVersionId)
  const created = await createFormTemplateVersionRemote(cached.templateId, {
    schemaJson: body.schemaJson ?? toJsonText(source?.schemaJson),
    extensionJson: body.extensionJson ?? toJsonText(source?.extensionJson),
    settingsJson: body.settingsJson ?? toJsonText(source?.settingsJson),
  })
  if (created.templateVersionId == null) {
    throw new Error('새 초안 버전 ID를 응답에서 찾을 수 없습니다.')
  }

  upsertFormTemplateVersionCacheEntry({
    templateCode,
    templateId: cached.templateId,
    templateVersionId: created.templateVersionId,
    latestVersionId: created.templateVersionId,
    latestVersionNo: created.versionNo,
  })
}

function toJsonText(value: unknown): string | undefined {
  if (value == null) return undefined
  return typeof value === 'string' ? value : JSON.stringify(value)
}

export async function publishFormTemplateVersion(templateCode: string): Promise<void> {
  if (!shouldUseFormsSurveysRemoteApi()) {
    throw new Error('양식 게시는 formsSurveys API 활성화 후 이용할 수 있습니다.')
  }

  if (isCatalogOriginalForSave(templateCode)) {
    throw new CatalogStructureImmutableError()
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

async function resolveDuplicateTemplateName(args: {
  sourceTemplateCode: string
  templateName?: string
}): Promise<string> {
  const explicit = args.templateName?.trim()
  if (explicit != null && explicit !== '') return explicit
  try {
    const payload = await fetchFormTemplatePayloadByCodeRemote(args.sourceTemplateCode)
    const sourceName = payload?.templateName?.trim()
    if (sourceName != null && sourceName !== '') return sourceName
  } catch {
    /* 원본 이름 조회 실패 — code로 대체 */
  }
  return args.sourceTemplateCode
}

/**
 * 신규 템플릿 등록(복제) — `POST /form-templates/{templateId}/duplicate`.
 * `versions/copy`는 프로그램 바인딩 전용으로 쓰지 않는다.
 */
export async function duplicateFormTemplateVersionRemote(args: {
  sourceTemplateCode: string
  sourceApiTemplateId?: number
  sourceVersionId?: number
  templateName?: string
}): Promise<string> {
  assertFormsSurveysRemoteReady()

  let sourceTemplateId = args.sourceApiTemplateId
  let sourceVersionId = args.sourceVersionId
  if (sourceTemplateId == null) {
    const source = await resolveFormTemplateCatalogIds(args.sourceTemplateCode)
    if (source == null) {
      throw new Error('복제할 템플릿 ID를 찾을 수 없습니다. 양식 관리에서 템플릿을 확인해 주세요.')
    }
    sourceTemplateId = source.templateId
    sourceVersionId = sourceVersionId ?? source.templateVersionId
  }

  const templateName = await resolveDuplicateTemplateName(args)
  const created = await duplicateFormTemplateRemote(sourceTemplateId, {
    templateName,
    sourceVersionId,
  })

  const newCode = created.templateCode?.trim()
  if (newCode == null || newCode === '' || newCode === args.sourceTemplateCode) {
    throw new Error('신규 템플릿 코드를 응답에서 찾을 수 없습니다.')
  }
  if (created.templateId == null) {
    throw new Error('신규 템플릿 ID를 응답에서 찾을 수 없습니다.')
  }

  let createdVersionId = created.latestVersionId ?? created.versions?.[0]?.templateVersionId
  let createdVersionNo = created.versions?.[0]?.versionNo
  if (createdVersionId == null) {
    const versions = await fetchFormTemplateVersionsRemote(created.templateId)
    const latest =
      versions.find(version => version.versionStatus === 'DRAFT') ?? versions.at(-1)
    createdVersionId = latest?.templateVersionId
    createdVersionNo = latest?.versionNo
  }
  if (createdVersionId == null) {
    throw new Error('신규 템플릿 버전 ID를 찾지 못했습니다.')
  }

  upsertFormTemplateVersionCacheEntry({
    templateCode: newCode,
    templateId: created.templateId,
    templateVersionId: createdVersionId,
    latestVersionId: createdVersionId,
    latestVersionNo: createdVersionNo,
  })

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

/** 성범죄 동의서 catalogDocument 등 settingsJson만 갱신하는 version PUT */
export async function putFormTemplateVersionJson(
  versionId: number,
  body: { schemaJson?: string; extensionJson?: string; settingsJson?: string }
): Promise<void> {
  assertFormsSurveysRemoteReady()
  await updateFormTemplateVersionRemote(versionId, body)
}

export async function deleteFormTemplate(templateCode: string): Promise<void> {
  const cached = getFormTemplateVersionCacheEntry(templateCode)
  const templateId = cached?.templateId
  if (templateId == null) {
    removeWritingFormTemplateSave(templateCode)
    return
  }

  assertFormsSurveysRemoteReady()
  await deleteFormTemplateRemote(templateId)
  removeFormTemplateVersionCacheEntry(templateCode)
  removeWritingFormTemplateSave(templateCode)
}
