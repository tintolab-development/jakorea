import { useCallback, useRef, useSyncExternalStore } from 'react'
import { readOperationalOverlayKvValue } from '@/features/template/ui/form-set/shared/operational-seed-default-suppression'
import { createScopedOverlayStore } from '@/features/template/ui/form-set/shared/scoped-overlay-store'
import {
  beginWizardApplicationRhfProjection,
  endWizardApplicationRhfProjection,
  isWizardApplicationOwnedOverlayKey,
  isWizardApplicationRhfProjecting,
  mergeWizardApplicationIntoOverlayRecord,
  patchWizardApplicationKv,
  peekGeneralRegistrationWizardRhf,
  readWizardApplicationKvValue,
  subscribeGeneralRegistrationWizardRhf,
} from '@/features/program/general/lib/overlay-phase1/registration-wizard-application-rhf'
import {
  patchActiveTrainedTeachersApplicationOverlay,
  peekActiveTrainedTeachersApplicationOverlayRecord,
  peekTrainedTeachersRegistrationRhf,
  readActiveTrainedTeachersApplicationOverlayValue,
  subscribeTrainedTeachersRegistrationRhf,
} from '@/features/program/trained-teachers/lib/registration-rhf-api'
import {
  isTrainedTeachersApplicationCatalog,
  isTrainedTeachersApplicationOverlayKey,
} from '@/features/program/trained-teachers/lib/registration-rhf-application'
import {
  patchActiveCompanySchoolApplicationOverlay,
  peekActiveCompanySchoolApplicationOverlayRecord,
  peekCompanySchoolRegistrationRhf,
  readActiveCompanySchoolApplicationOverlayValue,
  subscribeCompanySchoolRegistrationRhf,
} from '@/features/program/1c-1s/lib/registration-rhf-api'
import {
  isCompanySchoolApplicationCatalog,
  isCompanySchoolApplicationOverlayKey,
} from '@/features/program/1c-1s/lib/registration-rhf-application'

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

export function subscribeGeneralApplicationOverlayKey(
  key: string,
  listener: () => void
): () => void {
  return store.subscribeKey(key, listener)
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
  const merged = mergeWizardApplicationIntoOverlayRecord(store.peekRecord(templateCode), templateCode)
  const csRecord =
    peekCompanySchoolRegistrationRhf() != null && isCompanySchoolApplicationCatalog(templateCode)
      ? peekActiveCompanySchoolApplicationOverlayRecord()
      : null
  const ttRecord =
    peekTrainedTeachersRegistrationRhf() != null && isTrainedTeachersApplicationCatalog(templateCode)
      ? peekActiveTrainedTeachersApplicationOverlayRecord()
      : null
  if (csRecord != null) return { ...merged, ...csRecord }
  return ttRecord != null ? { ...merged, ...ttRecord } : merged
}

export function replaceGeneralApplicationOverlayForScope(
  templateCode: string | undefined | null,
  next: Record<string, unknown>
): void {
  if (peekTrainedTeachersRegistrationRhf() != null && isTrainedTeachersApplicationCatalog(templateCode)) {
    patchActiveTrainedTeachersApplicationOverlay(next)
    return
  }
  if (peekCompanySchoolRegistrationRhf() != null && isCompanySchoolApplicationCatalog(templateCode)) {
    patchActiveCompanySchoolApplicationOverlay(next)
    return
  }
  if (!isWizardApplicationRhfProjecting()) {
    patchWizardApplicationKv(next, { shouldDirty: false })
  }
  beginWizardApplicationRhfProjection()
  try {
    store.replaceFor(templateCode, next)
  } finally {
    endWizardApplicationRhfProjection()
  }
}

export function resetGeneralApplicationOverlayForScope(
  templateCode: string | undefined | null
): void {
  store.resetFor(templateCode)
}

function readOverlayKeyValue<T>(key: string, defaultValue: T): T {
  return readOperationalOverlayKvValue('general-application', store.getRecord(), key, defaultValue)
}

export function patchGeneralApplicationOverlay(partial: Record<string, unknown>): void {
  if (peekTrainedTeachersRegistrationRhf() != null) {
    const rest = patchActiveTrainedTeachersApplicationOverlay(partial)
    if (Object.keys(rest).length === 0) return
    beginWizardApplicationRhfProjection()
    try {
      store.patch(rest)
    } finally {
      endWizardApplicationRhfProjection()
    }
    return
  }
  if (peekCompanySchoolRegistrationRhf() != null) {
    const rest = patchActiveCompanySchoolApplicationOverlay(partial)
    if (Object.keys(rest).length === 0) return
    beginWizardApplicationRhfProjection()
    try {
      store.patch(rest)
    } finally {
      endWizardApplicationRhfProjection()
    }
    return
  }
  if (!isWizardApplicationRhfProjecting()) {
    patchWizardApplicationKv(partial, { shouldDirty: true })
  }
  beginWizardApplicationRhfProjection()
  try {
    store.patch(partial)
  } finally {
    endWizardApplicationRhfProjection()
  }
}

