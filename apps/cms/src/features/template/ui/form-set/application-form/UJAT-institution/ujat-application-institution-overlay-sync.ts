import { useCallback, useSyncExternalStore } from 'react'
import { readOperationalOverlayKvValue } from '@/features/template/ui/form-set/shared/operational-seed-default-suppression'
import { createScopedOverlayStore } from '@/features/template/ui/form-set/shared/scoped-overlay-store'

export {
  UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS,
  type UjatApplicationClassTimePeriods,
  type UjatApplicationGradeDetail,
} from './ujat-application-institution-overlay-keys'

const store = createScopedOverlayStore()

export function setUjatApplicationInstitutionOverlayScope(
  templateCode: string | undefined | null
): void {
  store.setScope(templateCode)
}

export function subscribeUjatApplicationInstitutionOverlay(listener: () => void): () => void {
  return store.subscribe(listener)
}

export function getUjatApplicationInstitutionOverlayVersion(): number {
  return store.getVersion()
}

export function getUjatApplicationInstitutionOverlayRecord(): Record<string, unknown> {
  return store.getRecord()
}

export function peekUjatApplicationInstitutionOverlayRecord(
  templateCode: string | undefined | null
): Record<string, unknown> {
  return store.peekRecord(templateCode)
}

export function replaceUjatApplicationInstitutionOverlayForScope(
  templateCode: string | undefined | null,
  next: Record<string, unknown>
): void {
  store.replaceFor(templateCode, next)
}

export function resetUjatApplicationInstitutionOverlayForScope(
  templateCode: string | undefined | null
): void {
  store.resetFor(templateCode)
}

export function patchUjatApplicationInstitutionOverlay(partial: Record<string, unknown>): void {
  store.patch(partial)
}

export function updateUjatApplicationInstitutionOverlayKey<T>(
  key: string,
  updater: (prev: T | undefined) => T
): void {
  store.updateKey(key, updater)
}

export function replaceUjatApplicationInstitutionOverlay(next: Record<string, unknown>): void {
  store.replace(next)
}

export function resetUjatApplicationInstitutionOverlay(): void {
  store.reset()
}

export function resetAllUjatApplicationInstitutionOverlay(): void {
  store.resetAll()
}

export function resetUjatApplicationInstitutionOverlayStoreForTests(): void {
  store.resetAll()
}

export function useUjatApplicationInstitutionOverlayKv<T>(
  key: string,
  defaultValue: T
): [T, (next: T) => void] {
  const version = useSyncExternalStore(
    subscribeUjatApplicationInstitutionOverlay,
    getUjatApplicationInstitutionOverlayVersion,
    getUjatApplicationInstitutionOverlayVersion
  )
  void version
  const record = getUjatApplicationInstitutionOverlayRecord()
  const value = readOperationalOverlayKvValue(
    'ujat-application-institution',
    record,
    key,
    defaultValue
  )
  const setValue = useCallback(
    (next: T) => {
      patchUjatApplicationInstitutionOverlay({ [key]: next })
    },
    [key]
  )
  return [value, setValue]
}
