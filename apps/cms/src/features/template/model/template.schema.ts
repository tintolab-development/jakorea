export type TemplateVariant = 'default' | 'volunteer'

export interface TemplateDefinition {
  id: string
  templateName: string
  variant: TemplateVariant
}

export interface TemplateRow extends TemplateDefinition {
  key: string
  no: number
  creator: string
  createdAt: string
  updatedAt: string
}

export interface TemplateSection {
  key: string
  title: string
  description: string
  rows: TemplateRow[]
}

const DEFAULT_MODAL_SECTIONS = ['기본 정보', '신청자 정보', '동의 항목'] as const
const VOLUNTEER_MODAL_SECTIONS = [
  '봉사자 신청 정보',
  '학력사항',
  '경력사항',
  'JA Korea 활동 희망',
] as const

const createRows = (
  prefix: string,
  definitions: TemplateDefinition[],
  options?: { startNo?: number }
): TemplateRow[] =>
  definitions.map((definition, index) => ({
    ...definition,
    key: `${prefix}-${index + 1}`,
    no: (options?.startNo ?? 1) + index,
    creator: '시스템 생성',
    createdAt: '2026. 09. 15',
    updatedAt: '-',
  }))

const registrationDefinitions: TemplateDefinition[] = [
  { id: 'registration-general', templateName: '일반 프로그램 등록 폼', variant: 'default' },
  { id: 'registration-economy', templateName: '1사1교 프로그램 등록 폼', variant: 'default' },
  { id: 'registration-ujat', templateName: 'UJAT 프로그램 등록 폼', variant: 'default' },
  {
    id: 'registration-trained-teachers',
    templateName: '교육받은 교사 프로그램 등록 폼',
    variant: 'default',
  },
]

/** Notion 2-0. 모집 양식 순서 */
const recruitmentDefinitions: TemplateDefinition[] = [
  { id: 'recruitment-instructor', templateName: '공통_강사 모집 폼', variant: 'default' },
  { id: 'recruitment-volunteer', templateName: '공통_봉사자 모집 폼', variant: 'volunteer' },
  {
    id: 'recruitment-participant-school',
    templateName: '일반_참여 기관 모집 폼',
    variant: 'default',
  },
  {
    id: 'recruitment-participant-individual',
    templateName: '일반_참여자 모집 폼',
    variant: 'default',
  },
  {
    id: 'recruitment-economy',
    templateName: '1사1교_참여 기관 모집 폼',
    variant: 'default',
  },
  {
    id: 'recruitment-gemini-visiting-training',
    templateName: 'Gemini_찾아가는 연수 모집 폼',
    variant: 'default',
  },
  { id: 'recruitment-ujat-school', templateName: 'UJAT_참여 기관 모집 폼', variant: 'default' },
  {
    id: 'recruitment-ujat-volunteer',
    templateName: 'UJAT_봉사자 모집 폼',
    variant: 'volunteer',
  },
  {
    id: 'recruitment-trained-teachers',
    templateName: '교육받은 교사_참여 기관 모집 폼',
    variant: 'default',
  },
]

/** Notion 3-0. 신청 양식 순서 */
const applicationDefinitions: TemplateDefinition[] = [
  { id: 'application-instructor', templateName: '공통_강사 신청 폼', variant: 'default' },
  { id: 'application-volunteer', templateName: '공통_봉사자 신청 폼', variant: 'volunteer' },
  {
    id: 'application-participant-school',
    templateName: '일반_참여 기관 신청 폼',
    variant: 'default',
  },
  {
    id: 'application-participant-individual',
    templateName: '일반_참여자 신청 폼',
    variant: 'default',
  },
  {
    id: 'application-economy',
    templateName: '1사1교_참여 기관 신청 폼',
    variant: 'default',
  },
  {
    id: 'application-gemini-visiting-training-school',
    templateName: 'Gemini_찾아가는 연수 참여 기관 신청 폼',
    variant: 'default',
  },
  {
    id: 'application-gemini-visiting-training-instructor',
    templateName: 'Gemini_찾아가는 연수 강사 신청 폼',
    variant: 'default',
  },
  {
    id: 'application-ujat-school',
    templateName: 'UJAT_참여 기관 신청 폼',
    variant: 'default',
  },
  {
    id: 'application-ujat-volunteer',
    templateName: 'UJAT_봉사자 신청 폼',
    variant: 'volunteer',
  },
  {
    id: 'application-trained-teachers',
    templateName: '교육받은 교사_참여 기관 신청 폼',
    variant: 'default',
  },
]

const surveyDefinitions: TemplateDefinition[] = [
  { id: 'survey-default', templateName: '설문조사', variant: 'default' },
  { id: 'survey-student', templateName: '만족도조사 (학생용)', variant: 'default' },
  { id: 'survey-teacher', templateName: '만족도조사 (교사용)', variant: 'default' },
  { id: 'survey-admin', templateName: '강의평가 (관리자용)', variant: 'default' },
]

/** Notion 5-0. 동의 양식 순서 */
const agreementDefinitions: TemplateDefinition[] = [
  { id: 'agreement-portrait', templateName: '초상권 수집·이용 동의', variant: 'default' },
  { id: 'agreement-third-party', templateName: '지급조서 사전 동의서', variant: 'default' },
  {
    id: 'agreement-crime',
    templateName: '성범죄 경력조회 및 아동학대 관련 범죄전력조회 동의서',
    variant: 'default',
  },
  { id: 'agreement-notice', templateName: '행정정보 공동이용 사전 동의서', variant: 'default' },
  { id: 'agreement-expense', templateName: '교육진행자 동의 서약서', variant: 'default' },
]

export const writingSections: TemplateSection[] = [
  {
    key: 'registration',
    title: '등록 양식',
    description: '모든 항목의 추가 및 삭제, 수정이 불가한 양식입니다.',
    rows: createRows('registration', registrationDefinitions),
  },
  {
    key: 'application',
    title: '모집 양식',
    description: '모든 항목의 추가 및 삭제, 수정이 불가한 양식입니다.',
    rows: createRows('recruitment', recruitmentDefinitions),
  },
  {
    key: 'application_form',
    title: '신청 양식',
    description:
      '기존 항목의 삭제가 불가하며, 일부 텍스트만 수정이 가능합니다. 필요한 항목은 직접 추가 가능한 양식입니다.',
    rows: createRows('application', applicationDefinitions),
  },
  {
    key: 'survey',
    title: '설문 양식',
    description: '모든 항목의 추가 및 삭제, 수정이 가능한 양식입니다.',
    rows: createRows('survey', surveyDefinitions),
  },
  {
    key: 'agreement',
    title: '동의 양식',
    description:
      '모든 항목의 추가 및 삭제가 불가하며, 일부 텍스트만 수정이 가능합니다. (*성범죄 경력조회 동의서는 수정이 불가합니다.)',
    rows: createRows('agreement', agreementDefinitions),
  },
]

export const TEMPLATE_MODAL_SECTIONS_BY_VARIANT: Record<TemplateVariant, readonly string[]> = {
  default: DEFAULT_MODAL_SECTIONS,
  volunteer: VOLUNTEER_MODAL_SECTIONS,
}
