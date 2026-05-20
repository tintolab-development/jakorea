/**
 * UJAT 모집 폼 템플릿 — API 연동 전 localStorage 영속화.
 * `ujat-recruit-template-draft.ts` 가 저장본을 읽어 프로그램 상세 모집 탭에 반영한다.
 */
import { normalizeWritingFormDraft, type WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { WRITING_FORM_TEMPLATE_SAVE_EVENT } from '@/features/template/lib/writing-form-template-local-save'
export const UJAT_RECRUIT_INSTITUTION_TEMPLATE_ID = 'recruitment-ujat-school' as const
export const UJAT_RECRUIT_VOLUNTEER_TEMPLATE_ID = 'recruitment-ujat-volunteer' as const
const STORAGE_KEY = 'cms.jakorea.ujatRecruitTemplateSaves.v1'
type TemplateSaveRecord = {
  version: 1
  templateId: string
  savedAt: string
  draft: WritingFormDraft
  overlay: Record<string, unknown>
}
type LocalSaveFile = {
  version: 1
  byTemplateId: Record<string, TemplateSaveRecord>
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
export function loadUjatRecruitTemplateSave(
  templateId: string
): { draft: WritingFormDraft; overlay: Record<string, unknown> } | null {
  const record = readFile().byTemplateId[templateId]
  if (!record || record.version !== 1) return null
  return {
    draft: normalizeWritingFormDraft(record.draft),
    overlay: cloneJson(record.overlay) }
}
export function persistUjatRecruitTemplateSave(args: {
  templateId: string
  draft: WritingFormDraft
  overlay: Record<string, unknown>
}): void {
  const file = readFile()
  file.byTemplateId[args.templateId] = {
    version: 1,
    templateId: args.templateId,
    savedAt: new Date().toISOString(),
    draft: cloneJson(normalizeWritingFormDraft(args.draft)),
    overlay: cloneJson(args.overlay) }
  writeFile(file)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(WRITING_FORM_TEMPLATE_SAVE_EVENT, { detail: { templateId: args.templateId } })
    )
  }
}
export function persistUjatRecruitInstitutionTemplateSave(args: {
  draft: WritingFormDraft
  overlay: Record<string, unknown>
}): void {
  persistUjatRecruitTemplateSave({
    templateId: UJAT_RECRUIT_INSTITUTION_TEMPLATE_ID,
    ...args })
}
export function loadUjatRecruitInstitutionTemplateSave(): {
  draft: WritingFormDraft
  overlay: Record<string, unknown>
} | null {
  return loadUjatRecruitTemplateSave(UJAT_RECRUIT_INSTITUTION_TEMPLATE_ID)
}
export function persistUjatRecruitVolunteerTemplateSave(args: {
  draft: WritingFormDraft
  overlay: Record<string, unknown>
}): void {
  persistUjatRecruitTemplateSave({
    templateId: UJAT_RECRUIT_VOLUNTEER_TEMPLATE_ID,
    ...args })
}
export function loadUjatRecruitVolunteerTemplateSave(): {
  draft: WritingFormDraft
  overlay: Record<string, unknown>
} | null {
  return loadUjatRecruitTemplateSave(UJAT_RECRUIT_VOLUNTEER_TEMPLATE_ID)
}