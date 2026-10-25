/**
 * 강사 모집(`recruit.instructor.*`) — RHF 필드 폼.
 *
 * Part3 4단계: 일반 모집 overlay 스토어에서 강사 모집 정보(`recruit.instructor.*`)를 RHF로 옮겼다.
 * Part3 5단계: 상세정보(`recruitInstructor.detailInfo.*`, 미디어 포함)는 공용 상세정보 RHF 폼(`recruit-detail-info-form-rhf`)이 소유한다.
 * - 일반 위저드: RHF `recruitmentKv`가 정본이고, 같은 값을 이 폼에도 둔다(예전 스토어 투영과 같은 위치).
 * - 1사1교: CS RHF는 강사 모집을 모델링하지 않으므로 이 폼이 정본(CREATE leftover·양식 collect가 이 폼을 읽는다).
 * - 상세·양식 편집기: 양식(templateCode)별 이 RHF 폼이 정본.
 * - 일반 모집 스토어(`general-recruit-overlay-sync`)는 이 폼을 합성해서 기존 읽기·collect 결과를 그대로 만든다.
 */
import { isRecruitMediaOverlayKey } from '@/features/program/general/lib/overlay-phase1/registration-wizard-recruitment-rhf'
import { useGeneralRecruitField } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-field-binding'
import { createScopedRhfFieldForm } from '@/features/template/ui/form-set/shared/scoped-rhf-field-form'

export const INSTRUCTOR_RECRUIT_KEY_PREFIX = 'recruit.instructor.'
export function isInstructorRecruitFieldKey(key: string): boolean {
  if (isRecruitMediaOverlayKey(key)) return false
  return key.startsWith(INSTRUCTOR_RECRUIT_KEY_PREFIX)
}

export const instructorRecruitFieldForm = createScopedRhfFieldForm({
  ownsKey: isInstructorRecruitFieldKey,
})

/** 강사 모집 단락 입력 바인딩 */
export function useInstructorRecruitField<T>(key: string, defaultValue: T): [T, (next: T) => void] {
  return useGeneralRecruitField(instructorRecruitFieldForm, key, defaultValue)
}
