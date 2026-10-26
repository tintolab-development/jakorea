/**
 * 일반 개인·팀 신청 — 팀 정보(`application.individual.teamInfo.*`) RHF 필드 폼.
 *
 * Part3 2단계: 일반 신청 overlay 스토어에서 이 키 묶음을 떼어 RHF로 옮겼다.
 * - 위저드: RHF 신청 kv(registration-wizard-application-rhf)가 정본이고, 같은 값을 이 폼에도 둔다(예전 스토어 투영과 같은 위치).
 * - 상세·양식 편집기: 양식(templateCode)별 이 RHF 폼이 정본.
 * - 일반 신청 스토어(`general-application-overlay-sync`)는 이 폼을 합성해서 기존 읽기·양식 collect 결과를 그대로 만든다.
 */
import { useGeneralApplicationField } from '@/features/template/ui/form-set/application-form/shared/general-application-field-binding'
import { createScopedRhfFieldForm } from '@/features/template/ui/form-set/shared/scoped-rhf-field-form'

export const INDIVIDUAL_TEAM_INFO_KEY_PREFIX = 'application.individual.teamInfo.'

export function isIndividualTeamInfoFieldKey(key: string): boolean {
  return key.startsWith(INDIVIDUAL_TEAM_INFO_KEY_PREFIX)
}

export const individualTeamInfoFieldForm = createScopedRhfFieldForm({
  ownsKey: isIndividualTeamInfoFieldKey,
})

/** 팀 정보 단락 입력 바인딩 */
export function useIndividualTeamInfoField<T>(key: string, defaultValue: T): [T, (next: T) => void] {
  return useGeneralApplicationField(individualTeamInfoFieldForm, key, defaultValue)
}
