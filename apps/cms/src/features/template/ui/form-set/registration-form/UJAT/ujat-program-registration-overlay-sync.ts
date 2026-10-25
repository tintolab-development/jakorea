import { useCallback, useRef, useSyncExternalStore } from 'react'
import { createScopedOverlayStore } from '@/features/template/ui/form-set/shared/scoped-overlay-store'

/**
 * UJAT 프로그램 등록 폼 단락 본문이 `WritingFormDraft`가 아닌 로컬 state로만 관리될 때,
 * 풀페이지(`TemplateFullpageModal`)와 `TemplatePreviewModal`이 각각 마운트되면 state가 이중으로 갈라진다.
 * 이 스토어로 동일 키를 공유해 미리보기에 입력값이 반영되게 한다.
 * templateCode 버킷으로 양식 인스턴스를 가른다.
 */

const store = createScopedOverlayStore()

export function setUjatProgramRegistrationOverlayScope(
  templateCode: string | undefined | null
): void {
  store.setScope(templateCode)
}

export function peekUjatProgramRegistrationOverlayRecord(
  templateCode: string | undefined | null
): Record<string, unknown> {
  return store.peekRecord(templateCode)
}

export function subscribeUjatProgramRegistrationOverlay(listener: () => void): () => void {
  return store.subscribe(listener)
}

export function subscribeUjatProgramRegistrationOverlayKey(
  key: string,
  listener: () => void
): () => void {
  return store.subscribeKey(key, listener)
}

export function getUjatProgramRegistrationOverlayVersion(): number {
  return store.getVersion()
}

export function getUjatProgramRegistrationOverlayRecord(): Record<string, unknown> {
  return store.getRecord()
}

export function patchUjatProgramRegistrationOverlay(partial: Record<string, unknown>): void {
  store.patch(partial)
}

export function replaceUjatProgramRegistrationOverlay(next: Record<string, unknown>): void {
  store.replace(next)
}

export function updateUjatProgramRegistrationOverlayKey<T>(
  key: string,
  updater: (prev: T | undefined) => T
): void {
  store.updateKey(key, updater)
}

export function resetUjatProgramRegistrationOverlay(): void {
  store.reset()
}

export function resetAllUjatProgramRegistrationOverlay(): void {
  store.resetAll()
}

export function resetUjatProgramRegistrationOverlayStoreForTests(): void {
  store.resetAll()
}

/** `useSyncExternalStore`용 — 버전만 구독하고 렌더 시 `getUjatProgramRegistrationOverlayRecord()`로 값을 읽는다. */
export function useUjatProgramRegistrationOverlayKv<T>(key: string, defaultValue: T): [T, (next: T) => void] {
  const defaultRef = useRef(defaultValue)
  const version = useSyncExternalStore(
    subscribeUjatProgramRegistrationOverlay,
    getUjatProgramRegistrationOverlayVersion,
    getUjatProgramRegistrationOverlayVersion
  )
  void version
  const record = getUjatProgramRegistrationOverlayRecord()
  const raw = record[key] as T | undefined
  const value = raw === undefined ? defaultRef.current : raw
  const setValue = useCallback(
    (next: T) => {
      patchUjatProgramRegistrationOverlay({ [key]: next })
    },
    [key]
  )
  return [value, setValue]
}
