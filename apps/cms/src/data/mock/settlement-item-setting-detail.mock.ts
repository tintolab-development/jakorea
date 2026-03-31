/**
 * 정산 항목 설정 — 카드 상세 모달용 목업
 */

export type SettlementItemSettingCompareKind = 'standard' | 'exceed' | 'below'

/**
 * tier1: 1급(시간·라디오·3열 금액·자격 152)
 * simple: 특강 등(산정 셀렉트만·한도 1열·자격 56)
 * transport: 교통비(거리·km·라디오·한도 1열·지원 기준 104·증빙)
 */
export type SettlementItemSettingDetailLayout = 'tier1' | 'simple' | 'transport'

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
  /** transport: 지원 기준 본문 */
  supportCriteriaLines?: string[]
  /** transport: 증빙 자료 제출 여부 */
  evidenceSubmission?: SettlementItemEvidenceSubmission
}

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
    '사회 통념상 상기 자격에 준하는 자로서 교육운영상 사무총장이 인정하는 자',
  ],
  remarkLines: [
    '유급의 내부직원에게는 지급 불가',
    '강의에 필요한 교재의 원고료, 강사 교통비(실비)는 필요사유에 따라 별도 지급 가능',
  ],
}

const W4_DETAIL: SettlementItemSettingDetail = {
  layout: 'simple',
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

const P1_DETAIL: SettlementItemSettingDetail = {
  layout: 'transport',
  basisUnit: '거리',
  basisHours: 60,
  compareKind: 'exceed',
  maxLimitWon: null,
  basicFeeWon: null,
  longDistanceFeeWon: null,
  qualificationLines: [],
  supportCriteriaLines: [
    '교통비(KTX일반, 고속버스, 전세버스, 주유비 등)',
    '자가용 이용 시 네이버 지도를 기준으로, 입력된 강사 자택 주소 및 강의 장소 기준으로 거리 및 톨비, 유가 고려된 금액 자동 산출',
  ],
  remarkLines: [
    '실비 영수증이 없을 경우 강사 교통비를 지급하지 않는 것이 원칙이나, 팀별 판단에 따라 편도 교통비 영수증만으로도 왕복 교통비를 지급',
  ],
  evidenceSubmission: 'required',
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

export function getSettlementItemSettingDetail(itemId: string): SettlementItemSettingDetail {
  if (itemId === 'w-1') {
    return {
      ...W1_DETAIL,
      qualificationLines: [...W1_DETAIL.qualificationLines],
      remarkLines: [...W1_DETAIL.remarkLines],
    }
  }
  if (itemId === 'w-4') {
    return {
      ...W4_DETAIL,
      qualificationLines: [...W4_DETAIL.qualificationLines],
      remarkLines: [...W4_DETAIL.remarkLines],
    }
  }
  if (itemId === 'p-1') {
    return {
      ...P1_DETAIL,
      supportCriteriaLines: [...(P1_DETAIL.supportCriteriaLines ?? [])],
      remarkLines: [...P1_DETAIL.remarkLines],
    }
  }
  return defaultDetail()
}
