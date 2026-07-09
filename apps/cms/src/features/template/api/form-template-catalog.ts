import type { TemplateVariant } from '@/features/template/model/template.schema'

export const WRITING_FORM_TYPE = 'WRITING' as const
export const ISSUANCE_FORM_TYPE = 'ISSUANCE' as const

export type WritingFormCategory =
  | 'REGISTRATION'
  | 'RECRUITMENT'
  | 'APPLICATION'
  | 'SURVEY'
  | 'AGREEMENT'

export interface WritingFormSectionCatalogEntry {
  key: string
  title: string
  description: string
  category: WritingFormCategory
}

export const WRITING_FORM_SECTION_CATALOG: readonly WritingFormSectionCatalogEntry[] = [
  {
    key: 'registration',
    title: '등록 양식',
    description: '프로그램 등록 시 수정/편집이 가능한 양식입니다.',
    category: 'REGISTRATION',
  },
  {
    key: 'application',
    title: '모집 양식',
    description: '프로그램 등록 시 수정/편집이 가능한 양식입니다.',
    category: 'RECRUITMENT',
  },
  {
    key: 'application_form',
    title: '신청 양식',
    description: '프로그램 등록 시 수정/편집이 가능한 양식입니다.',
    category: 'APPLICATION',
  },
  {
    key: 'survey',
    title: '설문 양식',
    description: '프로그램 등록 시 수정·편집이 가능한 양식입니다.',
    category: 'SURVEY',
  },
  {
    key: 'agreement',
    title: '동의 양식',
    description: '모든 화면에 동일한 구조로 노출되는 양식입니다.',
    category: 'AGREEMENT',
  },
] as const

export interface TemplateCodeCatalogEntry {
  templateName: string
  category: WritingFormCategory
  variant: TemplateVariant
}

/** 프론트 templateCode(SSOT) ↔ API category·variant */
export const TEMPLATE_CODE_CATALOG: Record<string, TemplateCodeCatalogEntry> = {
  'registration-general': {
    templateName: '일반 프로그램 등록 폼',
    category: 'REGISTRATION',
    variant: 'default',
  },
  'registration-economy': {
    templateName: '1사 1교 프로그램 등록 폼',
    category: 'REGISTRATION',
    variant: 'default',
  },
  'registration-ujat': {
    templateName: 'UJAT 프로그램 등록 폼',
    category: 'REGISTRATION',
    variant: 'default',
  },
  'registration-trained-teachers': {
    templateName: '교육받은 교사 프로그램 등록 폼',
    category: 'REGISTRATION',
    variant: 'default',
  },
  'recruitment-participant-school': {
    templateName: '프로그램 참여자 모집 폼 (학교)',
    category: 'RECRUITMENT',
    variant: 'default',
  },
  'recruitment-participant-individual': {
    templateName: '프로그램 참여자 모집 폼 (개인)',
    category: 'RECRUITMENT',
    variant: 'default',
  },
  'recruitment-instructor': {
    templateName: '프로그램 강사 모집 폼',
    category: 'RECRUITMENT',
    variant: 'default',
  },
  'recruitment-volunteer': {
    templateName: '프로그램 봉사자 모집 폼',
    category: 'RECRUITMENT',
    variant: 'volunteer',
  },
  'recruitment-ujat-school': {
    templateName: 'UJAT 프로그램 학교 모집 폼',
    category: 'RECRUITMENT',
    variant: 'default',
  },
  'recruitment-ujat-volunteer': {
    templateName: 'UJAT 프로그램 봉사자 모집 폼',
    category: 'RECRUITMENT',
    variant: 'volunteer',
  },
  'application-participant-school': {
    templateName: '프로그램 참여자 신청 폼 (학교)',
    category: 'APPLICATION',
    variant: 'default',
  },
  'application-participant-individual': {
    templateName: '프로그램 참여자 신청 폼 (개인)',
    category: 'APPLICATION',
    variant: 'default',
  },
  'application-instructor': {
    templateName: '프로그램 강사 신청 폼',
    category: 'APPLICATION',
    variant: 'default',
  },
  'application-volunteer': {
    templateName: '프로그램 봉사자 신청 폼',
    category: 'APPLICATION',
    variant: 'volunteer',
  },
  'application-economy': {
    templateName: '1사1교 프로그램 참여자 신청 폼',
    category: 'APPLICATION',
    variant: 'default',
  },
  'application-trained-teachers': {
    templateName: '교육받은 교사 프로그램 참여자 신청 폼',
    category: 'APPLICATION',
    variant: 'default',
  },
  'application-gemini-visiting-training-instructor': {
    templateName: 'Gemini 찾아가는 연수 강사 신청 폼',
    category: 'APPLICATION',
    variant: 'default',
  },
  'application-gemini-visiting-training-school': {
    templateName: 'Gemini 찾아가는 연수 참여 기관 신청 폼',
    category: 'APPLICATION',
    variant: 'default',
  },
  'application-ujat-school': {
    templateName: 'UJAT 프로그램 학교 신청 폼',
    category: 'APPLICATION',
    variant: 'default',
  },
  'application-ujat-volunteer': {
    templateName: 'UJAT 프로그램 봉사자 신청 폼',
    category: 'APPLICATION',
    variant: 'volunteer',
  },
  'survey-default': {
    templateName: '설문조사',
    category: 'SURVEY',
    variant: 'default',
  },
  'survey-student': {
    templateName: '만족도조사 (학생용)',
    category: 'SURVEY',
    variant: 'default',
  },
  'survey-teacher': {
    templateName: '만족도조사 (교사용)',
    category: 'SURVEY',
    variant: 'default',
  },
  'survey-admin': {
    templateName: '강의 평가 (관리자용)',
    category: 'SURVEY',
    variant: 'default',
  },
  'agreement-third-party': {
    templateName: '지급조서 사전 동의서',
    category: 'AGREEMENT',
    variant: 'default',
  },
  'agreement-crime': {
    templateName: '성범죄 경력조회 동의서',
    category: 'AGREEMENT',
    variant: 'default',
  },
  'agreement-notice': {
    templateName: '행정정보 공동이용 사전 동의서',
    category: 'AGREEMENT',
    variant: 'default',
  },
  'agreement-expense': {
    templateName: '교육진행자 동의 서약서',
    category: 'AGREEMENT',
    variant: 'default',
  },
  'agreement-portrait': {
    templateName: '초상권 수집·이용 동의서',
    category: 'AGREEMENT',
    variant: 'default',
  },
}

