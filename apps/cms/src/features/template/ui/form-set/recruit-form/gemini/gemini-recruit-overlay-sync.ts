import { useCallback, useSyncExternalStore } from 'react'
import { createDefaultGeminiRecruitmentAddFormSnapshot } from '@/features/program/gemini/lib/recruitment/add-local-save'
import {
  isOperationalSeedDefaultSuppressed,
  readOperationalOverlayKvValue,
} from '@/features/template/ui/form-set/shared/operational-seed-default-suppression'
import { createScopedOverlayStore } from '@/features/template/ui/form-set/shared/scoped-overlay-store'

export const GEMINI_RECRUIT_OVERLAY_KEYS = {
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

const defaults = createDefaultGeminiRecruitmentAddFormSnapshot()

export function createDefaultGeminiRecruitOverlay(): Record<string, unknown> {
  return {
    [GEMINI_RECRUIT_OVERLAY_KEYS.title]: defaults.title,
    [GEMINI_RECRUIT_OVERLAY_KEYS.announcementPublished]: defaults.announcementPublished,
    [GEMINI_RECRUIT_OVERLAY_KEYS.educationTargetLevels]: defaults.educationTargetLevels,
    [GEMINI_RECRUIT_OVERLAY_KEYS.educationTargetDetail]: defaults.educationTargetDetail,
    [GEMINI_RECRUIT_OVERLAY_KEYS.applicationPeriodStart]: defaults.applicationPeriodStart,
    [GEMINI_RECRUIT_OVERLAY_KEYS.applicationPeriodEnd]: defaults.applicationPeriodEnd,
    [GEMINI_RECRUIT_OVERLAY_KEYS.trainingRequestPeriodStart]: defaults.trainingRequestPeriodStart,
    [GEMINI_RECRUIT_OVERLAY_KEYS.trainingRequestPeriodEnd]: defaults.trainingRequestPeriodEnd,
    [GEMINI_RECRUIT_OVERLAY_KEYS.minStudentCount]: defaults.minStudentCount,
    [GEMINI_RECRUIT_OVERLAY_KEYS.educationForm]: defaults.educationForm,
    [GEMINI_RECRUIT_OVERLAY_KEYS.inquiryContactName]: defaults.inquiryContactName,
    [GEMINI_RECRUIT_OVERLAY_KEYS.inquiryTel]: defaults.inquiryTel,
    [GEMINI_RECRUIT_OVERLAY_KEYS.inquiryEmail]: defaults.inquiryEmail,
    [GEMINI_RECRUIT_OVERLAY_KEYS.notesNotApplicable]: defaults.notesNotApplicable,
    [GEMINI_RECRUIT_OVERLAY_KEYS.notes]: defaults.notes,
  }
}

const store = createScopedOverlayStore()

export function setGeminiRecruitOverlayScope(templateCode: string | undefined | null): void {
  store.setScope(templateCode)
}

export function subscribeGeminiRecruitOverlay(listener: () => void): () => void {
  return store.subscribe(listener)
}

export function getGeminiRecruitOverlayVersion(): number {
  return store.getVersion()
}

export function getGeminiRecruitOverlayRecord(): Record<string, unknown> {
  return store.getRecord()
}

export function peekGeminiRecruitOverlayRecord(
  templateCode: string | undefined | null
): Record<string, unknown> {
  return store.peekRecord(templateCode)
}

export function replaceGeminiRecruitOverlayForScope(
  templateCode: string | undefined | null,
  next: Record<string, unknown>
): void {
  store.replaceFor(templateCode, next)
}

export function resetGeminiRecruitOverlayForScope(
  templateCode: string | undefined | null
): void {
  store.replaceFor(
    templateCode,
    isOperationalSeedDefaultSuppressed('gemini-recruit', '*')
      ? {}
      : createDefaultGeminiRecruitOverlay()
  )
}

export function patchGeminiRecruitOverlay(partial: Record<string, unknown>): void {
  store.patch(partial)
}

export function replaceGeminiRecruitOverlay(next: Record<string, unknown>): void {
  store.replace({ ...createDefaultGeminiRecruitOverlay(), ...next })
}

/** 템플릿 변경으로 불러온 overlay. 빠진 키를 시드 기본값(최소 인원 15 등)으로 채우지 않는다. */
export function replaceGeminiRecruitOverlayExact(next: Record<string, unknown>): void {
  store.replace(next)
}

export function pickGeminiRecruitOverlay(record: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of Object.values(GEMINI_RECRUIT_OVERLAY_KEYS)) {
    if (record[key] !== undefined) out[key] = record[key]
  }
  return out
}

