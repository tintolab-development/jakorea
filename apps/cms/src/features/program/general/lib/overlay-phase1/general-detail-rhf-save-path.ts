/**
 * Phase 2 — 일반 프로그램 상세 공통정보 저장 경로 검증 인벤토리.
 * 제품 저장 훅에서 import하지 않는다.
 *
 * 확정 정책: NESTED_SSOT + EXPLICIT_STRUCTURE_RESET + EXPLICIT_DELETE_ONLY
 */

export const GENERAL_DETAIL_RHF_SAVE_POLICY = {
  nestedSsot: true,
  explicitStructureReset: true,
  explicitDeleteOnly: true,
  preserveOnStructureChange: false,
} as const

export const GENERAL_DETAIL_RHF_SAVE_SCOPE = [
  'GENERAL',
  'GENERAL_ORGANIZATION',
  'GENERAL_INDIVIDUAL',
] as const

export const GENERAL_DETAIL_RHF_PRODUCT_CALL_CHAIN = [
  'detail-fullpage-modal.infoTriggerSave',
  'useGeneralProgramCommonInfoSave.triggerSave',
  'form.getValues()',
  'createGeneralProgramCommonInfoIndependentSave / buildIndependentDetailCommonInfoFromRhf',
  'buildIndependentCommonInfoPatch',
  'persistGeneralProgramDraft',
  'updateGeneralProgramMutation / updateGeneralProgram(..., nested-ssot)',
  'mapGeneralProgramToUpdateRequest(draft, patch, baseline, nested-ssot)',
  'mapProgramPatchFieldsToRequest',
  'serializeGeneralProgramServiceDetailJson(overlayMerge: nested-ssot)',
  'updateAdminProgramRemote',
] as const

export const GENERAL_DETAIL_RHF_INTENDED_CALL_CHAIN = [
  'form.getValues() — nested curriculumSessions/scheduleDetails',
  'buildIndependentDetailCommonInfoFromRhf',
  'buildIndependentCommonInfoPatch',
  'mapIndependentCommonInfoPatchToUpdateRequest',
  'mapGeneralProgramToUpdateRequest / mapProgramPatchFieldsToRequest',
  'serializeGeneralProgramServiceDetailJson(overlayMerge: nested-ssot)',
] as const

export const GENERAL_DETAIL_RHF_SAVE_MIN_HOOK_SWAP_FILES = [
  'apps/cms/src/features/program/general/hooks/use-common-info-save.ts',
] as const

export const GENERAL_DETAIL_RHF_SAVE_MAPPER_FILES_IF_OVERLAY_MUST_OMIT = [
  'apps/cms/src/features/program/general/api/adapters/general-program-adapters.ts',
  'apps/cms/src/features/program/general/lib/general-program-service-detail-json.ts',
] as const

export type GeneralDetailRhfSaveWireCheckId =
  | 'independent-patch-omits-unchanged-curriculumSessions'
  | 'final-body-omits-unchanged-curriculumSessions'
  | 'independent-patch-sends-explicit-empty-array'
  | 'final-body-sends-explicit-empty-array'
  | 'final-body-keeps-sparse-sessionNo'
  | 'independent-patch-omits-registrationOverlay'
  | 'final-body-does-not-reattach-stale-overlay'
  | 'final-body-preserves-unchanged-scheduleDetails-by-omit'
  | 'final-body-preserves-unchanged-kpi'
  | 'structure-change-clears-inactive-nested'
  | 'structure-unchanged-does-not-clear-sibling'

export type GeneralDetailRhfSaveWireCheck = {
  id: GeneralDetailRhfSaveWireCheckId
  beExpected: string
  actual: string
  matchesBe: boolean
}

