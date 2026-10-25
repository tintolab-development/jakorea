/**
 * Phase 1-B에서 독립 구현으로 교체해야 할 overlay 의존성.
 * Phase 1-A 어댑터는 아래 함수를 내부 호출만 한다. 제품 저장 경로는 바꾸지 않았다.
 */
/**
 * part2(2026-10-25) 판정:
 * - `kv-format-pure`: 스토어를 읽지 않는 순수 변환(overlay KV ↔ Program/요청). 저장 정본 형식이
 *   `serviceDetailJson.registration.overlay`(KV) 이므로 형식 의존은 남지만 스토어 의존은 없다.
 *   재구현은 바이트 패리티 위험만 있고 이득이 없어 교체하지 않는다(shadow 테스트로 고정).
 * - `store-live`: 라이브 overlay 스토어를 읽는다 → 실제 제거 대상(사용처는 storeCallSites).
 * - `sidecar`: overlay 키가 아닌 editor 상태(스토어 아님).
 */
export type Phase1BOverlayDependencyStatus = 'kv-format-pure' | 'store-live' | 'sidecar'

export type Phase1BOverlayDependency = {
  id: string
  currentFn: string
  usedBy: string
  reason: string
  status: Phase1BOverlayDependencyStatus
  /** store-live 만: 제품 저장 경로에서 스토어를 읽는 호출 지점 */
  storeCallSites?: readonly string[]
}

export const PHASE1B_OVERLAY_DEPENDENCIES: readonly Phase1BOverlayDependency[] = [
  {
    id: 'apply-registration-overlay',
    currentFn: 'applyGeneralRegistrationOverlayToProgram',
    usedBy: 'buildCommonInfoDraft',
    reason: 'commonInfo draft Program 생성. overlay KV → nested/컬럼',
    status: 'kv-format-pure',
  },
  {
    id: 'resync-registration-overlay',
    currentFn: 'resyncGeneralRegistrationOverlayFromProgram',
    usedBy: 'buildCommonInfoDraft / snapshotToCommonInfoUpdateSave',
    reason: '상세 공통 PATCH persist overlay. nested 승 + KPI null 유지',
    status: 'kv-format-pure',
  },
  {
    id: 'seed-registration-overlay',
    currentFn: 'buildGeneralRegistrationOverlayFromProgram',
    usedBy: 'seedCommonInfoOverlayFromProgram',
    reason: 'GET → overlay 시드. dispatched KPI null, 유형별 빈 맵',
    status: 'kv-format-pure',
  },
  {
    id: 'map-create-request',
    currentFn: 'mapGeneralProgramToCreateRequest',
    usedBy: 'snapshotToCommonInfoCreateSave',
    reason: 'create body + serviceDetailJson',
    status: 'kv-format-pure',
  },
  {
    id: 'map-update-request',
    currentFn: 'mapGeneralProgramToUpdateRequest',
    usedBy: 'snapshotToCommonInfoUpdateSave',
    reason: 'patch 키만 update body + serviceDetailJson',
    status: 'kv-format-pure',
  },
  {
    id: 'wage-unchanged-strip',
    currentFn: 'omitUnchangedWageFieldsFromProgramForServiceDetail',
    usedBy: 'snapshotToCommonInfoUpdateSave',
    reason: '임금 미변경 시 wage overlay/nested strip',
    status: 'kv-format-pure',
  },
  {
    id: 'apply-recruit-overlay',
    currentFn: 'applyGeneralRecruitOverlayToProgram',
    usedBy: 'applyRecruitmentDraftsToProgram',
    reason: 'targetLevels·모집 기간 nested. preferOverlay true 가 create 계약',
    status: 'kv-format-pure',
  },
  {
    id: 'catalog-prefix-pick',
    currentFn: 'operationalOverlayKeyPrefixesForCatalogId + keyMatchesOperationalOverlayPrefixes',
    usedBy: 'buildRecruitmentDrafts / buildApplicationBindingDrafts',
    reason: 'catalog peek 대체. 입력은 plain overlay record',
    status: 'kv-format-pure',
  },
  {
    id: 'read-media-from-overlay',
    currentFn: 'readRecruitDetailMediaFromOverlay',
    usedBy: 'buildMediaSidecar',
    reason: 'fileObjectId canonical, blob 제외',
    status: 'kv-format-pure',
  },
  {
    id: 'live-overlay-store',
    currentFn: 'peek*OverlayRecord / collectOperationalOverlayForCatalogId',
    usedBy: '제품 저장 경로만. Snapshot 타입·builder 입력은 store-free',
    reason: 'Phase 1-B에서 라이브 캡처를 builder 입력으로 옮김',
    status: 'store-live',
    storeCallSites: [
      'prepare-registration-create-form-bindings.ts — 일반 모집/신청 양식 overlay(collectOperationalOverlayForCatalogId: RHF 투영 + 스토어의 미디어·비소유 키)',
      '1c-1s/lib/build-registration-create-from-canonical.ts — collectSelectedRecruitOverlaysForProgram leftover(recruit.instructor.*, recruitInstructor.* — CS RHF 미모델)',
      'general/hooks/use-registration-flow.ts — 신청 overlay fallback(일반 RHF 미마운트 시)',
      'general/lib/detail-operational-save-merge.ts — 상세 운영 양식 저장 병합',
      'UJAT/Gemini/TT 흐름 — 동작 불변 제약으로 유지',
    ],
  },
  {
    id: 'editor-extras-sidecar',
    currentFn: 'GeneralRegistrationEditorExtras / editorState JSON',
    usedBy: 'buildCommonInfoDraft extras 인자',
    reason: '유형·회차·세션 수·참여자 플래그는 overlay 키가 아님',
    status: 'sidecar',
  },
]
