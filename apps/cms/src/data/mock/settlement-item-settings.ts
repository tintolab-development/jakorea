/**
 * 정산 관리 > 정산 항목 설정 — 목업 데이터
 */

export type SettlementItemSettingIconKey =
  | 'wage_tier1'
  | 'wage_tier2'
  | 'wage_tier3'
  | 'wage_special_lecture'
  | 'wage_assistant'
  | 'wage_multi_instructor'
  | 'pay_transport'
  | 'pay_lodging'
  | 'pay_meal'
  | 'pay_meeting'
  | 'pay_volunteer'
  | 'pay_simple_labor'
  | 'deduct_business_33'
  | 'deduct_other_88'
  | 'deduct_other_44'
  | 'deduct_other_22'

export type SettlementItemSettingCategoryKind = 'wage' | 'payment' | 'deduction'

export interface SettlementItemSettingRow {
  id: string
  title: string
  description: string
  iconKey: SettlementItemSettingIconKey
}

export interface SettlementItemSettingSection {
  kind: SettlementItemSettingCategoryKind
  sectionTitle: string
  items: SettlementItemSettingRow[]
}

export const settlementItemSettingSections: SettlementItemSettingSection[] = [
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
        title: '보조 강사비',
        description: '각종 실기 실습 보조 요원에게 적용되는 임금입니다.',
        iconKey: 'wage_assistant',
      },
      {
        id: 'w-6',
        title: '다수인출강비',
        description: '출강 인원이 여러명일 때 적용되는 임금입니다.',
        iconKey: 'wage_multi_instructor',
      },
    ],
  },
  {
    kind: 'payment',
    sectionTitle: '지급 항목',
    items: [
      {
        id: 'p-1',
        title: '교통비',
        description: '편도 30km 이상 이동 시 지원되는 비용입니다.',
        iconKey: 'pay_transport',
      },
      {
        id: 'p-2',
        title: '교통비(일사일교)',
        description: '편도 30km 이상 이동 시 지원되는 비용입니다.',
        iconKey: 'pay_transport',
      },
      {
        id: 'p-3',
        title: '숙박비',
        description: '타지로 출장 시 지원되는 비용입니다.',
        iconKey: 'pay_lodging',
      },
      {
        id: 'p-4',
        title: '식사비',
        description: '식사 시 지원되는 비용입니다.',
        iconKey: 'pay_meal',
      },
      {
        id: 'p-5',
        title: '회의참석비',
        description: '회의에 참석 시 지원되는 비용입니다.',
        iconKey: 'pay_meeting',
      },
      {
        id: 'p-6',
        title: '자원봉사자 활동비',
        description: '자원봉사자에게 지원되는 비용입니다.',
        iconKey: 'pay_volunteer',
      },
      {
        id: 'p-7',
        title: '단순인건비',
        description: '1인/1일 단순 근로 시 지원되는 비용입니다.',
        iconKey: 'pay_simple_labor',
      },
    ],
  },
  {
    kind: 'deduction',
    sectionTitle: '공제 항목',
    items: [
      {
        id: 'd-1',
        title: '사업소득 3.3%',
        description: '사업소득자에게 적용되는 공제 항목입니다.',
        iconKey: 'deduct_business_33',
      },
      {
        id: 'd-2',
        title: '기타 소득 8.8%',
        description: '기타 소득 항목에 적용되는 공제 항목입니다.',
        iconKey: 'deduct_other_88',
      },
      {
        id: 'd-3',
        title: '기타 소득 4.4%',
        description: '상금에 적용되는 공제 항목입니다.',
        iconKey: 'deduct_other_44',
      },
      {
        id: 'd-4',
        title: '기타 소득 22%',
        description: '면접비, 지원금, 경품에 적용되는 공제 항목입니다.',
        iconKey: 'deduct_other_22',
      },
    ],
  },
]
