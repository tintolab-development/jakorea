/**
 * P0 — 일반 프로그램 RHF 전환 게이트. 제품 저장 훅에서 import하지 않는다.
 * COMPANY_SCHOOL / UJAT / GEMINI 는 범위 밖.
 * TRAINED_TEACHER 는 일반 Independent 빌더를 재사용하지 않고 전용 nested-ssot persist 를 쓴다.
 */

export const GENERAL_RHF_MIGRATION_GATE_SCOPE = [
  'GENERAL',
  'GENERAL_ORGANIZATION',
  'GENERAL_INDIVIDUAL',
] as const

export const BE_SESSION_SSOT_CONTRACT = {
  nestedCanonical: 'generalCommonInfo.curriculumSessions',
  omitKeepsExisting: true,
  emptyArrayDeletesAll: true,
  staleOverlayMustNotRestore: true,
  rebuildOverlayFromNested: true,
  keepSparseSessionNo: true,
  overlayOnlyWhenNestedMissing: true,
  scheduleDetailsIndependent: true,
  educationScheduleLinesAreDisplay: true,
  programSchedulesArePhysicalRows: true,
} as const

export type GeneralRhfGateProgramType = (typeof GENERAL_RHF_MIGRATION_GATE_SCOPE)[number]
export type GeneralRhfGateStructure = 'curriculum' | 'schedule'
export type GeneralRhfGateRound = 'single' | 'multi'
export type GeneralRhfGateSupport = 'supported' | 'unsupported'

export type GeneralRhfGateMatrixRow = {
  programType: GeneralRhfGateProgramType
  structure: GeneralRhfGateStructure
  round: GeneralRhfGateRound
  support: GeneralRhfGateSupport
  evidence: string
}

export const GENERAL_RHF_GATE_MATRIX: readonly GeneralRhfGateMatrixRow[] = (
  [
    'GENERAL',
    'GENERAL_ORGANIZATION',
    'GENERAL_INDIVIDUAL',
  ] as const
).flatMap(programType =>
  (['curriculum', 'schedule'] as const).flatMap(structure =>
    (['single', 'multi'] as const).map(round => ({
      programType,
      structure,
      round,
      support: 'supported' as const,
      evidence:
        '위저드 extras.programType/sessionRoundType + resolveGeneralProgramCreateProgramType. 상세 RHF educationStructure/sessionRound. 개인 SCHEDULE MULTI는 승인 스코프 규칙이 있으나 등록·공통 저장은 지원',
    }))
  )
)

export type GeneralRhfSessionScenarioId =
  | 'reduce-4-to-2'
  | 'delete-all-2-to-0'
  | 'add-2-to-4'
  | 'nested-2-stale-overlay-4'
  | 'nested-missing-overlay-only'
  | 'sparse-session-1-3'
  | 'patch-omit-curriculumSessions'
  | 'curriculum-vs-scheduleDetails-independent'

export type GeneralRhfSessionVerdict = 'matches-be' | 'conflicts-be' | 'independent-cannot-express'

export type GeneralRhfSessionScenario = {
  id: GeneralRhfSessionScenarioId
  beExpected: string
  independentActual: string
  verdict: GeneralRhfSessionVerdict
}

