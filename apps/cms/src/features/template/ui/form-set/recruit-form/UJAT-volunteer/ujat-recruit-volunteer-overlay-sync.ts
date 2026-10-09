import { useCallback, useSyncExternalStore } from 'react'
import { readOperationalOverlayKvValue } from '@/features/template/ui/form-set/shared/operational-seed-default-suppression'
import { createScopedOverlayStore } from '@/features/template/ui/form-set/shared/scoped-overlay-store'

const store = createScopedOverlayStore()

export function setUjatRecruitVolunteerOverlayScope(templateCode: string | undefined | null): void {
  store.setScope(templateCode)
}

export function subscribeUjatRecruitVolunteerOverlay(listener: () => void): () => void {
  return store.subscribe(listener)
}
export function getUjatRecruitVolunteerOverlayVersion(): number {
  return store.getVersion()
}
/** UI·활성 스코프 전용. persist/create 스냅샷에는 `collectSelectedRecruitOverlaysForProgram` / `collectOperationalOverlayForCatalogId`를 쓴다. */
export function getUjatRecruitVolunteerOverlayRecord(): Record<string, unknown> {
  return store.getRecord()
}

export function peekUjatRecruitVolunteerOverlayRecord(
  templateCode: string | undefined | null
): Record<string, unknown> {
  return store.peekRecord(templateCode)
}

export function replaceUjatRecruitVolunteerOverlayForScope(
  templateCode: string | undefined | null,
  next: Record<string, unknown>
): void {
  store.replaceFor(templateCode, next)
}

export function resetUjatRecruitVolunteerOverlayForScope(
  templateCode: string | undefined | null
): void {
  store.resetFor(templateCode)
}
export function patchUjatRecruitVolunteerOverlay(partial: Record<string, unknown>): void {
  store.patch(partial)
}
export function replaceUjatRecruitVolunteerOverlay(next: Record<string, unknown>): void {
  store.replace(next)
}
export function updateUjatRecruitVolunteerOverlayKey<T>(
  key: string,
  updater: (prev: T | undefined) => T
): void {
  store.updateKey(key, updater)
}
export function resetUjatRecruitVolunteerOverlay(): void {
  store.reset()
}
export function resetAllUjatRecruitVolunteerOverlay(): void {
  store.resetAll()
}
export function resetUjatRecruitVolunteerOverlayStoreForTests(): void {
  store.resetAll()
}
export function useUjatRecruitVolunteerOverlayKv<T>(
  key: string,
  defaultValue: T
): [T, (next: T) => void] {
  const version = useSyncExternalStore(
    subscribeUjatRecruitVolunteerOverlay,
    getUjatRecruitVolunteerOverlayVersion,
    getUjatRecruitVolunteerOverlayVersion
  )
  void version
  const record = getUjatRecruitVolunteerOverlayRecord()
  const value = readOperationalOverlayKvValue('ujat-recruit-volunteer', record, key, defaultValue)
  const setValue = useCallback(
    (next: T) => {
      patchUjatRecruitVolunteerOverlay({ [key]: next })
    },
    [key]
  )
  return [value, setValue]
}
