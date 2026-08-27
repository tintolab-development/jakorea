/**
 * 정산 항목 설정 — 카드 상세 모달용 목업 + 세션 메모리 저장(목 데이터)
 */

export type SettlementItemSettingCompareKind = 'standard' | 'exceed' | 'below'

/**
 * tier1: 1~3급 강사비 — 산정 단위(시간)·한도·자격
 * specialLecture: 특강 강사비(w-4)·기타 인건비(w-5) — 조건 가로 표만
 * gemini: 제미나이 강사비 — 조건 가로 표 + 1~4차시 고정액
 * assistantInstructor / simpleLabor / multiInstructor / meetingAttendance: 구 카탈로그 layout (모달 컴포넌트 잔존)
 * simple: 미지 id fallback
 * transport: 강사 교통비(p-1)·학생 교통비(p-2)
 * lodging: 숙박비(p-3·p-7)
 * meal: 식사비(p-4)
 * volunteerActivity: 활동비(p-6) — 식사비와 동형
 * withholdingDailyWorker: 일용근로자 원천징수세액(d-1)
 */
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
  /** transport(레거시): 지원 기준 본문 — UI는 qualificationLines 사용 */
  supportCriteriaLines?: string[]
  /** transport(p-1): 자차 / 대중교통 / 사용자 선택 */
  transportCommuteMode?: SettlementItemTransportCommuteMode
  /** transport / simpleLabor / lodging / meal / volunteerActivity: 증빙 자료 제출 여부 */
  evidenceSubmission?: SettlementItemEvidenceSubmission
  /** simpleLabor(w-7): 단순인건비(원) */
  simpleLaborWon?: number | null
  /** simpleLabor(w-7): 주휴수당(원) */
  weeklyHolidayAllowanceWon?: number | null
  /** multiInstructor(w-6): 산정 기준 01 — 기준 항목(시간당) */
  multiInstructor01Basis?: number | null
  multiInstructor01MaxUnder5?: number | null
  multiInstructor01Max6to10?: number | null
  multiInstructor01Max11plus?: number | null
  /** multiInstructor(w-6): 산정 기준 02 — 산정 기준 단위(시간) */
  multiInstructor02BasisHours?: number | null
  multiInstructor02MaxUnder5?: number | null
  multiInstructor02Max6to10?: number | null
  multiInstructor02Max11plus?: number | null
  /** meetingAttendance(p-5): 산정 01 — 기준 시간(이하) */
  meetingAttendance01BasisHours?: number | null
  /** meetingAttendance(p-5): 산정 01 — 최대 한도(원) */
  meetingAttendance01MaxLimitWon?: number | null
  /** meetingAttendance(p-5): 산정 02 — 기준 시간(초과) */
  meetingAttendance02BasisHours?: number | null
  /** meetingAttendance(p-5): 산정 02 — 최대 한도(원) */
  meetingAttendance02MaxLimitWon?: number | null
  /** withholdingDailyWorker(d-1): 소액 부징수 — 원천징수세액 이하(원) 미징수 기준 */
  withholdingExclusionMaxWon?: number | null
  /** withholdingDailyWorker(d-1): 근로소득공제비용(원) */
  withholdingEarnedIncomeDeductionWon?: number | null
  /** withholdingDailyWorker(d-1): 소득세율 — 사업소득(%) */
  withholdingTaxRateBusiness?: number | null
  /** withholdingDailyWorker(d-1): 소득세율 — 기타소득(%) */
  withholdingTaxRateOther?: number | null
  /** withholdingDailyWorker(d-1): 소득세율 — 상금 기타소득(%) */
  withholdingTaxRatePrize?: number | null
  /** withholdingDailyWorker(d-1): 소득세율 — 면접비·지원금·경품 기타소득(%) */
  withholdingTaxRateInterview?: number | null
  /** gemini(w-gemini): 1~4차시 고정액(원) */
  geminiSession1Won?: number | null
  geminiSession2Won?: number | null
  geminiSession3Won?: number | null
  geminiSession4Won?: number | null
}

/** 저장된 상세(페이지 세션 동안 유지, 새로고침 시 초기화) */
const settlementItemSettingDetailById: Record<string, SettlementItemSettingDetail> = {}

const W1_DETAIL: SettlementItemSettingDetail = {
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
    '사회 통념상 상기 자격에 준하는 자로서 교육운영본부 사무총장이 인정하는 자',
  ],
  remarkLines: [
    '유급의 내부직원에게는 지급 불가',
    '강의에 필요한 교재의 원고료, 강사 교통비(실비)는 필요사유에 따라 별도 지급 가능',
  ],
}