export function resolveWritingFormCategory(
  templateCode: string,
  apiCategory?: string
): WritingFormCategory | undefined {
  const fromCatalog = TEMPLATE_CODE_CATALOG[templateCode]?.category
  if (fromCatalog) return fromCatalog
  if (
    apiCategory === 'REGISTRATION' ||
    apiCategory === 'RECRUITMENT' ||
    apiCategory === 'APPLICATION' ||
    apiCategory === 'SURVEY' ||
    apiCategory === 'AGREEMENT'
  ) {
    return apiCategory
  }
  return undefined
}

export type IssuanceFormCategory = 'REPORT' | 'DOCUMENT'

export interface IssuanceFormSectionCatalogEntry {
  key: string
  title: string
  description: string
  category: IssuanceFormCategory
}

export const ISSUANCE_FORM_SECTION_CATALOG: readonly IssuanceFormSectionCatalogEntry[] = [
  {
    key: 'issuance-report',
    title: '보고 양식',
    description: '모든 프로그램에 동일한 구조로 노출되는 양식입니다.',
    category: 'REPORT',
  },
  {
    key: 'issuance-document',
    title: '서류 양식',
    description: '모든 프로그램에 동일한 구조로 노출되는 양식입니다.',
    category: 'DOCUMENT',
  },
] as const

export interface IssuanceTemplateCodeCatalogEntry {
  templateName: string
  category: IssuanceFormCategory
}

/** 발급 양식 templateCode(SSOT) ↔ API category */
export const ISSUANCE_TEMPLATE_CODE_CATALOG: Record<string, IssuanceTemplateCodeCatalogEntry> = {
  'issuance-1': { templateName: 'UJAT 결과리포트', category: 'REPORT' },
  'issuance-2': { templateName: 'UJAT 교육계획서', category: 'REPORT' },
  'issuance-ujat-edu-journal': { templateName: 'UJAT 교육일지', category: 'REPORT' },
  'issuance-3': { templateName: '강의보고서', category: 'REPORT' },
  'issuance-4': { templateName: '정산 신청서', category: 'REPORT' },
  'issuance-5': { templateName: '결과보고서', category: 'REPORT' },
  'document-payment-order-issue': { templateName: '지급조서(발급용)', category: 'DOCUMENT' },
  'document-payment-order-pre-consent': { templateName: '지급조서 사전 동의서', category: 'DOCUMENT' },
  'document-1': { templateName: '지출증빙서류(필수폼)', category: 'DOCUMENT' },
  'document-2': { templateName: '휴가 인증서', category: 'DOCUMENT' },
  'document-3': { templateName: '수료증', category: 'DOCUMENT' },
  'document-participation-certificate': { templateName: '참여인증서', category: 'DOCUMENT' },
  'document-4': { templateName: '강사 활동 인증서', category: 'DOCUMENT' },
  'document-5': { templateName: '봉사 활동 인증서', category: 'DOCUMENT' },
}

export function resolveIssuanceFormCategory(
  templateCode: string,
  apiCategory?: string
): IssuanceFormCategory | undefined {
  const fromCatalog = ISSUANCE_TEMPLATE_CODE_CATALOG[templateCode]?.category
  if (fromCatalog) return fromCatalog
  if (apiCategory === 'REPORT' || apiCategory === 'DOCUMENT') {
    return apiCategory
  }
  // BE 실응답 enum (formType=ISSUANCE 하위 분류)
  if (apiCategory === 'ISSUANCE') return 'REPORT'
  if (apiCategory === 'CERTIFICATE') return 'DOCUMENT'
  return undefined
}
