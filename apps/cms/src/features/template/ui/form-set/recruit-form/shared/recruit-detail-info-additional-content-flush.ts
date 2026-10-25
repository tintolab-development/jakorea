/**
 * 모집 상세 WYSIWYG — TipTap 로컬 상태를 overlay에 저장 직전 flush.
 * 키스트로크마다 overlay patch 금지 (rich-text-compose-input-perf).
 */

import { useSyncExternalStore } from 'react'
import { patchRecruitDetailInfo } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-form-rhf'

const gettersByOverlayKey = new Map<string, () => string | null>()
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

/**
 * pending만 읽는다. flush 금지는 overlay 적용 후 `consumeWizardContentResetPending`에서 푼다.
 *
 * 수동 회귀: 신규 leftover 없음 · 복사본 단락+상세 WYSIWYG · 탭 전환 시 상세 유지 ·
 * 임시저장 후 모집 유지 · 등록 완료 양식 매핑/상세 조회 · 상세 수정 격리 · DEV 자동입력.
 */
export function peekWizardContentResetPending(): boolean {
  return wizardContentResetPending
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
  getter: (() => string | null) | null
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
  patchRecruitDetailInfo(partial)
}

/** @deprecated 상세 정보 리치 텍스트 전 필드 flush로 확장됨 */
export const registerRecruitDetailAdditionalContentHtml = registerRecruitDetailRichTextHtml

/** @deprecated 상세 정보 리치 텍스트 전 필드 flush로 확장됨 */
export const flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay =
  flushRecruitDetailRichTextIntoGeneralRecruitOverlay

export function recruitDetailAdditionalContentOverlayKey(overlayKeyPrefix: string): string {
  return `${overlayKeyPrefix}.additionalContentHtml`
}
