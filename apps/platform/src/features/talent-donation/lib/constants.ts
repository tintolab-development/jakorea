export const TALENT_DONATION_PATH = '/support/talent'

export const HERO_LABEL = '재능기부'

export const HERO_TITLE_LINES = ['당신의 경험이', ' 청소년의 가능성으로'] as const

export const HERO_DESCRIPTION_LINES = [
  '현장에서 쌓은 지식과 경험은',
  ' 청소년에게 살아 있는 교육이 됩니다.',
  ' JA Korea와 함께 청소년이 더 넓은 세상을 배우고,',
  ' 자신의 미래를 주도적으로 준비할 수 있도록',
  ' 여러분의 경험과 전문성을 나눠주세요.',
] as const

export const METHODS_SECTION_TITLE = 'JA와 함께하는 방법'

export type MethodCardId = 'mentoring' | 'advisory' | 'program_support'

export type MethodCardContent = {
  id: MethodCardId
  title: string
  descriptionLines: readonly string[]
}

export const METHOD_CARDS: readonly MethodCardContent[] = [
  {
    id: 'mentoring',
    title: '교육 · 멘토링',
    descriptionLines: [
      '전문 지식과 현장 경험을',
      '청소년의 눈높이에 맞춰 전합니다.',
    ],
  },
  {
    id: 'advisory',
    title: '심사 · 자문',
    descriptionLines: [
      '청소년의 아이디어와',
      '발표에 전문적인 피드백을 더합니다.',
    ],
  },
  {
    id: 'program_support',
    title: '프로그램 운영 지원',
    descriptionLines: [
      '교육 공간 제공, 네트워크 연결 등',
      '프로그램에 필요한 자원을 제공합니다.',
    ],
  },
]

export const STORIES_SECTION_EYEBROW = '재능기부가 만드는 변화를 만나보세요'

export type StoryId = 'im_minjae' | 'lee_daehan'

export type StoryLayout = 'textFirst' | 'mediaFirst'

export type StoryContent = {
  id: StoryId
  layout: StoryLayout
  titleLines: readonly string[]
  descriptionLines: readonly string[]
  buttonLabel: string
}

export const TALENT_STORIES: readonly StoryContent[] = [
  {
    id: 'im_minjae',
    layout: 'textFirst',
    titleLines: ['받은 기회를', ' 다음 세대에게 돌려주는 일'],
    descriptionLines: [
      '14년 전 JA에서 얻은 도전의 경험은 지금의 진로를 선택하는 데 큰 힘이 되었습니다. 이제는 멘토와 심사위원으로 돌아와 제가 받았던 자극과 응원을 후배들에게 전할 수 있어 뜻깊습니다.',
    ],
    buttonLabel: '임민재님의 이야기 살펴보기',
  },
  {
    id: 'lee_daehan',
    layout: 'mediaFirst',
    titleLines: ['JA 네트워크 안에서', ' 함께 성장하는 경험'],
    descriptionLines: [
      '대학생 때 경제교육 봉사자로 JA Korea와 인연을 맺었습니다. 봉사활동을 통해 의사 표현에 자신감을 갖게 됐고, 사람들 앞에서 논리정연하게 이야기할 수 있는 리더십을 갖게 되었습니다.',
    ],
    buttonLabel: '이대한님의 이야기 살펴보기',
  },
]

export const CTA_SECTION_EYEBROW = 'Grow together'

export const CTA_SECTION_TITLE_LINES = [
  '재능을 나눈 작은 실천',
  '지금 시작해보세요.',
] as const

export const CTA_SECTION_BUTTON_LABEL = '재능기부 신청하기'
