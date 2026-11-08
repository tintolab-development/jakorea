/**
 * Phase 0-B — 일반 프로그램 신청 overlay 키 인벤토리.
 * 제품 저장 로직이 아니라 계약 조사 SSOT다. 런타임 저장 경로에서 import하지 않는다.
 */

export type ApplicationOverlayCatalogId =
  | 'application-participant-school'
  | 'application-participant-individual'
  | 'application-instructor'
  | 'application-volunteer'

export type ApplicationOverlaySink =
  | 'form-version-overlay'
  | 'program-patch'
  | 'preview-only'
  | 'bridge'
  | 'cms-applicant-detail'
  | 'local-draft'
  | 'test-only'

export type ApplicationOverlayKeyKind = 'static' | 'record' | 'array' | 'dynamic-prefix'

export type ApplicationOverlayKeyEntry = {
  catalog: ApplicationOverlayCatalogId
  key: string
  kind: ApplicationOverlayKeyKind
  /** 입력 UI. 없으면 소비 전용 */
  input: string
  defaultValue: string
  required: boolean
  preview: boolean
  bridge: boolean
  formVersionOverlay: boolean
  programPatch: boolean
  localDraft: boolean
  notes?: string
}

export const APPLICATION_OVERLAY_CATALOG_PREFIX: Record<ApplicationOverlayCatalogId, string> = {
  'application-participant-school': 'application.institution',
  'application-participant-individual': 'application.individual',
  'application-instructor': 'application.instructor',
  'application-volunteer': 'application.volunteer',
}

/** collectOperationalOverlayForCatalogId 가 가져가는 prefix — registration-operational-form-drafts.ts */
export const APPLICATION_OVERLAY_COLLECT_PREFIXES: Record<
  ApplicationOverlayCatalogId,
  readonly string[]
> = {
  'application-participant-school': ['application.institution'],
  'application-participant-individual': ['application.individual'],
  'application-instructor': ['application.instructor'],
  'application-volunteer': ['application.volunteer'],
}

const FORM_VERSION_AND_DRAFT = {
  formVersionOverlay: true,
  programPatch: false,
  localDraft: true,
} as const

