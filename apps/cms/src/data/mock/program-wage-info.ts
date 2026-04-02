/**
 * 프로그램 상세 공통 정보 — 임금 정보 목(Mock)
 */

export interface ProgramWageInfo {
  wageType: string
  pricingDisplay: string
  paymentItems: string
  deductionItems: string
}

/** 임금 정보 — 강사비 유형(수정 모드 셀렉트) */
export const PROGRAM_WAGE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: '1급 강사비', label: '1급 강사비' },
  { value: '2급 강사비', label: '2급 강사비' },
  { value: '3급 강사비', label: '3급 강사비' },
  { value: '특강 강사비', label: '특강 강사비' },
  { value: '보조 강사비', label: '보조 강사비' },
  { value: '다수인출강비', label: '다수인출강비' },
]

/** 임금 책정 기준 — 단위(시안: 회색 박스 셀렉트) */
export const PROGRAM_WAGE_PRICING_MEASURE_OPTIONS: { value: string; label: string }[] = [
  { value: '시간', label: '시간' },
]

export const DEFAULT_PROGRAM_WAGE_INFO: ProgramWageInfo = {
  wageType: '3급 강사비',
  pricingDisplay: '1시간 당 | 기본 강사비 : 240,000원 | 장거리 강사비 : 300,000원',
  paymentItems: '교통비(일사일교), 숙박비, 자원봉사자 활동비',
  deductionItems: '사업소득 3.3%, 기타 소득 8.8%',
}

export function getProgramWageInfoMock(_programId: string): ProgramWageInfo {
  return DEFAULT_PROGRAM_WAGE_INFO
}
