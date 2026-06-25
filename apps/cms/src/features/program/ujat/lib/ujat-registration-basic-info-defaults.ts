import { mockSponsorManagementListRows } from '@/data/mock/sponsor-management-list'
import type { ProgramRegistrationIpsCategory } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'
import {
  initialProgramRegistrationSurveyItems,
  type ProgramRegistrationSurveyItemId,
} from '@/features/template/lib/program-registration-survey-items'

export const UJAT_REGISTRATION_TEMPLATE_ID = 'registration-ujat' as const

export const UJAT_BASIC_INFO_REP_KO_DEFAULT = '대학생경제교육봉사단'
export const UJAT_BASIC_INFO_REP_EN_DEFAULT = 'University Students JA Team'
export const UJAT_BASIC_INFO_PROGRAM_MANAGEMENT_DEFAULT =
  'JA Korea 초등 경제교육 대상 학교 및 대학생경제교육봉사단 모집'

export const UJAT_DETAILED_PROGRAM_UJAT_VALUE = '__ujat_volunteer_core__' as const
export const UJAT_DETAILED_PROGRAM_UJAT_LABEL = '대학생경제교육봉사단'

export const UJAT_SPONSOR_ALL_VALUE = '__all__' as const

export const UJAT_DEFAULT_SPONSOR_ID =
  mockSponsorManagementListRows.find(s => s.name === '제이에이코리아')?.id ?? UJAT_SPONSOR_ALL_VALUE

export type UjatSurveyRowId = ProgramRegistrationSurveyItemId

export function createUjatSurveyItemsDefault(): Record<UjatSurveyRowId, boolean> {
  return initialProgramRegistrationSurveyItems(true)
}

export const UJAT_SURVEY_ITEMS_DEFAULT = createUjatSurveyItemsDefault()

export type UjatRegistrationBasicInfoOverlayDefaults = {
  repKo: string
  repEn: string
  programManagementName: string
  detailedProgramId: string
  operationRangeSeal: { start: string; end: string } | null
  participantIndividual: boolean
  participantOrganization: boolean
  participantTeacher: boolean
  participantVolunteer: boolean
  businessField: string
  sponsorId: string
  ipOwned: string
  courseDeliveredBy: string
  ipsCategory: ProgramRegistrationIpsCategory
  surveyItems: Record<UjatSurveyRowId, boolean>
  educationCourse: string
  partnerInvolvement: 'yes' | 'no'
}

export function createUjatRegistrationBasicInfoOverlayDefaults(): UjatRegistrationBasicInfoOverlayDefaults {
  return {
    repKo: UJAT_BASIC_INFO_REP_KO_DEFAULT,
    repEn: UJAT_BASIC_INFO_REP_EN_DEFAULT,
    programManagementName: UJAT_BASIC_INFO_PROGRAM_MANAGEMENT_DEFAULT,
    detailedProgramId: UJAT_DETAILED_PROGRAM_UJAT_VALUE,
    operationRangeSeal: null,
    participantIndividual: false,
    participantOrganization: true,
    participantTeacher: false,
    participantVolunteer: true,
    businessField: 'economy_finance',
    sponsorId: UJAT_DEFAULT_SPONSOR_ID,
    ipOwned: 'ja',
    courseDeliveredBy: 'ja',
    ipsCategory: 'prepare',
    surveyItems: createUjatSurveyItemsDefault(),
    educationCourse: '',
    partnerInvolvement: 'no',
  }
}
