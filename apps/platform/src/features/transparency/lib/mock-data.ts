import type {
  ExpenseDetailGroup,
  FinanceSummary,
  TransparencyPrinciple,
} from '../model/types'

export const TRANSPARENCY_HERO_TITLE =
  'JA Korea는 청소년의 미래를 지원하는 글로벌 교육 NGO로서\n신뢰를 바탕으로 투명하고 정직하게 운영됩니다.'

export const MOCK_TRANSPARENCY_PRINCIPLES: readonly TransparencyPrinciple[] = [
  {
    id: 'audit',
    icon: 'audit',
    title: '엄격한 회계 투명성과 독립적 외부 감사',
    description: [
      'JA Korea는 JA 회원국으로서 대한민국의 법률과 규정, 그리고 JA Worldwide 회원국 규정을 준수합니다.',
      '매년 신뢰성과 독립성을 갖춘 공인회계법인을 통해 회계 감사를 정기적으로 진행하고, 그 결과를 명확하게 공개합니다.',
    ],
  },
  {
    id: 'governance',
    icon: 'governance',
    title: '건전한 거버넌스와 책임 있는 이사회 운영',
    description: [
      'JA Korea는 기관의 발전을 도모하고 공정한 의사결정을 내릴 수 있도록 연 2회 이상의 정기 이사회를 개최합니다.',
      '검증된 기준에 따라 의장과 5인 이상의 이사진으로 구성된 이사회를 운영하며, 모든 회의 내용을 철저히 기록하고 보관함으로써 대내외적 책임 경영을 실천합니다.',
    ],
  },
  {
    id: 'privacy',
    icon: 'privacy',
    title: '잠재적 이해상충 방지 및 개인정보 보호',
    description: [
      'JA Korea의 모든 임직원과 이사진은 개인이나 특정 집단의 이해관계가 조직의 독립적인 판단과 공익성에 영향을 미치지 않도록 하고 있습니다.',
      '또한 「개인정보보호법」 및 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」을 준수하며 학생과 자원봉사자, 후원자의 개인정보를 철저하게 관리 및 보호합니다.',
    ],
  },
  {
    id: 'asset',
    icon: 'asset',
    title: '후원 목적의 철저한 준수 및 자산의 보호',
    description: [
      'JA Korea는 후원자와 파트너가 맡겨주신 소중한 후원금을 지정된 목적과 협약 내용에 맞게 충실히 집행합니다.',
      '기관의 모든 유형 및 무형 자산은 청소년 교육이라는 공익적 목적을 위해서만 정직하게 사용하고 보고합니다.',
    ],
  },
  {
    id: 'partnership',
    icon: 'partnership',
    title: '파트너십을 통한 사회적 영향력 확산',
    description: [
      'JA Korea는 파트너십과 협업을 통해 사회적 영향력을 건강하게 키워 나갑니다. 모든 협력 과정과 성과를 투명하게 소통하며,',
      '대내외 이해관계자 모두에게 정직하고 일관성 있는 메시지를 전달함으로써 우리 사회 전반에 지속가능한 교육적 가치를 확산합니다.',
    ],
  },
]

/** 수익총계 도넛 팔레트 — 시안 연두·그린·딥그린 */
export const MOCK_REVENUE_SUMMARY: FinanceSummary = {
  totalLabel: '수익총계(원)',
  totalAmount: 6_685_750_266,
  slices: [
    {
      id: 'corporate',
      label: '기업기부금',
      percent: '45.00',
      amount: 3_008_587_620,
      color: '#bbd153',
    },
    {
      id: 'individual',
      label: '개인기부금',
      percent: '35.00',
      amount: 2_340_012_593,
      color: '#46b17b',
    },
    {
      id: 'non-business',
      label: '사업외수익',
      percent: '20.00',
      amount: 1_337_150_053,
      color: '#006b5e',
    },
  ],
}

/** 지출총계 도넛 팔레트 — 시안 딥틸~시안·옐로·레드 */
export const MOCK_EXPENSE_SUMMARY: FinanceSummary = {
  totalLabel: '지출총계(원)',
  totalAmount: 6_012_724_646,
  slices: [
    {
      id: 'program',
      label: '프로그램 운영비',
      percent: '40.00',
      amount: 2_405_089_858,
      color: '#2b6173',
    },
    {
      id: 'office',
      label: '사무비',
      percent: '25.00',
      amount: 1_503_181_162,
      color: '#01a1af',
    },
    {
      id: 'non-business',
      label: '사업외비용',
      percent: '15.00',
      amount: 901_908_697,
      color: '#4cd9e5',
    },
    {
      id: 'promotion',
      label: '기획/홍보비',
      percent: '10.00',
      amount: 601_272_465,
      color: '#95e8f0',
    },
    {
      id: 'fundraising',
      label: '기부모집및관리비',
      percent: '6.00',
      amount: 360_763_479,
      color: '#e3e24f',
    },
    {
      id: 'board',
      label: '이사회운영비',
      percent: '4.00',
      amount: 240_508_986,
      color: '#e8574a',
    },
  ],
}

/** 수익총계 테이블 표시 순서 (비율 내림차순) */
export const MOCK_REVENUE_TABLE_ORDER: readonly string[] = [
  'corporate',
  'non-business',
  'individual',
]

export const MOCK_EXPENSE_DETAIL_GROUPS: readonly ExpenseDetailGroup[] = [
  {
    id: 'direct',
    label: '직접사업비',
    rows: [
      {
        id: 'economy',
        label: '프로그램 운영비 : 경제금융',
        percent: '6.02',
        amount: 361_771_007,
      },
      {
        id: 'career',
        label: '프로그램 운영비 : 진로취업',
        percent: '7.26',
        amount: 436_479_987,
      },
      {
        id: 'entrepreneurship',
        label: '프로그램 운영비 : 기업가정신',
        percent: '3.24',
        amount: 194_772_198,
      },
      {
        id: 'digital-literacy',
        label: '프로그램 운영비 : 디지털리터러시',
        percent: '67.37',
        amount: 4_050_715_525,
      },
      {
        id: 'personnel',
        label: '프로그램 운영비 : 인력',
        percent: '10.58',
        amount: 635_927_535,
      },
      { id: 'board', label: '이사회 운영비', percent: '0.07', amount: 4_492_280 },
      {
        id: 'fundraising',
        label: '기부모집및관리비',
        percent: '0.20',
        amount: 12_049_384,
      },
      { id: 'promotion', label: '기획/홍보비', percent: '0.20', amount: 12_239_870 },
    ],
    subtotal: { label: '직접사업비 합계', percent: '94.94', amount: 5_708_447_786 },
  },
  {
    id: 'indirect',
    label: '직접사업비 이외비용',
    rows: [
      { id: 'office', label: '사무비', percent: '4.27', amount: 256_937_982 },
      { id: 'non-business', label: '사업외비용', percent: '0.79', amount: 47_338_878 },
    ],
    subtotal: {
      label: '직접사업비 이외비용 합계',
      percent: '5.06',
      amount: 304_276_860,
    },
  },
]

export function formatKrwAmount(amount: number) {
  return `${amount.toLocaleString('ko-KR')}원`
}
