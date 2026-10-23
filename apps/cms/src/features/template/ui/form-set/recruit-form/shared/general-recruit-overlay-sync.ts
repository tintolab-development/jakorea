import { useCallback, useRef, useSyncExternalStore } from 'react'
import { readOperationalOverlayKvValue } from '@/features/template/ui/form-set/shared/operational-seed-default-suppression'
import { createScopedOverlayStore } from '@/features/template/ui/form-set/shared/scoped-overlay-store'
import {
  beginWizardRecruitmentRhfProjection,
  endWizardRecruitmentRhfProjection,
  isGeneralRecruitOwnedKey,
  isWizardRecruitmentRhfProjecting,
  mergeWizardRecruitmentIntoOverlayRecord,
  patchWizardRecruitmentKv,
  peekGeneralRegistrationWizardRhf,
  readWizardRecruitmentKvValue,
  subscribeGeneralRegistrationWizardRhf,
} from '@/features/program/general/lib/overlay-phase1/registration-wizard-recruitment-rhf'

/**
 * 모집 폼(개인 모집, 강사 모집, 봉사자 모집) overlay.
 * templateCode 버킷으로 양식 인스턴스를 가른다. persist 키는 그대로다.
 */

const store = createScopedOverlayStore()

export function setGeneralRecruitOverlayScope(templateCode: string | undefined | null): void {
  store.setScope(templateCode)
}

export function getGeneralRecruitOverlayScope(): string {
  return store.getScope()
}

export function subscribeGeneralRecruitOverlay(listener: () => void): () => void {
  return store.subscribe(listener)
}

export function subscribeGeneralRecruitOverlayKey(key: string, listener: () => void): () => void {
  return store.subscribeKey(key, listener)
}

export function getGeneralRecruitOverlayVersion(): number {
  return store.getVersion()
}

/** UI·활성 스코프 전용. persist/create 스냅샷에는 `collectSelectedRecruitOverlaysForProgram` / `collectOperationalOverlayForCatalogId`를 쓴다. */
export function getGeneralRecruitOverlayRecord(): Record<string, unknown> {
  return store.getRecord()
}

export function peekGeneralRecruitOverlayRecord(
  templateCode: string | undefined | null
): Record<string, unknown> {
  return mergeWizardRecruitmentIntoOverlayRecord(store.peekRecord(templateCode), templateCode)
}

export function replaceGeneralRecruitOverlayForScope(
  templateCode: string | undefined | null,
  next: Record<string, unknown>
): void {
  if (!isWizardRecruitmentRhfProjecting()) {
    patchWizardRecruitmentKv(next, { shouldDirty: false })
  }
  beginWizardRecruitmentRhfProjection()
  try {
    store.replaceFor(templateCode, next)
  } finally {
    endWizardRecruitmentRhfProjection()
  }
}

export function resetGeneralRecruitOverlayForScope(
  templateCode: string | undefined | null
): void {
  store.resetFor(templateCode)
}

function readOverlayKeyValue<T>(key: string, defaultValue: T): T {
  return readOperationalOverlayKvValue('general-recruit', store.getRecord(), key, defaultValue)
}

export function patchGeneralRecruitOverlay(partial: Record<string, unknown>): void {
  if (!isWizardRecruitmentRhfProjecting()) {
    patchWizardRecruitmentKv(partial, { shouldDirty: true })
  }
  beginWizardRecruitmentRhfProjection()
  try {
    store.patch(partial)
  } finally {
    endWizardRecruitmentRhfProjection()
  }
}

export function patchGeneralRecruitOverlayForScope(
  templateCode: string | undefined | null,
  partial: Record<string, unknown>
): void {
  if (!isWizardRecruitmentRhfProjecting()) {
    patchWizardRecruitmentKv(partial, { shouldDirty: true })
  }
  const current = store.peekRecord(templateCode)
  beginWizardRecruitmentRhfProjection()
  try {
    store.replaceFor(templateCode, { ...current, ...partial })
  } finally {
    endWizardRecruitmentRhfProjection()
  }
}

export function updateGeneralRecruitOverlayKey<T>(
  key: string,
  updater: (prev: T | undefined) => T
): void {
  const api = peekGeneralRegistrationWizardRhf()
  if (api != null && isGeneralRecruitOwnedKey(key) && !isWizardRecruitmentRhfProjecting()) {
    const prev = readWizardRecruitmentKvValue<T | undefined>(key, undefined)
    const next = updater(prev)
    patchWizardRecruitmentKv({ [key]: next }, { shouldDirty: true })
    beginWizardRecruitmentRhfProjection()
    try {
      store.updateKey(key, () => next)
    } finally {
      endWizardRecruitmentRhfProjection()
    }
    return
  }
  store.updateKey(key, updater)
}

export function replaceGeneralRecruitOverlay(next: Record<string, unknown>): void {
  if (!isWizardRecruitmentRhfProjecting()) {
    patchWizardRecruitmentKv(next, { shouldDirty: false })
  }
  beginWizardRecruitmentRhfProjection()
  try {
    store.replace(next)
  } finally {
    endWizardRecruitmentRhfProjection()
  }
}

export function resetGeneralRecruitOverlay(): void {
  store.reset()
}

/** 모든 templateCode 버킷 — 위저드 종료·신규 시작 */
export function resetAllGeneralRecruitOverlay(): void {
  store.resetAll()
}

export function resetGeneralRecruitOverlayStoreForTests(): void {
  store.resetAll()
}

/**
 * `useSyncExternalStore`용 — 변경된 overlay 키만 구독한다.
 *
 * 상세 정보 단락처럼 인풋과 WYSIWYG가 한 화면에 있을 때, 전역 version 구독이면
 * 키 입력마다 에디터까지 리렌더되어 버벅인다.
 */
export function useGeneralRecruitOverlayKv<T>(
  key: string,
  defaultValue: T
): [T, (next: T) => void] {
  const defaultRef = useRef(defaultValue)
  const rhfOwned = isGeneralRecruitOwnedKey(key)
  const getSnapshot = useCallback(() => {
    if (rhfOwned && peekGeneralRegistrationWizardRhf() != null) {
      return readWizardRecruitmentKvValue(key, defaultRef.current)
    }
    return readOverlayKeyValue(key, defaultRef.current)
  }, [key, rhfOwned])

  const value = useSyncExternalStore(
    listener => {
      const unsubOverlay = subscribeGeneralRecruitOverlayKey(key, listener)
      const unsubRhf = subscribeGeneralRegistrationWizardRhf(listener)
      return () => {
        unsubOverlay()
        unsubRhf()
      }
    },
    getSnapshot,
    getSnapshot
  )

  const setValue = useCallback(
    (next: T) => {
      patchGeneralRecruitOverlay({ [key]: next })
    },
    [key]
  )
  return [value, setValue]
}