export const APPLICATION_OVERLAY_KEY_INVENTORY: readonly ApplicationOverlayKeyEntry[] = [
  {
    catalog: 'application-participant-school',
    key: 'application.institution.teacherTel',
    kind: 'static',
    input: 'institution-basic-info-paragraph',
    defaultValue: "''",
    required: false,
    preview: true,
    bridge: false,
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-participant-school',
    key: 'application.institution.teacherMobile',
    kind: 'static',
    input: 'institution-basic-info-paragraph',
    defaultValue: "''",
    required: false,
    preview: true,
    bridge: false,
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-participant-school',
    key: 'application.institution.teacherEmail',
    kind: 'static',
    input: 'institution-basic-info-paragraph',
    defaultValue: "''",
    required: false,
    preview: true,
    bridge: false,
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-participant-school',
    key: 'application.institution.applicationGrade',
    kind: 'static',
    input: 'institution-basic-info-paragraph',
    defaultValue: "''",
    required: false,
    preview: true,
    bridge: false,
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-participant-school',
    key: 'application.institution.educationForm',
    kind: 'static',
    input: 'institution-basic-info-paragraph',
    defaultValue: "''",
    required: false,
    preview: true,
    bridge: true,
    notes: '표시는 institution-application-program-bridge 교육형태와 함께 동작',
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-participant-school',
    key: 'application.institution.classCount',
    kind: 'static',
    input: 'institution-basic-info-paragraph',
    defaultValue: "''",
    required: false,
    preview: true,
    bridge: false,
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-participant-school',
    key: 'application.institution.preferredSchedules',
    kind: 'array',
    input: 'institution-preferred-schedule-paragraph',
    defaultValue: '[] (block {date,session,start,end})',
    required: false,
    preview: true,
    bridge: true,
    notes: '브리지 세션 수·기간이 블록 수를 제한. dayjs는 overlay에 serialize',
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-participant-school',
    key: 'application.institution.fixedScheduleSelected',
    kind: 'array',
    input: 'institution-fixed-schedule-paragraph',
    defaultValue: '[]',
    required: false,
    preview: true,
    bridge: true,
    notes:
      '기관 신청 고정 일정. 개인 신청은 application.individual.fixedScheduleSelected 를 쓴다',
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-participant-school',
    key: 'application.institution.guidanceAnswers',
    kind: 'record',
    input: 'institution-guidance-paragraph',
    defaultValue: '{}',
    required: false,
    preview: true,
    bridge: false,
    notes: '동적 키는 Record<fieldId, string>. fieldId는 draft 단락 문항 id',
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-participant-school',
    key: 'application.institution.sexOffense.inquiryMethod',
    kind: 'static',
    input: 'institution-sex-offense-consent-inquiry-paragraph',
    defaultValue: "''",
    required: true,
    preview: true,
    bridge: false,
    notes: '1사1교 등록 완료 필수. 기본값 ja_system. 일반은 선택 UI',
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-participant-school',
    key: 'application.institution.sexOffense.siteSubmission',
    kind: 'static',
    input: 'institution-sex-offense-consent-inquiry-paragraph',
    defaultValue: "''",
    required: false,
    preview: true,
    bridge: false,
    notes: 'inquiryMethod가 criminal_record_site일 때 필수. ja_system이면 저장하지 않음',
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-participant-school',
    key: 'application.institution.sexOffense.institutionId',
    kind: 'static',
    input: 'institution-sex-offense-consent-inquiry-paragraph',
    defaultValue: "''",
    required: false,
    preview: true,
    bridge: false,
    notes: 'inquiryMethod가 criminal_record_site일 때 1사1교에서 필수. ja_system이면 비움',
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-participant-school',
    key: 'application.institution.sexOffense.verificationNumber',
    kind: 'static',
    input: 'institution-sex-offense-consent-inquiry-paragraph',
    defaultValue: "''",
    required: false,
    preview: true,
    bridge: false,
    notes: 'inquiryMethod가 criminal_record_site일 때 1사1교에서 필수. ja_system이면 비움',
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-participant-individual',
    key: 'application.individual.teamInfo.teamName',
    kind: 'static',
    input: 'individual-team-info-paragraph',
    defaultValue: "''",
    required: false,
    preview: true,
    bridge: false,
    notes: 'CMS 작성 overlay + 포털 제출 formAnswers 동일 키. 상세는 individual-application-team-detail',
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-participant-individual',
    key: 'application.individual.teamInfo.memberCountSelect',
    kind: 'static',
    input: 'individual-team-info-paragraph',
    defaultValue: "''",
    required: false,
    preview: true,
    bridge: false,
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-participant-individual',
    key: 'application.individual.teamInfo.customMemberCount',
    kind: 'static',
    input: 'individual-team-info-paragraph',
    defaultValue: "''",
    required: false,
    preview: true,
    bridge: false,
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-participant-individual',
    key: 'application.individual.teamInfo.teamRole',
    kind: 'static',
    input: 'individual-team-info-paragraph',
    defaultValue: "''",
    required: false,
    preview: true,
    bridge: false,
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-participant-individual',
    key: 'application.individual.fixedScheduleSelected',
    kind: 'array',
    input: 'individual-schedule-paragraph',
    defaultValue: '[]',
    required: false,
    preview: true,
    bridge: true,
    notes:
      '기관 고정 일정 컴포넌트를 overlayKey로 재사용. 포털 제출은 paragraph answer, CMS Form Version overlay는 개인 prefix',
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-instructor',
    key: 'application.instructor.crimeRecordConfirmed',
    kind: 'static',
    input: 'instructor-crime-record-paragraph',
    defaultValue: 'false',
    required: false,
    preview: true,
    bridge: false,
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-instructor',
    key: 'application.instructor.currentMonth',
    kind: 'static',
    input: 'instructor-available-schedule-paragraph',
    defaultValue: 'scheduleAnchor.startOf(month) ISO',
    required: false,
    preview: true,
    bridge: true,
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-instructor',
    key: 'application.instructor.selectedDate',
    kind: 'static',
    input: 'instructor-available-schedule-paragraph',
    defaultValue: 'scheduleAnchor ISO',
    required: false,
    preview: true,
    bridge: true,
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-instructor',
    key: 'application.instructor.selectedSlotIds',
    kind: 'array',
    input: 'instructor-available-schedule-paragraph',
    defaultValue: '[]',
    required: false,
    preview: true,
    bridge: true,
    notes: '슬롯 id 배열. 일정 슬롯 집합이 바뀌면 []로 reset',
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-volunteer',
    key: 'application.volunteer.previousProgram.applicationYear',
    kind: 'static',
    input: 'volunteer-previous-ja-program-paragraph',
    defaultValue: "''",
    required: false,
    preview: true,
    bridge: false,
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-volunteer',
    key: 'application.volunteer.previousProgram.programName',
    kind: 'static',
    input: 'volunteer-previous-ja-program-paragraph',
    defaultValue: "''",
    required: false,
    preview: true,
    bridge: false,
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-volunteer',
    key: 'application.volunteer.previousProgram.fileNames',
    kind: 'array',
    input: 'volunteer-previous-ja-program-paragraph',
    defaultValue: '[]',
    required: false,
    preview: true,
    bridge: false,
    notes: 'CMS 작성 미리보기 파일명. 포털 실제 첨부는 fileObjectId 문항 맵',
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-volunteer',
    key: 'application.volunteer.previousProgram.fileObjectIds',
    kind: 'array',
    input: 'volunteer-previous-ja-program-paragraph',
    defaultValue: '[]',
    required: false,
    preview: true,
    bridge: false,
    notes: 'fileNames와 같은 순서의 업로드 fileObjectId (4a3518d2d)',
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-volunteer',
    key: 'application.volunteer.applicant.currentMonth',
    kind: 'static',
    input: 'volunteer-interview-applicant-schedule-paragraph',
    defaultValue: 'month ISO',
    required: false,
    preview: true,
    bridge: false,
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-volunteer',
    key: 'application.volunteer.applicant.selectedDate',
    kind: 'static',
    input: 'volunteer-interview-applicant-schedule-paragraph',
    defaultValue: "''",
    required: false,
    preview: true,
    bridge: false,
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-volunteer',
    key: 'application.volunteer.applicant.selectedSlots',
    kind: 'array',
    input: 'volunteer-interview-applicant-schedule-paragraph',
    defaultValue: '[]',
    required: false,
    preview: true,
    bridge: false,
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-volunteer',
    key: 'application.volunteer.activitySchedule.currentMonth',
    kind: 'static',
    input: 'volunteer-activity-available-schedule-paragraph',
    defaultValue: 'scheduleAnchor.startOf(month) ISO',
    required: false,
    preview: true,
    bridge: true,
    notes: 'InstructorAvailableScheduleParagraph overlayKeyPrefix 재사용',
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-volunteer',
    key: 'application.volunteer.activitySchedule.selectedDate',
    kind: 'static',
    input: 'volunteer-activity-available-schedule-paragraph',
    defaultValue: 'scheduleAnchor ISO',
    required: false,
    preview: true,
    bridge: true,
    ...FORM_VERSION_AND_DRAFT,
  },
  {
    catalog: 'application-volunteer',
    key: 'application.volunteer.activitySchedule.selectedSlotIds',
    kind: 'array',
    input: 'volunteer-activity-available-schedule-paragraph',
    defaultValue: '[]',
    required: false,
    preview: true,
    bridge: true,
    ...FORM_VERSION_AND_DRAFT,
  },
]

