import { useCallback, useRef, useSyncExternalStore } from 'react'
import { readOperationalOverlayKvValue } from '@/features/template/ui/form-set/shared/operational-seed-default-suppression'
import { createScopedOverlayStore } from '@/features/template/ui/form-set/shared/scoped-overlay-store'

/**
 * 지원 폼(기관 지원, 개인 지원 등) overlay.
 * templateCode 버킷으로 양식 인스턴스를 가른다.
 */

const store = createScopedOverlayStore()

export function setGeneralApplicationOverlayScope(templateCode: string | undefined | null): void {
  store.setScope(templateCode)
}

export function getGeneralApplicationOverlayScope(): string {
  return store.getScope()
}

export function subscribeGeneralApplicationOverlay(listener: () => void): () => void {
  return store.subscribe(listener)
}

export function getGeneralApplicationOverlayVersion(): number {
  return store.getVersion()
}

export function getGeneralApplicationOverlayRecord(): Record<string, unknown> {
  return store.getRecord()
}

export function peekGeneralApplicationOverlayRecord(
  templateCode: string | undefined | null
): Record<string, unknown> {
  return store.peekRecord(templateCode)
}

export function replaceGeneralApplicationOverlayForScope(
  templateCode: string | undefined | null,
  next: Record<string, unknown>
): void {
  store.replaceFor(templateCode, next)
}

export function resetGeneralApplicationOverlayForScope(
  templateCode: string | undefined | null
): void {
  store.resetFor(templateCode)
}

export function patchGeneralApplicationOverlay(partial: Record<string, unknown>): void {
  store.patch(partial)
}

export function updateGeneralApplicationOverlayKey<T>(
  key: string,
  updater: (prev: T | undefined) => T
): void {
  store.updateKey(key, updater)
}

export function replaceGeneralApplicationOverlay(next: Record<string, unknown>): void {
  store.replace(next)
}

export function resetGeneralApplicationOverlay(): void {
  store.reset()
}

export function resetAllGeneralApplicationOverlay(): void {
  store.resetAll()
}

export function resetGeneralApplicationOverlayStoreForTests(): void {
  store.resetAll()
}

/** `useSyncExternalStore`용 — 버전만 구독하고 렌더 시 record로 값을 읽는다. */
export function useGeneralApplicationOverlayKv<T>(
  key: string,
  defaultValue: T
): [T, (next: T) => void] {
  const defaultRef = useRef(defaultValue)
  const version = useSyncExternalStore(
    subscribeGeneralApplicationOverlay,
    getGeneralApplicationOverlayVersion,
    getGeneralApplicationOverlayVersion
  )
  void version
  const record = getGeneralApplicationOverlayRecord()
  const value = readOperationalOverlayKvValue(
    'general-application',
    record,
    key,
    defaultRef.current
  )
  const setValue = useCallback(
    (next: T) => {
      patchGeneralApplicationOverlay({ [key]: next })
    },
    [key]
  )
  return [value, setValue]
}
