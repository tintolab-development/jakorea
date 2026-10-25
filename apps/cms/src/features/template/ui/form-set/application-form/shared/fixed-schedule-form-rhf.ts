/**
 * 고정 일정 선택(`application.institution.fixedScheduleSelected`, `application.individual.fixedScheduleSelected`) — RHF 필드 폼.
 *
 * Part3 5단계: 기관·개인 신청 공용 고정 일정 단락의 키를 일반 신청 overlay 스토어에서 RHF로 옮겼다.
 * - 일반 위저드: RHF 신청 kv가 정본이고, 같은 값을 이 폼에도 둔다(예전 스토어 투영과 같은 위치).
 * - 일반 신청 스토어(`general-application-overlay-sync`)는 이 폼을 합성해서 기존 읽기·collect 결과를 그대로 만든다.
 */
import {
  updateGeneralApplicationField,
  useGeneralApplicationField,
} from '@/features/template/ui/form-set/application-form/shared/general-application-field-binding'
import { createScopedRhfFieldForm } from '@/features/template/ui/form-set/shared/scoped-rhf-field-form'

export const FIXED_SCHEDULE_SELECTED_KEYS = [
  'application.institution.fixedScheduleSelected',
  'application.individual.fixedScheduleSelected',
] as const

export function isFixedScheduleFieldKey(key: string): boolean {
  return (FIXED_SCHEDULE_SELECTED_KEYS as readonly string[]).includes(key)
}

export const fixedScheduleFieldForm = createScopedRhfFieldForm({
  ownsKey: isFixedScheduleFieldKey,
})

/** 고정 일정 단락 입력 바인딩 */
export function useFixedScheduleField<T>(key: string, defaultValue: T): [T, (next: T) => void] {
  return useGeneralApplicationField(fixedScheduleFieldForm, key, defaultValue)
}

export function updateFixedScheduleField<T>(key: string, updater: (prev: T | undefined) => T): void {
  updateGeneralApplicationField(fixedScheduleFieldForm, key, updater)
}
