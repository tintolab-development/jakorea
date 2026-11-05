/**
 * 일반 프로그램 등록·상세 정본 규칙.
 * overlay store 는 입력 정본이 아니다. COMPANY_SCHOOL 구조를 복사하지 않는다.
 * 일반 Independent / 위저드 RHF / nested-ssot serialize 를 유지한다.
 */

export const GENERAL_TYPED_SSOT = {
  create:
    '위저드 RHF → buildGeneralProgramCreateFromWizardRhf → Independent builder → mapGeneralProgramToCreateRequest. overlay 는 unowned sidecar·wire',
  get: 'API → mapAdminProgramDetailToProgram → parseGeneralProgramServiceDetailJson. overlay 는 legacy decode·sidecar',
  commonInfoPatch:
    '상세 RHF → createGeneralProgramCommonInfoIndependentSave → nested-ssot serialize. overlay store 재읽기 없음',
  recruitPatch:
    '상세 RHF formPatch + GET leftover overlay. catalog peek 는 쓰지 않음. 봉사자 면접 그리드만 overlay UI adapter',
  draft: 'typed wizard UI values + operational session drafts (기존 키 계약)',
  apiWire: 'serviceDetailJson.registration.overlay 는 BE 호환 직렬화. FE 메모리 정본 아님',
} as const