export function updateGeneralApplicationOverlayKey<T>(
  key: string,
  updater: (prev: T | undefined) => T
): void {
  if (peekTrainedTeachersRegistrationRhf() != null && isTrainedTeachersApplicationOverlayKey(key)) {
    const prev = readActiveTrainedTeachersApplicationOverlayValue(key, undefined) as T | undefined
    const next = updater(prev)
    patchActiveTrainedTeachersApplicationOverlay({ [key]: next })
    return
  }
  if (peekCompanySchoolRegistrationRhf() != null && isCompanySchoolApplicationOverlayKey(key)) {
    const prev = readActiveCompanySchoolApplicationOverlayValue(key, undefined) as T | undefined
    const next = updater(prev)
    patchActiveCompanySchoolApplicationOverlay({ [key]: next })
    return
  }
  const api = peekGeneralRegistrationWizardRhf()
  if (api != null && isWizardApplicationOwnedOverlayKey(key) && !isWizardApplicationRhfProjecting()) {
    const prev = readWizardApplicationKvValue<T | undefined>(key, undefined)
    const next = updater(prev)
    patchWizardApplicationKv({ [key]: next }, { shouldDirty: true })
    beginWizardApplicationRhfProjection()
    try {
      store.updateKey(key, () => next)
    } finally {
      endWizardApplicationRhfProjection()
    }
    return
  }
  store.updateKey(key, updater)
}

export function replaceGeneralApplicationOverlay(next: Record<string, unknown>): void {
  if (peekTrainedTeachersRegistrationRhf() != null) {
    const rest = patchActiveTrainedTeachersApplicationOverlay(next)
    if (Object.keys(rest).length === 0) return
    beginWizardApplicationRhfProjection()
    try {
      store.replace(rest)
    } finally {
      endWizardApplicationRhfProjection()
    }
    return
  }
  if (peekCompanySchoolRegistrationRhf() != null) {
    const rest = patchActiveCompanySchoolApplicationOverlay(next)
    if (Object.keys(rest).length === 0) return
    beginWizardApplicationRhfProjection()
    try {
      store.replace(rest)
    } finally {
      endWizardApplicationRhfProjection()
    }
    return
  }
  if (!isWizardApplicationRhfProjecting()) {
    patchWizardApplicationKv(next, { shouldDirty: false })
  }
  beginWizardApplicationRhfProjection()
  try {
    store.replace(next)
  } finally {
    endWizardApplicationRhfProjection()
  }
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
  const rhfOwned = isWizardApplicationOwnedOverlayKey(key)
  const getSnapshot = useCallback(() => {
    if (peekTrainedTeachersRegistrationRhf() != null && isTrainedTeachersApplicationOverlayKey(key)) {
      return readActiveTrainedTeachersApplicationOverlayValue(key, defaultRef.current) as T
    }
    if (peekCompanySchoolRegistrationRhf() != null && isCompanySchoolApplicationOverlayKey(key)) {
      return readActiveCompanySchoolApplicationOverlayValue(key, defaultRef.current) as T
    }
    if (rhfOwned && peekGeneralRegistrationWizardRhf() != null) {
      return readWizardApplicationKvValue(key, defaultRef.current)
    }
    return readOverlayKeyValue(key, defaultRef.current)
  }, [key, rhfOwned])

  const value = useSyncExternalStore(
    listener => {
      const unsubOverlay = subscribeGeneralApplicationOverlayKey(key, listener)
      const unsubRhf = subscribeGeneralRegistrationWizardRhf(listener)
      const unsubTt = subscribeTrainedTeachersRegistrationRhf(listener)
      const unsubCs = subscribeCompanySchoolRegistrationRhf(listener)
      return () => {
        unsubOverlay()
        unsubRhf()
        unsubTt()
        unsubCs()
      }
    },
    getSnapshot,
    getSnapshot
  )
  const setValue = useCallback(
    (next: T) => {
      patchGeneralApplicationOverlay({ [key]: next })
    },
    [key]
  )
  return [value, setValue]
}
