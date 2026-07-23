import { useCallback, useSyncExternalStore } from 'react'

/**
 * 지원 폼(기관 지원, 개인 지원 등)의 공유 오버레이 스토어
 * 각 폼이 독립적으로 입력값을 지속하도록 함
 */

let overlayState: Record<string, unknown> = {}
let overlayVersion = 0
const overlayListeners = new Set<() => void>()

function emitOverlay() {
  overlayVersion += 1
  overlayListeners.forEach(l => l())
}

export function subscribeGeneralApplicationOverlay(listener: () => void): () => void {
  overlayListeners.add(listener)
  return () => overlayListeners.delete(listener)
}

export function getGeneralApplicationOverlayVersion(): number {
  return overlayVersion
}

export function getGeneralApplicationOverlayRecord(): Record<string, unknown> {
  return overlayState
}

export function patchGeneralApplicationOverlay(partial: Record<string, unknown>): void {
  overlayState = { ...overlayState, ...partial }
  emitOverlay()
}

export function updateGeneralApplicationOverlayKey<T>(
  key: string,
  updater: (prev: T | undefined) => T
): void {
  const prev = overlayState[key] as T | undefined
  overlayState = { ...overlayState, [key]: updater(prev) }
  emitOverlay()
}

export function replaceGeneralApplicationOverlay(next: Record<string, unknown>): void {
  overlayState = { ...next }
  emitOverlay()
}

export function resetGeneralApplicationOverlay(): void {
  overlayState = {}
  emitOverlay()
}

/** `useSyncExternalStore`용 — 버전만 구독하고 렌더 시 record로 값을 읽는다. */
export function useGeneralApplicationOverlayKv<T>(
  key: string,
  defaultValue: T
): [T, (next: T) => void] {
  const version = useSyncExternalStore(
    subscribeGeneralApplicationOverlay,
    getGeneralApplicationOverlayVersion,
    getGeneralApplicationOverlayVersion
  )
  void version
  const record = getGeneralApplicationOverlayRecord()
  const value = (record[key] as T | undefined) ?? defaultValue
  const setValue = useCallback(
    (next: T) => {
      patchGeneralApplicationOverlay({ [key]: next })
    },
    [key]
  )
  return [value, setValue]
}
