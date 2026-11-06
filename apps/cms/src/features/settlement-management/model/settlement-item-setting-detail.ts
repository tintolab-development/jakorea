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
  | 'activity'
  | 'volunteerActivity' // legacy alias; normalize → activity
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
  /** Gemini 자체 연수 차시 금액 (0 허용, null=미입력) */
  geminiSession1Won?: number | null
  geminiSession2Won?: number | null
  geminiSession3Won?: number | null
  geminiSession4Won?: number | null
  /** Gemini 대학생 연수 차시 금액 — API detailJson에만 저장(rateItems는 자체 연수). TODO: BE dual rate 확정 시 연동 */
  geminiSession1UniversityWon?: number | null
  geminiSession2UniversityWon?: number | null
  geminiSession3UniversityWon?: number | null
  geminiSession4UniversityWon?: number | null
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

/** Figma 1급 강사비(12432:445898) 기본 카피·값 — API 미제공 시 채움 */
const TIER1_CATALOG_DETAIL: SettlementItemSettingDetail = {
  layout: 'tier1',
  basisUnit: '시간',
  basisHours: 1,
  compareKind: 'standard',
  maxLimitWon: 500_000,
  basicFeeWon: null,
  longDistanceFeeWon: null,
  qualificationLines: [
    '해당분야 최고의 전문가',
    '전·현직 장관(급) 및 대학총장(급)',
    '전·현직 국회의원, 대기업 총수, 국영기업체',
    '정부 출연 연구기관장, 기업·기관, 단체의 장',
    '사회 통념상 상기 자격에 준하는 자로서 교육운영상 사무총장이 인정하는 자',
  ],
  remarkLines: [
    '유급의 내부직원에게는 지급 불가',
    '강의에 필요한 교재의 원고료, 강사 교통비(실비)는 필요사유에 따라 별도 지급 가능',
  ],
}

/** Figma 2급 강사비(12432:448139) 기본 카피·값 — API 미제공 시 채움 */
const TIER2_CATALOG_DETAIL: SettlementItemSettingDetail = {
  layout: 'tier1',
  basisUnit: '시간',
  basisHours: 1,
  compareKind: 'standard',
  maxLimitWon: 400_000,
  basicFeeWon: null,
  longDistanceFeeWon: null,
  qualificationLines: [
    '해당분야 최고의 전문가',
    '차관(급)',
    '대학교의 조교수 및 부교수 이상, 연구기관의 연구위원급',
    '판검사 및 변호사, 공인회계사 등 전문자격증을 가진 자',
    '언론인(부장급 이상)',
    '사회 통념상 상기 자격에 준하는 자로서 교육운영상 사무총장이 인정하는 자',
  ],
  remarkLines: [
    '유급의 내부직원에게는 지급 불가',
    '강의에 필요한 교재의 원고료, 강사 교통비(실비)는 필요사유에 따라 별도 지급 가능',
  ],
}

/** Figma 3급 강사비(12432:448388) 기본 카피·값 — API 미제공 시 채움 */
const TIER3_CATALOG_DETAIL: SettlementItemSettingDetail = {
  layout: 'tier1',
  basisUnit: '시간',
  basisHours: 1,
  compareKind: 'standard',
  maxLimitWon: 300_000,
  basicFeeWon: null,
  longDistanceFeeWon: null,
  qualificationLines: [
    '해당분야 최고의 전문가',
    '4급 이상 공무원, 박사학위 소지 5급 이하 공무원 및 전직 재단 임원',
    '대학교의 조교수·강사, 연구기관의 연구원 등',
    '사회 통념상 상기 자격에 준하는 자로서 교육운영상 사무총장이 인정하는 자',
  ],
  remarkLines: [
    '유급의 내부직원에게는 지급 불가',
    '강의에 필요한 교재의 원고료, 강사 교통비(실비)는 필요사유에 따라 별도 지급 가능',
  ],
}

function cloneCatalogDetail(detail: SettlementItemSettingDetail): SettlementItemSettingDetail {
  return {
    ...detail,
    qualificationLines: [...detail.qualificationLines],
    remarkLines: [...detail.remarkLines],
  }
}

/** Figma 특강 강사비(12432:448886) — 조건만, 산정 기준·숫자 필드 없음 */
const SPECIAL_LECTURE_CATALOG_DETAIL: SettlementItemSettingDetail = {
  layout: 'specialLecture',
  basisUnit: '전체',
  basisHours: 1,
  compareKind: 'standard',
  maxLimitWon: null,
  basicFeeWon: null,
  longDistanceFeeWon: null,
  qualificationLines: ['국내외 해당 분야 최고 권위자로 총장이 인정하는 자'],
  remarkLines: [
    '유급의 내부직원에게는 지급 불가',
    '강의에 필요한 교재의 원고료, 강사 교통비(실비)는 필요사유에 따라 별도 지급 가능',
  ],
}

