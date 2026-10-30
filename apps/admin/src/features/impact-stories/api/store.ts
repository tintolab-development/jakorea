/**
 * 임팩트 스토리 · 카테고리 localStorage mock
 */

import type {
  ImpactStory,
  ImpactStoryAttachment,
  ImpactStoryCategory,
  ImpactStoryCreateInput,
  ImpactStoryListFilter,
  ImpactStoryUpdateInput,
} from '@/entities/impact-stories/model/types'
import { IMPACT_STORY_PIN_MAX, PinLimitError } from '@/features/impact-stories/lib/pin-limits'

const STORIES_KEY = 'admin.jakorea.impactStories.v2'
const CATEGORIES_KEY = 'admin.jakorea.impactStoryCategories.v1'
export const IMPACT_STORIES_CHANGED_EVENT = 'jakorea:impact-stories-changed' as const

export const DEFAULT_AUTHOR = '홍길동'

type StoriesFile = { version: 1; items: ImpactStory[] }
type CategoriesFile = { version: 1; items: ImpactStoryCategory[] }

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function emitChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(IMPACT_STORIES_CHANGED_EVENT))
  }
}

function normalizeAttachment(
  raw: Partial<ImpactStoryAttachment>,
  idx: number
): ImpactStoryAttachment {
  const mime =
    raw.mime === 'image/png' || raw.mime === 'image/jpeg' ? raw.mime : 'image/jpeg'
  return {
    id: asString(raw.id, `att-${idx}`),
    name: asString(raw.name, 'file.jpg'),
    mime,
    dataUrl: typeof raw.dataUrl === 'string' ? raw.dataUrl : undefined,
  }
}

function normalizeCategory(raw: Partial<ImpactStoryCategory>, i: number): ImpactStoryCategory {
  const version =
    typeof raw.version === 'number' && Number.isFinite(raw.version) ? raw.version : undefined
  const storyCount =
    typeof raw.storyCount === 'number' && Number.isFinite(raw.storyCount)
      ? raw.storyCount
      : undefined
  return {
    id: asString(raw.id, `is-cat-${i}`),
    name: asString(raw.name, '카테고리'),
    sortOrder: asNumber(raw.sortOrder, i),
    ...(version != null ? { version } : {}),
    ...(storyCount != null ? { storyCount } : {}),
  }
}

function normalizeStory(raw: Partial<ImpactStory>, i: number): ImpactStory {
  const atts = Array.isArray(raw.attachments)
    ? raw.attachments.map((a, j) => normalizeAttachment(a as Partial<ImpactStoryAttachment>, j))
    : []
  const now = new Date().toISOString()
  return {
    id: asString(raw.id, `is-${i}`),
    categoryId: asString(raw.categoryId, ''),
    title: asString(raw.title, '제목 없음'),
    contentMarkdown: asString(raw.contentMarkdown, ''),
    isPublic: asBoolean(raw.isPublic, true),
    isPinned: asBoolean(raw.isPinned, false),
    authorName: asString(raw.authorName, DEFAULT_AUTHOR),
    publishedAt: asString(raw.publishedAt, now),
    createdAt: asString(raw.createdAt, now),
    updatedAt: asString(raw.updatedAt, now),
    viewCount: asNumber(raw.viewCount, 0),
    thumbnail: raw.thumbnail
      ? normalizeAttachment(raw.thumbnail as Partial<ImpactStoryAttachment>, 0)
      : null,
    attachments: atts,
  }
}

function buildSeedCategories(): ImpactStoryCategory[] {
  const names = ['스토리', '언론보도', '보고서', '영상', '뉴스레터']
  return names.map((name, i) => ({
    id: `is-cat-${i + 1}`,
    name,
    sortOrder: i,
  }))
}

function samplePng(): ImpactStoryAttachment {
  return {
    id: 'att-seed-1',
    name: '(2026) JA Korea 경제금융교육 커리큘럼.pdf',
    mime: 'image/png',
    dataUrl:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  }
}

