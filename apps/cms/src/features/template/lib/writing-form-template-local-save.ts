/**
 * 브라우저 localStorage — **프로그램 상세 임시저장** (`localOnly: true`) 및
 * 레거시 키 정리용. 양식 관리 draft SSOT는 remote API
 * (`saveFormTemplateVersionDraft` / `loadFormTemplateVersionDraft`).
 *
 * 프로그램 코드에서는 `features/program/shared/lib`의 프로그램 로컬 저장 헬퍼를 선호한다.
 */
import {
  normalizeWritingFormDraft,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
const STORAGE_KEY = 'cms.jakorea.writingFormTemplateSaves.v1'
export const WRITING_FORM_TEMPLATE_SAVE_EVENT = 'jakorea:writing-form-template-saved' as const
export type WritingFormTemplateSaveRecord = {
  version: 1
  templateId: string
  savedAt: string
  draft: WritingFormDraft
  /** UJAT 등 오버레이 스토어 스냅샷(해당 양식만) */
  overlay?: Record<string, unknown>
  /** 훅 로컬 state(프로그램 등록 참여 대상 등) */
  editorState?: Record<string, unknown>
  /** agreement-crime 등 settingsJson 기반 양식 */
  settingsJson?: Record<string, unknown>
}
type LocalSaveFile = {
  version: 1
  byTemplateId: Record<string, WritingFormTemplateSaveRecord>
}
function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
function readFile(): LocalSaveFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { version: 1, byTemplateId: {} }
    const parsed = JSON.parse(raw) as LocalSaveFile
    if (parsed?.version !== 1 || typeof parsed.byTemplateId !== 'object') {
      return { version: 1, byTemplateId: {} }
    }
    return parsed
  } catch {
    return { version: 1, byTemplateId: {} }
  }
}
function writeFile(file: LocalSaveFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
}

/**
 * overlay 인자를 생략하거나 빈 `{}`로 넘기면 기존 sidecar를 지우지 않는다.
 * 명시 키가 있는 snapshot은 그 값으로 교체한다(빈 문자열·null·[] 유지).
 */
function nextPersistedOverlay(
  incoming: Record<string, unknown> | undefined,
  previous: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (incoming == null || Object.keys(incoming).length === 0) {
    return previous != null ? cloneJson(previous) : undefined
  }
  return cloneJson({ ...(previous ?? {}), ...incoming })
}

/** QuotaExceededError / 용량 부족 — 임시저장 UI 실패 문구 분기용 */
export function isLocalStorageQuotaExceededError(error: unknown): boolean {
  if (error == null || typeof error !== 'object') return false
  const name = 'name' in error && typeof error.name === 'string' ? error.name : ''
  const code = 'code' in error ? error.code : undefined
  const message = 'message' in error && typeof error.message === 'string' ? error.message : ''
  return (
    name === 'QuotaExceededError' ||
    name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    code === 22 ||
    code === 1014 ||
    /quotaexceeded|quota.?exceeded|exceeded the quota/i.test(message)
  )
}
export function loadWritingFormTemplateSave(
  templateId: string
): WritingFormTemplateSaveRecord | null {
  const record = readFile().byTemplateId[templateId]
  if (!record || record.version !== 1) return null
  return {
    ...record,
    draft: normalizeWritingFormDraft(record.draft),
    overlay: record.overlay ? cloneJson(record.overlay) : undefined,
    editorState: record.editorState ? cloneJson(record.editorState) : undefined,
    settingsJson: record.settingsJson ? cloneJson(record.settingsJson) : undefined,
  }
}
export function persistWritingFormTemplateSave(args: {
  templateId: string
  draft: WritingFormDraft
  overlay?: Record<string, unknown>
  editorState?: Record<string, unknown>
  settingsJson?: Record<string, unknown>
}): void {
  const file = readFile()
  const previous = file.byTemplateId[args.templateId]
  file.byTemplateId[args.templateId] = {
    version: 1,
    templateId: args.templateId,
    savedAt: new Date().toISOString(),
    draft: cloneJson(normalizeWritingFormDraft(args.draft)),
    overlay: nextPersistedOverlay(args.overlay, previous?.overlay),
    editorState:
      args.editorState != null
        ? cloneJson(args.editorState)
        : previous?.editorState != null
          ? cloneJson(previous.editorState)
          : undefined,
    settingsJson:
      args.settingsJson != null
        ? cloneJson(args.settingsJson)
        : previous?.settingsJson != null
          ? cloneJson(previous.settingsJson)
          : undefined,
  }
  writeFile(file)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(WRITING_FORM_TEMPLATE_SAVE_EVENT, { detail: { templateId: args.templateId } })
    )
  }
}

