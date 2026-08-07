/**
 * 공지사항 localStorage mock
 */

import type {
  Notice,
  NoticeAttachment,
  NoticeCreateInput,
  NoticeListFilter,
  NoticeUpdateInput,
} from '@/entities/notices/model/types'

const STORAGE_KEY = 'admin.jakorea.notices.v1'
export const NOTICES_CHANGED_EVENT = 'jakorea:notices-changed' as const

type FileShape = {
  version: 1
  items: Notice[]
}

const DEFAULT_AUTHOR = '홍길동'

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function normalizeAttachment(raw: Partial<NoticeAttachment>, idx: number): NoticeAttachment {
  const mime =
    raw.mime === 'image/png' || raw.mime === 'image/jpeg' ? raw.mime : 'image/jpeg'
  return {
    id: asString(raw.id, `att-${idx}`),
    name: asString(raw.name, 'file.jpg'),
    mime,
    dataUrl: typeof raw.dataUrl === 'string' ? raw.dataUrl : undefined,
  }
}

function normalizeNotice(raw: Partial<Notice>, i: number): Notice {
  const atts = Array.isArray(raw.attachments)
    ? raw.attachments.map((a, j) => normalizeAttachment(a as Partial<NoticeAttachment>, j))
    : []
  const now = new Date().toISOString()
  return {
    id: asString(raw.id, `notice-${i}`),
    title: asString(raw.title, '제목 없음'),
    contentMarkdown: asString(raw.contentMarkdown, ''),
    isPublic: asBoolean(raw.isPublic, true),
    isPinned: asBoolean(raw.isPinned, false),
    authorName: asString(raw.authorName, DEFAULT_AUTHOR),
    publishedAt: asString(raw.publishedAt, now),
    createdAt: asString(raw.createdAt, now),
    updatedAt: asString(raw.updatedAt, now),
    viewCount: asNumber(raw.viewCount, 0),
    attachments: atts,
  }
}

function emitChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(NOTICES_CHANGED_EVENT))
  }
}

function buildSeed(): Notice[] {
  const titles = [
    '제1회 영재교육 페스티벌 개최 안내',
    'JA Korea - 시립은평청소년미래진로센터(궁리하다) 업무 협약',
    '창업놀이 페스티벌 2022 최종 선정팀 결과발표',
    'JA Korea 개인정보처리방침 (2022.04.08. 시행)',
    '2026년 상반기 교육 프로그램 모집 안내',
    '홈페이지 서비스 점검 안내 (비공개 샘플)',
    'JA 자원봉사자 모집 공고',
    '경제금융교육 커리큘럼 개편 안내',
    '연례 후원자 보고회 일정 안내',
    '신규 지회 개소식 안내',
    '청소년 금융 리터러시 캠페인 참여 기관 모집',
    '시스템 점검으로 인한 일시 장애 안내',
  ]

  const base = new Date('2026-01-15T12:00:32.000Z')
  return titles.map((title, i) => {
    const published = new Date(base.getTime() - i * 86_400_000 * 2)
    const isPinned = i < 3
    const isPublic = i !== 5 && i !== 11
    const hasAtt = i === 3 || i === 0
    return normalizeNotice(
      {
        id: `notice-${100 + titles.length - i}`,
        title,
        contentMarkdown: [
          `## ${title}`,
          '',
          '안녕하세요, JA Korea입니다.',
          '',
          '1. 개인정보의 처리목적',
          '',
          'JA Korea는 다음의 목적을 위하여 개인정보를 처리합니다.',
          '',
          '2. 개인정보의 처리 및 보유기간',
          '',
          '관련 법령에 따라 처리·보유합니다.',
          '',
          '본 공지 내용은 줄바꿈이 유지됩니다.',
        ].join('\n'),
        isPublic,
        isPinned,
        authorName: i % 3 === 0 ? '홍길동' : i % 3 === 1 ? '김지은' : '이준호',
        publishedAt: published.toISOString(),
        createdAt: new Date(published.getTime() - 3_600_000).toISOString(),
        updatedAt: published.toISOString(),
        viewCount: isPinned ? 9150000 + i * 1000 : 915 + i * 37,
        attachments: hasAtt
          ? [
              {
                id: `att-${i}-1`,
                name: '(2026) JA Korea 경제금융교육 커리큘럼.png',
                mime: 'image/png' as const,
                dataUrl:
                  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
              },
              {
                id: `att-${i}-2`,
                name: '첨부-샘플.jpg',
                mime: 'image/jpeg' as const,
                dataUrl:
                  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEAwAH/9k=',
              },
            ]
          : [],
      },
      i
    )
  })
}

