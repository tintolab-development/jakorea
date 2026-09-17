/**
 * UJAT 모집 폼 템플릿 — remote ON: form-template version `extensionJson` SSOT.
 * localStorage는 `localOnly`(프로그램 등록 임시저장) 전용. remote 경로에서는 키를 지운다.
 */
import { shouldUseFormsSurveysRemoteApi } from '@/features/template/api/admin-form-templates-service'
import {
  loadWritingFormTemplateDraft,
  persistWritingFormTemplateDraft,
  WRITING_FORM_TEMPLATE_SAVE_EVENT,
} from '@/features/template/lib/writing-form-template-local-save'
import { normalizeWritingFormDraft, type WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'

export const UJAT_RECRUIT_INSTITUTION_TEMPLATE_ID = 'recruitment-ujat-school' as const
export const UJAT_RECRUIT_VOLUNTEER_TEMPLATE_ID = 'recruitment-ujat-volunteer' as const

const STORAGE_KEY = 'cms.jakorea.ujatRecruitTemplateSaves.v1'

export const UJAT_RECRUIT_TEMPLATE_CHANGED_EVENT = 'jakorea:ujat-recruit-template-changed' as const

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

type RecruitTemplateSnapshot = {
  draft: WritingFormDraft
  overlay: Record<string, unknown>
}

const memoryCache = new Map<string, RecruitTemplateSnapshot>()

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

function dispatchChanged(templateId: string): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(UJAT_RECRUIT_TEMPLATE_CHANGED_EVENT, { detail: { templateId } })
  )
  window.dispatchEvent(
    new CustomEvent(WRITING_FORM_TEMPLATE_SAVE_EVENT, { detail: { templateId } })
  )
}

export function clearUjatRecruitTemplateLocalStorage(): void {
  try {
    if (localStorage.getItem(STORAGE_KEY) == null) return
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function rememberUjatRecruitTemplateSave(
  templateId: string,
  snapshot: RecruitTemplateSnapshot
): void {
  memoryCache.set(templateId, {
    draft: normalizeWritingFormDraft(snapshot.draft),
    overlay: cloneJson(snapshot.overlay),
  })
  dispatchChanged(templateId)
}

/** 동기 peek — 메모리 → (localOnly 잔여) localStorage */
export function loadUjatRecruitTemplateSave(
  templateId: string
): RecruitTemplateSnapshot | null {
  const cached = memoryCache.get(templateId)
  if (cached) {
    return {
      draft: normalizeWritingFormDraft(cached.draft),
      overlay: cloneJson(cached.overlay),
    }
  }

  if (shouldUseFormsSurveysRemoteApi()) {
    clearUjatRecruitTemplateLocalStorage()
    return null
  }

  const record = readFile().byTemplateId[templateId]
  if (!record || record.version !== 1) return null
  return {
    draft: normalizeWritingFormDraft(record.draft),
    overlay: cloneJson(record.overlay),
  }
}

/** localOnly 임시저장 전용 */
export function persistUjatRecruitTemplateSaveLocal(args: {
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
    overlay: cloneJson(args.overlay),
  }
  writeFile(file)
  rememberUjatRecruitTemplateSave(args.templateId, {
    draft: args.draft,
    overlay: args.overlay,
  })
}

/** @deprecated use persistUjatRecruitTemplateSaveLocal for localOnly, or remote persist + remember */
export function persistUjatRecruitTemplateSave(args: {
  templateId: string
  draft: WritingFormDraft
  overlay: Record<string, unknown>
}): void {
  persistUjatRecruitTemplateSaveLocal(args)
}

export function persistUjatRecruitInstitutionTemplateSave(args: {
  draft: WritingFormDraft
  overlay: Record<string, unknown>
}): void {
  persistUjatRecruitTemplateSaveLocal({
    templateId: UJAT_RECRUIT_INSTITUTION_TEMPLATE_ID,
    ...args,
  })
}

export function loadUjatRecruitInstitutionTemplateSave(): RecruitTemplateSnapshot | null {
  return loadUjatRecruitTemplateSave(UJAT_RECRUIT_INSTITUTION_TEMPLATE_ID)
}

export function persistUjatRecruitVolunteerTemplateSave(args: {
  draft: WritingFormDraft
  overlay: Record<string, unknown>
}): void {
  persistUjatRecruitTemplateSaveLocal({
    templateId: UJAT_RECRUIT_VOLUNTEER_TEMPLATE_ID,
    ...args,
  })
}

export function loadUjatRecruitVolunteerTemplateSave(): RecruitTemplateSnapshot | null {
  return loadUjatRecruitTemplateSave(UJAT_RECRUIT_VOLUNTEER_TEMPLATE_ID)
}

export async function hydrateUjatRecruitTemplateFromRemote(
  templateId: string
): Promise<RecruitTemplateSnapshot | null> {
  if (!shouldUseFormsSurveysRemoteApi()) {
    return loadUjatRecruitTemplateSave(templateId)
  }

  clearUjatRecruitTemplateLocalStorage()
  try {
    const saved = await loadWritingFormTemplateDraft(templateId)
    if (saved?.draft == null) return memoryCache.get(templateId) ?? null
    const snapshot: RecruitTemplateSnapshot = {
      draft: normalizeWritingFormDraft(saved.draft),
      overlay: saved.overlay ? cloneJson(saved.overlay) : {},
    }
    rememberUjatRecruitTemplateSave(templateId, snapshot)
    return snapshot
  } catch (error) {
    console.warn('[ujat-recruit-template] remote hydrate failed', error)
    return memoryCache.get(templateId) ?? null
  }
}

export async function hydrateAllUjatRecruitTemplatesFromRemote(): Promise<void> {
  await Promise.all([
    hydrateUjatRecruitTemplateFromRemote(UJAT_RECRUIT_INSTITUTION_TEMPLATE_ID),
    hydrateUjatRecruitTemplateFromRemote(UJAT_RECRUIT_VOLUNTEER_TEMPLATE_ID),
  ])
}

/** remote 경로 저장 — version PUT + 메모리. localStorage 미사용. */
export async function persistUjatRecruitTemplateRemote(args: {
  templateId: string
  draft: WritingFormDraft
  overlay: Record<string, unknown>
}): Promise<void> {
  await persistWritingFormTemplateDraft({
    templateId: args.templateId,
    draft: args.draft,
    overlay: args.overlay,
  })
  clearUjatRecruitTemplateLocalStorage()
  rememberUjatRecruitTemplateSave(args.templateId, {
    draft: args.draft,
    overlay: args.overlay,
  })
}
