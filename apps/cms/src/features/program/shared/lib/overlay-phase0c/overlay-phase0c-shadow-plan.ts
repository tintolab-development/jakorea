/**
 * Phase 0-C — 유형별 Baseline / Shadow fixture 계획.
 * 테스트 실행이 아니라 이후 Phase에서 쓸 fixture 정의.
 */

export type OverlayPhase0CShadowFixture = {
  id: string
  family: string
  covers: string
  compare: string
}

export const OVERLAY_PHASE0C_SHADOW_FIXTURES: readonly OverlayPhase0CShadowFixture[] = [
  {
    id: 'general-curriculum-nested-vs-overlay',
    family: 'GENERAL',
    covers: '세션 수 nested vs overlay 맵. 제품 교체 BLOCKED fixture 유지',
    compare: 'Independent extras vs extrasFromGeneralProgram',
  },
  {
    id: 'general-wizard-local-restore',
    family: 'GENERAL',
    covers: '임시저장·복원 apply→collect',
    compare: 'operational overlay local vs Independent persistOverlay',
  },
  {
    id: 'general-media-bind-rows',
    family: 'GENERAL',
    covers: '미디어 업로드 fileObjectId · 행/프로그램 bind 의도',
    compare: 'Independent media vs buildMediaSidecar',
  },
  {
    id: 'company-school-sessionN-authoring',
    family: 'COMPANY_SCHOOL',
    covers: 'economyRegistration.educationCurriculum.sessionN.* → nested 재생성',
    compare: 'applyEconomyRegistrationOverlayToProgram vs 향후 economy Independent',
  },
  {
    id: 'company-school-schedule-range-line',
    family: 'COMPANY_SCHOOL',
    covers: 'dateRangeSeal → educationScheduleLines. scheduleDetails와 혼동 금지',
    compare: 'buildEconomyEducationScheduleLines vs nested scheduleDetails 부재',
  },
  {
    id: 'company-school-application-economy-prefix',
    family: 'COMPANY_SCHOOL',
    covers: 'application.economy catalog collect. 1사1교 성범죄 필수와 일반 선택 정책 분리',
    compare: 'collectOperationalOverlayForCatalogId(application-economy)',
  },
  {
    id: 'trained-teachers-prefix-remap',
    family: 'TRAINED_TEACHER',
    covers: 'trainedTeachersRegistration → generalRegistration remap',
    compare: 'normalizeRegistrationOverlayForApply vs Independent adapter',
  },
  {
    id: 'trained-teachers-single-multi-schedule',
    family: 'TRAINED_TEACHER',
    covers: '단일·복수 일정. schedules[] ACTIVE 행 vs overlay scheduleLines',
    compare: 'GET schedules[] vs trainedTeachersRegistration.educationScheduleSettings',
  },
  {
    id: 'ujat-h1-h2-recruit',
    family: 'UJAT',
    covers: '봉사 모집 상·하반기 overlay 분리. 학교 모집 연 1회',
    compare: 'recruitment-ujat-volunteer h1/h2 catalog vs 일반 volunteer catalog',
  },
  {
    id: 'ujat-application-split',
    family: 'UJAT',
    covers: 'application-ujat-school / application-ujat-volunteer',
    compare: 'ujatApplication overlay vs 일반 application.institution',
  },
  {
    id: 'ujat-wizard-local-restore',
    family: 'UJAT',
    covers: 'persistUjatRegistrationFormLocal + operational overlay local',
    compare: 'ujatRegistrationOverlay 왕복',
  },
  {
    id: 'gemini-snapshot-local',
    family: 'GEMINI_VISITING_TRAINING',
    covers: 'geminiRecruitmentAddDraft localStorage · thumbnailFileName sidecar',
    compare: 'mapGeminiRecruitmentSnapshotToCreateRequest vs overlay Independent 비대상',
  },
]

export const OVERLAY_PHASE0C_REQUIRED_FIXTURE_FAMILIES = [
  'GENERAL',
  'COMPANY_SCHOOL',
  'TRAINED_TEACHER',
  'UJAT',
  'GEMINI_VISITING_TRAINING',
] as const
