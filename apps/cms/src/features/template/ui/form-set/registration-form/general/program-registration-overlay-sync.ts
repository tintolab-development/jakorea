import { useCallback, useSyncExternalStore } from 'react'

/**
 * 일반·1사1교·교육받은 교사 프로그램 등록 폼 단락 본문이 `WritingFormDraft`가 아닌
 * 로컬 state로만 관리될 때, 스텝 전환(언마운트)과 풀페이지·미리보기 이중 마운트에서
 * 입력값이 갈라지지 않도록 동일 키를 공유한다.
 */
let overlayState: Record<string, unknown> = {}
let overlayVersion = 0
const overlayListeners = new Set<() => void>()

function emitOverlay() {
  overlayVersion += 1
  overlayListeners.forEach(l => l())
}

export function subscribeProgramRegistrationOverlay(listener: () => void): () => void {
  overlayListeners.add(listener)
  return () => overlayListeners.delete(listener)
}

export function getProgramRegistrationOverlayVersion(): number {
  return overlayVersion
}

export function getProgramRegistrationOverlayRecord(): Record<string, unknown> {
  return overlayState
}

export function patchProgramRegistrationOverlay(partial: Record<string, unknown>): void {
  overlayState = { ...overlayState, ...partial }
  emitOverlay()
}

export function updateProgramRegistrationOverlayKey<T>(
  key: string,
  updater: (prev: T | undefined) => T
): void {
  const prev = overlayState[key] as T | undefined
  overlayState = { ...overlayState, [key]: updater(prev) }
  emitOverlay()
}

export function replaceProgramRegistrationOverlay(next: Record<string, unknown>): void {
  overlayState = { ...next }
  emitOverlay()
}

export function resetProgramRegistrationOverlay(): void {
  overlayState = {}
  emitOverlay()
}

/** `useSyncExternalStore`용 — 버전만 구독하고 렌더 시 record로 값을 읽는다. */
export function useProgramRegistrationOverlayKv<T>(
  key: string,
  defaultValue: T
): [T, (next: T) => void] {
  const version = useSyncExternalStore(
    subscribeProgramRegistrationOverlay,
    getProgramRegistrationOverlayVersion,
    getProgramRegistrationOverlayVersion
  )
  void version
  const record = getProgramRegistrationOverlayRecord()
  const value = (record[key] as T | undefined) ?? defaultValue
  const setValue = useCallback(
    (next: T) => {
      patchProgramRegistrationOverlay({ [key]: next })
    },
    [key]
  )
  return [value, setValue]
}
