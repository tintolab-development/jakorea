/** CMS 회원 신규 등록 — 약관 및 동의 섹션 전체 필드 */
export const MEMBER_REGISTER_ALL_CONSENT_KEYS = [
  'consentTermsOfService',
  'consentPersonalInfo',
  'consentMarketing',
  'consentPortrait',
  'consentWithholdingTax',
  'consentFacilitatorPledge',
  'consentAdministrativeJoint',
  'consentSexOffenseCheck',
] as const

export type MemberRegisterAllConsentKey = (typeof MEMBER_REGISTER_ALL_CONSENT_KEYS)[number]