export const GENERAL_RHF_SESSION_SCENARIOS: readonly GeneralRhfSessionScenario[] = [
  {
    id: 'reduce-4-to-2',
    beExpected: 'nested 2행. overlay 미러도 1·2만. 3·4 복원 금지',
    independentActual: 'extras=2이고 maps가 1·2만이면 nested 2. update persist는 nested 미러가 이김',
    verdict: 'matches-be',
  },
  {
    id: 'delete-all-2-to-0',
    beExpected: '명시적 [] 전체 삭제',
    independentActual:
      'sessionAuthoring.clear 또는 extras count 0 + 빈 maps → curriculumSessions: []',
    verdict: 'matches-be',
  },
  {
    id: 'add-2-to-4',
    beExpected: 'nested 4행 추가',
    independentActual: 'extras=4 + maps 1..4 → nested 4',
    verdict: 'matches-be',
  },
  {
    id: 'nested-2-stale-overlay-4',
    beExpected: 'nested 2가 정본. stale overlay 3·4 복원 금지',
    independentActual:
      'GET extras nested 2. maps에 stale 4키가 있어도 nested sessionNo만 사용해 2행. 3·4 복원 금지',
    verdict: 'matches-be',
  },
  {
    id: 'nested-missing-overlay-only',
    beExpected: 'nested 없을 때만 overlay-only 복원',
    independentActual: 'maps가 있으면 overlayCount로 복원. nested 없는 GET extras count는 1',
    verdict: 'matches-be',
  },
  {
    id: 'sparse-session-1-3',
    beExpected: 'sparse sessionNo [1,3] 유지',
    independentActual:
      'sessionNo [1,3] 행만 생성. 배열 index와 sessionNo를 분리. 구멍 2를 채우지 않음',
    verdict: 'matches-be',
  },
  {
    id: 'patch-omit-curriculumSessions',
    beExpected: '필드 생략 시 기존 유지',
    independentActual:
      'buildIndependentCommonInfoPatch 가 미변경 curriculumSessions 키를 생략. 명시적 삭제만 []',
    verdict: 'matches-be',
  },
  {
    id: 'curriculum-vs-scheduleDetails-independent',
    beExpected:
      '구조 변경 시 비활성 nested []. 미변경 시 상대 nested 유지. educationScheduleLines·schedules[] 와 혼동 금지',
    independentActual:
      'isEducationStructureChanged 이면 비활성 nested []. 아니면 omit/보존. educationScheduleLines·schedules[] 는 별개',
    verdict: 'matches-be',
  },
]

export type GeneralRhfGateBlockerId =
  | 'session-cannot-emit-empty-array'
  | 'session-stale-overlay-maps-extend-count'
  | 'session-densifies-sparse-index'
  | 'session-type-switch-sends-empty-sibling'
  | 'patch-cannot-omit-curriculumSessions'
  | 'dual-form-model-detail-rhf-vs-independent-maps'
  | 'product-save-overlay-first'
  | 'wizard-has-no-form-provider'
  | 'known-diff-change-required'

export const GENERAL_RHF_GATE_BLOCKERS: readonly GeneralRhfGateBlockerId[] = [
  'known-diff-change-required',
]

export const GENERAL_RHF_MIGRATION_GATE_STATUS = 'GENERAL_RHF_MIGRATION_GATE_BLOCKED' as const

export const GENERAL_RHF_CONTRACT_ALIGNMENT_STATUS =
  'GENERAL_RHF_CONTRACT_ALIGNMENT_COMPLETE' as const

/** 교육받은 교사 상세 공통정보 — 일반 Independent 재사용 아님. 전용 폼+draft nested persist. */
export const TRAINED_TEACHER_NESTED_SSOT_PERSIST_STATUS =
  'TRAINED_TEACHER_NESTED_SSOT_PERSIST_READY' as const

export const GENERAL_RHF_GATE_PRECONDITIONS = [
  'Independent 세션 빌더를 BE 계약에 맞춤: [] 허용, extras/nested count가 overlayCount를 이김, sparse 유지',
  '상세는 기존 nested RHF(generalCommonInfoEditValuesToProgramPatch)를 우선. Independent maps로 상세를 되돌리지 않음',
  '일반 위저드는 전 스텝을 감싸는 FormProvider(shouldUnregister:false)가 있다. Independent 입력은 모집/신청 언마운트 후에도 유지',
  '시드는 nested → overlay 미러. GET raw overlay maps를 formValues에 넣지 않음',
  '신청 PUT sink는 form version overlay 유지. create registrationOverlay에 application.* 금지',
  '미디어 canonical은 fileObjectId. blob URL은 create payload 제외',
  '실서버 Mutation은 BE PROGRAM_SESSION_SSOT_FIX가 연동 서버에 반영된 뒤에만',
] as const

export const LEGACY_VS_BE_SESSION_DIFF = {
  id: 'legacy-extras-overlay-map-length-vs-be-nested',
  current:
    'extrasFromGeneralProgram 은 overlay 맵 길이와 nested 중 큰 값을 씀. Independent GET extras는 nested만',
  be: 'curriculumSessions nested 정본. stale overlay 복원 금지',
  action: 'Legacy extras에 맞추지 않음. Independent extras가 BE에 더 가깝다',
} as const

export type IndependentToDetailAdapterStatus = 'same' | 'renamed' | 'shape-mismatch' | 'extras-not-form'