/** 신규 등록 등 — 해당 templateId 임시저장본 제거 */
export function removeWritingFormTemplateSave(templateId: string): void {
  const file = readFile()
  if (!(templateId in file.byTemplateId)) return
  delete file.byTemplateId[templateId]
  writeFile(file)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(WRITING_FORM_TEMPLATE_SAVE_EVENT, { detail: { templateId } })
    )
  }
}

/** 접두사에 해당하는 로컬 초안을 복제해 둔다. 위저드 방문 스냅샷용. */
export function captureWritingFormTemplateSavesByPrefix(
  prefix: string
): Record<string, WritingFormTemplateSaveRecord> {
  const file = readFile()
  const snapshot: Record<string, WritingFormTemplateSaveRecord> = {}
  for (const [templateId, record] of Object.entries(file.byTemplateId)) {
    if (!templateId.startsWith(prefix) || record.version !== 1) continue
    snapshot[templateId] = cloneJson(record)
  }
  return snapshot
}

/**
 * 접두사 초안을 스냅샷으로 되돌린다.
 * 스냅샷에 없는 키는 제거하고, 있던 키는 방문 시작(또는 임시저장) 시점으로 덮어쓴다.
 */
export function restoreWritingFormTemplateSavesByPrefix(
  prefix: string,
  snapshot: Record<string, WritingFormTemplateSaveRecord>
): void {
  const file = readFile()
  for (const templateId of Object.keys(file.byTemplateId)) {
    if (templateId.startsWith(prefix)) delete file.byTemplateId[templateId]
  }
  for (const [templateId, record] of Object.entries(snapshot)) {
    if (!templateId.startsWith(prefix) || record.version !== 1) continue
    file.byTemplateId[templateId] = cloneJson(record)
  }
  writeFile(file)
}

/** 프로그램 등록 위저드처럼 접두사로 격리된 localStorage 초안을 일괄 제거한다. */
export function removeWritingFormTemplateSavesByPrefix(prefix: string): void {
  const file = readFile()
  const templateIds = Object.keys(file.byTemplateId).filter(templateId =>
    templateId.startsWith(prefix)
  )
  if (templateIds.length === 0) return
  for (const templateId of templateIds) {
    delete file.byTemplateId[templateId]
  }
  writeFile(file)
  if (typeof window !== 'undefined') {
    for (const templateId of templateIds) {
      window.dispatchEvent(
        new CustomEvent(WRITING_FORM_TEMPLATE_SAVE_EVENT, { detail: { templateId } })
      )
    }
  }
}

/**
 * `localOnly: true` — 프로그램 등록 임시저장 (양식 버전 API와 분리).
 * 그 외 — 양식 관리용 remote draft API (`saveFormTemplateVersionDraft`).
 */
