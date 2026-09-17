/**
 * 교재 관리(CMS) — 사업 분야 기본 시드 (마스터 미존재 시 초기값)
 * 런타임 목록은 `listTextbookBusinessAreas` / localStorage.
 * @see apps/cms/.cursor/rules/process/textbook-management.md
 */
/** BE `textbook_business_area.name` SoT (공백 없는 마스터명) */
export const TEXTBOOK_BUSINESS_AREAS = [
  '경제금융',
  '진로취업',
  '기업가정신',
  '디지털리터러시',
] as const

/** 동적 마스터 도입 후 자유 문자열. 시드 리터럴은 위 const에 유지 */
export type TextbookBusinessArea = string

export const TEXTBOOK_BUSINESS_AREA_SELECT_OPTIONS: Array<{
  label: string
  value: string
}> = TEXTBOOK_BUSINESS_AREAS.map(area => ({ label: area, value: area }))
