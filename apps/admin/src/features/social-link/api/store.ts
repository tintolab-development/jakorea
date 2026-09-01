/**
 * 소셜 링크 — localStorage mock (API 연동 전)
 * 고정 6채널 — 생성/삭제 없음
 */

import type {
  SocialLink,
  SocialLinkChannel,
  SocialLinkUrlPatch,
} from '@/entities/social-link/model/types'

const STORAGE_KEY = 'admin.jakorea.socialLinks.v1'

export const SOCIAL_LINKS_CHANGED_EVENT = 'jakorea:social-links-changed' as const

type SocialLinkFile = {
  version: 1
  items: SocialLink[]
}

type SeedRow = {
  channel: SocialLinkChannel
  name: string
  isActive: boolean
  linkUrl: string
}

/** 시안 seed — 고정 6채널 */
const SEED_ROWS: readonly SeedRow[] = [
  {
    channel: 'instagram',
    name: '인스타그램',
    isActive: true,
    linkUrl: 'https://www.instagram.com/jakorea_official/',
  },
  {
    channel: 'facebook',
    name: '페이스북',
    isActive: true,
    linkUrl: 'https://www.facebook.com/jakorea/?locale=ko_KR',
  },
  {
    channel: 'linkedin',
    name: '링크드인',
    isActive: true,
    linkUrl: 'https://kr.linkedin.com/',
  },
  {
    channel: 'naver_blog',
    name: '네이버 블로그',
    isActive: true,
    linkUrl:
      'https://section.blog.naver.com/BlogHome.naver?directoryNo=0&currentPage=1&groupId=0',
  },
  {
    channel: 'newsletter',
    name: '뉴스레터',
    isActive: true,
    linkUrl: 'https://stibee.com/',
  },
  {
    channel: 'youtube',
    name: '유튜브',
    isActive: true,
    linkUrl: 'https://youtube.com/user/jakorea2002',
  },
]

const CHANNEL_NAME: Record<SocialLinkChannel, string> = {
  instagram: '인스타그램',
  facebook: '페이스북',
  linkedin: '링크드인',
  naver_blog: '네이버 블로그',
  newsletter: '뉴스레터',
  youtube: '유튜브',
}

function buildSeedLinks(): SocialLink[] {
  const base = new Date('2026-07-01T00:00:00.000Z')
  return SEED_ROWS.map((row, index) => {
    const ts = new Date(base.getTime() + index * 60_000).toISOString()
    return {
      id: `social-link-${row.channel}`,
      channel: row.channel,
      name: row.name,
      sortOrder: index + 1,
      isActive: row.isActive,
      linkUrl: row.linkUrl,
      version: 0,
      updatedAt: ts,
    }
  })
}

function isSocialLinkChannel(value: unknown): value is SocialLinkChannel {
  return (
    value === 'instagram' ||
    value === 'facebook' ||
    value === 'linkedin' ||
    value === 'naver_blog' ||
    value === 'newsletter' ||
    value === 'youtube'
  )
}

/** 누락 채널을 seed로 보정하고 표시명은 고정값으로 유지 */
function ensureFixedChannels(items: SocialLink[]): SocialLink[] {
  const seedByChannel = new Map(buildSeedLinks().map(row => [row.channel, row]))
  const byChannel = new Map<SocialLinkChannel, SocialLink>()

  for (const row of items) {
    if (!isSocialLinkChannel(row.channel)) continue
    const seed = seedByChannel.get(row.channel)!
    byChannel.set(row.channel, {
      ...row,
      id: seed.id,
      channel: row.channel,
      name: CHANNEL_NAME[row.channel],
      isActive: Boolean(row.isActive),
      linkUrl: typeof row.linkUrl === 'string' ? row.linkUrl : '',
      version: typeof row.version === 'number' ? row.version : 0,
      updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : seed.updatedAt,
      sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : seed.sortOrder,
    })
  }

  for (const seed of seedByChannel.values()) {
    if (!byChannel.has(seed.channel)) {
      byChannel.set(seed.channel, seed)
    }
  }

  return normalizeSortOrders([...byChannel.values()])
}

function readFile(): SocialLinkFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { version: 1, items: buildSeedLinks() }
    }
    const parsed = JSON.parse(raw) as SocialLinkFile
    if (parsed?.version !== 1 || !Array.isArray(parsed.items)) {
      return { version: 1, items: buildSeedLinks() }
    }
    return { version: 1, items: ensureFixedChannels(parsed.items) }
  } catch {
    return { version: 1, items: buildSeedLinks() }
  }
}

function writeFile(file: SocialLinkFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(SOCIAL_LINKS_CHANGED_EVENT))
}

function assignSortOrders(items: SocialLink[]): SocialLink[] {
  return items.map((row, index) => ({ ...row, sortOrder: index + 1 }))
}

function normalizeSortOrders(items: SocialLink[]): SocialLink[] {
  return assignSortOrders([...items].sort((a, b) => a.sortOrder - b.sortOrder))
}

export function readSocialLinks(): SocialLink[] {
  const file = readFile()
  const items = ensureFixedChannels(file.items)
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeFile({ version: 1, items })
  } else if (items.length !== file.items.length) {
    writeFile({ version: 1, items })
  }
  return items
}

export function reorderSocialLinks(orderedIds: string[]): SocialLink[] {
  const file = readFile()
  const items = ensureFixedChannels(file.items)
  const byId = new Map(items.map(row => [row.id, row]))
  const ordered: SocialLink[] = []
  for (const id of orderedIds) {
    const row = byId.get(id)
    if (row) {
      ordered.push(row)
      byId.delete(id)
    }
  }
  for (const row of byId.values()) {
    ordered.push(row)
  }
  const next = assignSortOrders(ordered)
  writeFile({ version: 1, items: next })
  return next
}

export function setSocialLinkActive(id: string, isActive: boolean): SocialLink {
  const file = readFile()
  const items = ensureFixedChannels(file.items)
  const index = items.findIndex(row => row.id === id)
  if (index < 0) {
    throw new Error(`Social link not found: ${id}`)
  }
  const next: SocialLink = {
    ...items[index]!,
    isActive,
    updatedAt: new Date().toISOString(),
  }
  const updated = [...items]
  updated[index] = next
  writeFile({ version: 1, items: normalizeSortOrders(updated) })
  return next
}

export function updateSocialLinkUrls(patches: SocialLinkUrlPatch[]): SocialLink[] {
  const file = readFile()
  const items = ensureFixedChannels(file.items)
  const patchById = new Map(patches.map(p => [p.id, p.linkUrl]))
  const now = new Date().toISOString()
  const updated = items.map(row => {
    if (!patchById.has(row.id)) return row
    return {
      ...row,
      linkUrl: (patchById.get(row.id) ?? '').trim(),
      updatedAt: now,
    }
  })
  writeFile({ version: 1, items: normalizeSortOrders(updated) })
  return normalizeSortOrders(updated)
}
