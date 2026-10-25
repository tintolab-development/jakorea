/**
 * Phase 0-C — CMS 전체 프로그램 Overlay / RHF 의존성 조사 SSOT.
 * 제품 저장 경로에서 import하지 않는다. 분석·테스트 계획 전용.
 */

import { ProgramCreateRequestProgramType } from '@/shared/api/generated/dashboard/schemas/programCreateRequestProgramType'

export const OVERLAY_PHASE0C_BASELINE_TEST_COUNT = 94

export type OverlayPhase0CInputSsot =
  | 'overlay-store'
  | 'rhf'
  | 'overlay-store+rhf'
  | 'react-state-snapshot'
  | 'none-cms-wizard'

export type OverlayPhase0CBuilderReuse =
  | 'reuse-as-is'
  | 'reuse-with-adapter'
  | 'needs-separate-domain'
  | 'overlay-conversion-not-needed'

export type OverlayPhase0CRisk = 'High' | 'Medium' | 'Low'

export type OverlayPhase0CCmsFamily =
  | 'GENERAL'
  | 'COMPANY_SCHOOL'
  | 'TRAINED_TEACHER'
  | 'UJAT'
  | 'GEMINI_VISITING_TRAINING'
  | 'LEGACY_VOLUNTEER_ROUTE'
  | 'OPENAPI_ONLY'

export type OverlayPhase0CMatrixRow = {
  family: OverlayPhase0CCmsFamily
  programTypeEnum: readonly string[]
  listRoute: string
  registrationScreen: string
  detailScreen: string
  wizardInputSsot: OverlayPhase0CInputSsot
  detailInputSsot: OverlayPhase0CInputSsot
  saveSsot: string
  saveHook: string
  createApi: string
  updateApi: string
  previewSource: string
  draftRestore: string
  commonInfoBuilder: OverlayPhase0CBuilderReuse
  recruitmentBuilder: OverlayPhase0CBuilderReuse
  applicationBuilder: OverlayPhase0CBuilderReuse
  mediaBuilder: OverlayPhase0CBuilderReuse
  risk: OverlayPhase0CRisk
  notes: string
}

/** OpenAPI create enum. CMS 위저드 유무와 별도. */
export const OPENAPI_PROGRAM_CREATE_TYPES = Object.values(ProgramCreateRequestProgramType)

export const CMS_REGISTRATION_DRAFT_TYPE_KEYS = [
  'GENERAL',
  'COMPANY_SCHOOL',
  'TRAINED_TEACHER',
  'UJAT',
] as const

export const OPERATIONAL_BINDING_KINDS = [
  'GENERAL',
  'COMPANY_SCHOOL',
  'TRAINED_TEACHER',
  'UJAT',
] as const

/**
 * 일정형 데이터 3종 — 혼동 금지.
 * scheduleDetails: nested 일정형 블록 (일반 공통정보 저장)
 * educationScheduleLines: 표시·브리지용 일정 라인
 * schedules[]: 교육받은 교사 상세 ACTIVE 일정 API 행. 등록 overlay 커리큘럼이 아님
 */
export const SCHEDULE_FIELD_CONTRACTS = [
  {
    field: 'scheduleDetails',
    owner: 'Program.generalCommonInfo.scheduleDetails',
    role: '일정형 세부 일정 블록 저장·상세 편집',
  },
  {
    field: 'educationScheduleLines',
    owner: 'Program.generalCommonInfo.educationScheduleLines',
    role: '표시·신청 브리지·1사1교 기간 라인. nested 일정 블록과 별개',
  },
  {
    field: 'schedules[]',
    owner: 'Program.schedules',
    role: '교육받은 교사 GET schedules[] ACTIVE 행. 등록 overlay/session 맵이 아님',
  },
] as const

