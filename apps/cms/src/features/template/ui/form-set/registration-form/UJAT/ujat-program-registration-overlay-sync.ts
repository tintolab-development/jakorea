import { useCallback, useSyncExternalStore } from 'react'

/**
 * UJAT 프로그램 등록 폼 단락 본문이 `WritingFormDraft`가 아닌 로컬 state로만 관리될 때,
 * 풀페이지(`TemplateFullpageModal`)와 `TemplatePreviewModal`이 각각 마운트되면 state가 이중으로 갈라진다.
 * 이 스토어로 동일 키를 공유해 미리보기에 입력값이 반영되게 한다.
 */
let overlayState: Record<string, unknown> = {}
let overlayVersion = 0
const overlayListeners = new Set<() => void>()

function emitOverlay() {
  overlayVersion += 1
  overlayListeners.forEach(l => l())
}

export function subscribeUjatProgramRegistrationOverlay(listener: () => void): () => void {
  overlayListeners.add(listener)
  return () => overlayListeners.delete(listener)
}

export function getUjatProgramRegistrationOverlayVersion(): number {
  return overlayVersion
}

export function getUjatProgramRegistrationOverlayRecord(): Record<string, unknown> {
  return overlayState
}

export function patchUjatProgramRegistrationOverlay(partial: Record<string, unknown>): void {
  overlayState = { ...overlayState, ...partial }
  emitOverlay()
}

export function updateUjatProgramRegistrationOverlayKey<T>(
  key: string,
  updater: (prev: T | undefined) => T
): void {
  const prev = overlayState[key] as T | undefined
  overlayState = { ...overlayState, [key]: updater(prev) }
  emitOverlay()
}

export function resetUjatProgramRegistrationOverlay(): void {
  overlayState = {}
  emitOverlay()
}

/** `useSyncExternalStore`용 — 버전만 구독하고 렌더 시 `getUjatProgramRegistrationOverlayRecord()`로 값을 읽는다. */
export function useUjatProgramRegistrationOverlayKv<T>(key: string, defaultValue: T): [T, (next: T) => void] {
  const version = useSyncExternalStore(
    subscribeUjatProgramRegistrationOverlay,
    getUjatProgramRegistrationOverlayVersion,
    getUjatProgramRegistrationOverlayVersion
  )
  void version
  const record = getUjatProgramRegistrationOverlayRecord()
  const value = (record[key] as T | undefined) ?? defaultValue
  const setValue = useCallback(
    (next: T) => {
      patchUjatProgramRegistrationOverlay({ [key]: next })
    },
    [key]
  )
  return [value, setValue]
}
