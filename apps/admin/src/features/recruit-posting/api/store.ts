/**
 * 채용공고 — localStorage mock
 * 시드 제목·상태·게시일은 Platform `MOCK_CAREER_JOBS`.
 */

import type {
  RecruitPosting,
  RecruitPostingAttachment,
  RecruitPostingCreateInput,
  RecruitPostingListFilter,
  RecruitPostingStatus,
  RecruitPostingUpdateInput,
} from '@/entities/recruit-posting/model/types'

const STORAGE_KEY = 'admin.jakorea.recruitPostings.v2'

export const RECRUIT_POSTINGS_CHANGED_EVENT = 'jakorea:recruit-postings-changed' as const

export const DEFAULT_AUTHOR = '홍길동'

type FileShape = {
  version: 2
  items: RecruitPosting[]
}

const STATUSES = new Set<RecruitPostingStatus>(['recruiting', 'result', 'closed'])

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asStatus(value: unknown, fallback: RecruitPostingStatus): RecruitPostingStatus {
  return typeof value === 'string' && STATUSES.has(value as RecruitPostingStatus)
    ? (value as RecruitPostingStatus)
    : fallback
}

function asAttachments(value: unknown): RecruitPostingAttachment[] {
  if (!Array.isArray(value)) return []
  const items: RecruitPostingAttachment[] = []
  for (let i = 0; i < value.length; i += 1) {
    const raw = value[i]
    if (!raw || typeof raw !== 'object') continue
    const row = raw as Partial<RecruitPostingAttachment>
    const name = asString(row.name, '')
    if (!name) continue
    const item: RecruitPostingAttachment = {
      id: asString(row.id, `att-${i}`),
      name,
      mime: (row.mime as RecruitPostingAttachment['mime']) || 'application/octet-stream',
    }
    if (typeof row.dataUrl === 'string') item.dataUrl = row.dataUrl
    if (typeof row.assetId === 'number') item.assetId = row.assetId
    items.push(item)
  }
  return items
}

function emitChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(RECRUIT_POSTINGS_CHANGED_EVENT))
  }
}

function normalizePosting(raw: Partial<RecruitPosting>, i: number): RecruitPosting {
  return {
    id: asString(raw.id, `job-${i + 1}`),
    isPublic: asBoolean(raw.isPublic, true),
    status: asStatus(raw.status, 'closed'),
    title: asString(raw.title, ''),
    contentMarkdown: asString(raw.contentMarkdown, ''),
    authorName: asString(raw.authorName, ''),
    recruitStart: asString(raw.recruitStart, ''),
    recruitEnd: asString(raw.recruitEnd, ''),
    publishedAt: asString(raw.publishedAt, ''),
    createdAt: asString(raw.createdAt, ''),
    viewCount: asNumber(raw.viewCount, 0),
    attachments: asAttachments(raw.attachments),
    buttonLabel: asString(raw.buttonLabel, '').trim(),
    linkUrl: asString(raw.linkUrl, '').trim(),
    version: asNumber(raw.version, 0),
  }
}

/**
 * Platform MOCK_CAREER_JOBS 제목·상태·게시일 + Admin 목록용 작성자·모집기간·작성일시
 */
