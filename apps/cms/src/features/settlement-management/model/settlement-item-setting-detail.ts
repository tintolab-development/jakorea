/**
 * 정산 항목 설정 — 상세 모달 FE types·파싱 유틸
 */

export type SettlementItemSettingCompareKind = 'standard' | 'exceed' | 'below'

export type SettlementItemTransportCommuteMode = 'private_car' | 'public_transit' | 'user_choice'

export type SettlementItemSettingDetailLayout =
  | 'tier1'
  | 'specialLecture'
  | 'gemini'
  | 'assistantInstructor'
  | 'simpleLabor'
  | 'multiInstructor'
  | 'simple'
  | 'transport'
  | 'lodging'
  | 'meal'
  | 'meetingAttendance'
  | 'volunteerActivity'
  | 'withholdingDailyWorker'

export type SettlementItemEvidenceSubmission = 'required' | 'not_required'

export interface SettlementItemSettingDetail {
  layout: SettlementItemSettingDetailLayout
  basisUnit: string
  basisHours: number
  compareKind: SettlementItemSettingCompareKind
  maxLimitWon: number | null
  basicFeeWon: number | null
  longDistanceFeeWon: number | null
  qualificationLines: string[]
  remarkLines: string[]
  supportCriteriaLines?: string[]
  transportCommuteMode?: SettlementItemTransportCommuteMode
  evidenceSubmission?: SettlementItemEvidenceSubmission
  simpleLaborWon?: number | null
  weeklyHolidayAllowanceWon?: number | null
  multiInstructor01Basis?: number | null
  multiInstructor01MaxUnder5?: number | null
  multiInstructor01Max6to10?: number | null
  multiInstructor01Max11plus?: number | null
  multiInstructor02BasisHours?: number | null
  multiInstructor02MaxUnder5?: number | null
  multiInstructor02Max6to10?: number | null
  multiInstructor02Max11plus?: number | null
  meetingAttendance01BasisHours?: number | null
  meetingAttendance01MaxLimitWon?: number | null
  meetingAttendance02BasisHours?: number | null
  meetingAttendance02MaxLimitWon?: number | null
  withholdingExclusionMaxWon?: number | null
  withholdingEarnedIncomeDeductionWon?: number | null
  withholdingTaxRateDailyWorker?: number | null
  withholdingTaxRateBusiness?: number | null
  withholdingTaxRateOther?: number | null
  withholdingTaxRatePrize?: number | null
  withholdingTaxRateInterview?: number | null
  withholdingEarnedIncomeTaxCreditRate?: number | null
  geminiSession1Won?: number | null
  geminiSession2Won?: number | null
  geminiSession3Won?: number | null
  geminiSession4Won?: number | null
}

export function parseEditableLines(text: string): string[] {
  return text
    .split('\n')
    .map(line => line.replace(/^\s*[•\-*]\s*/, '').trim())
    .filter(Boolean)
}

export function parseWonStringToNumber(s: string): number | null {
  const digits = s.replace(/[^\d]/g, '')
  if (digits === '') return null
  return Number.parseInt(digits, 10)
}

const detailById = new Map<string, SettlementItemSettingDetail>()

export function getSettlementItemSettingDetail(itemId: string): SettlementItemSettingDetail {
  return (
    detailById.get(itemId) ?? {
      layout: 'simple',
      basisUnit: '시간',
      basisHours: 1,
      compareKind: 'standard',
      maxLimitWon: null,
      basicFeeWon: null,
      longDistanceFeeWon: null,
      qualificationLines: [],
      remarkLines: [],
    }
  )
}

export function saveSettlementItemSettingDetail(
  itemId: string,
  detail: SettlementItemSettingDetail
): void {
  detailById.set(itemId, detail)
}

const EMPTY_CATALOG_DETAIL: SettlementItemSettingDetail = {
  layout: 'simple',
  basisUnit: '시간',
  basisHours: 1,
  compareKind: 'standard',
  maxLimitWon: null,
  basicFeeWon: null,
  longDistanceFeeWon: null,
  qualificationLines: [],
  remarkLines: [],
}

export function getCatalogSettlementItemSettingDetailByWageType(
  _wageItemType?: string | null
): SettlementItemSettingDetail {
  void _wageItemType
  return { ...EMPTY_CATALOG_DETAIL }
}

export function getCatalogSettlementItemSettingDetailByPaymentType(
  _paymentItemType?: string | null
): SettlementItemSettingDetail {
  void _paymentItemType
  return { ...EMPTY_CATALOG_DETAIL }
}

export function getCatalogSettlementItemSettingDetailForDeduction(): SettlementItemSettingDetail {
  return {
    ...EMPTY_CATALOG_DETAIL,
    layout: 'withholdingDailyWorker',
    basisUnit: '전체',
    qualificationLines: ['1일 급여액에서 근로소득공제 150,000원을 차감하여 산정'],
    withholdingExclusionMaxWon: 1_000,
    withholdingEarnedIncomeDeductionWon: 150_000,
    withholdingTaxRateDailyWorker: 6,
    withholdingTaxRateBusiness: 3.3,
    withholdingTaxRateOther: 8.8,
    withholdingTaxRatePrize: 4.4,
    withholdingTaxRateInterview: 22,
    withholdingEarnedIncomeTaxCreditRate: 55,
  }
}
