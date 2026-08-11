import type {
  ImpactStoryCategoryKey,
  ImpactStoryContentBlock,
  ImpactStoryDetail,
  ImpactStoryListItem,
} from '../model/types'

const CATEGORY_LABEL: Record<ImpactStoryCategoryKey, string> = {
  story: '스토리',
  press: '언론보도',
  report: '보고서',
  video: '영상',
  newsletter: '뉴스레터',
}

const PLACEHOLDER_COLORS: Record<ImpactStoryCategoryKey, string> = {
  story: '#c5e8eb',
  press: '#c8d4e8',
  report: '#d0d5e0',
  video: '#c9dfe8',
  newsletter: '#c5e0f0',
}

function formatPublishedAtLabel(iso: string): string {
  const date = new Date(iso)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}년 ${m}월 ${d}일`
}

/** 상세 메타용 — 예: 2026년 08월 15일 오전 12:00 */
function formatPublishedAtDetailLabel(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '-'

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hours24 = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const period = hours24 < 12 ? '오전' : '오후'
  const hours12 = hours24 % 12 || 12
  return `${y}년 ${m}월 ${d}일 ${period} ${hours12}:${minutes}`
}

type SeedStory = {
  id: string
  category: ImpactStoryCategoryKey
  title: string
  summary: string
  publishedAt: string
  isFeatured?: boolean
}

function buildDetailBlocks(_seed: SeedStory): ImpactStoryContentBlock[] {
  return [{ type: 'image', heightPx: 5000 }]
}

function viewCountFromId(id: string): number {
  const digits = id.replace(/\D/g, '')
  const n = Number(digits) || 1
  return 800 + n * 137
}

const SEED: readonly SeedStory[] = [
  {
    id: 'impact-1',
    category: 'story',
    title: '메트라이프생명 사회공헌재단과 JA Korea의 여름과 겨울 “금융교육”',
    summary:
      '지난 5월 16~17일 열린 Better Ground DAY 1박2일 캠프 현장에 반가운 얼굴이 나타났습니다. 바로 ‘Better Ground 1기’로 참여했던 이...',
    publishedAt: '2026-08-15T00:00:00.000Z',
    isFeatured: true,
  },
  {
    id: 'impact-2',
    category: 'story',
    title: '14년 만에 심사위원으로! 민재님이 JA와 함께하는 이유',
    summary:
      '2012년 고등학생 신분이었던 민재님은 친구들과 함께 FedEx/JA International Trade Challenge에 도전했습니다. 14년이 지난 지금...',
    publishedAt: '2026-08-08T00:00:00.000Z',
    isFeatured: true,
  },
  {
    id: 'impact-3',
    category: 'press',
    title: 'JA Korea - 시립은평청소년미래진로센터(궁리하다) 업무 협약',
    summary:
      'JA Korea와 시립은평청소년미래진로센터가 청소년 진로·금융교육 확산을 위한 업무 협약을 체결했습니다.',
    publishedAt: '2026-08-01T00:00:00.000Z',
    isFeatured: true,
  },
  {
    id: 'impact-4',
    category: 'story',
    title: '창업놀이 페스티벌 2026 최종 선정팀 결과발표',
    summary: '창업놀이 페스티벌에 참여한 청소년 팀들의 열정과 아이디어를 소개합니다.',
    publishedAt: '2026-07-28T00:00:00.000Z',
  },
  {
    id: 'impact-5',
    category: 'report',
    title: '경제금융교육 커리큘럼 개편 안내',
    summary: '현장 피드백을 반영한 경제금융교육 커리큘럼 개편 내용을 공유합니다.',
    publishedAt: '2026-07-20T00:00:00.000Z',
  },
  {
    id: 'impact-6',
    category: 'newsletter',
    title: '연례 후원자 보고회 하이라이트',
    summary: '한 해 동안의 교육 성과와 후원 성과를 나누는 보고회 소식을 전합니다.',
    publishedAt: '2026-07-12T00:00:00.000Z',
  },
  {
    id: 'impact-7',
    category: 'story',
    title: 'FedEx/JA International Trade Challenge 후기',
    summary: '국제 무역 챌린지에 도전한 학생들의 생생한 현장 이야기를 담았습니다.',
    publishedAt: '2026-07-05T00:00:00.000Z',
  },
  {
    id: 'impact-8',
    category: 'press',
    title: '언론보도 스크랩 — JA 교육 프로그램',
    summary: '최근 언론에 소개된 JA Korea 교육 프로그램 소식을 모아 보았습니다.',
    publishedAt: '2026-06-28T00:00:00.000Z',
  },
  {
    id: 'impact-9',
    category: 'report',
    title: '분기 보고서 발간 안내',
    summary: '2026년 2분기 활동과 성과를 담은 보고서를 공개합니다.',
    publishedAt: '2026-06-20T00:00:00.000Z',
  },
  {
    id: 'impact-10',
    category: 'video',
    title: '영상 콘텐츠: JA 캠퍼스 투어',
    summary: 'JA Korea 교육 현장을 영상으로 만나보세요.',
    publishedAt: '2026-06-12T00:00:00.000Z',
  },
  {
    id: 'impact-11',
    category: 'story',
    title: '자원봉사자 인터뷰 — 함께 성장하는 한 해',
    summary: '교육 현장에서 청소년과 함께한 자원봉사자들의 이야기를 소개합니다.',
    publishedAt: '2026-06-05T00:00:00.000Z',
  },
  {
    id: 'impact-12',
    category: 'newsletter',
    title: 'JA Korea 6월 뉴스레터',
    summary: '이번 달 주요 프로그램과 참여 소식을 뉴스레터로 전해 드립니다.',
    publishedAt: '2026-05-28T00:00:00.000Z',
  },
  {
    id: 'impact-13',
    category: 'story',
    title: '신규 지회 개소식 스토리',
    summary: '새롭게 문을 연 지회에서 청소년들과 나눈 첫 만남 이야기입니다.',
    publishedAt: '2026-05-20T00:00:00.000Z',
  },
  {
    id: 'impact-14',
    category: 'press',
    title: '청소년 금융 리터러시 캠페인 참여 기관 모집',
    summary: '금융 리터러시 확산을 위한 캠페인에 함께할 기관을 모집합니다.',
    publishedAt: '2026-05-12T00:00:00.000Z',
  },
  {
    id: 'impact-15',
    category: 'video',
    title: 'Better Ground DAY 하이라이트 영상',
    summary: '1박2일 캠프의 열기와 배움의 순간을 영상으로 담았습니다.',
    publishedAt: '2026-05-08T00:00:00.000Z',
  },
  {
    id: 'impact-16',
    category: 'report',
    title: '2025 연차보고서 하이라이트',
    summary: '한 해의 교육 임팩트를 한눈에 볼 수 있는 연차보고서 핵심을 소개합니다.',
    publishedAt: '2026-04-30T00:00:00.000Z',
  },
  {
    id: 'impact-17',
    category: 'story',
    title: '교실 속 기업가정신 — 선생님과 학생의 이야기',
    summary: '기업가정신 수업을 통해 달라진 교실의 풍경을 전합니다.',
    publishedAt: '2026-04-22T00:00:00.000Z',
  },
  {
    id: 'impact-18',
    category: 'newsletter',
    title: 'JA Korea 봄호 뉴스레터',
    summary: '봄을 맞아 새롭게 열린 프로그램과 참여 안내를 모았습니다.',
    publishedAt: '2026-04-15T00:00:00.000Z',
  },
]

function toListItem(seed: SeedStory): ImpactStoryListItem {
  return {
    id: seed.id,
    category: seed.category,
    categoryLabel: CATEGORY_LABEL[seed.category],
    title: seed.title,
    summary: seed.summary,
    publishedAt: seed.publishedAt,
    publishedAtLabel: formatPublishedAtLabel(seed.publishedAt),
    isFeatured: seed.isFeatured ?? false,
    placeholderColor: PLACEHOLDER_COLORS[seed.category],
  }
}

const MOCK_STORIES: readonly ImpactStoryListItem[] = SEED.map(toListItem)

function toDetail(seed: SeedStory): ImpactStoryDetail {
  return {
    ...toListItem(seed),
    publishedAtDetailLabel: formatPublishedAtDetailLabel(seed.publishedAt),
    viewCount: viewCountFromId(seed.id),
    blocks: buildDetailBlocks(seed),
  }
}

const MOCK_DETAILS: readonly ImpactStoryDetail[] = SEED.map(toDetail)

export function getMockImpactStories(): ImpactStoryListItem[] {
  return MOCK_STORIES.map(item => ({ ...item }))
}

export function getFeaturedImpactStories(): ImpactStoryListItem[] {
  return MOCK_STORIES.filter(item => item.isFeatured).map(item => ({ ...item }))
}

export function useMockImpactStories(): ImpactStoryListItem[] {
  return getMockImpactStories()
}

export function getMockImpactStoryById(id: string): ImpactStoryListItem | null {
  return MOCK_STORIES.find(item => item.id === id) ?? null
}

export function getMockImpactStoryDetailById(id: string): ImpactStoryDetail | null {
  const detail = MOCK_DETAILS.find(item => item.id === id)
  return detail ? { ...detail, blocks: detail.blocks.map(block => ({ ...block })) } : null
}

export function useMockImpactStoryDetail(id: string | null): ImpactStoryDetail | null {
  if (!id) return null
  return getMockImpactStoryDetailById(id)
}

export type AdjacentImpactStories = {
  previous: ImpactStoryListItem | null
  next: ImpactStoryListItem | null
}

/**
 * 최신순(발행일 desc) 기준 인접 글.
 * - previous(이전글): 목록에서 아래(더 오래된) 글
 * - next(다음글): 목록에서 위(더 최근) 글
 */
export function getAdjacentImpactStories(id: string): AdjacentImpactStories {
  const sorted = [...MOCK_STORIES].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
  const index = sorted.findIndex(item => item.id === id)
  if (index < 0) {
    return { previous: null, next: null }
  }
  return {
    next: index > 0 ? (sorted[index - 1] ?? null) : null,
    previous: index < sorted.length - 1 ? (sorted[index + 1] ?? null) : null,
  }
}
