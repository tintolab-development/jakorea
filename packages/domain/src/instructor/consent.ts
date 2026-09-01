import type { DomainSelectOption } from '../shared/types.js'

export const CONSENT_VALUE = {
  agree: 'agree',
  disagree: 'disagree',
} as const

export type ConsentValue = (typeof CONSENT_VALUE)[keyof typeof CONSENT_VALUE]

export const CONSENT_RADIO_OPTIONS: DomainSelectOption<ConsentValue>[] = [
  { value: CONSENT_VALUE.agree, label: '동의' },
  { value: CONSENT_VALUE.disagree, label: '미동의' },
]

export const TERMS_CONSENT_DESCRIPTION =
  '*미동의 시 서비스 가입 및 프로그램 참여에 제한이 있을 수 있습니다.'

/** 가입·등록 필수 동의 (라디오) */
export const INSTRUCTOR_REQUIRED_CONSENT_KEYS = [
  'consentTermsOfService',
  'consentPersonal',
] as const

export type InstructorRequiredConsentKey = (typeof INSTRUCTOR_REQUIRED_CONSENT_KEYS)[number]

export const INSTRUCTOR_CONSENT_RADIO_ITEMS = [
  {
    key: 'consentTermsOfService' as const,
    label: '서비스 이용약관',
    required: true,
  },
  {
    key: 'consentPersonal' as const,
    label: '개인정보 수집·이용 동의',
    required: true,
  },
  {
    key: 'consentMarketing' as const,
    label: '마케팅 제공 동의',
    required: false,
  },
] as const

/** 동의서 작성 후 동의로 표시되는 항목 */
export const INSTRUCTOR_CONSENT_DOCUMENT_ITEMS = [
  {
    key: 'consentPortrait' as const,
    label: '초상권 수집·이용 동의',
  },
  {
    key: 'consentPaymentStatement' as const,
    label: '지급조서 사전 동의서',
  },
  {
    key: 'consentEducatorPledge' as const,
    label: '교육진행자 서약서',
  },
  {
    key: 'consentAdministrativeJoint' as const,
    label: '행정정보 공동이용 사전동의서',
  },
  {
    key: 'consentSexOffenseCheck' as const,
    label: '성범죄 경력 조회 동의서',
  },
] as const

export type InstructorConsentDocumentKey =
  (typeof INSTRUCTOR_CONSENT_DOCUMENT_ITEMS)[number]['key']

/** CMS 강사 신규 등록 — 약관 및 동의 섹션 전체 필드 */
export const INSTRUCTOR_REGISTER_ALL_CONSENT_KEYS = [
  ...INSTRUCTOR_CONSENT_RADIO_ITEMS.map(item => item.key),
  ...INSTRUCTOR_CONSENT_DOCUMENT_ITEMS.map(item => item.key),
] as const

export type InstructorRegisterAllConsentKey =
  (typeof INSTRUCTOR_REGISTER_ALL_CONSENT_KEYS)[number]
