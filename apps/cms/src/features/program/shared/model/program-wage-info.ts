/**
 * 프로그램 상세 공통 정보 — 임금 정보 타입·옵션
 */

export interface ProgramWageInfo {
  wageType: string
  pricingDisplay: string
  paymentItems: string
  deductionItems: string
}

export const INSTRUCTOR_FEE_GRADE_OPTIONS: { value: string; label: string }[] = [
  { value: '1급 강사비', label: '1급 강사비' },
  { value: '2급 강사비', label: '2급 강사비' },
  { value: '3급 강사비', label: '3급 강사비' },
]

export const PROGRAM_WAGE_TYPE_OPTIONS: { value: string; label: string }[] =
  INSTRUCTOR_FEE_GRADE_OPTIONS

export const PROGRAM_WAGE_PRICING_MEASURE_OPTIONS: { value: string; label: string }[] = [
  { value: '시간', label: '시간' },
]

export const EMPTY_PROGRAM_WAGE_INFO: ProgramWageInfo = {
  wageType: '',
  pricingDisplay: '',
  paymentItems: '',
  deductionItems: '',
}
