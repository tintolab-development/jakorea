/**
 * 모집 상세 WYSIWYG — TipTap 로컬 상태를 overlay에 저장 직전 flush.
 * 키스트로크마다 overlay patch 금지 (rich-text-compose-input-perf).
 */

import { useSyncExternalStore } from 'react'
import { patchGeneralRecruitOverlay } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'

const gettersByOverlayKey = new Map<string, () => string>()
const resetGenerationListeners = new Set<() => void>()
let persistSuppressed = false
let contentResetGeneration = 0
let wizardContentResetPending = false

function emitContentResetGeneration(): void {
  resetGenerationListeners.forEach(listener => listener())
}

/** 위저드 템플릿 변경 — 이전 상세 HTML이 overlay로 되돌아가지 않게 막는다. */
export function beginRecruitDetailContentReset(): void {
  persistSuppressed = true
  wizardContentResetPending = true
  gettersByOverlayKey.clear()
}

/** overlay를 불러온 뒤에 호출해, 빈 스토어로 에디터가 먼저 리마운트되지 않게 한다. */
export function commitRecruitDetailContentReset(): void {
  contentResetGeneration += 1
  emitContentResetGeneration()
}

export function endRecruitDetailContentReset(): void {
  persistSuppressed = false
}

export function consumeWizardContentResetPending(): boolean {
  if (!wizardContentResetPending) return false
  wizardContentResetPending = false
  endRecruitDetailContentReset()
  return true
}

export function isRecruitDetailContentPersistSuppressed(): boolean {
  return persistSuppressed
}

export function getRecruitDetailContentResetGeneration(): number {
  return contentResetGeneration
}

export function subscribeRecruitDetailContentResetGeneration(listener: () => void): () => void {
  resetGenerationListeners.add(listener)
  return () => {
    resetGenerationListeners.delete(listener)
  }
}

export function useRecruitDetailContentResetGeneration(): number {
  return useSyncExternalStore(
    subscribeRecruitDetailContentResetGeneration,
    getRecruitDetailContentResetGeneration,
    getRecruitDetailContentResetGeneration
  )
}

/** `${overlayKeyPrefix}.*` HTML 키에 getHTML 등록 */
export function registerRecruitDetailRichTextHtml(
  overlayKey: string,
  getter: (() => string) | null
): void {
  if (getter == null) {
    gettersByOverlayKey.delete(overlayKey)
    return
  }
  gettersByOverlayKey.set(overlayKey, getter)
}

/** 등록된 에디터 HTML을 general recruit overlay에 기록 */
export function flushRecruitDetailRichTextIntoGeneralRecruitOverlay(): void {
  if (persistSuppressed || gettersByOverlayKey.size === 0) return
  const partial: Record<string, unknown> = {}
  for (const [key, getter] of gettersByOverlayKey) {
    const html = getter()
    if (typeof html !== 'string') continue
    partial[key] = html
  }
  if (Object.keys(partial).length === 0) return
  patchGeneralRecruitOverlay(partial)
}

/** @deprecated 상세 정보 리치 텍스트 전 필드 flush로 확장됨 */
export const registerRecruitDetailAdditionalContentHtml = registerRecruitDetailRichTextHtml

/** @deprecated 상세 정보 리치 텍스트 전 필드 flush로 확장됨 */
export const flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay =
  flushRecruitDetailRichTextIntoGeneralRecruitOverlay

export function recruitDetailAdditionalContentOverlayKey(overlayKeyPrefix: string): string {
  return `${overlayKeyPrefix}.additionalContentHtml`
}
