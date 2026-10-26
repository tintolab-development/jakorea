/**
 * Gemini 찾아가는 연수 모집 — 「참여 기관 모집 정보」폼 상태(RHF).
 *
 * Part3 1단계: 기존 `gemini-recruit-overlay-sync`(scoped overlay store)를 대체한다.
 * - 값의 정본은 양식(templateCode)별 RHF 폼 컨트롤(`createFormControl`)이다.
 *   필드 이름은 저장 키(`geminiRecruit.*`)를 그대로 써서 RHF 값은 `{ geminiRecruit: {...} }` 이고,
 *   직렬화(`getGeminiRecruitFormRecord`)는 같은 점 표기 키 레코드를 돌려준다(양식 extensionJson·snapshot 입력 형태 불변).
 * - 양식 불러오기로 들어온 `geminiRecruit.*` 이외 키는 폼 필드가 아니므로 편집하지 않고 그대로 통과시킨다(기존 저장 결과 유지).
 * - 저장 payload(`serviceDetailJson.geminiRecruitment`)는 `snapshot-from-overlay.ts` 가 이 레코드로 만든다.
 */
import { useCallback, useSyncExternalStore } from 'react'
import { createFormControl, useWatch } from 'react-hook-form'
import { createDefaultGeminiRecruitmentAddFormSnapshot } from '@/features/program/gemini/lib/recruitment/add-local-save'
import {
  isOperationalSeedDefaultSuppressed,
  readOperationalOverlayKvValue,
} from '@/features/template/ui/form-set/shared/operational-seed-default-suppression'

export const GEMINI_RECRUIT_FIELD_KEYS = {
  title: 'geminiRecruit.title',
  announcementPublished: 'geminiRecruit.announcementPublished',
  educationTargetLevels: 'geminiRecruit.educationTargetLevels',
  educationTargetDetail: 'geminiRecruit.educationTargetDetail',
  applicationPeriodStart: 'geminiRecruit.applicationPeriodStart',
  applicationPeriodEnd: 'geminiRecruit.applicationPeriodEnd',
  trainingRequestPeriodStart: 'geminiRecruit.trainingRequestPeriodStart',
  trainingRequestPeriodEnd: 'geminiRecruit.trainingRequestPeriodEnd',
  minStudentCount: 'geminiRecruit.minStudentCount',
  educationForm: 'geminiRecruit.educationForm',
  inquiryContactName: 'geminiRecruit.inquiryContactName',
  inquiryTel: 'geminiRecruit.inquiryTel',
  inquiryEmail: 'geminiRecruit.inquiryEmail',
  notesNotApplicable: 'geminiRecruit.notesNotApplicable',
  notes: 'geminiRecruit.notes',
} as const

export type GeminiRecruitFieldKey =
  (typeof GEMINI_RECRUIT_FIELD_KEYS)[keyof typeof GEMINI_RECRUIT_FIELD_KEYS]

const FIELD_PREFIX = 'geminiRecruit.'
const FIELD_NAMES = Object.values(GEMINI_RECRUIT_FIELD_KEYS).map(key =>
  key.slice(FIELD_PREFIX.length)
)
const FIELD_KEY_SET = new Set<string>(Object.values(GEMINI_RECRUIT_FIELD_KEYS))

export type GeminiRecruitFormValues = {
  geminiRecruit: Record<string, unknown>
}

const DEFAULT_SCOPE = '__default__'

function normalizeScope(templateCode: string | undefined | null): string {
  const next = templateCode?.trim() ?? ''
  return next === '' ? DEFAULT_SCOPE : next
}

const defaults = createDefaultGeminiRecruitmentAddFormSnapshot()

export function createDefaultGeminiRecruitFields(): Record<string, unknown> {
  return {
    [GEMINI_RECRUIT_FIELD_KEYS.title]: defaults.title,
    [GEMINI_RECRUIT_FIELD_KEYS.announcementPublished]: defaults.announcementPublished,
    [GEMINI_RECRUIT_FIELD_KEYS.educationTargetLevels]: defaults.educationTargetLevels,
    [GEMINI_RECRUIT_FIELD_KEYS.educationTargetDetail]: defaults.educationTargetDetail,
    [GEMINI_RECRUIT_FIELD_KEYS.applicationPeriodStart]: defaults.applicationPeriodStart,
    [GEMINI_RECRUIT_FIELD_KEYS.applicationPeriodEnd]: defaults.applicationPeriodEnd,
    [GEMINI_RECRUIT_FIELD_KEYS.trainingRequestPeriodStart]: defaults.trainingRequestPeriodStart,
    [GEMINI_RECRUIT_FIELD_KEYS.trainingRequestPeriodEnd]: defaults.trainingRequestPeriodEnd,
    [GEMINI_RECRUIT_FIELD_KEYS.minStudentCount]: defaults.minStudentCount,
    [GEMINI_RECRUIT_FIELD_KEYS.educationForm]: defaults.educationForm,
    [GEMINI_RECRUIT_FIELD_KEYS.inquiryContactName]: defaults.inquiryContactName,
    [GEMINI_RECRUIT_FIELD_KEYS.inquiryTel]: defaults.inquiryTel,
    [GEMINI_RECRUIT_FIELD_KEYS.inquiryEmail]: defaults.inquiryEmail,
    [GEMINI_RECRUIT_FIELD_KEYS.notesNotApplicable]: defaults.notesNotApplicable,
    [GEMINI_RECRUIT_FIELD_KEYS.notes]: defaults.notes,
  }
}

