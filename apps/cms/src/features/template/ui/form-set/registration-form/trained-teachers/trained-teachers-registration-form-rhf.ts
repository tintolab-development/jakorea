/**
 * 교육받은 교사 등록 공통정보 키(`trainedTeachersRegistration.*`) — 단락 바인딩.
 *
 * Part3 3단계:
 * - TT 등록 RHF가 마운트돼 있으면 그 RHF가 정본(기존과 같음, sidecar 포함).
 * - 마운트돼 있지 않을 때(양식 편집기, 마운트 전 seed) 예전 등록 overlay 스토어 버킷 대신 이 RHF 필드 폼이 값을 든다.
 * - 등록 overlay 스토어(`program-registration-overlay-sync`)는 이 폼을 합성해 기존 getRecord/collect 결과를 그대로 만든다.
 * TT 키는 1사1교 공통정보 키·일반 위저드 경로 맵과 겹치지 않아(접두어 다름) 그 분기는 타지 않는다.
 */
import { useCallback, useRef, useSyncExternalStore } from 'react'
import {
  peekTrainedTeachersRegistrationRhf,
  subscribeTrainedTeachersRegistrationRhf,
} from '@/features/program/trained-teachers/lib/registration-rhf-api'
import { writeTrainedTeachersRhfOverlayPartial } from '@/features/program/trained-teachers/lib/registration-rhf-overlay-write'
import {
  isTrainedTeachersCommonInfoOverlayKey,
  projectTrainedTeachersRhfToOverlayRecord,
  readTrainedTeachersRhfOverlayValue,
} from '@/features/program/trained-teachers/lib/registration-rhf-values'
import { readOperationalOverlayKvValue } from '@/features/template/ui/form-set/shared/operational-seed-default-suppression'
import { createScopedRhfFieldForm } from '@/features/template/ui/form-set/shared/scoped-rhf-field-form'

export const TRAINED_TEACHERS_REGISTRATION_KEY_PREFIX = 'trainedTeachersRegistration.'

export function isTrainedTeachersRegistrationFieldKey(key: string): boolean {
  return key.startsWith(TRAINED_TEACHERS_REGISTRATION_KEY_PREFIX)
}

export const trainedTeachersRegistrationFieldForm = createScopedRhfFieldForm({
  ownsKey: isTrainedTeachersRegistrationFieldKey,
})

function isBlankValue(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim() === ''
  return false
}

/**
 * 키 하나의 현재 값 — 예전 `getProgramRegistrationOverlayRecord()[key]` 와 같다
 * (TT RHF 투영 우선, 단 투영이 빈 값이고 보관 값이 있으면 보관 값).
 */
export function readTrainedTeachersRegistrationRecordValue(key: string): unknown {
  const stored = trainedTeachersRegistrationFieldForm.getRecord()[key]
  const api = peekTrainedTeachersRegistrationRhf()
  if (api == null) return stored
  const projected = projectTrainedTeachersRhfToOverlayRecord(api.getValues())
  if (!Object.prototype.hasOwnProperty.call(projected, key)) return stored
  const value = projected[key]
  if (isBlankValue(value) && !isBlankValue(stored)) return stored
  return value
}

export function updateTrainedTeachersRegistrationField<T>(
  key: string,
  updater: (prev: T | undefined) => T
): void {
  const api = peekTrainedTeachersRegistrationRhf()
  if (api != null && isTrainedTeachersCommonInfoOverlayKey(key)) {
    const prev = readTrainedTeachersRhfOverlayValue(api.getValues(), key) as T | undefined
    writeTrainedTeachersRhfOverlayPartial({ [key]: updater(prev) })
    return
  }
  trainedTeachersRegistrationFieldForm.updateKey(key, updater)
}

export function useTrainedTeachersRegistrationField<T>(
  key: string,
  defaultValue: T
): [T, (next: T) => void] {
  const defaultRef = useRef(defaultValue)
  const getSnapshot = useCallback(() => {
    const api = peekTrainedTeachersRegistrationRhf()
    if (api != null && isTrainedTeachersCommonInfoOverlayKey(key)) {
      const raw = readTrainedTeachersRhfOverlayValue(api.getValues(), key)
      return raw === undefined ? defaultRef.current : (raw as T)
    }
    return readOperationalOverlayKvValue(
      'program-registration',
      trainedTeachersRegistrationFieldForm.getRecord(),
      key,
      defaultRef.current
    )
  }, [key])

  const value = useSyncExternalStore(
    listener => {
      const unsubs = [
        trainedTeachersRegistrationFieldForm.subscribeKey(key, listener),
        subscribeTrainedTeachersRegistrationRhf(listener),
      ]
      return () => unsubs.forEach(unsub => unsub())
    },
    getSnapshot,
    getSnapshot
  )

  const setValue = useCallback(
    (next: T) => {
      const api = peekTrainedTeachersRegistrationRhf()
      if (api != null && isTrainedTeachersCommonInfoOverlayKey(key)) {
        const prev = readTrainedTeachersRhfOverlayValue(api.getValues(), key)
        if (Object.is(prev, next)) return
        writeTrainedTeachersRhfOverlayPartial({ [key]: next })
        return
      }
      const prev = readTrainedTeachersRegistrationRecordValue(key)
      if (Object.is(prev, next)) return
      trainedTeachersRegistrationFieldForm.patch({ [key]: next })
    },
    [key]
  )
  return [value, setValue]
}
