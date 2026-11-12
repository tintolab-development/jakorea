import type { ProgramRegistrationIpsCategory } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'
import {
  createUjatSurveyItemsDefault,
  type UjatSurveyRowId,
} from '@/features/program/ujat/lib/registration-survey-items'

export type { UjatSurveyRowId }
export { createUjatSurveyItemsDefault }

export const UJAT_REGISTRATION_TEMPLATE_ID = 'registration-ujat' as const

/** 대표 프로그램명 입력 예시 — 신규 등록 폼에는 placeholder 로만 쓴다(QA-0389-8556). 상세 빈 값 표시용 대체값으로도 쓴다. */
export const UJAT_BASIC_INFO_REP_KO_DEFAULT = '대학생경제교육봉사단'
export const UJAT_BASIC_INFO_REP_EN_DEFAULT = 'University Students JA Team'
export const UJAT_BASIC_INFO_PROGRAM_MANAGEMENT_DEFAULT =
  'JA Korea 초등 경제교육 대상 학교 및 대학생경제교육봉사단 모집'

export const UJAT_DETAILED_PROGRAM_UJAT_VALUE = '__ujat_volunteer_core__' as const
export const UJAT_DETAILED_PROGRAM_UJAT_LABEL = '대학생경제교육봉사단'

/** 목록 필터 전용. 등록·수정 폼 옵션에 넣지 않는다. */
export const UJAT_SPONSOR_ALL_VALUE = '__all__' as const
export const UJAT_SPONSOR_FILTER_ALL_OPTION = {
  value: UJAT_SPONSOR_ALL_VALUE,
  label: '전체',
} as const

export const UJAT_DEFAULT_SPONSOR_ID = ''

export function resolveUjatDefaultSponsorId(_sponsors: readonly SponsorManagementRow[] = []): string {
  return ''
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
  sponsorContactId: string
  sponsorManagerName: string
  ipOwned: string
  courseDeliveredBy: string
  ipsCategory: ProgramRegistrationIpsCategory | ''
  surveyItems: Record<UjatSurveyRowId, boolean>
  educationCourse: string
  partnerInvolvement: 'yes' | 'no' | ''
}

export function createUjatRegistrationBasicInfoOverlayDefaults(
  sponsors: readonly SponsorManagementRow[] = []
): UjatRegistrationBasicInfoOverlayDefaults {
  return {
    repKo: UJAT_BASIC_INFO_REP_KO_DEFAULT,
    repEn: UJAT_BASIC_INFO_REP_EN_DEFAULT,
    programManagementName: UJAT_BASIC_INFO_PROGRAM_MANAGEMENT_DEFAULT,
    detailedProgramId: '',
    operationRangeSeal: null,
    participantIndividual: false,
    participantOrganization: true,
    participantTeacher: false,
    participantVolunteer: true,
    businessField: '',
    sponsorId: resolveUjatDefaultSponsorId(sponsors),
    sponsorContactId: '',
    sponsorManagerName: '',
    ipOwned: '',
    courseDeliveredBy: '',
    ipsCategory: '',
    surveyItems: createUjatSurveyItemsDefault(),
    educationCourse: '',
    partnerInvolvement: '',
  }
}
