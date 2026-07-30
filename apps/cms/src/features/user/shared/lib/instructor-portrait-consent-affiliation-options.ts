/** 강사 신규 등록 — 초상권 동의서 「소속」 셀렉트 고정 옵션 */
export const INSTRUCTOR_PORTRAIT_CONSENT_AFFILIATION_OPTIONS = [
  { value: 'JA 강사단', label: 'JA 강사단' },
  { value: '제미나이 강사단', label: '제미나이 강사단' },
  { value: '특강 강사', label: '특강 강사' },
] as const

export type InstructorPortraitConsentAffiliationOption =
  (typeof INSTRUCTOR_PORTRAIT_CONSENT_AFFILIATION_OPTIONS)[number]
