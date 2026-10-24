/**
 * Phase 1-B에서 독립 구현으로 교체해야 할 overlay 의존성.
 * Phase 1-A 어댑터는 아래 함수를 내부 호출만 한다. 제품 저장 경로는 바꾸지 않았다.
 */
export type Phase1BOverlayDependency = {
  id: string
  currentFn: string
  usedBy: string
  reason: string
}

export const PHASE1B_OVERLAY_DEPENDENCIES: readonly Phase1BOverlayDependency[] = [
  {
    id: 'apply-registration-overlay',
    currentFn: 'applyGeneralRegistrationOverlayToProgram',
    usedBy: 'buildCommonInfoDraft',
    reason: 'commonInfo draft Program 생성. overlay KV → nested/컬럼',
  },
  {
    id: 'resync-registration-overlay',
    currentFn: 'resyncGeneralRegistrationOverlayFromProgram',
    usedBy: 'buildCommonInfoDraft / snapshotToCommonInfoUpdateSave',
    reason: '상세 공통 PATCH persist overlay. nested 승 + KPI null 유지',
  },
  {
    id: 'seed-registration-overlay',
    currentFn: 'buildGeneralRegistrationOverlayFromProgram',
    usedBy: 'seedCommonInfoOverlayFromProgram',
    reason: 'GET → overlay 시드. dispatched KPI null, 유형별 빈 맵',
  },
  {
    id: 'map-create-request',
    currentFn: 'mapGeneralProgramToCreateRequest',
    usedBy: 'snapshotToCommonInfoCreateSave',
    reason: 'create body + serviceDetailJson',
  },
  {
    id: 'map-update-request',
    currentFn: 'mapGeneralProgramToUpdateRequest',
    usedBy: 'snapshotToCommonInfoUpdateSave',
    reason: 'patch 키만 update body + serviceDetailJson',
  },
  {
    id: 'wage-unchanged-strip',
    currentFn: 'omitUnchangedWageFieldsFromProgramForServiceDetail',
    usedBy: 'snapshotToCommonInfoUpdateSave',
    reason: '임금 미변경 시 wage overlay/nested strip',
  },
  {
    id: 'apply-recruit-overlay',
    currentFn: 'applyGeneralRecruitOverlayToProgram',
    usedBy: 'applyRecruitmentDraftsToProgram',
    reason: 'targetLevels·모집 기간 nested. preferOverlay true 가 create 계약',
  },
  {
    id: 'catalog-prefix-pick',
    currentFn: 'operationalOverlayKeyPrefixesForCatalogId + keyMatchesOperationalOverlayPrefixes',
    usedBy: 'buildRecruitmentDrafts / buildApplicationBindingDrafts',
    reason: 'catalog peek 대체. 입력은 plain overlay record',
  },
  {
    id: 'read-media-from-overlay',
    currentFn: 'readRecruitDetailMediaFromOverlay',
    usedBy: 'buildMediaSidecar',
    reason: 'fileObjectId canonical, blob 제외',
  },
  {
    id: 'live-overlay-store',
    currentFn: 'peek*OverlayRecord / collectOperationalOverlayForCatalogId',
    usedBy: '제품 저장 경로만. Snapshot 타입·builder 입력은 store-free',
    reason: 'Phase 1-B에서 라이브 캡처를 builder 입력으로 옮김',
  },
  {
    id: 'editor-extras-sidecar',
    currentFn: 'GeneralRegistrationEditorExtras / editorState JSON',
    usedBy: 'buildCommonInfoDraft extras 인자',
    reason: '유형·회차·세션 수·참여자 플래그는 overlay 키가 아님',
  },
]
