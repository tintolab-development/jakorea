/**
 * 일반 모집 단락 → RHF 필드 폼 바인딩(공용).
 *
 * 예전 `useGeneralRecruitOverlayKv`·`patchGeneralRecruitOverlay`의 라우팅을 그대로 따른다
 * (TT RHF → 1사1교 RHF → 일반 위저드 RHF 순, 투영 플래그 동일).
 * 다만 마지막 저장 위치가 overlay 스토어가 아니라 키 묶음을 소유한 RHF 필드 폼이다.
 */
import { useCallback, useRef, useSyncExternalStore } from 'react'
import {
  beginWizardRecruitmentRhfProjection,
  endWizardRecruitmentRhfProjection,
  isGeneralRecruitOwnedKey,
  isWizardRecruitmentRhfProjecting,
  patchWizardRecruitmentKv,
  peekGeneralRegistrationWizardRhf,
  mergeWizardRecruitmentIntoOverlayRecord,
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
  peekActiveCompanySchoolInstitutionRecruitmentOverlayRecord,
  peekActiveCompanySchoolInstructorRecruitmentOverlayRecord,
  peekCompanySchoolRegistrationRhf,
  readActiveCompanySchoolRecruitmentOverlayValue,
  subscribeCompanySchoolRegistrationRhf,
} from '@/features/program/1c-1s/lib/registration-rhf-api'
import {
  isCompanySchoolOwnedRecruitmentCatalog,
  isCompanySchoolRecruitmentOverlayKey,
  pickCompanySchoolRecruitmentOverlayForCatalog,
} from '@/features/program/1c-1s/lib/registration-rhf-recruitment'
import { readOperationalOverlayKvValue } from '@/features/template/ui/form-set/shared/operational-seed-default-suppression'
import type { ScopedRhfFieldForm } from '@/features/template/ui/form-set/shared/scoped-rhf-field-form'
import { filterUjatTypedRecruitmentOverlayPatch } from '@/features/program/ujat/lib/ujat-typed-recruitment-overlay-write-block'

function patchFieldForm(form: ScopedRhfFieldForm, partial: Record<string, unknown>): void {
  beginWizardRecruitmentRhfProjection()
  try {
    form.patch(partial)
  } finally {
    endWizardRecruitmentRhfProjection()
  }
}

export function writeGeneralRecruitFields(
  form: ScopedRhfFieldForm,
  partial: Record<string, unknown>
): void {
  const allowed = filterUjatTypedRecruitmentOverlayPatch(partial)
  if (allowed == null) return
  partial = allowed
  if (peekTrainedTeachersRegistrationRhf() != null) {
    const rest = patchActiveTrainedTeachersRecruitmentOverlay(partial)
    if (Object.keys(rest).length === 0) return
    patchFieldForm(form, rest)
    return
  }
  if (peekCompanySchoolRegistrationRhf() != null) {
    const rest = patchActiveCompanySchoolRecruitmentOverlay(partial)
    if (Object.keys(rest).length === 0) return
    patchFieldForm(form, rest)
    return
  }
  if (!isWizardRecruitmentRhfProjecting()) {
    patchWizardRecruitmentKv(partial, { shouldDirty: true })
  }
  patchFieldForm(form, partial)
}

/** 예전 `peekGeneralRecruitOverlayRecord` 와 같은 병합(위저드 recruitmentKv → 1사1교/TT 활성 모집). 기준 레코드만 필드 폼이다. */
export function peekGeneralRecruitFieldRecord(
  form: ScopedRhfFieldForm,
  templateCode: string | undefined | null
): Record<string, unknown> {
  const merged = mergeWizardRecruitmentIntoOverlayRecord(form.peekRecord(templateCode), templateCode)
  const csRecord =
    peekCompanySchoolRegistrationRhf() != null && isCompanySchoolOwnedRecruitmentCatalog(templateCode)
      ? templateCode === 'recruitment-instructor'
        ? peekActiveCompanySchoolInstructorRecruitmentOverlayRecord()
        : peekActiveCompanySchoolInstitutionRecruitmentOverlayRecord()
      : null
  const ttRecord =
    peekTrainedTeachersRegistrationRhf() != null && isTrainedTeachersRecruitmentCatalog(templateCode)
      ? peekActiveTrainedTeachersRecruitmentOverlayRecord()
      : null
  if (csRecord != null) return { ...merged, ...csRecord }
  return ttRecord != null ? { ...merged, ...ttRecord } : merged
}

