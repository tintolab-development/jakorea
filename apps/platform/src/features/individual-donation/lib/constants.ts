export const INDIVIDUAL_DONATION_PATH = '/support/individual'

export const HERO_LABEL = '개인후원'

export const HERO_TITLE_LINES = ['청소년을 위한', '지속가능한 교육의 첫걸음'] as const

export const HERO_DESCRIPTION_LINES = [
  'JA Korea는 소중한 후원을 통해 청소년이 미래를 준비하고,',
  '스스로의 가능성을 펼칠 수 있도록 돕습니다.',
] as const

export const WHY_SECTION_TITLE = '왜 JA 일까요?'

export const WHY_SECTION_ACTION_DESCRIPTION =
  '후원금 사용 내역과 운영 현황을 확인해 보세요.'

export const WHY_SECTION_ACTION_BUTTON_LABEL = '투명경영 바로가기'

export type WhyCardId = 'future_capability' | 'education_access'

export type WhyCardContent = {
  id: WhyCardId
  badge: string
  titleLines: readonly string[]
  description: string
}

export const WHY_CARDS: readonly WhyCardContent[] = [
  {
    id: 'future_capability',
    badge: '미래 역량',
    titleLines: ['청소년을 위한 교육 프로그램 운영'],
    description: 'JA 글로벌 네트워크를 통한 교육 프로그램 확장',
  },
  {
    id: 'education_access',
    badge: '교육 접근성',
    titleLines: [
      '봉사자의 손길이 닿지 않는 지방 및',
      '도서·산간 지역 청소년을 위한 교육 지원',
    ],
    description: 'JA Worldwide 기준에 따른 투명한 조직 운영 체계',
  },
]