/** `application.volunteer.interview.{suffix}` 및 `…exception.{n}.{suffix}` */
export const VOLUNTEER_INTERVIEW_APPLICATION_DYNAMIC_SUFFIXES = [
  'exceptionDate',
  'interviewTime',
  'interviewTimeRange',
  'timeUnit',
  'selectedSlotKeys',
  'appliedUnavailableDates',
  'exclusionState',
] as const

export const APPLICATION_OVERLAY_DYNAMIC_RULES: ReadonlyArray<{
  catalog: ApplicationOverlayCatalogId
  pattern: RegExp
  description: string
}> = [
  {
    catalog: 'application-participant-school',
    pattern: /^application\.institution\.guidanceAnswers$/,
    description: 'Record<fieldId, string>',
  },
  {
    catalog: 'application-participant-individual',
    pattern: /^application\.individual\.teamInfo\./,
    description: 'TEAM_INFO_DOT_PREFIX — suffix teamName|memberCountSelect|customMemberCount|teamRole',
  },
  {
    catalog: 'application-volunteer',
    pattern: /^application\.volunteer\.activitySchedule(?:\.|$)/,
    description: 'InstructorAvailableScheduleParagraph overlayKeyPrefix',
  },
  {
    catalog: 'application-volunteer',
    pattern: /^application\.volunteer\.interview(?:\.|$)/,
    description: 'buildVolunteerInterviewOverlayKey(application, suffix[, exception.n])',
  },
]

/** 소스에 등장하지만 제품 저장 sink가 아닌 키 */
export const APPLICATION_OVERLAY_TEST_ONLY_KEYS = [
  'application.institution.memo',
  'application.instructor.memo',
  'application.volunteer.essay',
  'application.institution.draft',
  'application.volunteer.draft',
] as const

export type ApplicationOverlaySidecar = {
  id: string
  store: string
  programPatch: boolean
  formVersionOverlay: boolean
  notes: string
}

export const APPLICATION_NON_OVERLAY_SIDECARS: readonly ApplicationOverlaySidecar[] = [
  {
    id: 'sexOffense.submissionRequest',
    store: 'institution-application-form-visibility',
    programPatch: false,
    formVersionOverlay: false,
    notes: '라디오 선택은 overlay 키가 아님. 등록 위저드 표시용 sidecar',
  },
  {
    id: 'thirdPartyRecipient',
    store: 'WritingFormDraft cells',
    programPatch: false,
    formVersionOverlay: true,
    notes: '필수 검증은 overlay가 아니라 draft 셀. listIncompleteApplicationFormThirdPartyRecipientKeys',
  },
  {
    id: 'volunteer.freeTextItems',
    store: 'uncontrolled CmsTextArea',
    programPatch: false,
    formVersionOverlay: false,
    notes: '봉사자 자유작성은 overlay KV를 쓰지 않음. 템플릿 미리보기 로컬 입력',
  },
]

export function isInventoriedApplicationOverlayKey(key: string): boolean {
  if (APPLICATION_OVERLAY_KEY_INVENTORY.some(entry => entry.key === key)) return true
  if ((APPLICATION_OVERLAY_TEST_ONLY_KEYS as readonly string[]).includes(key)) return true
  return APPLICATION_OVERLAY_DYNAMIC_RULES.some(rule => rule.pattern.test(key))
}

export function applicationOverlayInventoryKeys(): string[] {
  return APPLICATION_OVERLAY_KEY_INVENTORY.map(entry => entry.key)
}
