/**
 * 교육받은 교사 신청 양식(`application.trainedTeachers.*`) — RHF 필드 폼.
 *
 * Part3 3단계: TT 등록 RHF가 마운트돼 있으면 그 RHF(application 슬라이스)가 정본이다(기존과 같음).
 * 마운트돼 있지 않을 때(양식 편집기 등) 예전에는 일반 신청 overlay 스토어가 들고 있던 값을 이 RHF 폼이 든다.
 * 일반 신청 스토어는 이 폼을 합성해서 기존 peek·collect 결과를 그대로 만든다.
 */
import {
  updateGeneralApplicationField,
  useGeneralApplicationField,
} from '@/features/template/ui/form-set/application-form/shared/general-application-field-binding'
import { createScopedRhfFieldForm } from '@/features/template/ui/form-set/shared/scoped-rhf-field-form'

export const TRAINED_TEACHERS_APPLICATION_KEY_PREFIX = 'application.trainedTeachers.'

export function isTrainedTeachersApplicationFieldKey(key: string): boolean {
  return key.startsWith(TRAINED_TEACHERS_APPLICATION_KEY_PREFIX)
}

export const trainedTeachersApplicationFieldForm = createScopedRhfFieldForm({
  ownsKey: isTrainedTeachersApplicationFieldKey,
})

export function useTrainedTeachersApplicationField<T>(
  key: string,
  defaultValue: T
): [T, (next: T) => void] {
  return useGeneralApplicationField(trainedTeachersApplicationFieldForm, key, defaultValue)
}

export function updateTrainedTeachersApplicationField<T>(
  key: string,
  updater: (prev: T | undefined) => T
): void {
  updateGeneralApplicationField(trainedTeachersApplicationFieldForm, key, updater)
}

/** 마운트된 RHF가 없을 때 TT 신청 양식 값(양식 collect 와 같은 키 레코드) */
export function peekTrainedTeachersApplicationFieldRecord(
  templateCode: string
): Record<string, unknown> {
  return trainedTeachersApplicationFieldForm.peekRecord(templateCode)
}
