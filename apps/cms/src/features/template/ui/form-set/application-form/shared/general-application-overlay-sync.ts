import { useCallback, useRef, useSyncExternalStore } from 'react'

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
  let changed = false
  for (const [key, next] of Object.entries(partial)) {
    if (!Object.is(overlayState[key], next)) {
      changed = true
      break
    }
  }
  if (!changed) return
  overlayState = { ...overlayState, ...partial }
  emitOverlay()
}

export function updateGeneralApplicationOverlayKey<T>(
  key: string,
  updater: (prev: T | undefined) => T
): void {
  const prev = overlayState[key] as T | undefined
  const next = updater(prev)
  if (Object.is(prev, next)) return
  overlayState = { ...overlayState, [key]: next }
  emitOverlay()
}

export function replaceGeneralApplicationOverlay(next: Record<string, unknown>): void {
  overlayState = { ...next }
  emitOverlay()
}

export function resetGeneralApplicationOverlay(): void {
  if (Object.keys(overlayState).length === 0) return
  overlayState = {}
  emitOverlay()
}

/** `useSyncExternalStore`용 — 버전만 구독하고 렌더 시 record로 값을 읽는다. */
export function useGeneralApplicationOverlayKv<T>(
  key: string,
  defaultValue: T
): [T, (next: T) => void] {
  // 인라인 default(`[]` / `createDefault…()`)가 렌더마다 새 참조가 되어
  // effect 의존·제어 컴포넌트 sync가 무한 루프 나지 않도록 최초 값만 고정
  const defaultRef = useRef(defaultValue)
  const version = useSyncExternalStore(
    subscribeGeneralApplicationOverlay,
    getGeneralApplicationOverlayVersion,
    getGeneralApplicationOverlayVersion
  )
  void version
  const record = getGeneralApplicationOverlayRecord()
  const value = (record[key] as T | undefined) ?? defaultRef.current
  const setValue = useCallback(
    (next: T) => {
      patchGeneralApplicationOverlay({ [key]: next })
    },
    [key]
  )
  return [value, setValue]
}
