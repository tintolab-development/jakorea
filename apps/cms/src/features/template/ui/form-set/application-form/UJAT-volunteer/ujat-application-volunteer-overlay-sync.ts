import { useCallback, useSyncExternalStore } from 'react'

export const UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS = {
  preferredRegion: 'ujatVolunteerApplication.preferredRegion',
  universityName: 'ujatVolunteerApplication.universityName',
  grade: 'ujatVolunteerApplication.grade',
  major: 'ujatVolunteerApplication.major',
  applicationRoute: 'ujatVolunteerApplication.applicationRoute',
  applicationRouteOther: 'ujatVolunteerApplication.applicationRouteOther',
  id1365: 'ujatVolunteerApplication.id1365',
  previousTerm: 'ujatVolunteerApplication.previousTerm',
  previousYear: 'ujatVolunteerApplication.previousYear',
  previousTermFileNames: 'ujatVolunteerApplication.previousTermFileNames',
  hasExperience: 'ujatVolunteerApplication.hasExperience',
} as const

let overlayState: Record<string, unknown> = {}
let overlayVersion = 0
const overlayListeners = new Set<() => void>()

function emitOverlay() {
  overlayVersion += 1
  overlayListeners.forEach(l => l())
}

export function subscribeUjatApplicationVolunteerOverlay(listener: () => void): () => void {
  overlayListeners.add(listener)
  return () => overlayListeners.delete(listener)
}

export function getUjatApplicationVolunteerOverlayVersion(): number {
  return overlayVersion
}

export function getUjatApplicationVolunteerOverlayRecord(): Record<string, unknown> {
  return overlayState
}

export function patchUjatApplicationVolunteerOverlay(partial: Record<string, unknown>): void {
  overlayState = { ...overlayState, ...partial }
  emitOverlay()
}

export function replaceUjatApplicationVolunteerOverlay(next: Record<string, unknown>): void {
  overlayState = { ...next }
  emitOverlay()
}

export function resetUjatApplicationVolunteerOverlay(): void {
  overlayState = {}
  emitOverlay()
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
  const value = (record[key] as T | undefined) ?? defaultValue
  const setValue = useCallback(
    (next: T) => {
      patchUjatApplicationVolunteerOverlay({ [key]: next })
    },
    [key]
  )
  return [value, setValue]
}