export const INDEPENDENT_TO_DETAIL_RHF_ADAPTER: readonly {
  independent: string
  detail: string
  status: IndependentToDetailAdapterStatus
}[] = [
  { independent: 'programTitleKo', detail: 'mainTitle', status: 'renamed' },
  { independent: 'programTitleEn', detail: 'titleEn', status: 'renamed' },
  { independent: 'publicProgramTitle', detail: 'announcementTitle', status: 'renamed' },
  { independent: 'detailedProgramId', detail: 'detailedProgramId', status: 'same' },
  { independent: 'businessField', detail: 'businessArea', status: 'renamed' },
  { independent: 'partnerInvolvement', detail: 'partnerInvolvement', status: 'same' },
  { independent: 'educationVenueKind', detail: 'venueKind', status: 'renamed' },
  { independent: 'educationVenueDetail', detail: 'venueDetail', status: 'renamed' },
  { independent: 'educationCourse', detail: 'educationProcess', status: 'renamed' },
  { independent: 'ipOwned', detail: 'ipOwned', status: 'same' },
  { independent: 'courseDeliveredBy', detail: 'courseDeliveredBy', status: 'same' },
  { independent: 'operationRangeSeal', detail: 'startDate+endDate', status: 'shape-mismatch' },
  { independent: 'surveyItems', detail: 'surveySurvey/Satisfaction/LectureEvaluation', status: 'shape-mismatch' },
  { independent: 'sponsorIds', detail: 'sponsorManagementIds', status: 'renamed' },
  { independent: 'managerContactIds', detail: 'sponsorManagerContactIds', status: 'renamed' },
  { independent: 'kpiParticipantCount', detail: 'kpiFinalParticipants', status: 'renamed' },
  { independent: 'kpiInstructor', detail: 'kpiInstructorCount', status: 'renamed' },
  { independent: 'kpiVolunteer', detail: 'kpiVolunteerCount', status: 'renamed' },
  { independent: 'kpiDispatchedSchool', detail: 'kpiFinalSchools', status: 'renamed' },
  { independent: 'kpiDispatchedClass', detail: 'kpiFinalClasses', status: 'renamed' },
  { independent: 'wageGrade1Fee', detail: 'wageGrade1Amount', status: 'renamed' },
  { independent: 'paymentItemValues', detail: 'wagePaymentItemIds', status: 'renamed' },
  { independent: 'scheduleLines', detail: 'educationScheduleLines', status: 'renamed' },
  {
    independent: 'curriculum',
    detail: 'curriculumSessions',
    status: 'shape-mismatch',
  },
  {
    independent: 'schedule',
    detail: 'scheduleDetails',
    status: 'shape-mismatch',
  },
  { independent: 'editorExtras.programType', detail: 'educationStructure', status: 'extras-not-form' },
  { independent: 'editorExtras.sessionRoundType', detail: 'sessionRound', status: 'extras-not-form' },
]

export const RECRUITMENT_RHF_CONNECTABLE = {
  independentModel: 'RecruitmentFormValues catalog objects',
  existingDetailRhf: 'ProgramDetailEditFormValues via useProgramDetailEditForm',
  wizardRhf: true,
  connectableWithAdapter: true,
  notes:
    '일반 신규 등록은 recruitmentKv RHF Independent. 상세 모집 탭은 기존 RHF. 행 PATCH는 recruitments[] SSOT를 덮으면 안 됨',
} as const

export const APPLICATION_RHF_CONNECTABLE = {
  independentModel: 'ApplicationFormValues OptionalField catalogs',
  existingDetailRhf: false,
  wizardRhf: true,
  connectableWithAdapter: true,
  sink: 'form-version-overlay',
  notes:
    '일반 신규 등록은 applicationKv RHF Independent. Form Version overlay PUT이 sink. 프로그램 CREATE에 application.* 를 넣지 않는다',
} as const

export const MEDIA_RHF_CONNECTABLE = {
  independentModel: 'IndependentMediaFormValues fileObjectId sidecar',
  existingDetailRhf: false,
  wizardRhf: false,
  connectableWithAdapter: true,
  sink: 'PUT thumbnail/attachments intent',
  notes: 'blob URL은 canonical 아님. 업로드 전 origin=ephemeral-blob, 후 uploaded-object-id',
} as const

export function generalRhfGateMatrixSize(): number {
  return GENERAL_RHF_GATE_MATRIX.length
}
