/**
 * 1사1교 강사 숙박비 신청(LODGING_1C1S) — BE 2026-11-09 계약.
 * - 1사1교 프로그램에서만 신청한다(그 외 프로그램은 서버 400).
 * - 신청 1건당 고정액 1건. 강사는 금액·박 수를 입력하지 않고 영수증만 첨부한다. 비과세.
 * - 관리자가 CMS 지급조서 검토에서 확인/반려/정정 요청한다.
 */

export const COMPANY_SCHOOL_LODGING_ITEM_TYPE = 'LODGING_1C1S'

/** 안내용 기본 고정액 — 서버 설정(LODGING_1C1S)이 정본이며 실제 지급액은 서버가 산정한다 */
export const COMPANY_SCHOOL_LODGING_DEFAULT_FIXED_WON = 80_000

const COMPANY_SCHOOL_PROGRAM_TYPES = new Set(['COMPANY_SCHOOL', 'ONE_COMPANY_ONE_SCHOOL'])

export function isCompanySchoolSettlementProgram(programType: string | null | undefined): boolean {
  return COMPANY_SCHOOL_PROGRAM_TYPES.has((programType ?? '').trim().toUpperCase())
}

export function formatCompanySchoolLodgingFixedAmountNotice(): string {
  return `신청 1건당 ${COMPANY_SCHOOL_LODGING_DEFAULT_FIXED_WON.toLocaleString('ko-KR')}원 고정 지급됩니다. 실제 숙박한 경우 영수증을 제출해 주세요.`
}