/** 예전 `updateGeneralRecruitOverlayKey` 와 같은 라우팅 */
export function updateGeneralRecruitField<T>(
  form: ScopedRhfFieldForm,
  key: string,
  updater: (prev: T | undefined) => T
): void {
  if (peekTrainedTeachersRegistrationRhf() != null && isTrainedTeachersRecruitmentOverlayKey(key)) {
    const prev = readActiveTrainedTeachersRecruitmentOverlayValue(key, undefined) as T | undefined
    const next = updater(prev)
    const rest = patchActiveTrainedTeachersRecruitmentOverlay({ [key]: next })
    if (Object.keys(rest).length === 0) return
    form.updateKey(key, () => rest[key] as T)
    return
  }
  if (peekCompanySchoolRegistrationRhf() != null && isCompanySchoolRecruitmentOverlayKey(key)) {
    const prev = readActiveCompanySchoolRecruitmentOverlayValue(key, undefined) as T | undefined
    const next = updater(prev)
    const rest = patchActiveCompanySchoolRecruitmentOverlay({ [key]: next })
    if (Object.keys(rest).length === 0) return
    form.updateKey(key, () => rest[key] as T)
    return
  }
  const api = peekGeneralRegistrationWizardRhf()
  if (api != null && isGeneralRecruitOwnedKey(key) && !isWizardRecruitmentRhfProjecting()) {
    const prev = readWizardRecruitmentKvValue<T | undefined>(key, undefined)
    const next = updater(prev)
    patchWizardRecruitmentKv({ [key]: next }, { shouldDirty: true })
    beginWizardRecruitmentRhfProjection()
    try {
      form.updateKey(key, () => next)
    } finally {
      endWizardRecruitmentRhfProjection()
    }
    return
  }
  form.updateKey(key, updater)
}

/**
 * 예전 `replaceGeneralRecruitOverlayForScope` 와 같은 라우팅. 교체 대상은 이 필드 폼이 소유한 키뿐이다
 * (호출부는 소유 키 묶음만 넘긴다).
 */
export function replaceGeneralRecruitFieldsForScope(
  form: ScopedRhfFieldForm,
  templateCode: string | undefined | null,
  next: Record<string, unknown>
): void {
  if (peekTrainedTeachersRegistrationRhf() != null && isTrainedTeachersRecruitmentCatalog(templateCode)) {
    patchActiveTrainedTeachersRecruitmentOverlay(next)
    return
  }
  if (peekCompanySchoolRegistrationRhf() != null && isCompanySchoolOwnedRecruitmentCatalog(templateCode)) {
    patchActiveCompanySchoolRecruitmentOverlay(
      pickCompanySchoolRecruitmentOverlayForCatalog(templateCode, next)
    )
    return
  }
  if (!isWizardRecruitmentRhfProjecting()) {
    patchWizardRecruitmentKv(next, { shouldDirty: false })
  }
  beginWizardRecruitmentRhfProjection()
  try {
    form.replaceFor(templateCode, next)
  } finally {
    endWizardRecruitmentRhfProjection()
  }
}

/** 예전 `replaceGeneralRecruitOverlay`(활성 양식) 와 같은 라우팅 */
export function replaceGeneralRecruitFields(
  form: ScopedRhfFieldForm,
  next: Record<string, unknown>
): void {
  if (peekTrainedTeachersRegistrationRhf() != null) {
    const rest = patchActiveTrainedTeachersRecruitmentOverlay(next)
    if (Object.keys(rest).length === 0) return
    if (!isWizardRecruitmentRhfProjecting()) {
      patchWizardRecruitmentKv(rest, { shouldDirty: false })
    }
    beginWizardRecruitmentRhfProjection()
    try {
      form.replace(rest)
    } finally {
      endWizardRecruitmentRhfProjection()
    }
    return
  }
  if (peekCompanySchoolRegistrationRhf() != null) {
    const rest = patchActiveCompanySchoolRecruitmentOverlay(next)
    if (Object.keys(rest).length === 0) return
    if (!isWizardRecruitmentRhfProjecting()) {
      patchWizardRecruitmentKv(rest, { shouldDirty: false })
    }
    beginWizardRecruitmentRhfProjection()
    try {
      form.replace(rest)
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
    form.replace(next)
  } finally {
    endWizardRecruitmentRhfProjection()
  }
}

export function useGeneralRecruitField<T>(
  form: ScopedRhfFieldForm,
  key: string,
  defaultValue: T
): [T, (next: T) => void] {
  const defaultRef = useRef(defaultValue)
  const wizardOwned = isGeneralRecruitOwnedKey(key)
  const getSnapshot = useCallback(() => {
    if (peekTrainedTeachersRegistrationRhf() != null && isTrainedTeachersRecruitmentOverlayKey(key)) {
      return readActiveTrainedTeachersRecruitmentOverlayValue(key, defaultRef.current) as T
    }
    if (peekCompanySchoolRegistrationRhf() != null && isCompanySchoolRecruitmentOverlayKey(key)) {
      return readActiveCompanySchoolRecruitmentOverlayValue(key, defaultRef.current) as T
    }
    if (wizardOwned && peekGeneralRegistrationWizardRhf() != null) {
      return readWizardRecruitmentKvValue(key, defaultRef.current)
    }
    return readOperationalOverlayKvValue(
      'general-recruit',
      form.getRecord(),
      key,
      defaultRef.current
    )
  }, [form, key, wizardOwned])

  const value = useSyncExternalStore(
    listener => {
      const unsubs = [
        form.subscribeKey(key, listener),
        subscribeGeneralRegistrationWizardRhf(listener),
        subscribeTrainedTeachersRegistrationRhf(listener),
        subscribeCompanySchoolRegistrationRhf(listener),
      ]
      return () => unsubs.forEach(unsub => unsub())
    },
    getSnapshot,
    getSnapshot
  )

  const setValue = useCallback(
    (next: T) => {
      writeGeneralRecruitFields(form, { [key]: next })
    },
    [form, key]
  )
  return [value, setValue]
}