function buildSeed(): RecruitPosting[] {
  const rows: Array<{
    id: string
    status: RecruitPosting['status']
    title: string
    publishedAt: string
    recruitStart: string
    recruitEnd: string
    createdAt: string
  }> = [
    {
      id: 'job-1',
      status: 'recruiting',
      title: '교육사업팀 프로그램 매니저 채용',
      publishedAt: '2026-05-08T09:00:00',
      recruitStart: '2026-05-08T09:00:00',
      recruitEnd: '2026-06-08T18:00:00',
      createdAt: '2026-05-07T12:00:32',
    },
    {
      id: 'job-2',
      status: 'recruiting',
      title: '마케팅·커뮤니케이션 담당자 채용',
      publishedAt: '2026-04-22T09:00:00',
      recruitStart: '2026-04-22T09:00:00',
      recruitEnd: '2026-05-22T18:00:00',
      createdAt: '2026-04-21T12:00:32',
    },
    {
      id: 'job-3',
      status: 'result',
      title: '디지털 콘텐츠 기획자 채용 — 서류 합격자 안내',
      publishedAt: '2026-03-15T09:00:00',
      recruitStart: '2026-02-01T09:00:00',
      recruitEnd: '2026-03-01T18:00:00',
      createdAt: '2026-03-14T12:00:32',
    },
    {
      id: 'job-4',
      status: 'result',
      title: '지역 파트너십 코디네이터 채용 — 최종 합격자 발표',
      publishedAt: '2026-02-28T09:00:00',
      recruitStart: '2026-01-15T09:00:00',
      recruitEnd: '2026-02-15T18:00:00',
      createdAt: '2026-02-27T12:00:32',
    },
    {
      id: 'job-5',
      status: 'closed',
      title: '경영지원팀 회계·총무 담당자 채용',
      publishedAt: '2025-12-10T09:00:00',
      recruitStart: '2025-11-01T09:00:00',
      recruitEnd: '2025-12-01T18:00:00',
      createdAt: '2025-12-09T12:00:32',
    },
    {
      id: 'job-6',
      status: 'closed',
      title: '자원봉사 운영 매니저 채용',
      publishedAt: '2025-11-05T09:00:00',
      recruitStart: '2025-10-01T09:00:00',
      recruitEnd: '2025-11-01T18:00:00',
      createdAt: '2025-11-04T12:00:32',
    },
    {
      id: 'job-7',
      status: 'closed',
      title: '2025 하반기 신입·경력 공개채용',
      publishedAt: '2025-09-18T09:00:00',
      recruitStart: '2025-08-01T09:00:00',
      recruitEnd: '2025-09-15T18:00:00',
      createdAt: '2025-09-17T12:00:32',
    },
    {
      id: 'job-8',
      status: 'closed',
      title: '교육 콘텐츠 에디터 채용',
      publishedAt: '2025-08-01T09:00:00',
      recruitStart: '2025-07-01T09:00:00',
      recruitEnd: '2025-07-31T18:00:00',
      createdAt: '2025-07-31T12:00:32',
    },
    {
      id: 'job-9',
      status: 'closed',
      title: 'IT·데이터 분석 담당자 채용',
      publishedAt: '2025-06-20T09:00:00',
      recruitStart: '2025-05-20T09:00:00',
      recruitEnd: '2025-06-19T18:00:00',
      createdAt: '2025-06-19T12:00:32',
    },
    {
      id: 'job-10',
      status: 'closed',
      title: '대외협력팀 어시스턴트 채용',
      publishedAt: '2025-05-08T09:00:00',
      recruitStart: '2025-04-08T09:00:00',
      recruitEnd: '2025-05-07T18:00:00',
      createdAt: '2025-05-07T12:00:32',
    },
  ]
  return rows.map((row, i) =>
    normalizePosting(
      {
        ...row,
        isPublic: true,
        contentMarkdown: '',
        authorName: DEFAULT_AUTHOR,
        attachments: [],
        viewCount: 0,
        buttonLabel: '',
        linkUrl: '',
        version: 0,
      },
      i,
    ),
  )
}

function readFile(): FileShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { version: 2, items: buildSeed() }
    const parsed = JSON.parse(raw) as FileShape
    if (parsed?.version !== 2 || !Array.isArray(parsed.items)) {
      return { version: 2, items: buildSeed() }
    }
    return {
      version: 2,
      items: parsed.items.map((row, i) => normalizePosting(row, i)),
    }
  } catch {
    return { version: 2, items: buildSeed() }
  }
}

function writeFile(file: FileShape): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  emitChange()
}

function ensurePersisted(): FileShape {
  const file = readFile()
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeFile(file)
  }
  return file
}

function ymd(value: string): string {
  return value.slice(0, 10)
}

function periodOverlaps(row: RecruitPosting, from: string, to: string): boolean {
  const start = ymd(row.recruitStart)
  const end = ymd(row.recruitEnd)
  if (!start || !end) return false
  if (from && end < from) return false
  if (to && start > to) return false
  return true
}

