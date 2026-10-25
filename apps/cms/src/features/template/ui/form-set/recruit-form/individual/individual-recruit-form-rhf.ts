/**
 * 일반 개인 참여자 모집 정보(`recruit.individual.*`) — RHF 필드 폼.
 *
 * Part3 2단계: 일반 모집 overlay 스토어에서 이 키 묶음을 떼어 RHF로 옮겼다.
 * - 위저드: RHF `recruitmentKv`(registration-wizard-recruitment-rhf)가 정본이고, 같은 값을 이 폼에도 둔다(예전 스토어 투영과 같은 위치).
 * - 상세·양식 편집기: 양식(templateCode)별 이 RHF 폼이 정본.
 * - 일반 모집 스토어(`general-recruit-overlay-sync`)는 이 폼을 합성해서 기존 읽기·양식 collect 결과를 그대로 만든다.
 */
import { isRecruitMediaOverlayKey } from '@/features/program/general/lib/overlay-phase1/registration-wizard-recruitment-rhf'
import { useGeneralRecruitField } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-field-binding'
import { createScopedRhfFieldForm } from '@/features/template/ui/form-set/shared/scoped-rhf-field-form'

export const INDIVIDUAL_RECRUIT_KEY_PREFIX = 'recruit.individual'

export function isIndividualRecruitFieldKey(key: string): boolean {
  return key.startsWith(INDIVIDUAL_RECRUIT_KEY_PREFIX) && !isRecruitMediaOverlayKey(key)
}

export const individualRecruitFieldForm = createScopedRhfFieldForm({
  ownsKey: isIndividualRecruitFieldKey,
})

/** 개인 모집 단락 입력 바인딩 */
export function useIndividualRecruitField<T>(key: string, defaultValue: T): [T, (next: T) => void] {
  return useGeneralRecruitField(individualRecruitFieldForm, key, defaultValue)
}
