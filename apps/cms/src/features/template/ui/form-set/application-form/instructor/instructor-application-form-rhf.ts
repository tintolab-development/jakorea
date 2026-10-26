/**
 * 강사 신청(`application.instructor.*`) — RHF 필드 폼.
 *
 * Part3 4단계: 일반 신청 overlay 스토어에서 이 키 묶음을 RHF로 옮겼다.
 * - 일반 위저드: RHF 신청 kv가 정본이고, 같은 값을 이 폼에도 둔다(예전 스토어 투영과 같은 위치).
 * - 1사1교: CS RHF는 강사 신청을 모델링하지 않으므로 이 폼이 정본.
 * - 일반 신청 스토어(`general-application-overlay-sync`)는 이 폼을 합성해서 기존 읽기·collect 결과를 그대로 만든다.
 *   (공용 가능 일정 단락은 접두어를 받아 봉사자·Gemini 강사와 함께 쓰므로 스토어 훅을 유지한다. 키 소유는 합성으로 이 폼.)
 */
import { useGeneralApplicationField } from '@/features/template/ui/form-set/application-form/shared/general-application-field-binding'
import { createScopedRhfFieldForm } from '@/features/template/ui/form-set/shared/scoped-rhf-field-form'

export const INSTRUCTOR_APPLICATION_KEY_PREFIX = 'application.instructor.'

export function isInstructorApplicationFieldKey(key: string): boolean {
  return key.startsWith(INSTRUCTOR_APPLICATION_KEY_PREFIX)
}

export const instructorApplicationFieldForm = createScopedRhfFieldForm({
  ownsKey: isInstructorApplicationFieldKey,
})

/** 강사 신청 단락 입력 바인딩 */
export function useInstructorApplicationField<T>(key: string, defaultValue: T): [T, (next: T) => void] {
  return useGeneralApplicationField(instructorApplicationFieldForm, key, defaultValue)
}