export const GENERAL_DETAIL_RHF_SAVE_WIRE_CHECKS: readonly GeneralDetailRhfSaveWireCheck[] = [
  {
    id: 'independent-patch-omits-unchanged-curriculumSessions',
    beExpected: '미변경 curriculumSessions 키 생략',
    actual: 'buildIndependentCommonInfoPatch 가 키를 지운다',
    matchesBe: true,
  },
  {
    id: 'final-body-omits-unchanged-curriculumSessions',
    beExpected: '최종 serviceDetailJson 에서도 키 생략',
    actual:
      'patch.generalCommonInfo shallow replace 로 JSON 에서 curriculumSessions 키가 빠진다',
    matchesBe: true,
  },
  {
    id: 'independent-patch-sends-explicit-empty-array',
    beExpected: '명시적 삭제 []',
    actual: 'sessionAuthoring.clear 또는 구조 변경 시 비활성 nested []',
    matchesBe: true,
  },
  {
    id: 'final-body-sends-explicit-empty-array',
    beExpected: '최종 JSON 에 []',
    actual: 'serialize 가 patch 의 [] 를 serviceDetailJson 에 넣는다',
    matchesBe: true,
  },
  {
    id: 'final-body-keeps-sparse-sessionNo',
    beExpected: 'sparse sessionNo 유지',
    actual:
      'Independent 상세 wrapper 가 RHF mapper 가 버린 sessionNo 를 existing 에서 복원해 replace JSON 에 넣는다',
    matchesBe: true,
  },
  {
    id: 'independent-patch-omits-registrationOverlay',
    beExpected: 'UPDATE 에 stale overlay 동봉 불필요',
    actual: 'Independent PATCH 기본값에 registrationOverlay 키 없음',
    matchesBe: true,
  },
  {
    id: 'final-body-does-not-reattach-stale-overlay',
    beExpected: '최종 body 에 stale overlay maps 없음',
    actual:
      'Independent 만 overlayMerge nested-ssot. stale unit map 을 empty 후 nested 미러로 덮는다. 기본 serialize 는 legacy-merge',
    matchesBe: true,
  },
  {
    id: 'final-body-preserves-unchanged-scheduleDetails-by-omit',
    beExpected: '미변경 scheduleDetails 키 생략 또는 동일 값 보존',
    actual: 'Independent PATCH 가 미변경이면 키 생략. JSON 에도 키 없음 → BE 유지',
    matchesBe: true,
  },
  {
    id: 'final-body-preserves-unchanged-kpi',
    beExpected: '미변경 KPI 키 생략 → BE 유지',
    actual: 'Independent PATCH 가 GET 과 같은 KPI 를 키 생략한다. JSON 에도 kpi 없음',
    matchesBe: true,
  },
  {
    id: 'structure-change-clears-inactive-nested',
    beExpected: 'CURRICULUM↔SCHEDULE 변경 시 비활성 nested []',
    actual: 'isEducationStructureChanged 이면 Independent draft/PATCH/JSON 에 []',
    matchesBe: true,
  },
  {
    id: 'structure-unchanged-does-not-clear-sibling',
    beExpected: '구조 미변경 저장은 상대 nested 를 지우지 않음',
    actual: 'Independent 가 제품 mapper 의 상시 [] 를 existing 으로 되돌리고 PATCH omit',
    matchesBe: true,
  },
]

export const GENERAL_DETAIL_OPERATIONAL_RISK_PATHS = [
  {
    kind: 'applications',
    evidence: 'applicationService.getAllSync / program list checkProgramRelatedData.hasApplications',
    structureChangeDeletesThem: false,
    blockingApi: null,
  },
  {
    kind: 'schedules',
    evidence: 'Program.schedules[] · program_schedule. Independent는 구조 변경 시에도 schedules[] 를 보존',
    structureChangeDeletesThem: false,
    blockingApi: null,
  },
  {
    kind: 'lecture-reports-attendance-settlement',
    evidence: '별도 CMS 진행·출결·정산 API. curriculumSessions [] 와 자동 연동 계약 없음',
    structureChangeDeletesThem: false,
    blockingApi: null,
  },
] as const

export type GeneralDetailRhfSaveStrId =
  | 'STR-01'
  | 'STR-02'
  | 'STR-03'
  | 'STR-04'
  | 'STR-05'
  | 'STR-06'
  | 'STR-07'
  | 'STR-08'
  | 'STR-09'
  | 'STR-10'
  | 'STR-11'
  | 'STR-12'

export type GeneralDetailRhfSaveStrVerdict = 'PASS' | 'FAIL' | 'BLOCKED'