export const SESSION_AUTHORING_CONTRACTS = [
  {
    family: 'GENERAL',
    authoring:
      'curriculumSessions non-empty nested 우선. overlay 맵은 호환 미러. nested 빈 배열이면 stale overlay 복원 위험. BE 정본 확인 전 제품 경로 BLOCKED',
  },
  {
    family: 'COMPANY_SCHOOL',
    authoring:
      'economyRegistration.educationCurriculum.sessionN.title|description overlay가 작성 정본. applyEconomyRegistrationOverlayToProgram이 nested curriculumSessions를 재생성',
  },
  {
    family: 'TRAINED_TEACHER',
    authoring:
      '상세 공통은 폼+draft nested curriculumSessions/scheduleDetails 정본. 비활성 nested는 []. stale session overlay maps는 serialize에서 제거',
  },
  {
    family: 'UJAT',
    authoring:
      'ujatRegistrationOverlay (ujat.h1.* / ujat.h2.*) 가 반기 일정 정본. nested curriculumSessions 일반 경로와 분리',
  },
] as const

export const OVERLAY_PHASE0C_MATRIX: readonly OverlayPhase0CMatrixRow[] = [
  {
    family: 'GENERAL',
    programTypeEnum: ['GENERAL', 'GENERAL_ORGANIZATION', 'GENERAL_INDIVIDUAL'],
    listRoute: '/programs/general',
    registrationScreen:
      'apps/cms/src/features/program/general/ui/registration/registration-fullpage-modal.tsx',
    detailScreen:
      'apps/cms/src/features/program/general/ui/detail-modal/program-detail-fullpage-modal.tsx',
    wizardInputSsot: 'overlay-store',
    detailInputSsot: 'overlay-store+rhf',
    saveSsot:
      '위저드: registration overlay + catalog overlay → mapGeneralProgramToCreateRequest. 상세 공통: overlay apply 결과 PATCH(known-diff overlay-first). 모집 행: GET recruitments[]',
    saveHook:
      'persistGeneralProgramRegistration / useGeneralProgramCommonInfoSave / useProgramDetailInfoSave',
    createApi: 'createGeneralProgram → POST /api/admin/programs',
    updateApi: 'updateAdminProgramRemote PATCH + buildProgramRecruitmentRowSaveRequest',
    previewSource: 'overlay + institution-application-program-bridge (Legacy extras)',
    draftRestore:
      'localStorage registration-wizard:GENERAL + operational overlay local',
    commonInfoBuilder: 'reuse-as-is',
    recruitmentBuilder: 'reuse-as-is',
    applicationBuilder: 'reuse-as-is',
    mediaBuilder: 'reuse-as-is',
    risk: 'High',
    notes:
      '상세 공통 저장은 RHF getValues가 아니라 overlay apply. 세션 수 Independent extras는 제품 교체 BLOCKED',
  },
  {
    family: 'COMPANY_SCHOOL',
    programTypeEnum: ['COMPANY_SCHOOL'],
    listRoute: '/programs/company-school',
    registrationScreen:
      'apps/cms/src/features/program/general/ui/registration/registration-fullpage-modal.tsx (variant=economy)',
    detailScreen:
      'apps/cms/src/features/program/general/ui/detail-modal/program-detail-fullpage-modal.tsx',
    wizardInputSsot: 'overlay-store',
    detailInputSsot: 'overlay-store+rhf',
    saveSsot:
      'economyRegistration overlay → applyEconomyRegistrationOverlayToProgram → mapCompanySchoolToCreateRequest. 상세는 writeEconomyRegistrationOverlayFromProgramDraft 후 PATCH',
    saveHook:
      'persistGeneralProgramRegistration(variant=economy) / writeEconomyRegistrationOverlayFromProgramDraft / useProgramDetailInfoSave',
    createApi: 'createCompanySchoolProgram → programType COMPANY_SCHOOL',
    updateApi: 'mapCompanySchoolToUpdateRequest',
    previewSource: 'economy overlay + 기관 신청 브리지',
    draftRestore: 'registration-wizard:COMPANY_SCHOOL + registration-economy template',
    commonInfoBuilder: 'needs-separate-domain',
    recruitmentBuilder: 'reuse-with-adapter',
    applicationBuilder: 'reuse-with-adapter',
    mediaBuilder: 'reuse-with-adapter',
    risk: 'High',
    notes:
      'sessionN overlay가 작성 정본이고 nested를 재생성. 일반 Independent extras(nested 우선)와 반대. 신청 binding은 프로그램 단위(행 스코프 아님)',
  },
  {
    family: 'TRAINED_TEACHER',
    programTypeEnum: ['TRAINED_TEACHER'],
    listRoute: '/programs/trained-teachers',
    registrationScreen:
      'apps/cms/src/features/program/general/ui/registration/registration-fullpage-modal.tsx (variant=trainedTeachers)',
    detailScreen:
      'apps/cms/src/features/program/general/ui/detail-modal/program-detail-fullpage-modal.tsx',
    wizardInputSsot: 'overlay-store',
    detailInputSsot: 'rhf',
    saveSsot:
      '상세 공통: RHF getValues + draft nested → useProgramDetailInfoSave. A extra와 B configJson 동일 slices. 전환 overlay omit. 일반 모달은 TT 저장을 거부하고 전용 URL로 보낸다',
    saveHook:
      'persistGeneralProgramRegistration(variant=trainedTeachers) / useProgramDetailInfoSave / detailEditValuesToProgramPatch',
    createApi: 'createTrainedTeacherProgram → programType TRAINED_TEACHER',
    updateApi: 'trained-teachers/api/adapters update + info-detail-adapters',
    previewSource: 'trainedTeachers overlay remap + 기관 신청 브리지',
    draftRestore: 'registration-wizard:TRAINED_TEACHER + registration-trained-teachers',
    commonInfoBuilder: 'reuse-with-adapter',
    recruitmentBuilder: 'reuse-with-adapter',
    applicationBuilder: 'reuse-with-adapter',
    mediaBuilder: 'reuse-with-adapter',
    risk: 'Medium',
    notes:
      '상세 공통은 일반 Independent 빌더를 쓰지 않는다. nested curriculumSessions/scheduleDetails 정본. Program.schedules는 overlay와 분리',
  },
  {
    family: 'UJAT',
    programTypeEnum: ['UJAT'],
    listRoute: '/programs/ujat',
    registrationScreen:
      'apps/cms/src/features/program/ujat/ui/registration/ujat-program-registration-fullpage-modal.tsx',
    detailScreen:
      'apps/cms/src/features/program/ujat/ui/detail-modal/ujat-program-detail-fullpage-modal.tsx',
    wizardInputSsot: 'overlay-store',
    detailInputSsot: 'overlay-store+rhf',
    saveSsot:
      'ujatRegistrationOverlay 우선 merge (buildUjatProgramDraftWithSessionOverlay). toCreateRequest / toUpdateRequest. 봉사 모집 상·하반기 분리',
    saveHook: 'use-ujat-program-registration-flow useCreateProgram / useProgramDetailInfoSave',
    createApi: 'ujat/api/service create → toCreateRequest programType UJAT',
    updateApi: 'updateAdminProgramRemote + toUpdateRequest',
    previewSource: 'ujatRegistrationOverlay + 반기 모집 overlay',
    draftRestore:
      'registration-wizard:UJAT + persistUjatRegistrationFormLocal + operational overlay local',
    commonInfoBuilder: 'needs-separate-domain',
    recruitmentBuilder: 'needs-separate-domain',
    applicationBuilder: 'needs-separate-domain',
    mediaBuilder: 'reuse-with-adapter',
    risk: 'High',
    notes:
      '학교 모집 연 1회, 봉사 모집 h1/h2. 봉사자=강사. 일반 Independent Builder와 prefix·도메인이 다름',
  },
  {
    family: 'GEMINI_VISITING_TRAINING',
    programTypeEnum: ['GEMINI_TRAINING', 'GEMINI'],
    listRoute: '/programs/gemini/visiting-training',
    registrationScreen:
      'apps/cms/src/features/program/gemini/ui/recruitment/add-fullpage-modal.tsx',
    detailScreen:
      'apps/cms/src/features/program/gemini/ui/approved/detail-fullpage-modal.tsx',
    wizardInputSsot: 'react-state-snapshot',
    detailInputSsot: 'react-state-snapshot',
    saveSsot:
      'geminiRecruit overlay + mapGeminiRecruitmentSnapshotToCreateRequest. serviceDetailJson.geminiRecruitment',
    saveHook: 'geminiRecruitmentService.register / updateGeminiRecruitmentRemote',
    createApi: 'Gemini visiting-training 전용 create (programType GEMINI_TRAINING 가설)',
    updateApi: 'updateGeminiRecruitmentRemote',
    previewSource: 'gemini snapshot / platform-preview-payload',
    draftRestore: 'localStorage cms.jakorea.geminiRecruitmentAddDraft.v1',
    commonInfoBuilder: 'overlay-conversion-not-needed',
    recruitmentBuilder: 'needs-separate-domain',
    applicationBuilder: 'overlay-conversion-not-needed',
    mediaBuilder: 'reuse-with-adapter',
    risk: 'Medium',
    notes:
      '일반 프로그램 등록 위저드가 아님. GEMINI vs GEMINI_TRAINING OpenAPI 이중 enum. /programs/gemini 는 preparing',
  },
  {
    family: 'LEGACY_VOLUNTEER_ROUTE',
    programTypeEnum: ['VOLUNTEER'],
    listRoute: '/programs/volunteer',
    registrationScreen: '(없음 — ProgramListPage 레거시 경로)',
    detailScreen: 'apps/cms/src/pages/programs/program-list-page.tsx',
    wizardInputSsot: 'none-cms-wizard',
    detailInputSsot: 'none-cms-wizard',
    saveSsot: '독립 등록 위저드 없음. 일반 목록 필터 volunteer',
    saveHook: '(없음)',
    createApi: '(CMS 위저드 없음)',
    updateApi: '(CMS 위저드 없음)',
    previewSource: '(없음)',
    draftRestore: '(없음)',
    commonInfoBuilder: 'overlay-conversion-not-needed',
    recruitmentBuilder: 'overlay-conversion-not-needed',
    applicationBuilder: 'overlay-conversion-not-needed',
    mediaBuilder: 'overlay-conversion-not-needed',
    risk: 'Low',
    notes: '라우터에 기존 경로 유지 주석. 일반 Independent Builder 대상 아님',
  },
  {
    family: 'OPENAPI_ONLY',
    programTypeEnum: ['DGBONG', 'UJAT_DGBONG'],
    listRoute: '(없음)',
    registrationScreen: '(없음)',
    detailScreen: '(없음)',
    wizardInputSsot: 'none-cms-wizard',
    detailInputSsot: 'none-cms-wizard',
    saveSsot: 'OpenAPI enum·파트너 배정 API만 존재. CMS 등록 위저드 없음',
    saveHook: '(없음)',
    createApi: '(CMS 위저드 없음)',
    updateApi: 'ujatDgbongPartnerAssignmentConfirmRequest 등 배정 API',
    previewSource: '(없음)',
    draftRestore: '(없음)',
    commonInfoBuilder: 'overlay-conversion-not-needed',
    recruitmentBuilder: 'overlay-conversion-not-needed',
    applicationBuilder: 'overlay-conversion-not-needed',
    mediaBuilder: 'overlay-conversion-not-needed',
    risk: 'Low',
    notes: '프로그램 Independent Builder 범위 밖. 배정 API와 혼동하지 않음',
  },
]

