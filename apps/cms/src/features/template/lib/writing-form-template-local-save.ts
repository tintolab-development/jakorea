/**
 * 브라우저 localStorage — **프로그램 상세 임시저장** (`localOnly: true`) 및
 * 레거시 키 정리용. 양식 관리 draft SSOT는 remote API
 * (`saveFormTemplateVersionDraft` / `loadFormTemplateVersionDraft`).
 *
 * 프로그램 코드에서는 `@/features/program/shared/lib/program-draft-local-save` 를 선호한다.
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
  file.byTemplateId[args.templateId] = {
    version: 1,
    templateId: args.templateId,
    savedAt: new Date().toISOString(),
    draft: cloneJson(normalizeWritingFormDraft(args.draft)),
    overlay: args.overlay != null ? cloneJson(args.overlay) : undefined,
    editorState: args.editorState != null ? cloneJson(args.editorState) : undefined,
    settingsJson: args.settingsJson != null ? cloneJson(args.settingsJson) : undefined,
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
}): Promise<void> {
  if (args.localOnly) {
    persistWritingFormTemplateSave(args)
    return
  }
  if (args.templateVersionId != null) {
    const { saveFormTemplateVersionDraftByVersionId } = await import(
      '@/features/template/api/admin-form-templates-service'
    )
    await saveFormTemplateVersionDraftByVersionId({
      versionId: args.templateVersionId,
      draft: args.draft,
      overlay: args.overlay,
      editorState: args.editorState,
      settingsJson: args.settingsJson,
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
  })
}

/**
 * `localOnly: true` — 프로그램 localStorage만.
 * `preferLocal: true` — local 초안이 있으면 사용, 없으면 remote.
 * `templateVersionId` — 프로그램 binding version payload.
 * 그 외 — remote draft GET (dev fallback: `VITE_FORM_TEMPLATE_LOCAL_FALLBACK=1`).
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