export const GENERAL_DETAIL_RHF_SAVE_STR_RESULTS: readonly {
  id: GeneralDetailRhfSaveStrId
  verdict: GeneralDetailRhfSaveStrVerdict
  evidence: string
}[] = [
  { id: 'STR-01', verdict: 'PASS', evidence: 'CURRICULUM→SCHEDULE 최종 JSON curriculumSessions []' },
  { id: 'STR-02', verdict: 'PASS', evidence: 'SCHEDULE→CURRICULUM 최종 JSON scheduleDetails []' },
  { id: 'STR-03', verdict: 'PASS', evidence: '구조 미변경 시 상대 nested PATCH omit' },
  { id: 'STR-04', verdict: 'PASS', evidence: '4→2 명시 축소 sessionNo 1·2' },
  { id: 'STR-05', verdict: 'PASS', evidence: 'sparse [1,3] 최종 JSON 유지' },
  { id: 'STR-06', verdict: 'PASS', evidence: '명시 전체 삭제 최종 JSON []' },
  {
    id: 'STR-07',
    verdict: 'PASS',
    evidence:
      'mapIndependentCommonInfoPatchToUpdateRequest → overlayMerge nested-ssot. 명시 삭제·omit 후 stale unit map 재동봉 없음',
  },
  { id: 'STR-08', verdict: 'PASS', evidence: '미변경 KPI PATCH omit. 수정한 KPI만 JSON에 포함' },
  { id: 'STR-09', verdict: 'PASS', evidence: '구조 없이 커리큘럼만 수정 시 scheduleDetails omit' },
  { id: 'STR-10', verdict: 'PASS', evidence: '신규 등록 Independent create shadow' },
  {
    id: 'STR-11',
    verdict: 'PASS',
    evidence: 'overlay-phase1 는 GENERAL* 만. overlay-phase0c 가 타 유형 미변경을 고정',
  },
  {
    id: 'STR-12',
    verdict: 'PASS',
    evidence:
      'BE STRUCTURE_CHANGE_GUARD_READY. FE는 409 PROGRAM_EDUCATION_STRUCTURE_CHANGE_BLOCKED / CONCURRENT / GENERAL_CURRICULUM_SESSION_IN_USE 를 안내하고 입력을 유지한다',
  },
]

export const GENERAL_DETAIL_RHF_SAVE_STATUS = 'GENERAL_DETAIL_RHF_SAVE_HOOK_READY' as const

export const GENERAL_DETAIL_UNCHANGED_FIELDS_STATUS =
  'GENERAL_DETAIL_UNCHANGED_FIELDS_READY' as const

/** Mock 브라우저 입력 → RHF → Independent PATCH. 제품 BE Mutation 이 아니다. */
export const GENERAL_DETAIL_RHF_BROWSER_SAVE_STATUS =
  'GENERAL_DETAIL_RHF_BROWSER_SAVE_FIXED' as const

/** Serializer 준비 완료. 제품 저장 훅 전환 승인은 아니다. */
export const GENERAL_DETAIL_SERIALIZER_STATUS = 'GENERAL_DETAIL_SERIALIZER_READY' as const

export const GENERAL_DETAIL_RHF_SAVE_BLOCKERS = [] as const

/** 일반 프로그램 상세 공통정보 — RHF 정본 필수 검증. Overlay 유령 회차를 필수로 요구하지 않는다. */
export const GENERAL_DETAIL_REQUIRED_VALIDATION_STATUS =
  'GENERAL_DETAIL_REQUIRED_VALIDATION_FIXED' as const

/**
 * 미변경 후원사·담당자 관계는 공통정보 PATCH에서 손실되지 않는다.
 * Overlay 미러는 정본 curriculumSessions 에 없는 일반 회차를 보유하지 않는다.
 */
export const GENERAL_DETAIL_DATA_INTEGRITY_STATUS =
  'GENERAL_DETAIL_DATA_INTEGRITY_FE_READY' as const

export const GENERAL_DETAIL_DATA_INTEGRITY_CONTRACT_STATUS =
  'GENERAL_DETAIL_DATA_INTEGRITY_CONTRACT_READY' as const
