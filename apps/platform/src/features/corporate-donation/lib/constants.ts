export const CORPORATE_DONATION_PATH = '/support/corporate'

export const HERO_LABEL = '기업후원'

/** Desktop 시안 줄바꿈 */
export const HERO_TITLE_LINES = ['청소년의 성장을 이끌어내는 파트너십의 힘'] as const

export const HERO_DESCRIPTION_LINES = [
  'JA Korea는 기업의 사회적 책임이 청소년의 내일로 연결될 수 있도록 맞춤형 교육 프로그램을 운영합니다.',
] as const

export type WhyCardId = 'global_expansion' | 'transparent_ops' | 'verified_impact'

export type WhyCardContent = {
  id: WhyCardId
  badge: string
  titleLines: readonly string[]
  description: string
}

export const WHY_CARDS: readonly WhyCardContent[] = [
  {
    id: 'global_expansion',
    badge: '글로벌 확장성',
    titleLines: ['100여개 국가'],
    description: 'JA 글로벌 네트워크를 통한 교육 프로그램 확장',
  },
  {
    id: 'transparent_ops',
    badge: '최고수준의 투명성',
    titleLines: ['투명한 조직운영'],
    description: 'JA Worldwide 기준에 따른 투명한 조직 운영 체계',
  },
  {
    id: 'verified_impact',
    badge: '검증된 임팩트',
    titleLines: ['10만명 이상'],
    description: '연간 청소년 교육으로 이어온 10년 이상의 장기 파트너십',
  },
]

export const PROCESS_SECTION_TITLE_LINES = [
  '기업의 나눔이',
  '청소년의 배움이 되기까지',
] as const

export type ProcessStep = {
  number: number
  title: string
  descriptions: readonly string[]
}

export const PROCESS_STEPS: readonly ProcessStep[] = [
  {
    number: 1,
    title: '제안',
    descriptions: ['JA Korea에 파트너십 문의'],
  },
  {
    number: 2,
    title: '검토',
    descriptions: [
      '프로그램 적합도 및 수혜 대상 타당성 조사',
      '기업 사회공헌 목표 파악',
    ],
  },
  {
    number: 3,
    title: '기획',
    descriptions: [
      '프로그램 목적 및 포지셔닝 설계',
      '수혜 대상 및 프로그램 운영 방식 제안',
    ],
  },
  {
    number: 4,
    title: '협약',
    descriptions: ['운영 기간 및 기부금 확정', '기부금(프로그램 운영비) 지원'],
  },
  {
    number: 5,
    title: '운영',
    descriptions: [
      '수혜 대상자 및 교사·강사·봉사자 모집/선발',
      '프로그램 진행',
    ],
  },
  {
    number: 6,
    title: '보고',
    descriptions: [
      '프로그램 결과 및 회계 보고',
      '성과 평가',
      '차년도 계획 수립 및 파트너십 점검',
    ],
  },
]

export const CTA_SECTION_EYEBROW = 'Grow together'

export const CTA_SECTION_TITLE_LINES = [
  '청소년의 가능성이',
  ' 꽃 피우는 순간,',
  ' 지금 함께 해주세요'
] as const

export const CTA_SECTION_BUTTON_LABEL = '기업후원 문의하기'

export const PARTNER_SECTION_TITLE = '함께해준 기업들'
