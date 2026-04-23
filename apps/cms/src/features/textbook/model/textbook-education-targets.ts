/**
 * 교재 관리(CMS) — 교육 대상(필터·등록·목 요약) 고정 순서
 * @see apps/cms/.cursor/rules/process/textbook-management.md
 */
export const TEXTBOOK_EDUCATION_TARGETS = [
  '유아',
  '초등학교',
  '중학교',
  '고등학교',
  '대학교',
] as const

export type TextbookEducationTarget = (typeof TEXTBOOK_EDUCATION_TARGETS)[number]

export const TEXTBOOK_EDUCATION_TARGET_SELECT_OPTIONS: Array<{
  label: TextbookEducationTarget
  value: TextbookEducationTarget
}> = TEXTBOOK_EDUCATION_TARGETS.map(target => ({ label: target, value: target }))