function buildSeedStories(categories: ImpactStoryCategory[]): ImpactStory[] {
  const nameToId = new Map(categories.map(c => [c.name, c.id]))
  const seeds: Array<{
    categoryName: string
    title: string
    summary: string
    publishedAt: string
    pinned: boolean
  }> = [
    {
      categoryName: '스토리',
      title: '메트라이프생명 사회공헌재단과 JA Korea의 여름과 겨울 “금융교육”',
      summary:
        '지난 5월 16~17일 열린 Better Ground DAY 1박2일 캠프 현장에 반가운 얼굴이 나타났습니다. 바로 ‘Better Ground 1기’로 참여했던 이...',
      publishedAt: '2026-08-15T00:00:00.000Z',
      pinned: true,
    },
    {
      categoryName: '스토리',
      title: '14년 만에 심사위원으로! 민재님이 JA와 함께하는 이유',
      summary:
        '2012년 고등학생 신분이었던 민재님은 친구들과 함께 FedEx/JA International Trade Challenge에 도전했습니다. 14년이 지난 지금...',
      publishedAt: '2026-08-08T00:00:00.000Z',
      pinned: true,
    },
    {
      categoryName: '언론보도',
      title: 'JA Korea - 시립은평청소년미래진로센터(궁리하다) 업무 협약',
      summary:
        'JA Korea와 시립은평청소년미래진로센터가 청소년 진로·금융교육 확산을 위한 업무 협약을 체결했습니다.',
      publishedAt: '2026-08-01T00:00:00.000Z',
      pinned: true,
    },
    {
      categoryName: '스토리',
      title: '창업놀이 페스티벌 2026 최종 선정팀 결과발표',
      summary: '창업놀이 페스티벌에 참여한 청소년 팀들의 열정과 아이디어를 소개합니다.',
      publishedAt: '2026-07-28T00:00:00.000Z',
      pinned: false,
    },
    {
      categoryName: '보고서',
      title: '경제금융교육 커리큘럼 개편 안내',
      summary: '현장 피드백을 반영한 경제금융교육 커리큘럼 개편 내용을 공유합니다.',
      publishedAt: '2026-07-20T00:00:00.000Z',
      pinned: false,
    },
    {
      categoryName: '뉴스레터',
      title: '연례 후원자 보고회 하이라이트',
      summary: '한 해 동안의 교육 성과와 후원 성과를 나누는 보고회 소식을 전합니다.',
      publishedAt: '2026-07-12T00:00:00.000Z',
      pinned: false,
    },
    {
      categoryName: '스토리',
      title: 'FedEx/JA International Trade Challenge 후기',
      summary: '국제 무역 챌린지에 도전한 학생들의 생생한 현장 이야기를 담았습니다.',
      publishedAt: '2026-07-05T00:00:00.000Z',
      pinned: false,
    },
    {
      categoryName: '언론보도',
      title: '언론보도 스크랩 — JA 교육 프로그램',
      summary: '최근 언론에 소개된 JA Korea 교육 프로그램 소식을 모아 보았습니다.',
      publishedAt: '2026-06-28T00:00:00.000Z',
      pinned: false,
    },
    {
      categoryName: '보고서',
      title: '분기 보고서 발간 안내',
      summary: '2026년 2분기 활동과 성과를 담은 보고서를 공개합니다.',
      publishedAt: '2026-06-20T00:00:00.000Z',
      pinned: false,
    },
    {
      categoryName: '영상',
      title: '영상 콘텐츠: JA 캠퍼스 투어',
      summary: 'JA Korea 교육 현장을 영상으로 만나보세요.',
      publishedAt: '2026-06-12T00:00:00.000Z',
      pinned: false,
    },
    {
      categoryName: '스토리',
      title: '자원봉사자 인터뷰 — 함께 성장하는 한 해',
      summary: '교육 현장에서 청소년과 함께한 자원봉사자들의 이야기를 소개합니다.',
      publishedAt: '2026-06-05T00:00:00.000Z',
      pinned: false,
    },
    {
      categoryName: '뉴스레터',
      title: 'JA Korea 6월 뉴스레터',
      summary: '이번 달 주요 프로그램과 참여 소식을 뉴스레터로 전해 드립니다.',
      publishedAt: '2026-05-28T00:00:00.000Z',
      pinned: false,
    },
    {
      categoryName: '스토리',
      title: '신규 지회 개소식 스토리',
      summary: '새롭게 문을 연 지회에서 청소년들과 나눈 첫 만남 이야기입니다.',
      publishedAt: '2026-05-20T00:00:00.000Z',
      pinned: false,
    },
    {
      categoryName: '언론보도',
      title: '청소년 금융 리터러시 캠페인 참여 기관 모집',
      summary: '금융 리터러시 확산을 위한 캠페인에 함께할 기관을 모집합니다.',
      publishedAt: '2026-05-12T00:00:00.000Z',
      pinned: false,
    },
    {
      categoryName: '영상',
      title: 'Better Ground DAY 하이라이트 영상',
      summary: '1박2일 캠프의 열기와 배움의 순간을 영상으로 담았습니다.',
      publishedAt: '2026-05-08T00:00:00.000Z',
      pinned: false,
    },
    {
      categoryName: '보고서',
      title: '2025 연차보고서 하이라이트',
      summary: '한 해의 교육 임팩트를 한눈에 볼 수 있는 연차보고서 핵심을 소개합니다.',
      publishedAt: '2026-04-30T00:00:00.000Z',
      pinned: false,
    },
    {
      categoryName: '스토리',
      title: '교실 속 기업가정신 — 선생님과 학생의 이야기',
      summary: '기업가정신 수업을 통해 달라진 교실의 풍경을 전합니다.',
      publishedAt: '2026-04-22T00:00:00.000Z',
      pinned: false,
    },
    {
      categoryName: '뉴스레터',
      title: 'JA Korea 봄호 뉴스레터',
      summary: '봄을 맞아 새롭게 열린 프로그램과 참여 안내를 모았습니다.',
      publishedAt: '2026-04-15T00:00:00.000Z',
      pinned: false,
    },
  ]
  const authors = ['홍길동', '김지은', '이준호'] as const
  const fallbackCategoryId = categories[0]?.id ?? ''

  return seeds.map((seed, i) => {
    const publishedAt = seed.publishedAt
    const createdAt = new Date(new Date(publishedAt).getTime() - 3_600_000).toISOString()
    return normalizeStory(
      {
        id: `is-${118 - i}`,
        categoryId: nameToId.get(seed.categoryName) ?? fallbackCategoryId,
        title: seed.title,
        contentMarkdown: [`## ${seed.title}`, '', seed.summary].join('\n'),
        isPublic: true,
        isPinned: seed.pinned,
        authorName: authors[i % authors.length],
        publishedAt,
        createdAt,
        updatedAt: publishedAt,
        viewCount: 800 + (i + 1) * 137,
        thumbnail: i === 0 ? samplePng() : null,
        attachments: i === 1 ? [samplePng()] : [],
      },
      i
    )
  })
}

