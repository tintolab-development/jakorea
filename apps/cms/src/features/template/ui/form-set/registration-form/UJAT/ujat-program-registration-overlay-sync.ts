import { useCallback, useRef, useSyncExternalStore } from 'react'

/**
 * UJAT 프로그램 등록 폼 단락 본문이 `WritingFormDraft`가 아닌 로컬 state로만 관리될 때,
 * 풀페이지(`TemplateFullpageModal`)와 `TemplatePreviewModal`이 각각 마운트되면 state가 이중으로 갈라진다.
 * 이 스토어로 동일 키를 공유해 미리보기에 입력값이 반영되게 한다.
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

export function subscribeUjatProgramRegistrationOverlay(listener: () => void): () => void {
  overlayListeners.add(listener)
  return () => overlayListeners.delete(listener)
}

export function subscribeUjatProgramRegistrationOverlayKey(
  key: string,
  listener: () => void
): () => void {
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

export function getUjatProgramRegistrationOverlayVersion(): number {
  return overlayVersion
}

export function getUjatProgramRegistrationOverlayRecord(): Record<string, unknown> {
  return overlayState
}

export function patchUjatProgramRegistrationOverlay(partial: Record<string, unknown>): void {
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

export function updateUjatProgramRegistrationOverlayKey<T>(
  key: string,
  updater: (prev: T | undefined) => T
): void {
  const prev = overlayState[key] as T | undefined
  const next = updater(prev)
  if (Object.is(prev, next)) return
  overlayState = { ...overlayState, [key]: next }
  notifyOverlayListeners([key])
}

export function resetUjatProgramRegistrationOverlay(): void {
  overlayState = {}
  notifyOverlayListeners()
}

/**
 * `useSyncExternalStore`용 — 변경된 overlay 키만 구독한다.
 * 전역 version 구독이면 대표 프로그램명 입력마다 다른 단락까지 리렌더된다.
 */
export function useUjatProgramRegistrationOverlayKv<T>(
  key: string,
  defaultValue: T
): [T, (next: T) => void] {
  const defaultRef = useRef(defaultValue)
  const getSnapshot = useCallback(() => {
    const raw = overlayState[key] as T | undefined
    return raw === undefined ? defaultRef.current : raw
  }, [key])

  const value = useSyncExternalStore(
    listener => subscribeUjatProgramRegistrationOverlayKey(key, listener),
    getSnapshot,
    getSnapshot
  )

  const setValue = useCallback(
    (next: T) => {
      const prev = overlayState[key]
      if (Object.is(prev, next)) return
      patchUjatProgramRegistrationOverlay({ [key]: next })
    },
    [key]
  )
  return [value, setValue]
}
