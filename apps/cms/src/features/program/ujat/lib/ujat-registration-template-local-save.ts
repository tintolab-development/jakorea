/**
 * UJAT 등록 양식 템플릿 — **localOnly 임시저장 전용**.
 * 프로그램 상세 기본정보 SSOT는 program PATCH + 세션 overlay.
 * 양식 관리 draft는 form-template version API.
 */
import { shouldUseFormsSurveysRemoteApi } from '@/features/template/api/admin-form-templates-service'
import { normalizeWritingFormDraft, type WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { WRITING_FORM_TEMPLATE_SAVE_EVENT } from '@/features/template/lib/writing-form-template-local-save'
import { UJAT_REGISTRATION_TEMPLATE_ID } from '@/features/program/ujat/lib/ujat-registration-basic-info-defaults'

const STORAGE_KEY = 'cms.jakorea.ujatRegistrationTemplateSaves.v1'

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

export function clearUjatRegistrationTemplateLocalStorage(): void {
  try {
    if (localStorage.getItem(STORAGE_KEY) == null) return
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/** localOnly 임시저장 peek. remote ON이면 레거시 키 삭제 후 null. */
export function loadUjatRegistrationTemplateSave(): {
  draft: WritingFormDraft
  overlay: Record<string, unknown>
} | null {
  if (shouldUseFormsSurveysRemoteApi()) {
    clearUjatRegistrationTemplateLocalStorage()
    return null
  }
  const record = readFile().byTemplateId[UJAT_REGISTRATION_TEMPLATE_ID]
  if (!record || record.version !== 1) return null
  return {
    draft: normalizeWritingFormDraft(record.draft),
    overlay: cloneJson(record.overlay),
  }
}

/** localOnly 임시저장 전용 — 양식 관리·상세 기본정보에서 호출하지 말 것 */
export function persistUjatRegistrationTemplateSave(args: {
  draft: WritingFormDraft
  overlay: Record<string, unknown>
}): void {
  if (shouldUseFormsSurveysRemoteApi()) {
    clearUjatRegistrationTemplateLocalStorage()
    return
  }
  const file = readFile()
  file.byTemplateId[UJAT_REGISTRATION_TEMPLATE_ID] = {
    version: 1,
    templateId: UJAT_REGISTRATION_TEMPLATE_ID,
    savedAt: new Date().toISOString(),
    draft: cloneJson(normalizeWritingFormDraft(args.draft)),
    overlay: cloneJson(args.overlay),
  }
  writeFile(file)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(WRITING_FORM_TEMPLATE_SAVE_EVENT, {
        detail: { templateId: UJAT_REGISTRATION_TEMPLATE_ID },
      })
    )
  }
}

export function removeUjatRegistrationTemplateSave(): void {
  clearUjatRegistrationTemplateLocalStorage()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(WRITING_FORM_TEMPLATE_SAVE_EVENT, {
        detail: { templateId: UJAT_REGISTRATION_TEMPLATE_ID },
      })
    )
  }
}
