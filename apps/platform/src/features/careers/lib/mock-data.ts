import heroImageUrl from '../image/illustration/hero.png'
import storyMetlifeUrl from '../image/illustration/story-metlife.png'
import thriveHelpDecoUrl from '../image/illustration/thrive-help-deco.svg'
import thriveImpactDecoUrl from '../image/illustration/thrive-impact-deco.svg'
import thriveLearnDecoUrl from '../image/illustration/thrive-learn-deco.svg'
import thriveSpeakDecoUrl from '../image/illustration/thrive-speak-deco.svg'
import thriveTitleDecoUrl from '../image/illustration/thrive-title-deco.svg'
import type {
  CareerJobListItem,
  CareersFeaturedStory,
  ThriveValue,
} from '../model/types'

export const CAREERS_HERO = {
  label: '인재채용',
  titleLines: [
    '가능성을 믿는 사람들이',
    '만드는 변화, 우리는 청소년의',
    '가능성을 믿습니다',
  ],
  descriptionKo: [
    '신뢰와 존중을 바탕으로 함께 배우고 성장하며,',
    '그 가능성을 실천로 만들어갑니다.',
  ],
  descriptionEn:
    'People who believe in young people, creating impact together through trust, partnership, and continuous learning.',
  imageUrl: heroImageUrl,
  imageAlt: 'JA Korea 동료들이 밝은 사무실에서 자료를 보며 대화하는 모습',
} as const

export const THRIVE_TITLE = {
  text: 'How We Thrive',
  decorationUrl: thriveTitleDecoUrl,
} as const

export const THRIVE_VALUES: readonly ThriveValue[] = [
  {
    id: 'impact',
    title: 'Make an Impact',
    summary: '청소년의 성장이라는 공동의 목적을 향해 함께 나아갑니다',
    detail:
      '각자의 노력이 만드는 작은 변화가 더 큰 사회적 가치로 이어진다고 믿으며, 맡은 일에 책임감을 가지고 긍정적인 변화를 만들어갑니다.',
    tone: 'yellow',
    column: 'left',
    order: 0,
  },
  {
    id: 'learn',
    title: 'Keep Learning',
    summary: '배움은 성장의 시작입니다',
    detail:
      '호기심을 가지고 새로운 것에 도전하며 끊임없이 배우고 더 나은 방법을 함께 찾아갑니다.',
    tone: 'sky',
    column: 'left',
    order: 1,
  },
  {
    id: 'speak',
    title: 'Speak Openly',
    summary: '좋은 아이디어는 열린 소통에서 시작됩니다',
    detail:
      '신뢰와 정직을 바탕으로 자유롭게 의견을 나누며, 직급이나 역할에 관계없이 서로의 목소리에 귀 기울이고 더 나은 방향을 함께 만들어갑니다.',
    tone: 'mint',
    column: 'right',
    order: 0,
  },
  {
    id: 'help',
    title: 'Ready to Help',
    summary: '협력은 서로를 존중하는 마음에서 시작됩니다',
    detail:
      '다양한 의견에 귀 기울이고, 도움이 필요한 순간에는 기꺼이 손을 내밀며 함께 해결책을 찾아갑니다.',
    tone: 'lime',
    column: 'right',
    order: 1,
  },
]

export const THRIVE_DECORATION_URL: Record<ThriveValue['tone'], string> = {
  yellow: thriveImpactDecoUrl,
  mint: thriveSpeakDecoUrl,
  sky: thriveLearnDecoUrl,
  lime: thriveHelpDecoUrl,
}

export const FEATURED_STORIES: readonly CareersFeaturedStory[] = [
  {
    id: 'story-metlife-2026',
    categoryLabel: '스토리',
    title: '메트라이프생명 사회공헌재단과 JA Korea의 여름과 겨울',
    publishedAtLabel: '2026년 08월 15일',
    imageUrl: storyMetlifeUrl,
  },
  {
    id: 'story-summer-camp',
    categoryLabel: '스토리',
    title: '청소년과 함께한 JA Korea 여름 캠프 이야기',
    publishedAtLabel: '2025년 07월 20일',
    imageUrl: storyMetlifeUrl,
  },
  {
    id: 'story-volunteer-day',
    categoryLabel: '스토리',
    title: '임직원 봉사로 이어진 따뜻한 하루',
    publishedAtLabel: '2025년 03월 10일',
    imageUrl: storyMetlifeUrl,
  },
]

/** 채용성 mock — 시안 공지 제목은 사용하지 않음 */
export const MOCK_CAREER_JOBS: readonly CareerJobListItem[] = [
  {
    id: 'job-1',
    title: '교육사업팀 프로그램 매니저 채용',
    status: 'recruiting',
    statusLabel: '모집중',
    publishedAtLabel: '2026년 05월 08일',
  },
  {
    id: 'job-2',
    title: '마케팅·커뮤니케이션 담당자 채용',
    status: 'recruiting',
    statusLabel: '모집중',
    publishedAtLabel: '2026년 04월 22일',
  },
  {
    id: 'job-3',
    title: '디지털 콘텐츠 기획자 채용 — 서류 합격자 안내',
    status: 'result',
    statusLabel: '결과발표',
    publishedAtLabel: '2026년 03월 15일',
  },
  {
    id: 'job-4',
    title: '지역 파트너십 코디네이터 채용 — 최종 합격자 발표',
    status: 'result',
    statusLabel: '결과발표',
    publishedAtLabel: '2026년 02월 28일',
  },
  {
    id: 'job-5',
    title: '경영지원팀 회계·총무 담당자 채용',
    status: 'closed',
    statusLabel: '모집완료',
    publishedAtLabel: '2025년 12월 10일',
  },
  {
    id: 'job-6',
    title: '자원봉사 운영 매니저 채용',
    status: 'closed',
    statusLabel: '모집완료',
    publishedAtLabel: '2025년 11월 05일',
  },
  {
    id: 'job-7',
    title: '2025 하반기 신입·경력 공개채용',
    status: 'closed',
    statusLabel: '모집완료',
    publishedAtLabel: '2025년 09월 18일',
  },
  {
    id: 'job-8',
    title: '교육 콘텐츠 에디터 채용',
    status: 'closed',
    statusLabel: '모집완료',
    publishedAtLabel: '2025년 08월 01일',
  },
  {
    id: 'job-9',
    title: 'IT·데이터 분석 담당자 채용',
    status: 'closed',
    statusLabel: '모집완료',
    publishedAtLabel: '2025년 06월 20일',
  },
  {
    id: 'job-10',
    title: '대외협력팀 어시스턴트 채용',
    status: 'closed',
    statusLabel: '모집완료',
    publishedAtLabel: '2025년 05월 08일',
  },
]

export function getMockCareerJobs() {
  return MOCK_CAREER_JOBS
}

export function getThriveValues() {
  return THRIVE_VALUES
}

export function getFeaturedStories() {
  return FEATURED_STORIES
}