export async function persistWritingFormTemplateDraft(args: {
  templateId: string
  draft: WritingFormDraft
  overlay?: Record<string, unknown>
  editorState?: Record<string, unknown>
  settingsJson?: Record<string, unknown>
  /** 프로그램 등록·모집 임시저장 전용. 양식 관리에서는 사용하지 않는다. */
  localOnly?: boolean
  /** 프로그램 form-binding 전용 version — 카탈로그 code PUT을 건너뛴다 */
  templateVersionId?: number
  /** 템플릿 관리 설문·동의서 저장만 true. 프로그램 흐름에서는 켜지 않는다. */
  publishAfterSave?: boolean
}): Promise<void> {
  if (args.localOnly) {
    persistWritingFormTemplateSave(args)
    return
  }
  const { isCatalogOriginalVersionWriteBlocked } = await import(
    '@/features/template/lib/form-template-delete-policy'
  )
  if (args.templateVersionId == null && isCatalogOriginalVersionWriteBlocked(args.templateId)) {
    throw new Error(
      args.templateId.trim() === 'agreement-crime'
        ? '성범죄 경력조회 동의서는 폼 빌더가 아닌 PDF 교체 기능으로만 수정할 수 있습니다.'
        : '등록·모집·신청 CATALOG 원본은 수정하거나 새 버전을 만들 수 없습니다.'
    )
  }
  if (args.templateVersionId != null) {
    const { saveFormTemplateVersionDraftByVersionId, resolveFormTemplateCatalogIds } = await import(
      '@/features/template/api/admin-form-templates-service'
    )
    // 프로그램 바인딩 버전 직접 저장 — 공용 카탈로그·발행·공유 버전이면 막는다(fail-closed).
    const [{ fetchFormTemplateVersionRemote }, guard] = await Promise.all([
      import('@/features/template/api/form-templates-api-client'),
      import('@/features/template/lib/program-form-version-write-guard'),
    ])
    const current = await fetchFormTemplateVersionRemote(args.templateVersionId)
    const catalog = await resolveFormTemplateCatalogIds(args.templateId).catch(() => null)
    if (
      !guard.canWriteProgramFormVersionInPlace(current, {
        catalogTemplateId: catalog?.templateId,
        programId: current.ownerProgramId,
      })
    ) {
      throw new guard.SharedFormVersionWriteBlockedError(args.templateVersionId)
    }
    await saveFormTemplateVersionDraftByVersionId({
      versionId: args.templateVersionId,
      draft: args.draft,
      overlay: args.overlay,
      editorState: args.editorState,
      settingsJson: args.settingsJson,
      templateCode: args.templateId,
    })
    return
  }
  const { saveFormTemplateVersionDraft } = await import(
    '@/features/template/api/admin-form-templates-service'
  )
  await saveFormTemplateVersionDraft({
    templateCode: args.templateId,
    draft: args.draft,
    overlay: args.overlay,
    editorState: args.editorState,
    settingsJson: args.settingsJson,
    publishAfterSave: args.publishAfterSave,
  })
}

/**
 * `localOnly: true` — 프로그램 localStorage만.
 * `preferLocal: true` — local 초안이 있으면 사용, 없으면 remote.
 * `templateVersionId` — 프로그램 binding version payload.
 * 그 외 — remote draft GET (실패 시 null → seed hydrate).
 */
export async function loadWritingFormTemplateDraft(
  templateId: string,
  options?: { localOnly?: boolean; templateVersionId?: number; preferLocal?: boolean }
): Promise<WritingFormTemplateSaveRecord | null> {
  if (options?.localOnly) return loadWritingFormTemplateSave(templateId)
  if (options?.preferLocal) {
    const local = loadWritingFormTemplateSave(templateId)
    if (local?.draft != null) return local
  }
  if (options?.templateVersionId != null) {
    const { loadFormTemplateVersionDraftByVersionId } = await import(
      '@/features/template/api/admin-form-templates-service'
    )
    return loadFormTemplateVersionDraftByVersionId(templateId, options.templateVersionId)
  }
  const { loadFormTemplateVersionDraft } = await import(
    '@/features/template/api/admin-form-templates-service'
  )
  return loadFormTemplateVersionDraft(templateId)
}