function readCategoriesFile(): CategoriesFile {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { version: 1, items: buildSeedCategories() }
  }
  const raw = window.localStorage.getItem(CATEGORIES_KEY)
  if (!raw) {
    const seed = { version: 1 as const, items: buildSeedCategories() }
    window.localStorage.setItem(CATEGORIES_KEY, JSON.stringify(seed))
    return seed
  }
  try {
    const parsed = JSON.parse(raw) as CategoriesFile
    if (!parsed || !Array.isArray(parsed.items)) throw new Error('invalid')
    return {
      version: 1,
      items: parsed.items.map((item, i) => normalizeCategory(item, i)),
    }
  } catch {
    const seed = { version: 1 as const, items: buildSeedCategories() }
    window.localStorage.setItem(CATEGORIES_KEY, JSON.stringify(seed))
    return seed
  }
}

function writeCategoriesFile(items: ImpactStoryCategory[]) {
  if (typeof window === 'undefined' || !window.localStorage) return
  window.localStorage.setItem(
    CATEGORIES_KEY,
    JSON.stringify({ version: 1, items } satisfies CategoriesFile)
  )
  emitChange()
}

function readStoriesFile(): StoriesFile {
  const categories = readCategoriesFile().items
  if (typeof window === 'undefined' || !window.localStorage) {
    return { version: 1, items: buildSeedStories(categories) }
  }
  const raw = window.localStorage.getItem(STORIES_KEY)
  if (!raw) {
    const seed = { version: 1 as const, items: buildSeedStories(categories) }
    window.localStorage.setItem(STORIES_KEY, JSON.stringify(seed))
    return seed
  }
  try {
    const parsed = JSON.parse(raw) as StoriesFile
    if (!parsed || !Array.isArray(parsed.items)) throw new Error('invalid')
    return {
      version: 1,
      items: parsed.items.map((item, i) => normalizeStory(item, i)),
    }
  } catch {
    const seed = { version: 1 as const, items: buildSeedStories(categories) }
    window.localStorage.setItem(STORIES_KEY, JSON.stringify(seed))
    return seed
  }
}

function writeStoriesFile(items: ImpactStory[]) {
  if (typeof window === 'undefined' || !window.localStorage) return
  window.localStorage.setItem(
    STORIES_KEY,
    JSON.stringify({ version: 1, items } satisfies StoriesFile)
  )
  emitChange()
}

function ymd(iso: string): string {
  return iso.slice(0, 10)
}

function matchesFilter(row: ImpactStory, filter?: ImpactStoryListFilter): boolean {
  if (!filter) return true
  if (filter.visibility === 'public' && !row.isPublic) return false
  if (filter.visibility === 'private' && row.isPublic) return false
  if (filter.categoryId && row.categoryId !== filter.categoryId) return false

  const titleQ = filter.title?.trim().toLowerCase()
  if (titleQ && !row.title.toLowerCase().includes(titleQ)) return false

  const authorQ = filter.authorName?.trim().toLowerCase()
  if (authorQ && !row.authorName.toLowerCase().includes(authorQ)) return false

  const pFrom = filter.publishedFrom?.trim()
  const pTo = filter.publishedTo?.trim()
  if (pFrom || pTo) {
    const d = ymd(row.publishedAt)
    if (pFrom && d < pFrom) return false
    if (pTo && d > pTo) return false
  }

  const cFrom = filter.createdFrom?.trim()
  const cTo = filter.createdTo?.trim()
  if (cFrom || cTo) {
    const d = ymd(row.createdAt)
    if (cFrom && d < cFrom) return false
    if (cTo && d > cTo) return false
  }
  return true
}

