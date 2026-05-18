import { useCallback, useSyncExternalStore } from 'react'
let overlayState: Record<string, unknown> = {}
let overlayVersion = 0
const overlayListeners = new Set<() => void>()
function emitOverlay() {
  overlayVersion += 1
  overlayListeners.forEach(l => l())
}
export function subscribeUjatRecruitVolunteerOverlay(listener: () => void): () => void {
  overlayListeners.add(listener)
  return () => overlayListeners.delete(listener)
}
export function getUjatRecruitVolunteerOverlayVersion(): number {
  return overlayVersion
}
export function getUjatRecruitVolunteerOverlayRecord(): Record<string, unknown> {
  return overlayState
}
export function patchUjatRecruitVolunteerOverlay(partial: Record<string, unknown>): void {
  overlayState = { ...overlayState, ...partial }
  emitOverlay()
}
export function replaceUjatRecruitVolunteerOverlay(next: Record<string, unknown>): void {
  overlayState = { ...next }
  emitOverlay()
}
export function updateUjatRecruitVolunteerOverlayKey<T>(
  key: string,
  updater: (prev: T | undefined) => T
): void {
  const prev = overlayState[key] as T | undefined
  overlayState = { ...overlayState, [key]: updater(prev) }
  emitOverlay()
}
export function resetUjatRecruitVolunteerOverlay(): void {
  overlayState = {}
  emitOverlay()
}
export function useUjatRecruitVolunteerOverlayKv<T>(key: string, defaultValue: T): [T, (next: T) => void] {
  const version = useSyncExternalStore(
    subscribeUjatRecruitVolunteerOverlay,
    getUjatRecruitVolunteerOverlayVersion,
    getUjatRecruitVolunteerOverlayVersion
  )
  void version
  const record = getUjatRecruitVolunteerOverlayRecord()
  const value = (record[key] as T | undefined) ?? defaultValue
  const setValue = useCallback(
    (next: T) => {
      patchUjatRecruitVolunteerOverlay({ [key]: next })
    },
    [key]
  )
  return [value, setValue]
}