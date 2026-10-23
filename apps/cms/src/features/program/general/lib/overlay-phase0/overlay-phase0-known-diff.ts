/**
 * Phase 0-B known-diff. 테스트가 현재 동작을 고정한다.
 * 승인되지 않은 차이를 정규화로 숨기지 않는다.
 */

export type OverlayPhase0KnownDiffChange = 'keep_current' | 'change_required' | 'phase1_decision'

export type OverlayPhase0KnownDiff = {
  id: string
  current: string
  expectedIfChanged: string
  change: OverlayPhase0KnownDiffChange
  evidence: string
  verifyTest: string
}

export const OVERLAY_PHASE0_KNOWN_DIFFS: readonly OverlayPhase0KnownDiff[] = [
  {
    id: 'detail-common-save-overlay-first',
    current:
      'useGeneralProgramCommonInfoSave는 Independent PATCH. 교육받은 교사는 일반 훅에서 저장을 거부하고 전용 모달 nested persist를 쓴다',
    expectedIfChanged: '동일',
    change: 'keep_current',
    evidence: 'apps/cms/src/features/program/general/hooks/use-common-info-save.ts',
    verifyTest: '교육받은 교사는 일반 공통정보 overlay-first 저장을 하지 않는다',
  },
  {
    id: 'recruit-detailinfo-reseed-gap',
    current: 'persist된 recruit.detailInfo 키가 상세 시드에서 스토어로 안 돌아가는 fixture가 있다',
    expectedIfChanged: 'GET registrationOverlay.recruit.detailInfo* 가 catalog 스토어에 재시드',
    change: 'change_required',
    evidence: 'apps/cms/src/features/program/shared/parity/known-parity-gaps.test.ts',
    verifyTest: 'parity known gaps — overlay_only recruit.detailInfo',
  },
  {
    id: 'nested-wins-over-overlay',
    current: '시드 병합은 nested 행이 overlay persist 값을 덮는다 (recruit.detailInfo conflict)',
    expectedIfChanged: 'overlay persist를 상세 표시 SSOT로 둘지 결정 필요',
    change: 'keep_current',
    evidence: 'known-parity-gaps nested_overlay_conflict',
    verifyTest: 'nested 설명이 overlay 설명을 이긴다',
  },
  {
    id: 'kpi-dispatched-seed-null',
    current: 'buildGeneralRegistrationOverlayFromProgram 이 dispatchedSchool/Class 를 항상 null 시드',
    expectedIfChanged: 'KPI API 값을 overlay에 넣거나 키를 생략',
    change: 'keep_current',
    evidence: 'registration-overlay-sync.ts dispatchedSchool/Class = null',
    verifyTest: '시드 KPI 파견 값은 null',
  },
  {
    id: 'recruit-save-locks-announcement-title',
    current: '모집 탭 PATCH는 announcementTitle을 공통정보 값으로 고정해 모집 폼이 공고명을 비우지 못하게 한다',
    expectedIfChanged: '모집 행 announcementTitle과 공통 공고명 분리',
    change: 'keep_current',
    evidence: 'use-program-detail-info-save.ts announcementTitle: program.generalCommonInfo?.announcementTitle',
    verifyTest: 'apply 빈 공고용명은 기존 announcementTitle로 fallback',
  },
  {
    id: 'empty-public-title-apply-fallback',
    current:
      'apply overlayString(publicProgramTitle) || existing. 빈 문자열은 기존 공고명으로 돌아간다. seed는 nested 빈값을 유지',
    expectedIfChanged: '명시적 빈 공고용명을 apply에서도 유지',
    change: 'change_required',
    evidence: 'registration-overlay-to-program.ts announcementTitle || fallback',
    verifyTest: '빈 공고용명 apply fallback',
  },
  {
    id: 'wage-unchanged-strip',
    current: '임금 미변경 PATCH는 wageGradeRows/paymentItems와 wage overlay 키를 뺀다',
    expectedIfChanged: '동일 (BE 400 방지)',
    change: 'keep_current',
    evidence: 'omitUnchangedWageFieldsFromProgramForServiceDetail',
    verifyTest: '임금 미변경 strip',
  },
  {
    id: 'catalog-peek-not-getrecord',
    current: 'persist/create 스냅샷은 peek(catalog)만 사용. 활성 getRecord는 신청 단계 후 비어 있을 수 있다',
    expectedIfChanged: '동일',
    change: 'keep_current',
    evidence: 'collectOperationalOverlayForCatalogId / collectSelectedRecruitOverlaysForProgram',
    verifyTest: '활성 스코프와 다른 catalog peek',
  },
  {
    id: 'individual-schedule-writes-institution-prefix',
    current:
      '개인 신청 일정은 application.individual.fixedScheduleSelected. 구 키 application.institution.fixedScheduleSelected 는 개인 전용 hydrate 호환만 하고 individual catalog collect prefix에 institution 전체를 넣지 않는다',
    expectedIfChanged: '동일',
    change: 'keep_current',
    evidence:
      'individual-schedule-paragraph overlayKey + canonicalizeWizardApplicationKv',
    verifyTest: '개인 신청 일정은 individual catalog 키로 저장하고 기관 키와 섞지 않는다',
  },
  {
    id: 'application-overlay-not-in-program-create',
    current:
      '등록 완료 persistRegistrationAndRecruitOverlay는 registration+recruit만 합친다. application.* 는 form version overlay',
    expectedIfChanged: '동일',
    change: 'keep_current',
    evidence: 'registration-local-save persistRegistrationAndRecruitOverlay',
    verifyTest: 'create overlay에 application. 키가 없다',
  },
  {
    id: 'serialize-rebuilds-overlay-from-nested',
    current:
      'serializeGeneralProgramServiceDetailJson은 nested announcementTitle로 publicProgramTitle을 다시 만든다. overlay-only 공고명은 nested가 이긴다',
    expectedIfChanged: '명시적 overlay 공고명을 serialize가 유지',
    change: 'keep_current',
    evidence: 'general-program-service-detail-json.ts fromNested + resync',
    verifyTest: 'serviceDetailJson nested/root overlay 동일, 공고명은 nested',
  },
  {
    id: 'schedule-type-detailed-name-from-details',
    current:
      '일정형 apply는 overlay 세부프로그램명을 쓰지 않고 scheduleDetails 라벨을 이어 붙인다',
    expectedIfChanged: '해당없음 고정 vs 일정명 파생 — 제품 요구 확인',
    change: 'keep_current',
    evidence: 'applyGeneralRegistrationOverlayToProgram lockDetailedProgramToSchedule',
    verifyTest: '일정형 extras는 세부프로그램 id를 보내지 않는다',
  },
  {
    id: 'media-canonical-file-object-id',
    current:
      '미리보기 blob URL은 persist/create payload에 안 넣는다. canonical은 thumbFileObjectId / attachmentFileObjectIds → PUT thumbnail·attachments',
    expectedIfChanged: '동일',
    change: 'keep_current',
    evidence: 'recruit-detail-info-media.ts bindRecruitDetailMediaAfterProgramCreate',
    verifyTest: 'blob은 keyVisualImage에서 제외, objectId PUT',
  },
]
