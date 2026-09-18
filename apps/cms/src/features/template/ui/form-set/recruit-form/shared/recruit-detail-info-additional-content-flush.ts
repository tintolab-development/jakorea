/**
 * 모집 상세「추가 내용」WYSIWYG — TipTap 로컬 상태를 overlay에 저장 직전 flush.
 * 키스트로크마다 overlay patch 금지 (rich-text-compose-input-perf).
 */

import { patchGeneralRecruitOverlay } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'

const gettersByOverlayKey = new Map<string, () => string>()

/** `${overlayKeyPrefix}.additionalContentHtml` 키에 getHTML 등록 */
export function registerRecruitDetailAdditionalContentHtml(
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
export function flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay(): void {
  if (gettersByOverlayKey.size === 0) return
  const partial: Record<string, unknown> = {}
  for (const [key, getter] of gettersByOverlayKey) {
    const html = getter()
    if (typeof html !== 'string') continue
    partial[key] = html
  }
  if (Object.keys(partial).length === 0) return
  patchGeneralRecruitOverlay(partial)
}

export function recruitDetailAdditionalContentOverlayKey(overlayKeyPrefix: string): string {
  return `${overlayKeyPrefix}.additionalContentHtml`
}