type GeminiRecruitFormEntry = {
  form: ReturnType<typeof createFormControl<GeminiRecruitFormValues>>
  /** 폼 필드가 아닌 키(양식 불러오기 통과분) */
  passthrough: Record<string, unknown>
}

const entries = new Map<string, GeminiRecruitFormEntry>()
let activeScope = DEFAULT_SCOPE
let version = 0
const listeners = new Set<() => void>()

function notify(): void {
  version += 1
  listeners.forEach(listener => listener())
}

/** 점 표기 레코드 → RHF 값. 없는 키는 없는 채로 둔다(빈 상태 시드 억제 판정이 hasOwnProperty 기준). */
function toFormValues(record: Record<string, unknown>): {
  values: GeminiRecruitFormValues
  passthrough: Record<string, unknown>
} {
  const fields: Record<string, unknown> = {}
  const passthrough: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (FIELD_KEY_SET.has(key)) fields[key.slice(FIELD_PREFIX.length)] = value
    else passthrough[key] = value
  }
  return { values: { geminiRecruit: fields }, passthrough }
}

function createEntry(record: Record<string, unknown> = {}): GeminiRecruitFormEntry {
  const { values, passthrough } = toFormValues(record)
  const form = createFormControl<GeminiRecruitFormValues>({ defaultValues: values })
  // createFormControl 은 마운트 전 setValue 를 무시한다 — reset 으로 값 상태를 확정해 둔다.
  form.reset(values)
  return { form, passthrough }
}

function ensureEntry(scope: string): GeminiRecruitFormEntry {
  let entry = entries.get(scope)
  if (entry == null) {
    entry = createEntry()
    entries.set(scope, entry)
  }
  return entry
}

/** RHF 값 → 저장용 점 표기 레코드(직렬화). 통과 키 다음에 폼 필드 순서로 둔다. */
function serializeEntry(entry: GeminiRecruitFormEntry): Record<string, unknown> {
  const out: Record<string, unknown> = { ...entry.passthrough }
  const fields = (entry.form.getValues('geminiRecruit') ?? {}) as Record<string, unknown>
  for (const name of FIELD_NAMES) {
    if (Object.prototype.hasOwnProperty.call(fields, name)) {
      out[`${FIELD_PREFIX}${name}`] = fields[name]
    }
  }
  return out
}

function resetEntry(scope: string, record: Record<string, unknown>): void {
  const { values, passthrough } = toFormValues(record)
  const entry = ensureEntry(scope)
  entry.passthrough = passthrough
  entry.form.reset(values)
}

ensureEntry(activeScope)

export function setGeminiRecruitFormScope(templateCode: string | undefined | null): void {
  const next = normalizeScope(templateCode)
  ensureEntry(next)
  if (next === activeScope) return
  activeScope = next
  notify()
}

export function subscribeGeminiRecruitForm(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getGeminiRecruitFormVersion(): number {
  return version
}

/** 활성 양식의 RHF 컨트롤 */
export function getActiveGeminiRecruitForm(): GeminiRecruitFormEntry['form'] {
  return ensureEntry(activeScope).form
}

export function getGeminiRecruitFormRecord(): Record<string, unknown> {
  return serializeEntry(ensureEntry(activeScope))
}

export function peekGeminiRecruitFormRecord(
  templateCode: string | undefined | null
): Record<string, unknown> {
  return serializeEntry(ensureEntry(normalizeScope(templateCode)))
}

export function replaceGeminiRecruitFormForScope(
  templateCode: string | undefined | null,
  next: Record<string, unknown>
): void {
  resetEntry(normalizeScope(templateCode), next)
  notify()
}

export function resetGeminiRecruitFormForScope(templateCode: string | undefined | null): void {
  replaceGeminiRecruitFormForScope(
    templateCode,
    isOperationalSeedDefaultSuppressed('gemini-recruit', '*')
      ? {}
      : createDefaultGeminiRecruitFields()
  )
}

/** 사용자 입력 — RHF setValue(dirty 표시) */
export function setGeminiRecruitFieldValue(key: string, value: unknown): void {
  const entry = ensureEntry(activeScope)
  if (!FIELD_KEY_SET.has(key)) {
    if (Object.is(entry.passthrough[key], value)) return
    entry.passthrough = { ...entry.passthrough, [key]: value }
    notify()
    return
  }
  const fields = (entry.form.getValues('geminiRecruit') ?? {}) as Record<string, unknown>
  const name = key.slice(FIELD_PREFIX.length)
  if (Object.prototype.hasOwnProperty.call(fields, name) && Object.is(fields[name], value)) return
  entry.form.setValue(`geminiRecruit.${name}`, value, { shouldDirty: true })
  notify()
}

export function patchGeminiRecruitForm(partial: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(partial)) setGeminiRecruitFieldValue(key, value)
}

