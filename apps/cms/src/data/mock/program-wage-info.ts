/**
 * 프로그램 상세 공통 정보 — 임금 정보 목(Mock)
 */

export interface ProgramWageInfo {
  wageType: string
  pricingDisplay: string
  paymentItems: string
  deductionItems: string
}

/**
 * CMS 공통: 강사비 등급·프로그램 임금 정보의 강사비 유형 셀렉트 — 1·2·3급만
 */
export const INSTRUCTOR_FEE_GRADE_OPTIONS: { value: string; label: string }[] = [
  { value: '1급 강사비', label: '1급 강사비' },
  { value: '2급 강사비', label: '2급 강사비' },
  { value: '3급 강사비', label: '3급 강사비' },
]

/** 프로그램 상세 임금 정보 등 — 옵션은 {@link INSTRUCTOR_FEE_GRADE_OPTIONS}와 동일 */
export const PROGRAM_WAGE_TYPE_OPTIONS: { value: string; label: string }[] = INSTRUCTOR_FEE_GRADE_OPTIONS

/** 임금 책정 기준 — 단위(시안: 회색 박스 셀렉트) */
export const PROGRAM_WAGE_PRICING_MEASURE_OPTIONS: { value: string; label: string }[] = [
  { value: '시간', label: '시간' },
]

export const DEFAULT_PROGRAM_WAGE_INFO: ProgramWageInfo = {
  wageType: '3급 강사비',
  pricingDisplay: '1시간 당 | 기본 강사비 : 240,000원 | 장거리 강사비 : 300,000원',
  paymentItems: '교통비 (1사1교), 숙박비, 자원봉사자 활동비',
  deductionItems: '사업소득 3.3%, 기타 소득 8.8%',
}

export function getProgramWageInfoMock(_programId: string): ProgramWageInfo {
  return DEFAULT_PROGRAM_WAGE_INFO
}
