import { useCallback, useSyncExternalStore } from 'react'
import { readOperationalOverlayKvValue } from '@/features/template/ui/form-set/shared/operational-seed-default-suppression'
import { createScopedOverlayStore } from '@/features/template/ui/form-set/shared/scoped-overlay-store'

import { UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS } from './ujat-application-volunteer-overlay-keys'

export {
  UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS,
  stripUjatApplicationVolunteerProgramOnlyFields,
  ujatVolunteerFreeTextOverlayKey,
} from './ujat-application-volunteer-overlay-keys'

const store = createScopedOverlayStore()

export function setUjatApplicationVolunteerOverlayScope(
  templateCode: string | undefined | null
): void {
  store.setScope(templateCode)
}

export function subscribeUjatApplicationVolunteerOverlay(listener: () => void): () => void {
  return store.subscribe(listener)
}

export function getUjatApplicationVolunteerOverlayVersion(): number {
  return store.getVersion()
}

export function getUjatApplicationVolunteerOverlayRecord(): Record<string, unknown> {
  return store.getRecord()
}

/**
 * 수료증 파일은 지원자별 런타임 응답이다.
 * 관리자 프로그램 생성용 form binding/serviceDetail overlay에는 넣지 않는다.
 */
export function getUjatApplicationVolunteerProgramOverlayRecord(): Record<string, unknown> {
  const record = getUjatApplicationVolunteerOverlayRecord()
  const next = { ...record }
  delete next[UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.previousTermFileNames]
  delete next[UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.previousTermFileObjectIds]
  return next
}


export function peekUjatApplicationVolunteerOverlayRecord(
  templateCode: string | undefined | null
): Record<string, unknown> {
  return store.peekRecord(templateCode)
}

export function replaceUjatApplicationVolunteerOverlayForScope(
  templateCode: string | undefined | null,
  next: Record<string, unknown>
): void {
  store.replaceFor(templateCode, next)
}

export function resetUjatApplicationVolunteerOverlayForScope(
  templateCode: string | undefined | null
): void {
  store.resetFor(templateCode)
}

export function patchUjatApplicationVolunteerOverlay(partial: Record<string, unknown>): void {
  store.patch(partial)
}

export function replaceUjatApplicationVolunteerOverlay(next: Record<string, unknown>): void {
  store.replace(next)
}

export function resetUjatApplicationVolunteerOverlay(): void {
  store.reset()
}

export function resetAllUjatApplicationVolunteerOverlay(): void {
  store.resetAll()
}

export function resetUjatApplicationVolunteerOverlayStoreForTests(): void {
  store.resetAll()
}

export function useUjatApplicationVolunteerOverlayKv<T>(
  key: string,
  defaultValue: T
): [T, (next: T) => void] {
  const version = useSyncExternalStore(
    subscribeUjatApplicationVolunteerOverlay,
    getUjatApplicationVolunteerOverlayVersion,
    getUjatApplicationVolunteerOverlayVersion
  )
  void version
  const record = getUjatApplicationVolunteerOverlayRecord()
  const value = readOperationalOverlayKvValue(
    'ujat-application-volunteer',
    record,
    key,
    defaultValue
  )
  const setValue = useCallback(
    (next: T) => {
      patchUjatApplicationVolunteerOverlay({ [key]: next })
    },
    [key]
  )
  return [value, setValue]
}
