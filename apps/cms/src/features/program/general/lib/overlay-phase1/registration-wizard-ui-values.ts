/**
 * 일반 신규 등록 위저드 — RHF UI 정본.
 * Overlay KV 키를 폼 루트로 쓰지 않는다. CommonInfoFormValues 변환은 adapter에서만.
 */
import type { ProgramRegistrationParticipantSelection } from '@/features/template/lib/program-registration-editor-state'
import type {
  ProgramRegistrationEducationScheduleMode,
  ProgramRegistrationScheduleDetailKind,
  ProgramRegistrationSessionRoundType,
  ProgramRegistrationType,
} from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { PRE_EDUCATION_SCHEDULE_LABEL } from '@/features/program/general/lib/schedule-detail-form'
import {
  DEFAULT_REGISTRATION_EDUCATION_FORM,
  DEFAULT_REGISTRATION_PARTICIPATION,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-education-form-options'
import { emptyCurriculumMaps, emptyScheduleMaps } from './common-info-domain'
import type {
  CommonInfoCurriculumMaps,
  CommonInfoIpsValue,
  CommonInfoScheduleMaps,
  CommonInfoSurveyItems,
} from './common-info-form-values'
import type { RecruitmentFormValues } from './recruitment-form-values'

export const REGISTRATION_WIZARD_RHF_SETTINGS_KEY = 'registrationWizardRhf' as const

export type RegistrationWizardUiExtras = {
  programType: ProgramRegistrationType
  sessionRoundType: ProgramRegistrationSessionRoundType
  educationScheduleMode: ProgramRegistrationEducationScheduleMode
  educationFormScheduleDetail: ProgramRegistrationScheduleDetailKind
  participationScheduleDetail: ProgramRegistrationScheduleDetailKind
  ipsScheduleDetail: ProgramRegistrationScheduleDetailKind
  curriculumSessionCount: number
  curriculumChartSessionCount: number
  scheduleCurriculumDetailCount: number
  scheduleCurriculumGroupCount: number
  scheduleCurriculumPreEducation: boolean
  participant: ProgramRegistrationParticipantSelection
}

export type RegistrationWizardUiValues = {
  programTitleKo: string
  programTitleEn: string
  publicProgramTitle: string
  detailedProgramId: string
  detailedProgramName: string
  businessField: string
  partnerInvolvement: string
  educationVenueKind: string
  educationVenueDetail: string
  educationCourse: string
  ipOwned: string
  courseDeliveredBy: string
  operationRangeSeal: { start: string; end: string } | null
  operationAnchorIso: string | null
  surveyItems: CommonInfoSurveyItems
  sponsorIds: string[]
  sponsorId: string
  managerContactIds: string[]
  managerContactId: string
  sponsorManagerLine: string
  kpiParticipantCount: number | null
  kpiInstructor: number | null
  kpiVolunteer: number | null
  kpiDispatchedSchool: number | null
  kpiDispatchedClass: number | null
  wageGrade1Fee: number | undefined
  wageGrade2Fee: number | undefined
  wageGrade3Fee: number | undefined
  paymentItemValues: string[]
  paymentItemLabels: string
  singleEducationForm: string
  multiCommonEducationForm: string
  legacyEducationForm: string
  singleParticipation: string
  multiCommonParticipation: string
  ipsType: CommonInfoIpsValue
  scheduleLines: string[]
  singleDateIso: string | null
  periodDateIso: string | null
  footerIpsType: CommonInfoIpsValue
  /** 개인 대상 — 교육 진행 장소 일정 공통/일정 별 상이 */
  educationPlaceScheduleDetail: ProgramRegistrationScheduleDetailKind
  /** 일정 공통 교육 진행 장소(주소) */
  educationPlaceAddress: string
  /** 커리큘럼형 차시/회차 별 교육 진행 장소 */
  educationPlaceBySession: Record<number, string>
  /** 일정형 세부/행사 일정 별 교육 진행 장소 */
  educationPlaceByDetail: Record<number, string>
  curriculum: CommonInfoCurriculumMaps
  schedule: CommonInfoScheduleMaps
  extras: RegistrationWizardUiExtras
  recruitment: RecruitmentFormValues
  recruitmentKv: Record<string, unknown>
  applicationKv: Record<string, unknown>
}

export function createDefaultRegistrationWizardUiExtras(): RegistrationWizardUiExtras {
  return {
    programType: 'curriculum',
    sessionRoundType: 'single',
    educationScheduleMode: 'date',
    educationFormScheduleDetail: 'common',
    participationScheduleDetail: 'common',
    ipsScheduleDetail: 'common',
    curriculumSessionCount: 1,
    curriculumChartSessionCount: 1,
    scheduleCurriculumDetailCount: 1,
    scheduleCurriculumGroupCount: 1,
    scheduleCurriculumPreEducation: false,
    participant: {
      individual: false,
      organization: false,
      teacherInstructor: false,
      volunteer: false,
    },
  }
}

export function createDefaultRegistrationWizardUiValues(
  extras?: Partial<RegistrationWizardUiExtras>
): RegistrationWizardUiValues {
  return {
    programTitleKo: '',
    programTitleEn: '',
    publicProgramTitle: '',
    detailedProgramId: '',
    detailedProgramName: '',
    businessField: '',
    partnerInvolvement: '',
    educationVenueKind: '',
    educationVenueDetail: '',
    educationCourse: '',
    ipOwned: '',
    courseDeliveredBy: '',
    operationRangeSeal: null,
    operationAnchorIso: null,
    surveyItems: {},
    sponsorIds: [],
    sponsorId: '',
    managerContactIds: [],
    managerContactId: '',
    sponsorManagerLine: '',
    kpiParticipantCount: null,
    kpiInstructor: null,
    kpiVolunteer: null,
    kpiDispatchedSchool: null,
    kpiDispatchedClass: null,
    wageGrade1Fee: undefined,
    wageGrade2Fee: undefined,
    wageGrade3Fee: undefined,
    paymentItemValues: [],
    paymentItemLabels: '',
    singleEducationForm: '',
    multiCommonEducationForm: '',
    legacyEducationForm: '',
    singleParticipation: '',
    multiCommonParticipation: '',
    ipsType: { category: '', detail: '' },
    scheduleLines: [],
    singleDateIso: null,
    periodDateIso: null,
    footerIpsType: { category: '', detail: '' },
    educationPlaceScheduleDetail: 'common',
    educationPlaceAddress: '',
    educationPlaceBySession: {},
    educationPlaceByDetail: {},
    curriculum: {
      ...emptyCurriculumMaps(),
      preEducationScheduleName: PRE_EDUCATION_SCHEDULE_LABEL,
    },
    schedule: {
      ...emptyScheduleMaps(),
      preEducationName: PRE_EDUCATION_SCHEDULE_LABEL,
    },
    extras: {
      ...createDefaultRegistrationWizardUiExtras(),
      ...extras,
    },
    recruitment: {},
    recruitmentKv: {},
    applicationKv: {},
  }
}

/**
 * 신규 작성 시작값 — 단일 회차 교육 형태·참여 방식을 왼쪽 값(온라인·개인)으로 선택해 둔다.
 * 설문 진행 항목(설문조사·만족도조사·강의평가)은 시안대로 모두 선택해 둔다.
 * 임시저장 복원·재조회 hydrate 는 `createDefaultRegistrationWizardUiValues` 를 그대로 써서 저장값을 덮지 않는다.
 * 복수 회차 일정 공통 값은 비워 두어 기존처럼 단일 회차 값에서 시드한다.
 */
export function createNewRegistrationWizardUiValues(
  extras?: Partial<RegistrationWizardUiExtras>
): RegistrationWizardUiValues {
  return {
    ...createDefaultRegistrationWizardUiValues(extras),
    singleEducationForm: DEFAULT_REGISTRATION_EDUCATION_FORM,
    singleParticipation: DEFAULT_REGISTRATION_PARTICIPATION,
    surveyItems: { survey: true, satisfaction: true, lecture_evaluation: true },
  }
}

export function cloneRegistrationWizardUiValues(
  values: RegistrationWizardUiValues
): RegistrationWizardUiValues {
  return structuredClone(values)
}
