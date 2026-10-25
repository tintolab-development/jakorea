/**
 * UJAT 모집 폼 템플릿 — remote ON: form-template version `extensionJson` SSOT.
 * localStorage는 `localOnly`(프로그램 등록 임시저장) 전용. remote 경로에서는 키를 지운다.
 */
import { shouldUseFormsSurveysRemoteApi } from '@/features/template/api/admin-form-templates-service'
import type { Program } from '@/types/domain'
import { replaceUjatApplicationInstitutionOverlay } from '@/features/template/ui/form-set/application-form/UJAT-institution/ujat-application-institution-overlay-sync'
import { replaceUjatApplicationVolunteerOverlay } from '@/features/template/ui/form-set/application-form/UJAT-volunteer/ujat-application-volunteer-overlay-sync'
import {
  pickOverlayKeysByPrefix,
  pickUjatVolunteerRecruitGeneralStoreSidecar,
  RECRUIT_DETAIL_INFO_OVERLAY_PREFIX,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-overlay'
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
  settingsJson?: Record<string, unknown>
}

type LocalSaveFile = {
  version: 1
  byTemplateId: Record<string, TemplateSaveRecord>
}

type RecruitTemplateSnapshot = {
  draft: WritingFormDraft
  overlay: Record<string, unknown>
  settingsJson?: Record<string, unknown>
}

const memoryCache = new Map<string, RecruitTemplateSnapshot>()
const hydrateInflightByProgramId = new Map<string, Promise<void>>()
const lastHydrateStampByProgramId = new Map<string, string>()

export function resetUjatRecruitTemplateProgramHydrate(programId?: string): void {
  if (programId) {
    lastHydrateStampByProgramId.delete(programId)
    hydrateInflightByProgramId.delete(programId)
    return
  }
  lastHydrateStampByProgramId.clear()
  hydrateInflightByProgramId.clear()
}

function recruitHydrateStamp(program: Program): string {
  const overlay = program.ujatRegistrationOverlay ?? {}
  const rows = (program.programRecruitments ?? [])
    .map(row => `${row.id ?? ''}:${row.recruitTerm ?? ''}`)
    .join('|')
  return `${program.id}:${Object.keys(overlay).length}:${rows}`
}

function pickProgramRecruitOverlayForTemplate(
  program: Program,
  templateId: string
): Record<string, unknown> {
  const overlay = program.ujatRegistrationOverlay ?? {}
  if (templateId === UJAT_RECRUIT_INSTITUTION_TEMPLATE_ID) {
    return {
      ...pickOverlayByPrefix(overlay, 'ujat.recruit.institution.'),
      ...pickOverlayKeysByPrefix(overlay, RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.ujatInstitution),
    }
  }
  return {
    ...pickOverlayByPrefix(overlay, 'ujat.recruit.volunteer.'),
    ...pickUjatVolunteerRecruitGeneralStoreSidecar(overlay),
  }
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
    settingsJson: snapshot.settingsJson ? cloneJson(snapshot.settingsJson) : undefined,
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
      settingsJson: cached.settingsJson ? cloneJson(cached.settingsJson) : undefined,
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
    settingsJson: record.settingsJson ? cloneJson(record.settingsJson) : undefined,
  }
}