function readFile(): FileShape {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { version: 1, items: buildSeed() }
  }
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const seed = { version: 1 as const, items: buildSeed() }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }
  try {
    const parsed = JSON.parse(raw) as FileShape
    if (!parsed || !Array.isArray(parsed.items)) {
      throw new Error('invalid')
    }
    return {
      version: 1,
      items: parsed.items.map((item, i) => normalizeNotice(item, i)),
    }
  } catch {
    const seed = { version: 1 as const, items: buildSeed() }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }
}

function writeFile(items: Notice[]) {
  if (typeof window === 'undefined' || !window.localStorage) return
  const next: FileShape = { version: 1, items }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  emitChange()
}

function ymd(iso: string): string {
  return iso.slice(0, 10)
}

function matchesFilter(row: Notice, filter?: NoticeListFilter): boolean {
  if (!filter) return true
  if (filter.visibility === 'public' && !row.isPublic) return false
  if (filter.visibility === 'private' && row.isPublic) return false

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

function sortNotices(items: Notice[]): Notice[] {
  return [...items].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
    const pa = new Date(a.publishedAt).getTime()
    const pb = new Date(b.publishedAt).getTime()
    return pb - pa
  })
}

export function readNotices(filter?: NoticeListFilter): Notice[] {
  const items = sortNotices(readFile().items)
  if (!filter) return items
  return items.filter(row => matchesFilter(row, filter))
}

export function getNoticeById(id: string): Notice | null {
  return readFile().items.find(n => n.id === id) ?? null
}

export function createNotice(input: NoticeCreateInput): Notice {
  const file = readFile()
  const now = new Date().toISOString()
  const notice: Notice = {
    id: `notice-${Date.now()}`,
    title: input.title.trim(),
    contentMarkdown: input.contentMarkdown,
    isPublic: input.isPublic,
    isPinned: input.isPinned,
    authorName: input.authorName.trim() || DEFAULT_AUTHOR,
    publishedAt: input.publishedAt,
    createdAt: now,
    updatedAt: now,
    viewCount: 0,
    attachments: input.attachments,
  }
  writeFile([notice, ...file.items])
  return notice
}

export function updateNotice(input: NoticeUpdateInput): Notice {
  const file = readFile()
  const idx = file.items.findIndex(n => n.id === input.id)
  if (idx < 0) throw new Error('공지를 찾을 수 없습니다.')
  const prev = file.items[idx]!
  const next: Notice = {
    ...prev,
    title: input.title.trim(),
    contentMarkdown: input.contentMarkdown,
    isPublic: input.isPublic,
    isPinned: input.isPinned,
    authorName: input.authorName.trim() || prev.authorName,
    publishedAt: input.publishedAt,
    attachments: input.attachments,
    updatedAt: new Date().toISOString(),
  }
  const items = [...file.items]
  items[idx] = next
  writeFile(items)
  return next
}

export function removeNotices(ids: string[]): void {
  const idSet = new Set(ids)
  const file = readFile()
  writeFile(file.items.filter(n => !idSet.has(n.id)))
}

export function setNoticePublic(id: string, isPublic: boolean): Notice {
  const file = readFile()
  const idx = file.items.findIndex(n => n.id === id)
  if (idx < 0) throw new Error('공지를 찾을 수 없습니다.')
  const next: Notice = {
    ...file.items[idx]!,
    isPublic,
    updatedAt: new Date().toISOString(),
  }
  const items = [...file.items]
  items[idx] = next
  writeFile(items)
  return next
}

export { DEFAULT_AUTHOR }