function matchesFilter(row: RecruitPosting, filter?: RecruitPostingListFilter): boolean {
  if (!filter) return true
  if (filter.visibility === 'public' && !row.isPublic) return false
  if (filter.visibility === 'private' && row.isPublic) return false
  if (filter.status && row.status !== filter.status) return false

  const titleQ = filter.title?.trim().toLowerCase()
  if (titleQ && !row.title.toLowerCase().includes(titleQ)) return false

  const authorQ = filter.authorName?.trim().toLowerCase()
  if (authorQ && !row.authorName.toLowerCase().includes(authorQ)) return false

  const recruitFrom = filter.recruitFrom?.trim() ?? ''
  const recruitTo = filter.recruitTo?.trim() ?? ''
  if ((recruitFrom || recruitTo) && !periodOverlaps(row, recruitFrom, recruitTo)) return false

  const publishedFrom = filter.publishedFrom?.trim() ?? ''
  const publishedTo = filter.publishedTo?.trim() ?? ''
  if (publishedFrom || publishedTo) {
    const day = ymd(row.publishedAt)
    if (!day) return false
    if (publishedFrom && day < publishedFrom) return false
    if (publishedTo && day > publishedTo) return false
  }

  return true
}

function sortPostings(items: RecruitPosting[]): RecruitPosting[] {
  return [...items].sort((a, b) => {
    const pa = a.publishedAt || ''
    const pb = b.publishedAt || ''
    if (pa !== pb) return pb.localeCompare(pa)
    return a.id.localeCompare(b.id)
  })
}

export function filterRecruitPostings(
  items: RecruitPosting[],
  filter?: RecruitPostingListFilter,
): RecruitPosting[] {
  return sortPostings(items).filter(row => matchesFilter(row, filter))
}

export function readRecruitPostings(filter?: RecruitPostingListFilter): RecruitPosting[] {
  return filterRecruitPostings(ensurePersisted().items, filter)
}

export function getRecruitPostingById(id: string): RecruitPosting | null {
  return ensurePersisted().items.find(row => row.id === id) ?? null
}

export function createRecruitPosting(input: RecruitPostingCreateInput): RecruitPosting {
  const file = ensurePersisted()
  const now = new Date().toISOString()
  const posting: RecruitPosting = {
    id: `job-${Date.now()}`,
    title: input.title.trim(),
    contentMarkdown: input.contentMarkdown,
    isPublic: input.isPublic,
    status: input.status,
    authorName: input.authorName.trim() || DEFAULT_AUTHOR,
    recruitStart: input.recruitStart,
    recruitEnd: input.recruitEnd,
    publishedAt: input.publishedAt,
    createdAt: now,
    viewCount: 0,
    attachments: input.attachments.map(a => ({
      id: a.id,
      name: a.name,
      mime: a.mime,
      dataUrl: a.dataUrl,
      assetId: a.assetId,
    })),
    buttonLabel: input.buttonLabel.trim(),
    linkUrl: input.linkUrl.trim(),
    version: 0,
  }
  writeFile({ version: 2, items: [posting, ...file.items] })
  return posting
}

export function updateRecruitPosting(input: RecruitPostingUpdateInput): RecruitPosting {
  const file = ensurePersisted()
  const index = file.items.findIndex(row => row.id === input.id)
  if (index < 0) throw new Error('POSTING_NOT_FOUND')
  const prev = file.items[index]!
  const next: RecruitPosting = {
    ...prev,
    title: input.title.trim(),
    contentMarkdown: input.contentMarkdown,
    isPublic: input.isPublic,
    status: input.status,
    authorName: input.authorName.trim() || prev.authorName,
    recruitStart: input.recruitStart,
    recruitEnd: input.recruitEnd,
    publishedAt: input.publishedAt,
    attachments: input.attachments.map(a => ({
      id: a.id,
      name: a.name,
      mime: a.mime,
      dataUrl: a.dataUrl,
      assetId: a.assetId,
    })),
    buttonLabel: input.buttonLabel.trim(),
    linkUrl: input.linkUrl.trim(),
    version: prev.version + 1,
  }
  const items = file.items.slice()
  items[index] = next
  writeFile({ version: 2, items })
  return next
}

export function setRecruitPostingPublic(id: string, isPublic: boolean): RecruitPosting {
  const file = ensurePersisted()
  const index = file.items.findIndex(row => row.id === id)
  if (index < 0) throw new Error('POSTING_NOT_FOUND')
  const next = { ...file.items[index]!, isPublic, version: file.items[index]!.version + 1 }
  const items = file.items.slice()
  items[index] = next
  writeFile({ version: 2, items })
  return next
}

export function removeRecruitPostings(ids: string[]): void {
  if (ids.length === 0) throw new Error('POSTING_NONE_SELECTED')
  const idSet = new Set(ids)
  const file = ensurePersisted()
  writeFile({ version: 2, items: file.items.filter(row => !idSet.has(row.id)) })
}
