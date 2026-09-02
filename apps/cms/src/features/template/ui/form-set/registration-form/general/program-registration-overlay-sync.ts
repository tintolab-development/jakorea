import { useCallback, useSyncExternalStore } from 'react'

/**
 * 일반·1사1교·교육받은 교사 프로그램 등록 폼 단락 본문이 `WritingFormDraft`가 아닌
 * 로컬 state로만 관리될 때, 스텝 전환(언마운트)과 풀페이지·미리보기 이중 마운트에서
 * 입력값이 갈라지지 않도록 동일 키를 공유한다.
 */

/** 일반 등록 기본정보 — controlled editor state와 동기화하는 overlay 키 */
export const GENERAL_REGISTRATION_OVERLAY_SPONSOR_ID_KEY =
  'generalRegistration.basicInfo.localSponsorId' as const
export const GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY =
  'generalRegistration.basicInfo.localManagerContactId' as const
export const GENERAL_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY =
  'generalRegistration.basicInfo.localProgramTitleKo' as const
export const GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY =
  'generalRegistration.educationScheduleSettings.scheduleLines' as const
export const GENERAL_REGISTRATION_OVERLAY_GROUP_TIMES_KEY =
  'generalRegistration.educationScheduleCurriculum.groupTimesByDetail' as const

let overlayState: Record<string, unknown> = {}
let overlayVersion = 0
const overlayListeners = new Set<() => void>()
const overlayKeyListeners = new Map<string, Set<() => void>>()

function readOverlayString(key: string): string {
  const raw = overlayState[key]
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw)
  return ''
}

/** overlay에 남은 후원사 id (controlled state가 비었을 때 완료·복원 fallback) */
export function readGeneralRegistrationOverlaySponsorId(): string {
  return readOverlayString(GENERAL_REGISTRATION_OVERLAY_SPONSOR_ID_KEY)
}

export function readGeneralRegistrationOverlaySponsorContactId(): string {
  return readOverlayString(GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY)
}

export function readGeneralRegistrationOverlayProgramTitleKo(): string {
  return readOverlayString(GENERAL_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY)
}

export function readGeneralRegistrationOverlayScheduleLines(): string[] {
  const raw = overlayState[GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY]
  if (!Array.isArray(raw)) return []
  return raw
    .filter((line): line is string => typeof line === 'string')
    .map(line => line.trim())
    .filter(Boolean)
}

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

export function subscribeProgramRegistrationOverlay(listener: () => void): () => void {
  overlayListeners.add(listener)
  return () => overlayListeners.delete(listener)
}

export function subscribeProgramRegistrationOverlayKey(
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

export function getProgramRegistrationOverlayVersion(): number {
  return overlayVersion
}

export function getProgramRegistrationOverlayRecord(): Record<string, unknown> {
  return overlayState
}

function readOverlayKeyValue<T>(key: string, defaultValue: T): T {
  const raw = overlayState[key] as T | undefined
  return raw === undefined ? defaultValue : raw
}

export function patchProgramRegistrationOverlay(partial: Record<string, unknown>): void {
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

export function updateProgramRegistrationOverlayKey<T>(
  key: string,
  updater: (prev: T | undefined) => T
): void {
  const prev = overlayState[key] as T | undefined
  const next = updater(prev)
  if (Object.is(prev, next)) return
  overlayState = { ...overlayState, [key]: next }
  notifyOverlayListeners([key])
}

export function replaceProgramRegistrationOverlay(next: Record<string, unknown>): void {
  overlayState = { ...next }
  notifyOverlayListeners()
}

export function resetProgramRegistrationOverlay(): void {
  overlayState = {}
  notifyOverlayListeners()
}

/** `useSyncExternalStore`용 — 변경된 overlay 키만 구독한다. */
export function useProgramRegistrationOverlayKv<T>(
  key: string,
  defaultValue: T
): [T, (next: T) => void] {
  const getSnapshot = useCallback(
    () => readOverlayKeyValue(key, defaultValue),
    [defaultValue, key]
  )

  const value = useSyncExternalStore(
    listener => subscribeProgramRegistrationOverlayKey(key, listener),
    getSnapshot,
    getSnapshot
  )

  const setValue = useCallback(
    (next: T) => {
      const prev = getProgramRegistrationOverlayRecord()[key]
      if (Object.is(prev, next)) return
      patchProgramRegistrationOverlay({ [key]: next })
    },
    [key]
  )
  return [value, setValue]
}