/** localOnly 임시저장 전용 */
export function persistUjatRecruitTemplateSaveLocal(args: {
  templateId: string
  draft: WritingFormDraft
  overlay: Record<string, unknown>
  settingsJson?: Record<string, unknown>
}): void {
  const file = readFile()
  file.byTemplateId[args.templateId] = {
    version: 1,
    templateId: args.templateId,
    savedAt: new Date().toISOString(),
    draft: cloneJson(normalizeWritingFormDraft(args.draft)),
    overlay: cloneJson(args.overlay),
    settingsJson: args.settingsJson ? cloneJson(args.settingsJson) : undefined,
  }
  writeFile(file)
  rememberUjatRecruitTemplateSave(args.templateId, {
    draft: args.draft,
    overlay: args.overlay,
    settingsJson: args.settingsJson,
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
      settingsJson: saved.settingsJson ? cloneJson(saved.settingsJson) : undefined,
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

/** UJAT 프로그램 상세 모집 — binding version GET으로 미리보기 hydrate (PATCH 없음). 신청 양식 GET은 신청 탭에서. */
export async function hydrateUjatRecruitTemplatesForProgram(program: Program): Promise<void> {
  const programOverlay = program.ujatRegistrationOverlay ?? {}
  const applicationInstitution = pickOverlayByPrefix(programOverlay, 'ujatApplication.')
  const applicationVolunteer = pickOverlayByPrefix(programOverlay, 'ujatVolunteerApplication.')
  if (Object.keys(applicationInstitution).length > 0) {
    replaceUjatApplicationInstitutionOverlay(applicationInstitution)
  }
  if (Object.keys(applicationVolunteer).length > 0) {
    replaceUjatApplicationVolunteerOverlay(applicationVolunteer)
  }

  if (!shouldUseFormsSurveysRemoteApi()) {
    await applyMergedRecruitOverlays(program, null)
    return
  }

  const stamp = recruitHydrateStamp(program)
  const inflight = hydrateInflightByProgramId.get(program.id)
  if (inflight) {
    await inflight
    if (lastHydrateStampByProgramId.get(program.id) === stamp) return
  } else if (lastHydrateStampByProgramId.get(program.id) === stamp) {
    return
  }

  const run = (async () => {
    const { resolveProgramOperationalFormLoadSource } = await import(
      '@/features/program/general/lib/sync-registration-form-bindings'
    )
    const { loadFormTemplateVersionDraftByVersionId } = await import(
      '@/features/template/api/admin-form-templates-service'
    )
    const { applyOperationalOverlayForCatalogId } = await import(
      '@/features/program/general/lib/registration-operational-form-drafts'
    )

    await Promise.all(
      [UJAT_RECRUIT_INSTITUTION_TEMPLATE_ID, UJAT_RECRUIT_VOLUNTEER_TEMPLATE_ID].map(
        async templateId => {
          try {
            const source = await resolveProgramOperationalFormLoadSource(program, templateId)
            const programSlice = pickProgramRecruitOverlayForTemplate(program, templateId)
            if (source.templateVersionId == null) {
              const catalogSaved = await hydrateUjatRecruitTemplateFromRemote(templateId)
              await applyMergedRecruitSnapshot({
                templateId,
                draft: catalogSaved?.draft,
                overlay: { ...(catalogSaved?.overlay ?? {}), ...programSlice },
                applyOperationalOverlayForCatalogId,
              })
              return
            }
            const saved = await loadFormTemplateVersionDraftByVersionId(
              templateId,
              source.templateVersionId
            )
            await applyMergedRecruitSnapshot({
              templateId,
              draft: saved?.draft,
              overlay: { ...(saved?.overlay ?? {}), ...programSlice },
              applyOperationalOverlayForCatalogId,
            })
          } catch (error) {
            console.warn('[ujat-recruit-template] program-scoped hydrate failed', templateId, error)
          }
        }
      )
    )
    lastHydrateStampByProgramId.set(program.id, stamp)
  })().finally(() => {
    hydrateInflightByProgramId.delete(program.id)
  })
  hydrateInflightByProgramId.set(program.id, run)
  return run
}

async function applyMergedRecruitOverlays(
  program: Program,
  applyOperationalOverlayForCatalogId: typeof import('@/features/program/general/lib/registration-operational-form-drafts').applyOperationalOverlayForCatalogId | null
): Promise<void> {
  const apply =
    applyOperationalOverlayForCatalogId ??
    (await import('@/features/program/general/lib/registration-operational-form-drafts'))
      .applyOperationalOverlayForCatalogId
  for (const templateId of [
    UJAT_RECRUIT_INSTITUTION_TEMPLATE_ID,
    UJAT_RECRUIT_VOLUNTEER_TEMPLATE_ID,
  ] as const) {
    const overlay = pickProgramRecruitOverlayForTemplate(program, templateId)
    if (Object.keys(overlay).length === 0) continue
    apply(templateId, overlay)
    const cached = memoryCache.get(templateId)
    if (cached) {
      rememberUjatRecruitTemplateSave(templateId, {
        draft: cached.draft,
        overlay: { ...cached.overlay, ...overlay },
      })
    }
  }
}

function applyMergedRecruitSnapshot(args: {
  templateId: string
  draft: WritingFormDraft | undefined
  overlay: Record<string, unknown>
  applyOperationalOverlayForCatalogId: typeof import('@/features/program/general/lib/registration-operational-form-drafts').applyOperationalOverlayForCatalogId
}): void {
  if (Object.keys(args.overlay).length > 0) {
    args.applyOperationalOverlayForCatalogId(args.templateId, args.overlay)
  }
  if (args.draft == null) return
  clearUjatRecruitTemplateLocalStorage()
  rememberUjatRecruitTemplateSave(args.templateId, {
    draft: args.draft,
    overlay: args.overlay,
  })
}

function pickOverlayByPrefix(
  record: Record<string, unknown>,
  prefix: string
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (key.startsWith(prefix)) out[key] = value
  }
  return out
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