export const OVERLAY_PHASE0C_IMPLEMENTATION_ORDER = [
  {
    rank: 1,
    family: 'GENERAL',
    action: '제품 저장 훅 교체 보류. 세션 수 BE 정본 확정 전 BLOCKED. Independent Builder는 유지',
  },
  {
    rank: 2,
    family: 'TRAINED_TEACHER',
    action: 'trainedTeachersRegistration prefix remap 어댑터로 CommonInfo Independent 재사용 검토',
  },
  {
    rank: 3,
    family: 'COMPANY_SCHOOL',
    action: 'sessionN overlay 정본용 별도 CommonInfo 도메인 Builder. 일반 extras 규칙을 이식하지 않음',
  },
  {
    rank: 4,
    family: 'COMPANY_SCHOOL',
    action: 'recruitment-economy / application.economy prefix 어댑터',
  },
  {
    rank: 5,
    family: 'UJAT',
    action: 'ujatRegistrationOverlay + h1/h2 별도 Recruitment/Application Builder',
  },
  {
    rank: 6,
    family: 'GEMINI_VISITING_TRAINING',
    action: 'snapshot Independent. 일반 overlay Builder로 합치지 않음',
  },
] as const

export const DO_NOT_MERGE_INTO_ONE_BUILDER = true

/** APPLICATION form-binding을 모집 행에 묶는 programType. 1사1교·교육받은 교사는 프로그램 단위. */
export const APPLICATION_BINDING_RECRUITMENT_ROW_TYPES = [
  'GENERAL',
  'GENERAL_INDIVIDUAL',
  'GENERAL_ORGANIZATION',
  'UJAT',
] as const

