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
import {
  DEFAULT_REGISTRATION_EDUCATION_FORM,
  DEFAULT_REGISTRATION_PARTICIPATION,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-education-form-options'
import { PRE_EDUCATION_SCHEDULE_LABEL } from '@/features/program/general/lib/schedule-detail-form'
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
    partnerInvolvement: 'yes',
    educationVenueKind: 'inside',
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
    singleEducationForm: DEFAULT_REGISTRATION_EDUCATION_FORM,
    multiCommonEducationForm: '',
    legacyEducationForm: '',
    singleParticipation: DEFAULT_REGISTRATION_PARTICIPATION,
    multiCommonParticipation: '',
    ipsType: { category: '', detail: '' },
    scheduleLines: [],
    singleDateIso: null,
    periodDateIso: null,
    footerIpsType: { category: 'prepare', detail: 'none' },
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

export function cloneRegistrationWizardUiValues(
  values: RegistrationWizardUiValues
): RegistrationWizardUiValues {
  return structuredClone(values)
}
