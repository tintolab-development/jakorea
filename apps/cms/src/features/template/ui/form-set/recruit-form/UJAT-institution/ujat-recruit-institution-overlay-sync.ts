import { useCallback, useSyncExternalStore } from 'react'
/**
 * UJAT 학교 모집 폼 템플릿 편집기·미리보기가 각각 마운트될 때 로컬 state가 갈라지지 않도록 공유한다.
 */
let overlayState: Record<string, unknown> = {}
let overlayVersion = 0
const overlayListeners = new Set<() => void>()
function emitOverlay() {
  overlayVersion += 1
  overlayListeners.forEach(l => l())
}
export function subscribeUjatRecruitInstitutionOverlay(listener: () => void): () => void {
  overlayListeners.add(listener)
  return () => overlayListeners.delete(listener)
}
export function getUjatRecruitInstitutionOverlayVersion(): number {
  return overlayVersion
}
export function getUjatRecruitInstitutionOverlayRecord(): Record<string, unknown> {
  return overlayState
}
export function patchUjatRecruitInstitutionOverlay(partial: Record<string, unknown>): void {
  overlayState = { ...overlayState, ...partial }
  emitOverlay()
}
export function replaceUjatRecruitInstitutionOverlay(next: Record<string, unknown>): void {
  overlayState = { ...next }
  emitOverlay()
}
export function updateUjatRecruitInstitutionOverlayKey<T>(
  key: string,
  updater: (prev: T | undefined) => T
): void {
  const prev = overlayState[key] as T | undefined
  overlayState = { ...overlayState, [key]: updater(prev) }
  emitOverlay()
}
export function resetUjatRecruitInstitutionOverlay(): void {
  overlayState = {}
  emitOverlay()
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
  const value = (record[key] as T | undefined) ?? defaultValue
  const setValue = useCallback(
    (next: T) => {
      patchUjatRecruitInstitutionOverlay({ [key]: next })
    },
    [key]
  )
  return [value, setValue]
}