/** 상세·스냅샷 → geminiRecruit.* 만. 일반 recruit.* 와 섞지 않는다. */
export function seedGeminiRecruitOverlayFromDetail(detail: {
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
    [GEMINI_RECRUIT_OVERLAY_KEYS.title]: detail.title ?? '',
    [GEMINI_RECRUIT_OVERLAY_KEYS.announcementPublished]:
      detail.announcementPublished ?? defaults.announcementPublished,
    [GEMINI_RECRUIT_OVERLAY_KEYS.educationTargetLevels]: detail.educationTargetLevels ?? [],
    [GEMINI_RECRUIT_OVERLAY_KEYS.educationTargetDetail]: detail.educationTargetDetail ?? '',
    [GEMINI_RECRUIT_OVERLAY_KEYS.applicationPeriodStart]: detail.applicationPeriodStart ?? null,
    [GEMINI_RECRUIT_OVERLAY_KEYS.applicationPeriodEnd]: detail.applicationPeriodEnd ?? null,
    [GEMINI_RECRUIT_OVERLAY_KEYS.trainingRequestPeriodStart]:
      detail.trainingRequestPeriodStart ?? null,
    [GEMINI_RECRUIT_OVERLAY_KEYS.trainingRequestPeriodEnd]:
      detail.trainingRequestPeriodEnd ?? null,
    [GEMINI_RECRUIT_OVERLAY_KEYS.minStudentCount]: detail.minStudentCount ?? null,
    [GEMINI_RECRUIT_OVERLAY_KEYS.educationForm]: detail.educationForm ?? defaults.educationForm,
    [GEMINI_RECRUIT_OVERLAY_KEYS.inquiryContactName]: detail.inquiryContactName ?? '',
    [GEMINI_RECRUIT_OVERLAY_KEYS.inquiryTel]: detail.inquiryTel ?? '',
    [GEMINI_RECRUIT_OVERLAY_KEYS.inquiryEmail]: detail.inquiryEmail ?? '',
    [GEMINI_RECRUIT_OVERLAY_KEYS.notesNotApplicable]: detail.notesNotApplicable === true,
    [GEMINI_RECRUIT_OVERLAY_KEYS.notes]: detail.notes ?? '',
  }
}

export function restoreGeminiRecruitOverlay(overlay: Record<string, unknown>): void {
  const picked = pickGeminiRecruitOverlay(overlay)
  if (Object.keys(picked).length > 0) {
    replaceGeminiRecruitOverlayExact(picked)
    return
  }
  replaceGeminiRecruitOverlay(seedGeminiRecruitOverlayFromDetail(overlay))
}

export function resetGeminiRecruitOverlay(): void {
  store.replace(
    isOperationalSeedDefaultSuppressed('gemini-recruit', '*')
      ? {}
      : createDefaultGeminiRecruitOverlay()
  )
}

export function resetAllGeminiRecruitOverlay(): void {
  store.resetAll()
}

export function resetGeminiRecruitOverlayStoreForTests(): void {
  store.resetAll()
}

export function useGeminiRecruitOverlayKv<T>(
  key: string,
  defaultValue: T
): [T, (next: T) => void] {
  const version = useSyncExternalStore(
    subscribeGeminiRecruitOverlay,
    getGeminiRecruitOverlayVersion,
    getGeminiRecruitOverlayVersion
  )
  void version
  const record = getGeminiRecruitOverlayRecord()
  const value = readOperationalOverlayKvValue('gemini-recruit', record, key, defaultValue)
  const setValue = useCallback(
    (next: T) => {
      patchGeminiRecruitOverlay({ [key]: next })
    },
    [key]
  )
  return [value, setValue]
}
