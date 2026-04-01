/**
 * 프로그램 상세 공통 정보 — 임금 정보 목(Mock)
 */

export interface ProgramWageInfo {
  wageType: string
  pricingDisplay: string
  paymentItems: string
  deductionItems: string
}

export const DEFAULT_PROGRAM_WAGE_INFO: ProgramWageInfo = {
  wageType: '3급 강사비',
  pricingDisplay: '1시간 당 | 기본 강사비 : 240,000원 | 장거리 강사비 : 300,000원',
  paymentItems: '교통비(일사일교), 숙박비, 자원봉사자 활동비',
  deductionItems: '사업소득 3.3%, 기타 소득 8.8%',
}

export function getProgramWageInfoMock(_programId: string): ProgramWageInfo {
  return DEFAULT_PROGRAM_WAGE_INFO
}
