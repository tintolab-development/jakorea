/**
 * 정산 관리 > 정산 항목 설정 — 목업 데이터
 * SSOT: Notion 정산 항목 설정 + 목록 시안 (임금 6 · 지급 6 · 공제 1)
 */

export type SettlementItemSettingIconKey =
  | 'wage_tier1'
  | 'wage_tier2'
  | 'wage_tier3'
  | 'wage_special_lecture'
  | 'wage_other_labor'
  | 'wage_gemini'
  | 'wage_assistant'
  | 'wage_multi_instructor'
  | 'wage_simple_labor'
  | 'pay_transport'
  | 'pay_lodging'
  | 'pay_meal'
  | 'pay_activity'
  | 'pay_meeting'
  | 'pay_volunteer'
  | 'deduct_business_33'
  | 'deduct_other_88'
  | 'deduct_other_44'
  | 'deduct_other_22'

export type SettlementItemSettingCategoryKind = 'wage' | 'payment' | 'deduction'

export interface SettlementItemSettingRow {
  id: string
  /** API 항목 id (remote 전용) */
  apiItemId?: number
  title: string
  description: string
  iconKey: SettlementItemSettingIconKey
  /**
   * 임시: 헤더·카드에 Tossface(`.tossface`)로 표시할 단일 문자.
   * 미설정이면 `iconKey` SVG 아이콘 사용.
   */
  emojiOverride?: string | null
}

export interface SettlementItemSettingSection {
  kind: SettlementItemSettingCategoryKind
  sectionTitle: string
  items: SettlementItemSettingRow[]
}

export const settlementItemSettingSections: SettlementItemSettingSection[] = [
  /**
   * 임금 항목 중 강사비(급수별 강사비·특강 등) 산정 기준 — 제품/정책 확인용 메모
   * - 프로그램 등록 시 또는 강사비 유형 선택 시, 유형별 최대 한도 안에서 지급 금액을 입력한다.
   * - 강사 매칭 시 강사마다 임금 항목을 선택한다.
   * - 1사1교 프로그램에 한해: 자택–출강지 거리에 따라 같은 급수라도 금액이 달라질 수 있으며, 편도 200km 초과 시 추가 금액이 지급된다.
   * - 제미나이 강사비는 제미나이 프로그램 전용.
   */
  {
    kind: 'wage',
    sectionTitle: '임금 항목',
    items: [
      {
        id: 'w-1',
        title: '1급 강사비',
        description: '상세 기준에 따라 적용되는 임금입니다.',
        iconKey: 'wage_tier1',
      },
      {
        id: 'w-2',
        title: '2급 강사비',
        description: '상세 기준에 따라 적용되는 임금입니다.',
        iconKey: 'wage_tier2',
      },
      {
        id: 'w-3',
        title: '3급 강사비',
        description: '일반적으로 사용되는 강사 임금입니다.',
        iconKey: 'wage_tier3',
      },
      {
        id: 'w-4',
        title: '특강 강사비',
        description: '금액 한도가 별도 적용되는 임금입니다.',
        iconKey: 'wage_special_lecture',
      },
      {
        id: 'w-5',
        title: '기타 인건비',
        description: '금액 한도가 별도 적용되는 임금입니다.',
        iconKey: 'wage_other_labor',
      },
      {
        id: 'w-gemini',
        title: '제미나이 강사비',
        description: '제미나이 프로그램에서 사용되는 강사 임금입니다.',
        iconKey: 'wage_gemini',
      },
    ],
  },
  {
    kind: 'payment',
    sectionTitle: '지급 항목',
    items: [
      {
        id: 'p-1',
        title: '강사 교통비',
        description: '편도 30km 이상 이동 시 지원되는 비용입니다.',
        iconKey: 'pay_transport',
      },
      {
        id: 'p-2',
        title: '학생 교통비',
        description: '편도 30km 이상 이동 시 지원되는 비용입니다.',
        iconKey: 'pay_transport',
      },
      {
        id: 'p-4',
        title: '식사비',
        description: '식사 시 지원되는 비용입니다.',
        iconKey: 'pay_meal',
      },
      {
        id: 'p-3',
        title: '숙박비',
        description: '타지로 출장 시 지원되는 비용입니다.',
        iconKey: 'pay_lodging',
      },
      {
        id: 'p-7',
        title: '숙박비 (1사1교)',
        description: '1사1교 프로그램에서 타지역 출장 시 지원되는 숙박 비용입니다.',
        iconKey: 'pay_lodging',
      },
      {
        id: 'p-6',
        title: '활동비',
        description: '활동비로 지원되는 비용입니다.',
        iconKey: 'pay_activity',
      },
    ],
  },
  {
    kind: 'deduction',
    sectionTitle: '공제 항목',
    items: [
      {
        id: 'd-1',
        title: '일용근로자 원천징수세액',
        description: '일용직 급여에서 원천징수하는 소득세액입니다.',
        iconKey: 'deduct_business_33',
      },
    ],
  },
]