export function replaceGeminiRecruitForm(next: Record<string, unknown>): void {
  resetEntry(activeScope, { ...createDefaultGeminiRecruitFields(), ...next })
  notify()
}

/** 템플릿 변경으로 불러온 값. 빠진 키를 시드 기본값(최소 인원 15 등)으로 채우지 않는다. */
export function replaceGeminiRecruitFormExact(next: Record<string, unknown>): void {
  resetEntry(activeScope, next)
  notify()
}

export function pickGeminiRecruitFields(record: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of Object.values(GEMINI_RECRUIT_FIELD_KEYS)) {
    if (record[key] !== undefined) out[key] = record[key]
  }
  return out
}

/** 상세·스냅샷 → geminiRecruit.* 만. 일반 recruit.* 와 섞지 않는다. */
export function seedGeminiRecruitFieldsFromDetail(detail: {
  title?: string
  announcementPublished?: string
  educationTargetLevels?: string[]
  educationTargetDetail?: string
  applicationPeriodStart?: string | null
  applicationPeriodEnd?: string | null
  trainingRequestPeriodStart?: string | null
  trainingRequestPeriodEnd?: string | null
  minStudentCount?: number | null
  educationForm?: string
  inquiryContactName?: string
  inquiryTel?: string
  inquiryEmail?: string
  notesNotApplicable?: boolean
  notes?: string
}): Record<string, unknown> {
  return {
    [GEMINI_RECRUIT_FIELD_KEYS.title]: detail.title ?? '',
    [GEMINI_RECRUIT_FIELD_KEYS.announcementPublished]:
      detail.announcementPublished ?? defaults.announcementPublished,
    [GEMINI_RECRUIT_FIELD_KEYS.educationTargetLevels]: detail.educationTargetLevels ?? [],
    [GEMINI_RECRUIT_FIELD_KEYS.educationTargetDetail]: detail.educationTargetDetail ?? '',
    [GEMINI_RECRUIT_FIELD_KEYS.applicationPeriodStart]: detail.applicationPeriodStart ?? null,
    [GEMINI_RECRUIT_FIELD_KEYS.applicationPeriodEnd]: detail.applicationPeriodEnd ?? null,
    [GEMINI_RECRUIT_FIELD_KEYS.trainingRequestPeriodStart]:
      detail.trainingRequestPeriodStart ?? null,
    [GEMINI_RECRUIT_FIELD_KEYS.trainingRequestPeriodEnd]: detail.trainingRequestPeriodEnd ?? null,
    [GEMINI_RECRUIT_FIELD_KEYS.minStudentCount]: detail.minStudentCount ?? null,
    [GEMINI_RECRUIT_FIELD_KEYS.educationForm]: detail.educationForm ?? defaults.educationForm,
    [GEMINI_RECRUIT_FIELD_KEYS.inquiryContactName]: detail.inquiryContactName ?? '',
    [GEMINI_RECRUIT_FIELD_KEYS.inquiryTel]: detail.inquiryTel ?? '',
    [GEMINI_RECRUIT_FIELD_KEYS.inquiryEmail]: detail.inquiryEmail ?? '',
    [GEMINI_RECRUIT_FIELD_KEYS.notesNotApplicable]: detail.notesNotApplicable === true,
    [GEMINI_RECRUIT_FIELD_KEYS.notes]: detail.notes ?? '',
  }
}

export function restoreGeminiRecruitForm(saved: Record<string, unknown>): void {
  const picked = pickGeminiRecruitFields(saved)
  if (Object.keys(picked).length > 0) {
    replaceGeminiRecruitFormExact(picked)
    return
  }
  replaceGeminiRecruitForm(seedGeminiRecruitFieldsFromDetail(saved))
}

export function resetGeminiRecruitForm(): void {
  resetEntry(
    activeScope,
    isOperationalSeedDefaultSuppressed('gemini-recruit', '*')
      ? {}
      : createDefaultGeminiRecruitFields()
  )
  notify()
}

/** 모든 양식 폼 삭제 — 위저드 종료·신규 시작 */
export function resetAllGeminiRecruitForms(): void {
  entries.clear()
  activeScope = DEFAULT_SCOPE
  ensureEntry(activeScope)
  notify()
}

/** 단락 입력 바인딩 — 활성 양식 RHF 값 구독 + setValue */
export function useGeminiRecruitField<T>(key: string, defaultValue: T): [T, (next: T) => void] {
  useSyncExternalStore(subscribeGeminiRecruitForm, getGeminiRecruitFormVersion, getGeminiRecruitFormVersion)
  const form = getActiveGeminiRecruitForm()
  useWatch({ control: form.control, name: 'geminiRecruit' })
  const value = readOperationalOverlayKvValue(
    'gemini-recruit',
    getGeminiRecruitFormRecord(),
    key,
    defaultValue
  )
  const setValue = useCallback(
    (next: T) => {
      setGeminiRecruitFieldValue(key, next)
    },
    [key]
  )
  return [value, setValue]
}
