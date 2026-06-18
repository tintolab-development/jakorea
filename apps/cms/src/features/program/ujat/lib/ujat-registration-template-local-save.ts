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

export function loadUjatRegistrationTemplateSave(): {
  draft: WritingFormDraft
  overlay: Record<string, unknown>
} | null {
  const record = readFile().byTemplateId[UJAT_REGISTRATION_TEMPLATE_ID]
  if (!record || record.version !== 1) return null
  return {
    draft: normalizeWritingFormDraft(record.draft),
    overlay: cloneJson(record.overlay),
  }
}

export function persistUjatRegistrationTemplateSave(args: {
  draft: WritingFormDraft
  overlay: Record<string, unknown>
}): void {
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