/** 2급 강사비 — 조건·산정 기준 표 UI는 1급과 동일(tier1) */
const W2_DETAIL: SettlementItemSettingDetail = {
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
    '사회 통념상 상기 자격에 준하는 자로서 교육운영본부 사무총장이 인정하는 자',
  ],
  remarkLines: [
    '유급의 내부직원에게는 지급 불가',
    '강의에 필요한 교재의 원고료, 강사 교통비(실비)는 필요사유에 따라 별도 지급 가능',
  ],
}

/** 3급 강사비 — 조건·산정 기준 표 UI는 1·2급과 동일(tier1) */
const W3_DETAIL: SettlementItemSettingDetail = {
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
    '사회 통념상 상기 자격에 준하는 자로서 교육운영본부 사무총장이 인정하는 자',
  ],
  remarkLines: [
    '유급의 내부직원에게는 지급 불가',
    '강의에 필요한 교재의 원고료, 강사 교통비(실비)는 필요사유에 따라 별도 지급 가능',
  ],
}

const W4_DETAIL: SettlementItemSettingDetail = {
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

/** 기타 인건비(w-5) — 특강과 동일 layout(조건 가로 표만). 시안은 빈 입력 + placeholder */
const W5_DETAIL: SettlementItemSettingDetail = {
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

/** 제미나이 강사비 — 조건 가로 표 + 1~4차시 고정액 */
const W_GEMINI_DETAIL: SettlementItemSettingDetail = {
  layout: 'gemini',
  basisUnit: '차시',
  basisHours: 1,
  compareKind: 'standard',
  maxLimitWon: null,
  basicFeeWon: null,
  longDistanceFeeWon: null,
  qualificationLines: ['제미나이 프로그램에서 사용되는 강사 임금'],
  remarkLines: [
    '실적보고서를 기반으로 차시 산출하여 금액 산정',
    '별도의 지급조서 작성 및 확인 절차 없이 계좌 지급 대상 목록으로 노출 및 처리',
  ],
  geminiSession1Won: 0,
  geminiSession2Won: 170_000,
  geminiSession3Won: 220_000,
  geminiSession4Won: 270_000,
}

const P1_DETAIL: SettlementItemSettingDetail = {
  layout: 'transport',
  basisUnit: '거리',
  basisHours: 30,
  compareKind: 'standard',
  maxLimitWon: null,
  basicFeeWon: null,
  longDistanceFeeWon: null,
  qualificationLines: [
    '네이버 지도를 기준으로, 입력된 강사 자택 주소 및 강의 장소 기준으로 거리 및 유류와 톨비가 고려된 금액 자동 산출',
  ],
  remarkLines: [
    '실비 영수증이 없을 경우 강사 교통비를 지급하지 않는 것이 원칙이나, 팀별 판단에 따라 편도 교통비 영수증만으로도 왕복 교통비를 지급',
  ],
  transportCommuteMode: 'private_car',
  evidenceSubmission: 'not_required',
}

/** 학생 교통비 p-2 */
const P2_DETAIL: SettlementItemSettingDetail = {
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

/** 숙박비 p-3 — 조건(지급 요건·비고, 행 104px) + 산정(일·최대 한도·증빙) */
const P3_DETAIL: SettlementItemSettingDetail = {
  layout: 'lodging',
  basisUnit: '일',
  basisHours: 1,
  compareKind: 'standard',
  maxLimitWon: 150_000,
  basicFeeWon: null,
  longDistanceFeeWon: null,
  qualificationLines: ['1인 1실 기준'],
  remarkLines: [],
  evidenceSubmission: 'required',
}

/** 식사비 p-4 */
const P4_DETAIL: SettlementItemSettingDetail = {
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

/** 활동비 p-6 — 식사비와 동형(layout=meal, 한도 50,000) */
const P6_DETAIL: SettlementItemSettingDetail = {
  layout: 'meal',
  basisUnit: '시간',
  basisHours: 1,
  compareKind: 'standard',
  maxLimitWon: 50_000,
  basicFeeWon: null,
  longDistanceFeeWon: null,
  qualificationLines: ['참여자에게 지급되는 지원비'],
  remarkLines: [],
  evidenceSubmission: 'required',
}

/** 숙박비 (1사1교) p-7 — 1일 8만 고정 · 영수증 없음 · 세금 징수 */
const P7_DETAIL: SettlementItemSettingDetail = {
  layout: 'lodging',
  basisUnit: '일',
  basisHours: 1,
  compareKind: 'standard',
  maxLimitWon: 80_000,
  basicFeeWon: null,
  longDistanceFeeWon: null,
  qualificationLines: ['숙박비 고정 지급'],
  remarkLines: ['영수증 제출 없음. 세금 징수.'],
  evidenceSubmission: 'not_required',
}

/** 일용근로자 원천징수세액 d-1 */
const D1_DETAIL: SettlementItemSettingDetail = {
  layout: 'withholdingDailyWorker',
  basisUnit: '전체',
  basisHours: 1,
  compareKind: 'standard',
  maxLimitWon: null,
  basicFeeWon: null,
  longDistanceFeeWon: null,
  qualificationLines: ['지급액이 125,000원 초과인 경우'],
  remarkLines: [],
  withholdingExclusionMaxWon: 1_000,
  withholdingEarnedIncomeDeductionWon: 150_000,
  withholdingTaxRateBusiness: 3.3,
  withholdingTaxRateOther: 8.8,
  withholdingTaxRatePrize: 4.4,
  withholdingTaxRateInterview: 22,
}

function defaultDetail(): SettlementItemSettingDetail {
  return {
    layout: 'simple',
    basisUnit: '전체',
    basisHours: 1,
    compareKind: 'standard',
    maxLimitWon: null,
    basicFeeWon: null,
    longDistanceFeeWon: null,
    qualificationLines: [],
    remarkLines: [],
  }
}

function cloneDetail(d: SettlementItemSettingDetail): SettlementItemSettingDetail {
  return JSON.parse(JSON.stringify(d)) as SettlementItemSettingDetail
}

/** 모달 textarea(불릿 줄) → 문자열 배열 */
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

/** 코드 기본값(저장 전·삭제 후) */
export function getBaseSettlementItemSettingDetail(itemId: string): SettlementItemSettingDetail {
  if (itemId === 'w-1') {
    return {
      ...W1_DETAIL,
      qualificationLines: [...W1_DETAIL.qualificationLines],
      remarkLines: [...W1_DETAIL.remarkLines],
    }
  }
  if (itemId === 'w-2') {
    return {
      ...W2_DETAIL,
      qualificationLines: [...W2_DETAIL.qualificationLines],
      remarkLines: [...W2_DETAIL.remarkLines],
    }
  }
  if (itemId === 'w-3') {
    return {
      ...W3_DETAIL,
      qualificationLines: [...W3_DETAIL.qualificationLines],
      remarkLines: [...W3_DETAIL.remarkLines],
    }
  }
  if (itemId === 'w-4') {
    return {
      ...W4_DETAIL,
      qualificationLines: [...W4_DETAIL.qualificationLines],
      remarkLines: [...W4_DETAIL.remarkLines],
    }
  }
  if (itemId === 'w-5') {
    return {
      ...W5_DETAIL,
      qualificationLines: [...W5_DETAIL.qualificationLines],
      remarkLines: [...W5_DETAIL.remarkLines],
    }
  }
  if (itemId === 'w-gemini') {
    return {
      ...W_GEMINI_DETAIL,
      qualificationLines: [...W_GEMINI_DETAIL.qualificationLines],
      remarkLines: [...W_GEMINI_DETAIL.remarkLines],
    }
  }
  if (itemId === 'p-1') {
    return {
      ...P1_DETAIL,
      qualificationLines: [...P1_DETAIL.qualificationLines],
      remarkLines: [...P1_DETAIL.remarkLines],
    }
  }
  if (itemId === 'p-2') {
    return {
      ...P2_DETAIL,
      qualificationLines: [...P2_DETAIL.qualificationLines],
      remarkLines: [...P2_DETAIL.remarkLines],
    }
  }
  if (itemId === 'p-3') {
    return {
      ...P3_DETAIL,
      qualificationLines: [...P3_DETAIL.qualificationLines],
      remarkLines: [...P3_DETAIL.remarkLines],
    }
  }
  if (itemId === 'p-4') {
    return {
      ...P4_DETAIL,
      qualificationLines: [...P4_DETAIL.qualificationLines],
      remarkLines: [...P4_DETAIL.remarkLines],
    }
  }
  if (itemId === 'p-6') {
    return {
      ...P6_DETAIL,
      qualificationLines: [...P6_DETAIL.qualificationLines],
      remarkLines: [...P6_DETAIL.remarkLines],
    }
  }
  if (itemId === 'p-7') {
    return {
      ...P7_DETAIL,
      qualificationLines: [...P7_DETAIL.qualificationLines],
      remarkLines: [...P7_DETAIL.remarkLines],
    }
  }
  if (itemId === 'd-1') {
    return {
      ...D1_DETAIL,
      qualificationLines: [...D1_DETAIL.qualificationLines],
      remarkLines: [...D1_DETAIL.remarkLines],
    }
  }
  return defaultDetail()
}

/**
 * 항목 상세 저장(목 데이터). API 연동 시 이 함수 본문만 교체하면 됨.
 */
export function saveSettlementItemSettingDetail(
  itemId: string,
  detail: SettlementItemSettingDetail
): void {
  settlementItemSettingDetailById[itemId] = cloneDetail(detail)
}

/**
 * 기본값 + 저장분(있으면 저장분 우선)
 */
export function getSettlementItemSettingDetail(itemId: string): SettlementItemSettingDetail {
  const saved = settlementItemSettingDetailById[itemId]
  if (saved) return cloneDetail(saved)
  return getBaseSettlementItemSettingDetail(itemId)
}