/** Figma 기타 인건비(12432:449135) — 조건만·양쪽 placeholder 빈칸, 산정 기준 없음 */
const OTHER_LABOR_CATALOG_DETAIL: SettlementItemSettingDetail = {
  layout: 'specialLecture',
  basisUnit: '전체',
  basisHours: 1,
  compareKind: 'standard',
  maxLimitWon: null,
  basicFeeWon: null,
  longDistanceFeeWon: null,
  qualificationLines: [],
  remarkLines: [],
}

/** Figma Gemini 강사비(12432:448637) — 1차시 0≠blank, 4차시 대학생 null→placeholder「금액」 */
const GEMINI_CATALOG_DETAIL: SettlementItemSettingDetail = {
  layout: 'gemini',
  basisUnit: '시간',
  basisHours: 1,
  compareKind: 'standard',
  maxLimitWon: null,
  basicFeeWon: null,
  longDistanceFeeWon: null,
  qualificationLines: ['Gemini 프로그램에서 사용되는 강사 임금'],
  remarkLines: [
    '실적보고서를 기반으로 차시 산출하여 금액 산정',
    '별도의 지급조서 작성 및 확인 절차 없이 계좌 지급 대상 목록으로 노출 및 처리',
  ],
  geminiSession1Won: 0,
  geminiSession1UniversityWon: 0,
  geminiSession2Won: 170_000,
  geminiSession2UniversityWon: 280_000,
  geminiSession3Won: 220_000,
  geminiSession3UniversityWon: 380_000,
  geminiSession4Won: 270_000,
  geminiSession4UniversityWon: null,
}

export function getCatalogSettlementItemSettingDetailByWageType(
  wageItemType?: string | null
): SettlementItemSettingDetail {
  if (wageItemType === 'TIER1') return cloneCatalogDetail(TIER1_CATALOG_DETAIL)
  if (wageItemType === 'TIER2') return cloneCatalogDetail(TIER2_CATALOG_DETAIL)
  if (wageItemType === 'TIER3') return cloneCatalogDetail(TIER3_CATALOG_DETAIL)
  if (wageItemType === 'SPECIAL_LECTURE') return cloneCatalogDetail(SPECIAL_LECTURE_CATALOG_DETAIL)
  if (wageItemType === 'OTHER_LABOR') return cloneCatalogDetail(OTHER_LABOR_CATALOG_DETAIL)
  if (wageItemType === 'GEMINI') return cloneCatalogDetail(GEMINI_CATALOG_DETAIL)
  return { ...EMPTY_CATALOG_DETAIL }
}

/** Figma 강사 교통비(12432:446645) — 라디오 disabled 표시용 기본값(자차·불필요), 단위 30km */
const TRANSPORT_INSTRUCTOR_CATALOG_DETAIL: SettlementItemSettingDetail = {
  layout: 'transport',
  basisUnit: '거리',
  basisHours: 30,
  compareKind: 'standard',
  maxLimitWon: null,
  basicFeeWon: null,
  longDistanceFeeWon: null,
  qualificationLines: [
    '네이버 지도를 기준으로, 입력된 강사 자택 주소 및 강의 장소 기준으로 거리 및 유류비와 톨비가 고려된 금액 자동 산출',
  ],
  remarkLines: [
    '실비 영수증이 없을 경우 강사 교통비를 지급하지 않는 것이 원칙이나, 팀별 판단에 따라 편도 교통비 영수증만으로도 왕복 교통비를 지급',
  ],
  transportCommuteMode: 'private_car',
  evidenceSubmission: 'not_required',
}

/** Figma 학생 교통비(12432:446396) — 대중교통·필요(disabled), 30km */
const TRANSPORT_STUDENT_CATALOG_DETAIL: SettlementItemSettingDetail = {
  layout: 'transport',
  basisUnit: '거리',
  basisHours: 30,
  compareKind: 'standard',
  maxLimitWon: null,
  basicFeeWon: null,
  longDistanceFeeWon: null,
  qualificationLines: [
    '대중교통 이용비(KTX일반, 고속버스, 전세버스 등)',
    '톨비의 경우, 별도 영수증 증빙 처리해서 산출',
  ],
  remarkLines: ['실비 영수증 필수 제출'],
  transportCommuteMode: 'public_transit',
  evidenceSubmission: 'required',
}

/** Figma 숙박비(12432:446894) — 1박·최대 150,000·증빙 필요(active), 비고 blank */
const LODGING_GENERAL_CATALOG_DETAIL: SettlementItemSettingDetail = {
  layout: 'lodging',
  basisUnit: '박',
  basisHours: 1,
  compareKind: 'standard',
  maxLimitWon: 150_000,
  basicFeeWon: null,
  longDistanceFeeWon: null,
  qualificationLines: ['1인 1실 기준'],
  remarkLines: [],
  evidenceSubmission: 'required',
}

