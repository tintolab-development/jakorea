import { useCallback, useRef, useSyncExternalStore } from 'react'
import { readOperationalOverlayKvValue } from '@/features/template/ui/form-set/shared/operational-seed-default-suppression'
import { createScopedOverlayStore } from '@/features/template/ui/form-set/shared/scoped-overlay-store'
import { composeOverlayStoreWithFieldForms } from '@/features/template/ui/form-set/shared/scoped-rhf-field-form'
import { individualRecruitFieldForm } from '@/features/template/ui/form-set/recruit-form/individual/individual-recruit-form-rhf'
import { instructorRecruitFieldForm } from '@/features/template/ui/form-set/recruit-form/instructor/instructor-recruit-form-rhf'
import { recruitDetailInfoFieldForm } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-form-rhf'
import { volunteerRecruitFieldForm } from '@/features/template/ui/form-set/recruit-form/volunteer/volunteer-recruit-form-rhf'
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
import {
  patchActiveTrainedTeachersRecruitmentOverlay,
  peekActiveTrainedTeachersRecruitmentOverlayRecord,
  peekTrainedTeachersRegistrationRhf,
  readActiveTrainedTeachersRecruitmentOverlayValue,
  subscribeTrainedTeachersRegistrationRhf,
} from '@/features/program/trained-teachers/lib/registration-rhf-api'
import {
  isTrainedTeachersRecruitmentCatalog,
  isTrainedTeachersRecruitmentOverlayKey,
} from '@/features/program/trained-teachers/lib/registration-rhf-recruitment'
import {
  patchActiveCompanySchoolRecruitmentOverlay,
  peekActiveCompanySchoolRecruitmentOverlayRecord,
  peekCompanySchoolRegistrationRhf,
  readActiveCompanySchoolRecruitmentOverlayValue,
  subscribeCompanySchoolRegistrationRhf,
} from '@/features/program/1c-1s/lib/registration-rhf-api'
import {
  isCompanySchoolRecruitmentCatalog,
  isCompanySchoolRecruitmentOverlayKey,
} from '@/features/program/1c-1s/lib/registration-rhf-recruitment'

/**
 * 모집 폼(개인 모집, 강사 모집, 봉사자 모집) overlay.
 * templateCode 버킷으로 양식 인스턴스를 가른다. persist 키는 그대로다.
 */

/**
 * Part3: 키 묶음 일부는 RHF 필드 폼이 소유한다(합성). 소유 키는 스토어 버킷에 남지 않는다.
 * 나머지 키는 아직 스코프 overlay 스토어.
 */
const store = composeOverlayStoreWithFieldForms(createScopedOverlayStore(), [
  individualRecruitFieldForm,
  instructorRecruitFieldForm,
  recruitDetailInfoFieldForm,
  volunteerRecruitFieldForm,
])

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
  const merged = mergeWizardRecruitmentIntoOverlayRecord(store.peekRecord(templateCode), templateCode)
  const csRecord =
    peekCompanySchoolRegistrationRhf() != null && isCompanySchoolRecruitmentCatalog(templateCode)
      ? peekActiveCompanySchoolRecruitmentOverlayRecord()
      : null
  const ttRecord =
    peekTrainedTeachersRegistrationRhf() != null && isTrainedTeachersRecruitmentCatalog(templateCode)
      ? peekActiveTrainedTeachersRecruitmentOverlayRecord()
      : null
  if (csRecord != null) return { ...merged, ...csRecord }
  return ttRecord != null ? { ...merged, ...ttRecord } : merged
}

/**
 * 일반 위저드 라이브 읽기. 활성 overlay 스코프가 다른 모집 탭이어도
 * RHF recruitmentKv 의 선택 참여자 키를 유지한다.
 */
export function readLiveGeneralRecruitOverlayRecord(): Record<string, unknown> {
  if (peekGeneralRegistrationWizardRhf() != null) {
    return mergeWizardRecruitmentIntoOverlayRecord(store.getRecord(), null)
  }
  return store.getRecord()
}

export function replaceGeneralRecruitOverlayForScope(
  templateCode: string | undefined | null,
  next: Record<string, unknown>
): void {
  if (peekTrainedTeachersRegistrationRhf() != null && isTrainedTeachersRecruitmentCatalog(templateCode)) {
    patchActiveTrainedTeachersRecruitmentOverlay(next)
    return
  }
  if (peekCompanySchoolRegistrationRhf() != null && isCompanySchoolRecruitmentCatalog(templateCode)) {
    patchActiveCompanySchoolRecruitmentOverlay(next)
    return
  }
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

function readOverlayKeyValue<T>(key: string, defaultValue: T): T {
  return readOperationalOverlayKvValue('general-recruit', store.getRecord(), key, defaultValue)
}

export function patchGeneralRecruitOverlay(partial: Record<string, unknown>): void {
  if (peekTrainedTeachersRegistrationRhf() != null) {
    const rest = patchActiveTrainedTeachersRecruitmentOverlay(partial)
    if (Object.keys(rest).length === 0) return
    beginWizardRecruitmentRhfProjection()
    try {
      store.patch(rest)
    } finally {
      endWizardRecruitmentRhfProjection()
    }
    return
  }
  if (peekCompanySchoolRegistrationRhf() != null) {
    const rest = patchActiveCompanySchoolRecruitmentOverlay(partial)
    if (Object.keys(rest).length === 0) return
    beginWizardRecruitmentRhfProjection()
    try {
      store.patch(rest)
    } finally {
      endWizardRecruitmentRhfProjection()
    }
    return
  }
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
  if (peekCompanySchoolRegistrationRhf() != null) {
    const rest = patchActiveCompanySchoolRecruitmentOverlay(next)
    if (Object.keys(rest).length === 0) return
    if (!isWizardRecruitmentRhfProjecting()) {
      patchWizardRecruitmentKv(rest, { shouldDirty: false })
    }
    beginWizardRecruitmentRhfProjection()
    try {
      store.replace(rest)
    } finally {
      endWizardRecruitmentRhfProjection()
    }
    return
  }
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
  defaultValue: T,
  options?: { typedTemplateAuthoring?: boolean }
): [T, (next: T) => void] {
  const defaultRef = useRef(defaultValue)
  const typedTemplateAuthoring = options?.typedTemplateAuthoring === true
  const rhfOwned = isGeneralRecruitOwnedKey(key)
  const getSnapshot = useCallback(() => {
    if (typedTemplateAuthoring) return defaultRef.current
    if (peekTrainedTeachersRegistrationRhf() != null && isTrainedTeachersRecruitmentOverlayKey(key)) {
      return readActiveTrainedTeachersRecruitmentOverlayValue(key, defaultRef.current) as T
    }
    if (peekCompanySchoolRegistrationRhf() != null && isCompanySchoolRecruitmentOverlayKey(key)) {
      return readActiveCompanySchoolRecruitmentOverlayValue(key, defaultRef.current) as T
    }
    if (rhfOwned && peekGeneralRegistrationWizardRhf() != null) {
      return readWizardRecruitmentKvValue(key, defaultRef.current)
    }
    return readOverlayKeyValue(key, defaultRef.current)
  }, [key, rhfOwned, typedTemplateAuthoring])

  const value = useSyncExternalStore(
    listener => {
      const unsubOverlay = typedTemplateAuthoring
        ? () => {}
        : subscribeGeneralRecruitOverlayKey(key, listener)
      if (typedTemplateAuthoring) return unsubOverlay
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
      if (typedTemplateAuthoring) return
      patchGeneralRecruitOverlay({ [key]: next })
    },
    [key, typedTemplateAuthoring]
  )
  return [value, setValue]
}
