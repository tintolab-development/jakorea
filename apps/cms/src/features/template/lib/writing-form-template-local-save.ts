/**
 * 폼 양식 관리 — 작성 양식 템플릿 localStorage 영속화 (API 연동 전).
 * UJAT 전용 키(`ujat-registration-local-save`, `ujat-recruit-template-local-save`)와 병행해
 * 그 외 등록·모집·신청·설문 양식 draft·부가 상태를 저장한다.
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

/** localStorage 우선 저장 + formsSurveys API 동기화(활성 시 fire-and-forget) */
export async function persistWritingFormTemplateDraft(args: {
  templateId: string
  draft: WritingFormDraft
  overlay?: Record<string, unknown>
  editorState?: Record<string, unknown>
  settingsJson?: Record<string, unknown>
}): Promise<void> {
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

/** API draft 우선, 실패·미활성 시 localStorage */
export async function loadWritingFormTemplateDraft(
  templateId: string
): Promise<WritingFormTemplateSaveRecord | null> {
  const { loadFormTemplateVersionDraft } = await import(
    '@/features/template/api/admin-form-templates-service'
  )
  return loadFormTemplateVersionDraft(templateId)
}