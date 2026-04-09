export type TemplateVariant = 'default' | 'volunteer' | 'curriculum'

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
const VOLUNTEER_MODAL_SECTIONS = ['봉사자 신청 정보', '학력사항', '경력사항', 'JA Korea 활동 경험'] as const

const createRows = (prefix: string, definitions: TemplateDefinition[]): TemplateRow[] =>
  definitions.map((definition, index) => ({
    ...definition,
    key: `${prefix}-${index + 1}`,
    no: index + 1,
    creator: '시스템 생성',
    createdAt: '2026. 09. 15',
    updatedAt: '-',
  }))

const registrationDefinitions: TemplateDefinition[] = [
  {
    id: 'registration-general-keywording',
    templateName: '일반 프로그램 등록 정보 (주입 키워딩 ver.)',
    variant: 'default',
  },
  {
    id: 'registration-general-curriculum',
    templateName: '일반 프로그램 등록 정보 폼 (교육 커리큘럼 ver.)',
    variant: 'curriculum',
  },
  { id: 'registration-economy', templateName: '경제교육 프로그램 등록 정보', variant: 'default' },
  { id: 'registration-keminior', templateName: '케미니어 프로그램 등록 정보', variant: 'default' },
  { id: 'registration-instructor-1', templateName: '프로그램 강사 모집 폼', variant: 'default' },
  { id: 'registration-instructor-2', templateName: '프로그램 강사 모집 폼', variant: 'default' },
  { id: 'registration-volunteer', templateName: '프로그램 봉사자 모집 폼', variant: 'volunteer' },
  { id: 'registration-ujat-volunteer', templateName: 'U JAT 봉사자 모집 폼', variant: 'volunteer' },
]

const applicationDefinitions: TemplateDefinition[] = [
  {
    id: 'application-general-lecture',
    templateName: '일반 프로그램 신청 폼 (강의계획형 ver.)',
    variant: 'default',
  },
  {
    id: 'application-general-education',
    templateName: '일반 프로그램 신청 폼 (교육형 ver.)',
    variant: 'default',
  },
  { id: 'application-economy', templateName: '경제교육 프로그램 신청폼', variant: 'default' },
  { id: 'application-keminior', templateName: '케미니어 프로그램 신청폼', variant: 'default' },
  { id: 'application-instructor-1', templateName: '프로그램 강사 신청 폼', variant: 'default' },
  { id: 'application-instructor-2', templateName: '프로그램 강사 신청 폼', variant: 'default' },
  { id: 'application-ujat-volunteer', templateName: 'U JAT 봉사신청 폼', variant: 'volunteer' },
]

const surveyDefinitions: TemplateDefinition[] = [
  { id: 'survey-default', templateName: '설문조사', variant: 'default' },
  { id: 'survey-student', templateName: '만족도조사 (학생)', variant: 'default' },
  { id: 'survey-teacher', templateName: '만족도조사 (교사)', variant: 'default' },
  { id: 'survey-admin', templateName: '강의 평가 (관리자용)', variant: 'default' },
]

const agreementDefinitions: TemplateDefinition[] = [
  { id: 'agreement-personal', templateName: '개인정보 수집 동의서', variant: 'default' },
  { id: 'agreement-third-party', templateName: '제3자 서류업 동의서', variant: 'default' },
  { id: 'agreement-crime', templateName: '성범죄 경력조회 동의서', variant: 'default' },
  { id: 'agreement-notice', templateName: '플랫폼 내 공지사항 사전 동의서', variant: 'default' },
  { id: 'agreement-expense', templateName: '교재비/여비 정산 서약서', variant: 'default' },
  { id: 'agreement-portrait', templateName: '초상권 동의서', variant: 'default' },
]

export const writingSections: TemplateSection[] = [
  {
    key: 'registration',
    title: '등록 양식',
    description: '프로그램 등록 시 수정/편집이 가능한 양식입니다.',
    rows: createRows('registration', registrationDefinitions),
  },
  {
    key: 'application',
    title: '신청 양식',
    description: '프로그램 등록 시 수정/편집이 가능한 양식입니다.',
    rows: createRows('application', applicationDefinitions),
  },
  {
    key: 'survey',
    title: '설문 양식',
    description: '프로그램 등록 시 수정/편집이 가능한 양식입니다.',
    rows: createRows('survey', surveyDefinitions),
  },
  {
    key: 'agreement',
    title: '동의 양식',
    description: '모든 화면에 동일한 구조로 노출되는 양식입니다.',
    rows: createRows('agreement', agreementDefinitions),
  },
]

export const TEMPLATE_MODAL_SECTIONS_BY_VARIANT: Record<TemplateVariant, readonly string[]> = {
  default: DEFAULT_MODAL_SECTIONS,
  volunteer: VOLUNTEER_MODAL_SECTIONS,
  curriculum: DEFAULT_MODAL_SECTIONS,
}
