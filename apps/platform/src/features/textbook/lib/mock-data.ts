import type {
  TextbookCategoryFilter,
  TextbookContent,
  TextbookThemeSection,
  TextbooksListParams,
} from '../model/types'

const ECONOMY_LIFE_UNITS = [
  {
    unitLabel: '1단원',
    title: '로비의 농장 여행',
    description:
      '로비와 함께 농장에 놀러가서 여러 동물들을 만나고 농장에서 생산되는 여러 자원에 대해 알아봅니다. 농장에서 생산되는 여러 자원에 대해 알아봅니다.',
  },
  {
    unitLabel: '2단원',
    title: '로비의 시장 여행',
    description:
      '로비와 함께 시장에 놀러가서 여러 상인들을 만나고 시장에서 거래되는 여러 물건에 대해 알아봅니다. 시장에서 거래되는 여러 물건에 대해 알아봅니다.',
  },
  {
    unitLabel: '3단원',
    title: '로비의 은행 여행',
    description:
      '로비와 함께 은행에 놀러가서 여러 은행원들을 만나고 은행에서 하는 여러 일에 대해 알아봅니다. 은행에서 하는 여러 일에 대해 알아봅니다.',
  },
  {
    unitLabel: '4단원',
    title: '로비의 기업 여행',
    description:
      '로비와 함께 기업에 놀러가서 여러 직장인들을 만나고 기업에서 하는 여러 일에 대해 알아봅니다. 기업에서 하는 여러 일에 대해 알아봅니다.',
  },
] as const

