/**
 * 교재 관리(CMS) — 사업 분야 고정값 (필터·등록·상세·Mock 공통)
 * @see apps/cms/.cursor/rules/process/textbook-management.md
 */
export const TEXTBOOK_BUSINESS_AREAS = [
  '기업가정신',
  '경제금융',
  '진로취업',
  '디지털 리터러시',
] as const

export type TextbookBusinessArea = (typeof TEXTBOOK_BUSINESS_AREAS)[number]

export const TEXTBOOK_BUSINESS_AREA_SELECT_OPTIONS: Array<{
  label: TextbookBusinessArea
  value: TextbookBusinessArea
}> = TEXTBOOK_BUSINESS_AREAS.map(area => ({ label: area, value: area }))