function sortStories(items: ImpactStory[]): ImpactStory[] {
  return [...items].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
    const pa = new Date(a.publishedAt).getTime()
    const pb = new Date(b.publishedAt).getTime()
    return pb - pa
  })
}

function countPinned(items: ImpactStory[], excludeId?: string): number {
  return items.filter(s => s.isPinned && s.id !== excludeId).length
}

function assertPinAllowed(items: ImpactStory[], isPinned: boolean, excludeId?: string) {
  if (!isPinned) return
  if (countPinned(items, excludeId) >= IMPACT_STORY_PIN_MAX) {
    throw new PinLimitError()
  }
}

export function readCategories(): ImpactStoryCategory[] {
  return [...readCategoriesFile().items].sort((a, b) => a.sortOrder - b.sortOrder)
}

export function saveCategories(items: ImpactStoryCategory[]): ImpactStoryCategory[] {
  const next = items.map((item, i) =>
    normalizeCategory({ ...item, name: item.name.trim(), sortOrder: i }, i)
  )
  writeCategoriesFile(next)
  return next
}

export function readStories(filter?: ImpactStoryListFilter): ImpactStory[] {
  const items = sortStories(readStoriesFile().items)
  if (!filter) return items
  return items.filter(row => matchesFilter(row, filter))
}

export function getStoryById(id: string): ImpactStory | null {
  return readStoriesFile().items.find(n => n.id === id) ?? null
}

export function getCategoryNameMap(): Map<string, string> {
  return new Map(readCategories().map(c => [c.id, c.name]))
}

export function countStoriesByCategoryId(categoryId: string): number {
  return readStoriesFile().items.filter(s => s.categoryId === categoryId).length
}

export function countPinnedStories(excludeId?: string): number {
  return countPinned(readStoriesFile().items, excludeId)
}

export function createStory(input: ImpactStoryCreateInput): ImpactStory {
  const file = readStoriesFile()
  assertPinAllowed(file.items, input.isPinned)
  const now = new Date().toISOString()
  const story: ImpactStory = {
    id: `is-${Date.now()}`,
    categoryId: input.categoryId,
    title: input.title.trim(),
    contentMarkdown: input.contentMarkdown,
    isPublic: input.isPublic,
    isPinned: input.isPinned,
    authorName: input.authorName.trim() || DEFAULT_AUTHOR,
    publishedAt: input.publishedAt,
    createdAt: now,
    updatedAt: now,
    viewCount: 0,
    thumbnail: input.thumbnail,
    attachments: input.attachments,
  }
  writeStoriesFile([story, ...file.items])
  return story
}

export function updateStory(input: ImpactStoryUpdateInput): ImpactStory {
  const file = readStoriesFile()
  const idx = file.items.findIndex(n => n.id === input.id)
  if (idx < 0) throw new Error('게시글을 찾을 수 없습니다.')
  const prev = file.items[idx]!
  if (input.isPinned && !prev.isPinned) {
    assertPinAllowed(file.items, true, input.id)
  }
  const next: ImpactStory = {
    ...prev,
    categoryId: input.categoryId,
    title: input.title.trim(),
    contentMarkdown: input.contentMarkdown,
    isPublic: input.isPublic,
    isPinned: input.isPinned,
    authorName: input.authorName.trim() || prev.authorName,
    publishedAt: input.publishedAt,
    thumbnail: input.thumbnail,
    attachments: input.attachments,
    updatedAt: new Date().toISOString(),
  }
  const items = [...file.items]
  items[idx] = next
  writeStoriesFile(items)
  return next
}

export function removeStories(ids: string[]): void {
  const idSet = new Set(ids)
  const file = readStoriesFile()
  writeStoriesFile(file.items.filter(n => !idSet.has(n.id)))
}

export function setStoryPublic(id: string, isPublic: boolean): ImpactStory {
  const file = readStoriesFile()
  const idx = file.items.findIndex(n => n.id === id)
  if (idx < 0) throw new Error('게시글을 찾을 수 없습니다.')
  const next: ImpactStory = {
    ...file.items[idx]!,
    isPublic,
    updatedAt: new Date().toISOString(),
  }
  const items = [...file.items]
  items[idx] = next
  writeStoriesFile(items)
  return next
}
