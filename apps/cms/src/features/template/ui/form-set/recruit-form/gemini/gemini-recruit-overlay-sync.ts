import { useCallback, useSyncExternalStore } from 'react'
import { createDefaultGeminiRecruitmentAddFormSnapshot } from '@/features/program/gemini/lib/recruitment/add-local-save'

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

let overlayState: Record<string, unknown> = createDefaultGeminiRecruitOverlay()
let overlayVersion = 0
const overlayListeners = new Set<() => void>()

function emitOverlay() {
  overlayVersion += 1
  overlayListeners.forEach(l => l())
}

export function subscribeGeminiRecruitOverlay(listener: () => void): () => void {
  overlayListeners.add(listener)
  return () => overlayListeners.delete(listener)
}

export function getGeminiRecruitOverlayVersion(): number {
  return overlayVersion
}

export function getGeminiRecruitOverlayRecord(): Record<string, unknown> {
  return overlayState
}

export function patchGeminiRecruitOverlay(partial: Record<string, unknown>): void {
  overlayState = { ...overlayState, ...partial }
  emitOverlay()
}

export function replaceGeminiRecruitOverlay(next: Record<string, unknown>): void {
  overlayState = { ...createDefaultGeminiRecruitOverlay(), ...next }
  emitOverlay()
}

export function resetGeminiRecruitOverlay(): void {
  overlayState = createDefaultGeminiRecruitOverlay()
  emitOverlay()
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
  const value = (record[key] as T | undefined) ?? defaultValue
  const setValue = useCallback(
    (next: T) => {
      patchGeminiRecruitOverlay({ [key]: next })
    },
    [key]
  )
  return [value, setValue]
}