export const MOCK_TEXTBOOK_CONTENTS: TextbookContent[] = [
  {
    id: 'economy-life',
    title: '우리들의 경제생활',
    description:
      '유아, 유치원생을 대상으로 경제교육을 하는 교재입니다. 동화를 통해 경제 개념을 쉽게 이해할 수 있도록 구성되어 있습니다.',
    theme: 'economy',
    level: 'preschool',
    compositions: ['학생용 교재', '교사 지침서', '활동 자료', '수료증'],
    tags: ['유아, 유치원생', '경제교육'],
    modalTags: [
      { label: '유아, 유치원생', icon: 'target' },
      { label: '경제교육', icon: 'category' },
      { label: '읽기, 쓰기', icon: 'skill' },
    ],
    sessionSummary: '총 4단원 (30분 수업기준 4차시 교육)',
    unitCount: 4,
    unitSessionText: '30분 수업기준 4차시 교육',
    units: [...ECONOMY_LIFE_UNITS],
  },
  {
    id: 'space-travel',
    title: '우주여행',
    description:
      '중학생을 대상으로 진로·미래 직업을 탐구하는 교재입니다. 우주 탐사를 소재로 진로 탐색과 협업 역량을 기릅니다.',
    theme: 'career',
    level: 'middle',
    compositions: ['학생용 교재', '교사 지침서'],
    tags: ['중학교', '진로취업'],
    modalTags: [
      { label: '중학교', icon: 'target' },
      { label: '진로취업', icon: 'category' },
    ],
    sessionSummary: '총 3단원 (45분 수업기준 6차시 교육)',
    unitCount: 3,
    unitSessionText: '45분 수업기준 6차시 교육',
    units: [
      {
        unitLabel: '1단원',
        title: '우주로 떠나는 첫걸음',
        description: '우주와 관련된 직업을 알아보고 나와의 연결점을 찾아봅니다.',
      },
      {
        unitLabel: '2단원',
        title: '팀으로 해결하는 미션',
        description: '모둠 활동을 통해 협업과 문제 해결 과정을 경험합니다.',
      },
      {
        unitLabel: '3단원',
        title: '나의 미래 설계도',
        description: '관심 분야를 바탕으로 진로 로드맵을 작성합니다.',
      },
    ],
  },
  {
    id: 'economy-explorers',
    title: '경제 탐험대',
    description:
      '초등학생을 위한 경제·금융 입문 교재입니다. 생활 속 경제 이야기를 통해 합리적 소비와 저축을 배웁니다.',
    theme: 'economy',
    level: 'elementary',
    compositions: ['학생용 교재', '활동 자료'],
    tags: ['초등학교', '경제금융'],
    modalTags: [
      { label: '초등학교', icon: 'target' },
      { label: '경제금융', icon: 'category' },
    ],
    sessionSummary: '총 5단원 (40분 수업기준 5차시 교육)',
    unitCount: 5,
    unitSessionText: '40분 수업기준 5차시 교육',
    units: [
      {
        unitLabel: '1단원',
        title: '돈이 생기는 곳',
        description: '소득과 일의 관계를 생활 사례로 이해합니다.',
      },
      {
        unitLabel: '2단원',
        title: '사고 싶은 것과 필요한 것',
        description: '욕구와 필요를 구분해 합리적 소비를 연습합니다.',
      },
    ],
  },
  {
    id: 'job-world',
    title: '직업의 세계',
    description: '고등학생이 다양한 직업 세계를 탐색하고 자기 이해를 넓히는 진로 교재입니다.',
    theme: 'career',
    level: 'high',
    tags: ['고등학교', '진로취업'],
    modalTags: [
      { label: '고등학교', icon: 'target' },
      { label: '진로취업', icon: 'category' },
    ],
    sessionSummary: '총 4단원 (50분 수업기준 8차시 교육)',
    unitCount: 4,
    unitSessionText: '50분 수업기준 8차시 교육',
    units: [
      {
        unitLabel: '1단원',
        title: '나를 아는 시간',
        description: '흥미·강점·가치를 점검하며 진로 방향을 탐색합니다.',
      },
      {
        unitLabel: '2단원',
        title: '변화하는 직업 세계',
        description: '미래 산업과 직업 변화를 사례로 살펴봅니다.',
      },
    ],
  },
  {
    id: 'startup-seed',
    title: '창업 씨앗 키우기',
    description: '청소년·청년의 기업가정신을 키우는 실습형 교재입니다.',
    theme: 'entrepreneurship',
    level: 'high',
    tags: ['고등학교', '기업가정신'],
    modalTags: [
      { label: '고등학교', icon: 'target' },
      { label: '기업가정신', icon: 'category' },
    ],
    sessionSummary: '총 6단원 (50분 수업기준 12차시 교육)',
    unitCount: 6,
    unitSessionText: '50분 수업기준 12차시 교육',
    units: [
      {
        unitLabel: '1단원',
        title: '문제 발견하기',
        description: '일상 속 문제를 발견하고 아이디어로 연결합니다.',
      },
      {
        unitLabel: '2단원',
        title: '고객을 만나다',
        description: '간단한 인터뷰로 고객 니즈를 확인합니다.',
      },
    ],
  },
  {
    id: 'digital-citizen',
    title: '디지털 시민 되기',
    description: '초·중학생을 위한 디지털 리터러시 기초 교재입니다. 온라인 예절과 정보 비판 능력을 다룹니다.',
    theme: 'digital',
    level: 'elementary',
    tags: ['초등학교', '디지털리터러시'],
    modalTags: [
      { label: '초등학교', icon: 'target' },
      { label: '디지털리터러시', icon: 'category' },
    ],
    sessionSummary: '총 4단원 (40분 수업기준 4차시 교육)',
    unitCount: 4,
    unitSessionText: '40분 수업기준 4차시 교육',
    units: [
      {
        unitLabel: '1단원',
        title: '나와 디지털 세상',
        description: '디지털 기기의 역할과 안전 사용법을 배웁니다.',
      },
      {
        unitLabel: '2단원',
        title: '믿을 수 있는 정보',
        description: '가짜 뉴스와 사실을 구분하는 기준을 연습합니다.',
      },
    ],
  },
  {
    id: 'finance-adult',
    title: '성인을 위한 금융 리터러시',
    description: '성인 학습자를 위한 실용 금융 교육 콘텐츠입니다.',
    theme: 'economy',
    level: 'adult',
    tags: ['성인', '경제금융'],
    modalTags: [
      { label: '성인', icon: 'target' },
      { label: '경제금융', icon: 'category' },
    ],
    sessionSummary: '총 5단원 (60분 수업기준 5차시 교육)',
    unitCount: 5,
    unitSessionText: '60분 수업기준 5차시 교육',
    units: [
      {
        unitLabel: '1단원',
        title: '가계부에서 시작하는 재무관리',
        description: '수입·지출 구조를 파악하고 목표를 세웁니다.',
      },
    ],
  },
  {
    id: 'guide-notice',
    title: '교육 콘텐츠 이용 안내',
    description: '교재 신청·활용 전 확인이 필요한 공통 안내사항입니다.',
    theme: 'economy',
    level: 'notice',
    tags: ['안내사항'],
    modalTags: [{ label: '안내사항', icon: 'category' }],
    sessionSummary: '안내 자료 (차시 없음)',
    unitCount: 0,
    unitSessionText: '차시 없음',
    units: [
      {
        title: '이용 전 확인사항',
        description: '교재 대여·반납 절차와 저작권 안내를 확인합니다.',
      },
    ],
  },
]

