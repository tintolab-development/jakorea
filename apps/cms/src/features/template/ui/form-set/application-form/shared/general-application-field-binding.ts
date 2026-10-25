/**
 * 일반 신청 단락 → RHF 필드 폼 바인딩(공용).
 *
 * 예전 `useGeneralApplicationOverlayKv`·`patchGeneralApplicationOverlay`·`updateGeneralApplicationOverlayKey`
 * 의 라우팅을 그대로 따른다(TT RHF → 1사1교 RHF → 일반 위저드 RHF 순, 투영 플래그 동일).
 * 다만 마지막 저장 위치가 overlay 스토어가 아니라 키 묶음을 소유한 RHF 필드 폼이다.
 */
import { useCallback, useRef, useSyncExternalStore } from 'react'
import {
  beginWizardApplicationRhfProjection,
  endWizardApplicationRhfProjection,
  isWizardApplicationOwnedOverlayKey,
  isWizardApplicationRhfProjecting,
  patchWizardApplicationKv,
  peekGeneralRegistrationWizardRhf,
  readWizardApplicationKvValue,
  subscribeGeneralRegistrationWizardRhf,
} from '@/features/program/general/lib/overlay-phase1/registration-wizard-application-rhf'
import {
  patchActiveTrainedTeachersApplicationOverlay,
  peekTrainedTeachersRegistrationRhf,
  readActiveTrainedTeachersApplicationOverlayValue,
  subscribeTrainedTeachersRegistrationRhf,
} from '@/features/program/trained-teachers/lib/registration-rhf-api'
import { isTrainedTeachersApplicationOverlayKey } from '@/features/program/trained-teachers/lib/registration-rhf-application'
import {
  patchActiveCompanySchoolApplicationOverlay,
  peekCompanySchoolRegistrationRhf,
  readActiveCompanySchoolApplicationOverlayValue,
  subscribeCompanySchoolRegistrationRhf,
} from '@/features/program/1c-1s/lib/registration-rhf-api'
import { isCompanySchoolApplicationOverlayKey } from '@/features/program/1c-1s/lib/registration-rhf-application'
import { readOperationalOverlayKvValue } from '@/features/template/ui/form-set/shared/operational-seed-default-suppression'
import type { ScopedRhfFieldForm } from '@/features/template/ui/form-set/shared/scoped-rhf-field-form'

function patchFieldForm(form: ScopedRhfFieldForm, partial: Record<string, unknown>): void {
  beginWizardApplicationRhfProjection()
  try {
    form.patch(partial)
  } finally {
    endWizardApplicationRhfProjection()
  }
}

export function writeGeneralApplicationFields(
  form: ScopedRhfFieldForm,
  partial: Record<string, unknown>
): void {
  if (peekTrainedTeachersRegistrationRhf() != null) {
    const rest = patchActiveTrainedTeachersApplicationOverlay(partial)
    if (Object.keys(rest).length === 0) return
    patchFieldForm(form, rest)
    return
  }
  if (peekCompanySchoolRegistrationRhf() != null) {
    const rest = patchActiveCompanySchoolApplicationOverlay(partial)
    if (Object.keys(rest).length === 0) return
    patchFieldForm(form, rest)
    return
  }
  if (!isWizardApplicationRhfProjecting()) {
    patchWizardApplicationKv(partial, { shouldDirty: true })
  }
  patchFieldForm(form, partial)
}

export function updateGeneralApplicationField<T>(
  form: ScopedRhfFieldForm,
  key: string,
  updater: (prev: T | undefined) => T
): void {
  if (peekTrainedTeachersRegistrationRhf() != null && isTrainedTeachersApplicationOverlayKey(key)) {
    const prev = readActiveTrainedTeachersApplicationOverlayValue(key, undefined) as T | undefined
    patchActiveTrainedTeachersApplicationOverlay({ [key]: updater(prev) })
    return
  }
  if (peekCompanySchoolRegistrationRhf() != null && isCompanySchoolApplicationOverlayKey(key)) {
    const prev = readActiveCompanySchoolApplicationOverlayValue(key, undefined) as T | undefined
    patchActiveCompanySchoolApplicationOverlay({ [key]: updater(prev) })
    return
  }
  const api = peekGeneralRegistrationWizardRhf()
  if (api != null && isWizardApplicationOwnedOverlayKey(key) && !isWizardApplicationRhfProjecting()) {
    const prev = readWizardApplicationKvValue<T | undefined>(key, undefined)
    const next = updater(prev)
    patchWizardApplicationKv({ [key]: next }, { shouldDirty: true })
    beginWizardApplicationRhfProjection()
    try {
      form.updateKey(key, () => next)
    } finally {
      endWizardApplicationRhfProjection()
    }
    return
  }
  form.updateKey(key, updater)
}

export function useGeneralApplicationField<T>(
  form: ScopedRhfFieldForm,
  key: string,
  defaultValue: T
): [T, (next: T) => void] {
  const defaultRef = useRef(defaultValue)
  const wizardOwned = isWizardApplicationOwnedOverlayKey(key)
  const getSnapshot = useCallback(() => {
    if (peekTrainedTeachersRegistrationRhf() != null && isTrainedTeachersApplicationOverlayKey(key)) {
      return readActiveTrainedTeachersApplicationOverlayValue(key, defaultRef.current) as T
    }
    if (peekCompanySchoolRegistrationRhf() != null && isCompanySchoolApplicationOverlayKey(key)) {
      return readActiveCompanySchoolApplicationOverlayValue(key, defaultRef.current) as T
    }
    if (wizardOwned && peekGeneralRegistrationWizardRhf() != null) {
      return readWizardApplicationKvValue(key, defaultRef.current)
    }
    return readOperationalOverlayKvValue(
      'general-application',
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
      writeGeneralApplicationFields(form, { [key]: next })
    },
    [form, key]
  )
  return [value, setValue]
}
