import type { TemplateVariant } from './template-variant.js'

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
    description: '모든 항목의 추가 및 삭제, 수정이 불가한 양식입니다.',
    category: 'REGISTRATION',
  },
  {
    key: 'application',
    title: '모집 양식',
    description: '모든 항목의 추가 및 삭제, 수정이 불가한 양식입니다.',
    category: 'RECRUITMENT',
  },
  {
    key: 'application_form',
    title: '신청 양식',
    description:
      '기존 항목의 삭제가 불가하며, 일부 텍스트만 수정이 가능합니다. 필요한 항목은 직접 추가 가능한 양식입니다.',
    category: 'APPLICATION',
  },
  {
    key: 'survey',
    title: '설문 양식',
    description: '모든 항목의 추가 및 삭제, 수정이 가능한 양식입니다.',
    category: 'SURVEY',
  },
  {
    key: 'agreement',
    title: '동의 양식',
    description:
      '모든 항목의 추가 및 삭제가 불가하며, 일부 텍스트만 수정이 가능합니다. (*성범죄 경력조회 동의서는 수정이 불가합니다.)',
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
    templateName: '1사1교 프로그램 등록 폼',
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
    templateName: '일반_참여 기관 모집 폼',
    category: 'RECRUITMENT',
    variant: 'default',
  },
  'recruitment-economy': {
    templateName: '1사1교_참여 기관 모집 폼',
    category: 'RECRUITMENT',
    variant: 'default',
  },
  'recruitment-participant-individual': {
    templateName: '일반_참여자 모집 폼',
    category: 'RECRUITMENT',
    variant: 'default',
  },
  'recruitment-instructor': {
    templateName: '공통_강사 모집 폼',
    category: 'RECRUITMENT',
    variant: 'default',
  },
  'recruitment-volunteer': {
    templateName: '공통_봉사자 모집 폼',
    category: 'RECRUITMENT',
    variant: 'volunteer',
  },
  'recruitment-ujat-school': {
    templateName: 'UJAT_참여 기관 모집 폼',
    category: 'RECRUITMENT',
    variant: 'default',
  },
  'recruitment-ujat-volunteer': {
    templateName: 'UJAT_봉사자 모집 폼',
    category: 'RECRUITMENT',
    variant: 'volunteer',
  },
  'recruitment-gemini-visiting-training': {
    templateName: 'Gemini_찾아가는 연수 모집 폼',
    category: 'RECRUITMENT',
    variant: 'default',
  },
  'recruitment-trained-teachers': {
    templateName: '교육받은 교사_참여 기관 모집 폼',
    category: 'RECRUITMENT',
    variant: 'default',
  },
  'application-participant-school': {
    templateName: '일반_참여 기관 신청 폼',
    category: 'APPLICATION',
    variant: 'default',
  },
  'application-participant-individual': {
    templateName: '일반_참여자 신청 폼',
    category: 'APPLICATION',
    variant: 'default',
  },
  'application-instructor': {
    templateName: '공통_강사 신청 폼',
    category: 'APPLICATION',
    variant: 'default',
  },
  'application-volunteer': {
    templateName: '공통_봉사자 신청 폼',
    category: 'APPLICATION',
    variant: 'volunteer',
  },
  'application-economy': {
    templateName: '1사1교_참여 기관 신청 폼',
    category: 'APPLICATION',
    variant: 'default',
  },
  'application-trained-teachers': {
    templateName: '교육받은 교사_참여 기관 신청 폼',
    category: 'APPLICATION',
    variant: 'default',
  },
  'application-gemini-visiting-training-instructor': {
    templateName: 'Gemini_찾아가는 연수 강사 신청 폼',
    category: 'APPLICATION',
    variant: 'default',
  },
  'application-gemini-visiting-training-school': {
    templateName: 'Gemini_찾아가는 연수 참여 기관 신청 폼',
    category: 'APPLICATION',
    variant: 'default',
  },
  'application-ujat-school': {
    templateName: 'UJAT_참여 기관 신청 폼',
    category: 'APPLICATION',
    variant: 'default',
  },
  'application-ujat-volunteer': {
    templateName: 'UJAT_봉사자 신청 폼',
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
    templateName: '강의평가 (관리자용)',
    category: 'SURVEY',
    variant: 'default',
  },
  'agreement-third-party': {
    templateName: '지급조서 사전 동의서',
    category: 'AGREEMENT',
    variant: 'default',
  },
  'agreement-crime': {
    templateName: '성범죄 경력조회 및 아동학대 관련 범죄전력조회 동의서',
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
    templateName: '초상권 수집·이용 동의',
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

/**
 * 발급 양식 templateCode(SSOT) ↔ API category.
 * 시드/레거시 코드도 유지한다. 목록 노출은 `ISSUANCE_FORM_LIST_TEMPLATE_CODES`만.
 */
export const ISSUANCE_TEMPLATE_CODE_CATALOG: Record<string, IssuanceTemplateCodeCatalogEntry> = {
  'issuance-1': { templateName: 'UJAT 결과리포트', category: 'REPORT' },
  'issuance-2': { templateName: 'UJAT 교육계획서', category: 'REPORT' },
  'issuance-ujat-edu-journal': { templateName: 'UJAT 교육일지', category: 'REPORT' },
  'issuance-3': { templateName: '강의보고서', category: 'REPORT' },
  'issuance-4': { templateName: '정산 신청서', category: 'REPORT' },
  'issuance-5': { templateName: '결과보고서', category: 'REPORT' },
  'document-payment-order-issue': { templateName: '지급조서 (발급용)', category: 'DOCUMENT' },
  'document-payment-order-pre-consent': { templateName: '지급조서 사전 동의서', category: 'DOCUMENT' },
  'document-1': { templateName: '지출증빙서류(필수폼)', category: 'DOCUMENT' },
  'document-2': { templateName: '휴가 인증서', category: 'DOCUMENT' },
  'document-3': { templateName: '수료증', category: 'DOCUMENT' },
  'document-participation-certificate': { templateName: '참가인증서', category: 'DOCUMENT' },
  'document-4': { templateName: '강사 활동 인증서', category: 'DOCUMENT' },
  'document-5': { templateName: '봉사 활동 인증서', category: 'DOCUMENT' },
}

/**
 * Notion 발급 양식 목록 노출 순서 (보고 5 + 서류 5).
 * 제외: issuance-1, document-payment-order-pre-consent, document-1, document-2
 */
export const ISSUANCE_FORM_LIST_TEMPLATE_CODES = [
  'issuance-2',
  'issuance-ujat-edu-journal',
  'issuance-3',
  'issuance-4',
  'issuance-5',
  'document-payment-order-issue',
  'document-participation-certificate',
  'document-3',
  'document-4',
  'document-5',
] as const

export type IssuanceFormListTemplateCode = (typeof ISSUANCE_FORM_LIST_TEMPLATE_CODES)[number]

const ISSUANCE_FORM_LIST_TEMPLATE_CODE_SET = new Set<string>(ISSUANCE_FORM_LIST_TEMPLATE_CODES)

export function isIssuanceFormListTemplateCode(templateCode?: string): boolean {
  if (templateCode == null || templateCode === '') return false
  return ISSUANCE_FORM_LIST_TEMPLATE_CODE_SET.has(templateCode)
}

/**
 * Payload D — `settingsJson` only (schemaJson null / empty paragraphs 허용).
 * UI는 `settingsJson`만 소비한다. `schemaJson.paragraphs`로 그리지 않는다.
 * `document-2`(휴가 인증서)는 목록 비노출·시드/레거시용.
 */
export const CERTIFICATE_ISSUANCE_TEMPLATE_CODES = [
  'document-2',
  'document-3',
  'document-participation-certificate',
  'document-4',
  'document-5',
] as const

export type CertificateIssuanceTemplateCode =
  (typeof CERTIFICATE_ISSUANCE_TEMPLATE_CODES)[number]

const CERTIFICATE_ISSUANCE_TEMPLATE_CODE_SET = new Set<string>(CERTIFICATE_ISSUANCE_TEMPLATE_CODES)

export function isCertificateIssuanceTemplateCode(templateCode?: string): boolean {
  if (templateCode == null || templateCode === '') return false
  return CERTIFICATE_ISSUANCE_TEMPLATE_CODE_SET.has(templateCode)
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