export const OVERLAY_PHASE0C_EVIDENCE_FILES = [
  'apps/cms/src/features/program/general/ui/registration/registration-fullpage-modal.tsx',
  'apps/cms/src/features/program/general/ui/detail-modal/program-detail-fullpage-modal.tsx',
  'apps/cms/src/features/program/general/ui/detail-modal/detail-fullpage-modal.tsx',
  'apps/cms/src/features/program/general/hooks/use-registration-flow.ts',
  'apps/cms/src/features/program/general/hooks/use-common-info-save.ts',
  'apps/cms/src/features/program/general/hooks/use-program-detail-info-save.ts',
  'apps/cms/src/features/program/general/lib/registration-local-save.ts',
  'apps/cms/src/features/program/general/lib/economy-registration-overlay-to-program.ts',
  'apps/cms/src/features/program/general/lib/operational-form-bindings.ts',
  'apps/cms/src/features/program/general/lib/program-operational-binding-profile.ts',
  'apps/cms/src/features/program/1c-1s/api/adapters.ts',
  'apps/cms/src/features/program/1c-1s/ui/common-info-registration-edit.tsx',
  'apps/cms/src/features/program/trained-teachers/api/adapters.ts',
  'apps/cms/src/features/program/trained-teachers/ui/common-info/common-info-view.tsx',
  'apps/cms/src/features/program/ujat/ui/registration/ujat-program-registration-fullpage-modal.tsx',
  'apps/cms/src/features/program/ujat/ui/detail-modal/ujat-program-detail-fullpage-modal.tsx',
  'apps/cms/src/features/program/ujat/hooks/use-ujat-program-registration-flow.ts',
  'apps/cms/src/features/program/ujat/api/service.ts',
  'apps/cms/src/features/program/gemini/ui/recruitment/add-fullpage-modal.tsx',
  'apps/cms/src/features/program/gemini/ui/approved/detail-fullpage-modal.tsx',
  'apps/cms/src/features/program/gemini/ui/detail/fullpage-modal.tsx',
  'apps/cms/src/features/program/gemini/api/visiting-training/adapters.ts',
  'apps/cms/src/pages/programs/program-list-page.tsx',
  'apps/cms/src/features/program/general/lib/overlay-phase1/build-independent-common-info.ts',
  'apps/cms/src/features/program/general/lib/overlay-phase1/build-independent-recruitment.ts',
  'apps/cms/src/features/program/general/lib/overlay-phase1/build-independent-application.ts',
  'apps/cms/src/features/program/general/lib/overlay-phase1/build-independent-media.ts',
] as const

export function overlayPhase0cMatrixByFamily(
  family: OverlayPhase0CCmsFamily
): OverlayPhase0CMatrixRow {
  const row = OVERLAY_PHASE0C_MATRIX.find(item => item.family === family)
  if (!row) throw new Error(`missing Phase 0-C matrix row: ${family}`)
  return row
}