export const MOCK_THEME_SECTIONS: TextbookThemeSection[] = [
  {
    key: 'career',
    title: '진로취업',
    description: '미래 진로를 탐색하고 직업 세계를 이해하는 교육 콘텐츠입니다.',
    rows: [
      {
        id: 'dir-career-1',
        titles: ['우주여행', '직업의 세계'],
        level: 'middle',
        contentId: 'space-travel',
      },
      {
        id: 'dir-career-2',
        titles: ['나의 진로 설계', '꿈 찾기 워크북'],
        level: 'high',
        contentId: 'job-world',
      },
      {
        id: 'dir-career-3',
        titles: ['진로 프로그램 신청 안내'],
        level: 'notice',
        contentId: 'guide-notice',
      },
    ],
  },
  {
    key: 'economy',
    title: '경제금융',
    description: '생활 속 경제 개념과 금융 리터러시를 키우는 교육 콘텐츠입니다.',
    rows: [
      {
        id: 'dir-economy-1',
        titles: ['우리들의 경제생활'],
        level: 'preschool',
        contentId: 'economy-life',
      },
      {
        id: 'dir-economy-2',
        titles: ['경제 탐험대', '용돈 관리 교실'],
        level: 'elementary',
        contentId: 'economy-explorers',
      },
      {
        id: 'dir-economy-3',
        titles: ['성인을 위한 금융 리터러시'],
        level: 'adult',
        contentId: 'finance-adult',
      },
    ],
  },
  {
    key: 'entrepreneurship',
    title: '기업가정신',
    description: '문제 해결과 도전 정신을 키우는 기업가정신 교육 콘텐츠입니다.',
    rows: [
      {
        id: 'dir-entre-1',
        titles: ['창업 씨앗 키우기', '아이디어 랩'],
        level: 'high',
        contentId: 'startup-seed',
      },
      {
        id: 'dir-entre-2',
        titles: ['미니 비즈니스 챌린지'],
        level: 'middle',
        contentId: 'startup-seed',
      },
    ],
  },
  {
    key: 'digital',
    title: '디지털 리터러시',
    description: '디지털 시민으로서 필요한 소양과 비판적 사고력을 기릅니다.',
    rows: [
      {
        id: 'dir-digital-1',
        titles: ['디지털 시민 되기', '안전한 온라인'],
        level: 'elementary',
        contentId: 'digital-citizen',
      },
      {
        id: 'dir-digital-2',
        titles: ['정보 판별 트레이닝'],
        level: 'middle',
        contentId: 'digital-citizen',
      },
    ],
  },
]

export function getMockTextbookById(id: string): TextbookContent | undefined {
  return MOCK_TEXTBOOK_CONTENTS.find(item => item.id === id)
}

export function filterTextbooksByCategory(
  items: TextbookContent[],
  category: TextbookCategoryFilter,
): TextbookContent[] {
  if (category === 'all') return items
  return items.filter(item => item.theme === category)
}

export function filterAndSortTextbooks(
  items: TextbookContent[],
  params: Pick<TextbooksListParams, 'category' | 'sort'>,
): TextbookContent[] {
  const filtered = filterTextbooksByCategory(items, params.category)
  if (params.sort === 'name') {
    return [...filtered].sort((a, b) => a.title.localeCompare(b.title, 'ko'))
  }
  return filtered
}

export function useMockTextbookCatalog() {
  return MOCK_TEXTBOOK_CONTENTS
}

export function useMockThemeSections() {
  return MOCK_THEME_SECTIONS
}
