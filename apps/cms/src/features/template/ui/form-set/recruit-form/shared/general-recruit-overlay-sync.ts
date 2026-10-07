import { useCallback, useRef, useSyncExternalStore } from 'react'
import { readOperationalOverlayKvValue } from '@/features/template/ui/form-set/shared/operational-seed-default-suppression'

/**
 * 모집 폼(개인 모집, 강사 모집, 봉사자 모집)의 공유 오버레이 스토어
 * 각 폼이 독립적으로 입력값을 지속하도록 함
 */

let overlayState: Record<string, unknown> = {}
let overlayVersion = 0
const overlayListeners = new Set<() => void>()
const overlayKeyListeners = new Map<string, Set<() => void>>()

function notifyOverlayListeners(changedKeys?: Iterable<string>) {
  overlayVersion += 1
  const notified = new Set<() => void>()
  if (changedKeys != null) {
    for (const key of changedKeys) {
      overlayKeyListeners.get(key)?.forEach(listener => notified.add(listener))
    }
  } else {
    overlayKeyListeners.forEach(listeners => listeners.forEach(listener => notified.add(listener)))
  }
  overlayListeners.forEach(listener => notified.add(listener))
  notified.forEach(listener => listener())
}

export function subscribeGeneralRecruitOverlay(listener: () => void): () => void {
  overlayListeners.add(listener)
  return () => overlayListeners.delete(listener)
}

export function subscribeGeneralRecruitOverlayKey(key: string, listener: () => void): () => void {
  let listeners = overlayKeyListeners.get(key)
  if (listeners == null) {
    listeners = new Set()
    overlayKeyListeners.set(key, listeners)
  }
  listeners.add(listener)
  return () => {
    listeners?.delete(listener)
    if (listeners != null && listeners.size === 0) {
      overlayKeyListeners.delete(key)
    }
  }
}

export function getGeneralRecruitOverlayVersion(): number {
  return overlayVersion
}

export function getGeneralRecruitOverlayRecord(): Record<string, unknown> {
  return overlayState
}

function readOverlayKeyValue<T>(key: string, defaultValue: T): T {
  return readOperationalOverlayKvValue('general-recruit', overlayState, key, defaultValue)
}

export function patchGeneralRecruitOverlay(partial: Record<string, unknown>): void {
  const changedKeys: string[] = []
  const next: Record<string, unknown> = { ...overlayState }
  for (const [key, value] of Object.entries(partial)) {
    if (Object.is(overlayState[key], value)) continue
    next[key] = value
    changedKeys.push(key)
  }
  if (changedKeys.length === 0) return
  overlayState = next
  notifyOverlayListeners(changedKeys)
}

export function updateGeneralRecruitOverlayKey<T>(
  key: string,
  updater: (prev: T | undefined) => T
): void {
  const prev = overlayState[key] as T | undefined
  const next = updater(prev)
  if (Object.is(prev, next)) return
  overlayState = { ...overlayState, [key]: next }
  notifyOverlayListeners([key])
}

export function replaceGeneralRecruitOverlay(next: Record<string, unknown>): void {
  overlayState = { ...next }
  notifyOverlayListeners()
}

export function resetGeneralRecruitOverlay(): void {
  if (Object.keys(overlayState).length === 0) return
  overlayState = {}
  notifyOverlayListeners()
}

/**
 * `useSyncExternalStore`용 — 변경된 overlay 키만 구독한다.
 *
 * 상세 정보 단락처럼 인풋과 WYSIWYG가 한 화면에 있을 때, 전역 version 구독이면
 * 키 입력마다 에디터까지 리렌더되어 버벅인다.
 */
export function useGeneralRecruitOverlayKv<T>(
  key: string,
  defaultValue: T
): [T, (next: T) => void] {
  const defaultRef = useRef(defaultValue)
  const getSnapshot = useCallback(() => readOverlayKeyValue(key, defaultRef.current), [key])

  const value = useSyncExternalStore(
    listener => subscribeGeneralRecruitOverlayKey(key, listener),
    getSnapshot,
    getSnapshot
  )

  const setValue = useCallback(
    (next: T) => {
      patchGeneralRecruitOverlay({ [key]: next })
    },
    [key]
  )
  return [value, setValue]
}