/** BE seed LODGING_1C1S — 지급액(fixedAmountWon) 80,000·증빙 불필요·비고 세금 문구
 * 시안은 증빙「필요」선택이나 데이터는 백엔드(evidenceRequiredYn=false)를 따름.
 */
const LODGING_1C1S_CATALOG_DETAIL: SettlementItemSettingDetail = {
  layout: 'lodging',
  basisUnit: '박',
  basisHours: 1,
  compareKind: 'standard',
  maxLimitWon: 80_000,
  basicFeeWon: null,
  longDistanceFeeWon: null,
  qualificationLines: ['숙박비 고정 지급'],
  remarkLines: ['영수증 제출 없음. 세금 징수.'],
  evidenceSubmission: 'not_required',
}

/** Figma 식사비(12432:447392) — 최대한도 30,000·증빙 필요(active), 산정단위 행 없음, 비고 blank */
const MEAL_CATALOG_DETAIL: SettlementItemSettingDetail = {
  layout: 'meal',
  basisUnit: '시간',
  basisHours: 1,
  compareKind: 'standard',
  maxLimitWon: 30_000,
  basicFeeWon: null,
  longDistanceFeeWon: null,
  qualificationLines: ['1인 1식 기준'],
  remarkLines: [],
  evidenceSubmission: 'required',
}

/** BE PaymentItemType.catalogLayout()=activity — 최대한도 1,000,000·증빙 필요, 산정단위 행 없음 */
const ACTIVITY_CATALOG_DETAIL: SettlementItemSettingDetail = {
  layout: 'activity',
  basisUnit: '시간',
  basisHours: 1,
  compareKind: 'standard',
  maxLimitWon: 1_000_000,
  basicFeeWon: null,
  longDistanceFeeWon: null,
  qualificationLines: ['참여자에게 지급되는 지원비'],
  remarkLines: [],
  evidenceSubmission: 'required',
}

export function getCatalogSettlementItemSettingDetailByPaymentType(
  paymentItemType?: string | null
): SettlementItemSettingDetail {
  if (paymentItemType === 'TRANSPORT_INSTRUCTOR') {
    return cloneCatalogDetail(TRANSPORT_INSTRUCTOR_CATALOG_DETAIL)
  }
  if (paymentItemType === 'TRANSPORT_STUDENT') {
    return cloneCatalogDetail(TRANSPORT_STUDENT_CATALOG_DETAIL)
  }
  if (paymentItemType === 'LODGING_GENERAL') {
    return cloneCatalogDetail(LODGING_GENERAL_CATALOG_DETAIL)
  }
  if (paymentItemType === 'LODGING_1C1S') {
    return cloneCatalogDetail(LODGING_1C1S_CATALOG_DETAIL)
  }
  if (paymentItemType === 'MEAL') {
    return cloneCatalogDetail(MEAL_CATALOG_DETAIL)
  }
  if (paymentItemType === 'ACTIVITY') {
    return cloneCatalogDetail(ACTIVITY_CATALOG_DETAIL)
  }
  return { ...EMPTY_CATALOG_DETAIL }
}

/** Figma 원천징수세액(12432:447641) — 공제요건·소액부징수 1,000·세율 3.3/8.8/4.4/22 (근로소득공제 UI 없음) */
const WITHHOLDING_CATALOG_DETAIL: SettlementItemSettingDetail = {
  layout: 'withholdingDailyWorker',
  basisUnit: '전체',
  basisHours: 1,
  compareKind: 'standard',
  maxLimitWon: null,
  basicFeeWon: null,
  longDistanceFeeWon: null,
  qualificationLines: [
    '강사비 등 임금 항목에 소득 유형별 원천징수율 적용 (지급 항목은 실비로 제외)',
  ],
  remarkLines: [],
  withholdingExclusionMaxWon: 1_000,
  // config.earnedIncomeDeduction / detailJson — UI 미표시, 시드 유지
  withholdingEarnedIncomeDeductionWon: 150_000,
  withholdingTaxRateBusiness: 3.3,
  withholdingTaxRateOther: 8.8,
  withholdingTaxRatePrize: 4.4,
  withholdingTaxRateInterview: 22,
  // withholdingTaxRateDailyWorker / withholdingEarnedIncomeTaxCreditRate: DEPRECATED — 시드·업서트 미사용
}

export function getCatalogSettlementItemSettingDetailForDeduction(): SettlementItemSettingDetail {
  return cloneCatalogDetail(WITHHOLDING_CATALOG_DETAIL)
}
