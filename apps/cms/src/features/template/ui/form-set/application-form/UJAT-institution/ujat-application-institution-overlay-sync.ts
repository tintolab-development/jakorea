import { useCallback, useSyncExternalStore } from 'react'

export const UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS = {
  gradeDetailByBlock: 'ujatApplication.gradeDetailByBlock',
  classTimeCheckedByBlock: 'ujatApplication.classTimeCheckedByBlock',
  classTimePeriodsByBlock: 'ujatApplication.classTimePeriodsByBlock',
  preferredScheduleSelectedIds: 'ujatApplication.preferredScheduleSelectedIds',
} as const

export type UjatApplicationGradeDetail = {
  classCountInput: string
  classNoByIndex: Record<number, string>
  studentCountByIndex: Record<number, string>
}

export type UjatApplicationClassTimePeriods = Record<
  string,
  { start: string | null; end: string | null }
>

let overlayState: Record<string, unknown> = {}
let overlayVersion = 0
const overlayListeners = new Set<() => void>()

function emitOverlay() {
  overlayVersion += 1
  overlayListeners.forEach(l => l())
}

export function subscribeUjatApplicationInstitutionOverlay(listener: () => void): () => void {
  overlayListeners.add(listener)
  return () => overlayListeners.delete(listener)
}

export function getUjatApplicationInstitutionOverlayVersion(): number {
  return overlayVersion
}

export function getUjatApplicationInstitutionOverlayRecord(): Record<string, unknown> {
  return overlayState
}

export function patchUjatApplicationInstitutionOverlay(partial: Record<string, unknown>): void {
  overlayState = { ...overlayState, ...partial }
  emitOverlay()
}

export function updateUjatApplicationInstitutionOverlayKey<T>(
  key: string,
  updater: (prev: T | undefined) => T
): void {
  const prev = overlayState[key] as T | undefined
  const next = updater(prev)
  if (Object.is(prev, next)) return
  overlayState = { ...overlayState, [key]: next }
  emitOverlay()
}

export function replaceUjatApplicationInstitutionOverlay(next: Record<string, unknown>): void {
  overlayState = { ...next }
  emitOverlay()
}

export function resetUjatApplicationInstitutionOverlay(): void {
  overlayState = {}
  emitOverlay()
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
  const value = (record[key] as T | undefined) ?? defaultValue
  const setValue = useCallback(
    (next: T) => {
      patchUjatApplicationInstitutionOverlay({ [key]: next })
    },
    [key]
  )
  return [value, setValue]
}
