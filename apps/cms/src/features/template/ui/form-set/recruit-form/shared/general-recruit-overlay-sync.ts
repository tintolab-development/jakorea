import { useCallback, useRef, useSyncExternalStore } from 'react'

/**
 * 모집 폼(개인 모집, 강사 모집, 봉사자 모집)의 공유 오버레이 스토어
 * 각 폼이 독립적으로 입력값을 지속하도록 함
 */

let overlayState: Record<string, unknown> = {}
let overlayVersion = 0
const overlayListeners = new Set<() => void>()

function emitOverlay() {
  overlayVersion += 1
  overlayListeners.forEach(l => l())
}

export function subscribeGeneralRecruitOverlay(listener: () => void): () => void {
  overlayListeners.add(listener)
  return () => overlayListeners.delete(listener)
}

export function getGeneralRecruitOverlayVersion(): number {
  return overlayVersion
}

export function getGeneralRecruitOverlayRecord(): Record<string, unknown> {
  return overlayState
}

export function patchGeneralRecruitOverlay(partial: Record<string, unknown>): void {
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

export function updateGeneralRecruitOverlayKey<T>(
  key: string,
  updater: (prev: T | undefined) => T
): void {
  const prev = overlayState[key] as T | undefined
  const next = updater(prev)
  if (Object.is(prev, next)) return
  overlayState = { ...overlayState, [key]: next }
  emitOverlay()
}

export function replaceGeneralRecruitOverlay(next: Record<string, unknown>): void {
  overlayState = { ...next }
  emitOverlay()
}

export function resetGeneralRecruitOverlay(): void {
  if (Object.keys(overlayState).length === 0) return
  overlayState = {}
  emitOverlay()
}

/** `useSyncExternalStore`용 — 버전만 구독하고 렌더 시 record로 값을 읽는다. */
export function useGeneralRecruitOverlayKv<T>(
  key: string,
  defaultValue: T
): [T, (next: T) => void] {
  const defaultRef = useRef(defaultValue)
  const version = useSyncExternalStore(
    subscribeGeneralRecruitOverlay,
    getGeneralRecruitOverlayVersion,
    getGeneralRecruitOverlayVersion
  )
  void version
  const record = getGeneralRecruitOverlayRecord()
  const value = (record[key] as T | undefined) ?? defaultRef.current
  const setValue = useCallback(
    (next: T) => {
      patchGeneralRecruitOverlay({ [key]: next })
    },
    [key]
  )
  return [value, setValue]
}
