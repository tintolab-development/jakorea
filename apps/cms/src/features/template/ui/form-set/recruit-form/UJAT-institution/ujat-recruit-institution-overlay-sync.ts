import { useCallback, useSyncExternalStore } from 'react'
import { readOperationalOverlayKvValue } from '@/features/template/ui/form-set/shared/operational-seed-default-suppression'
import { createScopedOverlayStore } from '@/features/template/ui/form-set/shared/scoped-overlay-store'

/**
 * UJAT 학교 모집 폼 템플릿 편집기·미리보기가 각각 마운트될 때 로컬 state가 갈라지지 않도록 공유한다.
 */
const store = createScopedOverlayStore()

export function setUjatRecruitInstitutionOverlayScope(
  templateCode: string | undefined | null
): void {
  store.setScope(templateCode)
}

export function subscribeUjatRecruitInstitutionOverlay(listener: () => void): () => void {
  return store.subscribe(listener)
}
export function getUjatRecruitInstitutionOverlayVersion(): number {
  return store.getVersion()
}
export function getUjatRecruitInstitutionOverlayRecord(): Record<string, unknown> {
  return store.getRecord()
}

export function peekUjatRecruitInstitutionOverlayRecord(
  templateCode: string | undefined | null
): Record<string, unknown> {
  return store.peekRecord(templateCode)
}

export function replaceUjatRecruitInstitutionOverlayForScope(
  templateCode: string | undefined | null,
  next: Record<string, unknown>
): void {
  store.replaceFor(templateCode, next)
}

export function resetUjatRecruitInstitutionOverlayForScope(
  templateCode: string | undefined | null
): void {
  store.resetFor(templateCode)
}
export function patchUjatRecruitInstitutionOverlay(partial: Record<string, unknown>): void {
  store.patch(partial)
}
export function replaceUjatRecruitInstitutionOverlay(next: Record<string, unknown>): void {
  store.replace(next)
}
export function updateUjatRecruitInstitutionOverlayKey<T>(
  key: string,
  updater: (prev: T | undefined) => T
): void {
  store.updateKey(key, updater)
}
export function resetUjatRecruitInstitutionOverlay(): void {
  store.reset()
}
export function resetAllUjatRecruitInstitutionOverlay(): void {
  store.resetAll()
}
export function resetUjatRecruitInstitutionOverlayStoreForTests(): void {
  store.resetAll()
}
export function useUjatRecruitInstitutionOverlayKv<T>(
  key: string,
  defaultValue: T
): [T, (next: T) => void] {
  const version = useSyncExternalStore(
    subscribeUjatRecruitInstitutionOverlay,
    getUjatRecruitInstitutionOverlayVersion,
    getUjatRecruitInstitutionOverlayVersion
  )
  void version
  const record = getUjatRecruitInstitutionOverlayRecord()
  const value = readOperationalOverlayKvValue('ujat-recruit-institution', record, key, defaultValue)
  const setValue = useCallback(
    (next: T) => {
      patchUjatRecruitInstitutionOverlay({ [key]: next })
    },
    [key]
  )
  return [value, setValue]
}
