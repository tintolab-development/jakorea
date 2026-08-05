/**
 * 히어로 배너 — localStorage mock (API 연동 전)
 */

import type {
  HeroBanner,
  HeroBannerCreateInput,
  HeroBannerUpdateInput,
} from '@/entities/hero-banner/model/types'

const STORAGE_KEY = 'admin.jakorea.heroBanners.v1'

export const HERO_BANNERS_CHANGED_EVENT = 'jakorea:hero-banners-changed' as const

type BannerFile = {
  version: 1
  items: HeroBanner[]
}

/** 시안용 placeholder 이미지 (회색 그라데이션 SVG) */
const SEED_IMAGE =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#5a9aa8"/>
          <stop offset="100%" stop-color="#2a5f6e"/>
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill="url(#g)"/>
      <text x="160" y="96" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="18">Hero Banner</text>
    </svg>`
  )

const SEED_ROWS: readonly Omit<HeroBanner, 'id' | 'sortOrder' | 'createdAt' | 'updatedAt'>[] = [
  {
    isActive: true,
    imageUrl: SEED_IMAGE,
    imageFileName: 'hero-1.jpg',
    topText: 'JA KOREA',
    mainTitle: '청소년의 가능성이 더 넓은 세상과 만납니다',
    bottomText:
      'JA Korea는 청소년들이 경제·금융·창업 교육을 통해 세상을 이해하고 미래를 준비할 수 있도록 돕습니다.',
    linkUrl: 'https://www.instagram.com/',
  },
  {
    isActive: true,
    imageUrl: SEED_IMAGE,
    imageFileName: 'hero-2.jpg',
    topText: 'JA KOREA',
    mainTitle: '청소년의 가능성이 더 넓은 세상과 만납니다',
    bottomText:
      'JA Korea는 청소년들이 경제·금융·창업 교육을 통해 세상을 이해하고 미래를 준비할 수 있도록 돕습니다.',
    linkUrl: '',
  },
  {
    isActive: true,
    imageUrl: SEED_IMAGE,
    imageFileName: 'hero-3.jpg',
    topText: 'JA KOREA',
    mainTitle: '청소년의 가능성이 더 넓은 세상과 만납니다',
    bottomText:
      'JA Korea는 청소년들이 경제·금융·창업 교육을 통해 세상을 이해하고 미래를 준비할 수 있도록 돕습니다.',
    linkUrl: 'https://www.instagram.com/',
  },
  {
    isActive: true,
    imageUrl: SEED_IMAGE,
    imageFileName: 'hero-4.jpg',
    topText: 'JA KOREA',
    mainTitle: '청소년의 가능성이 더 넓은 세상과 만납니다',
    bottomText:
      'JA Korea는 청소년들이 경제·금융·창업 교육을 통해 세상을 이해하고 미래를 준비할 수 있도록 돕습니다.',
    linkUrl: '',
  },
  {
    isActive: true,
    imageUrl: SEED_IMAGE,
    imageFileName: 'hero-5.jpg',
    topText: 'JA KOREA',
    mainTitle: '청소년의 가능성이 더 넓은 세상과 만납니다',
    bottomText:
      'JA Korea는 청소년들이 경제·금융·창업 교육을 통해 세상을 이해하고 미래를 준비할 수 있도록 돕습니다.',
    linkUrl: 'https://www.instagram.com/',
  },
  {
    isActive: true,
    imageUrl: SEED_IMAGE,
    imageFileName: 'hero-6.jpg',
    topText: 'JA KOREA',
    mainTitle: '청소년의 가능성이 더 넓은 세상과 만납니다',
    bottomText:
      'JA Korea는 청소년들이 경제·금융·창업 교육을 통해 세상을 이해하고 미래를 준비할 수 있도록 돕습니다.',
    linkUrl: '',
  },
]

function buildSeedBanners(): HeroBanner[] {
  const base = new Date('2026-07-01T00:00:00.000Z')
  return SEED_ROWS.map((row, index) => {
    const ts = new Date(base.getTime() + index * 60_000).toISOString()
    return {
      ...row,
      id: `hero-banner-${index + 1}`,
      sortOrder: index + 1,
      createdAt: ts,
      updatedAt: ts,
    }
  })
}

function readFile(): BannerFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { version: 1, items: buildSeedBanners() }
    }
    const parsed = JSON.parse(raw) as BannerFile
    if (parsed?.version !== 1 || !Array.isArray(parsed.items)) {
      return { version: 1, items: buildSeedBanners() }
    }
    return parsed
  } catch {
    return { version: 1, items: buildSeedBanners() }
  }
}

function writeFile(file: BannerFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(HERO_BANNERS_CHANGED_EVENT))
}

function assignSortOrders(items: HeroBanner[]): HeroBanner[] {
  return items.map((row, index) => ({ ...row, sortOrder: index + 1 }))
}

function normalizeSortOrders(items: HeroBanner[]): HeroBanner[] {
  return assignSortOrders([...items].sort((a, b) => a.sortOrder - b.sortOrder))
}

export function readHeroBanners(): HeroBanner[] {
  const file = readFile()
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeFile(file)
  }
  return normalizeSortOrders(file.items)
}

export function createHeroBanner(input: HeroBannerCreateInput): HeroBanner {
  const file = readFile()
  const now = new Date().toISOString()
  const item: HeroBanner = {
    id: `hero-banner-${Date.now()}`,
    sortOrder: file.items.length + 1,
    isActive: input.isActive,
    imageUrl: input.imageUrl,
    imageFileName: input.imageFileName,
    topText: input.topText.trim(),
    mainTitle: input.mainTitle.trim(),
    bottomText: input.bottomText.trim(),
    linkUrl: input.linkUrl.trim(),
    createdAt: now,
    updatedAt: now,
  }
  const next = normalizeSortOrders([...file.items, item])
  writeFile({ version: 1, items: next })
  return item
}

export function updateHeroBanner(id: string, patch: HeroBannerUpdateInput): HeroBanner {
  const file = readFile()
  const index = file.items.findIndex(row => row.id === id)
  if (index < 0) {
    throw new Error(`Hero banner not found: ${id}`)
  }
  const prev = file.items[index]!
  const next: HeroBanner = {
    ...prev,
    ...(patch.isActive !== undefined ? { isActive: patch.isActive } : {}),
    ...(patch.imageUrl !== undefined ? { imageUrl: patch.imageUrl } : {}),
    ...(patch.imageFileName !== undefined ? { imageFileName: patch.imageFileName } : {}),
    ...(patch.topText !== undefined ? { topText: patch.topText.trim() } : {}),
    ...(patch.mainTitle !== undefined ? { mainTitle: patch.mainTitle.trim() } : {}),
    ...(patch.bottomText !== undefined ? { bottomText: patch.bottomText.trim() } : {}),
    ...(patch.linkUrl !== undefined ? { linkUrl: patch.linkUrl.trim() } : {}),
    updatedAt: new Date().toISOString(),
  }
  const items = [...file.items]
  items[index] = next
  writeFile({ version: 1, items: normalizeSortOrders(items) })
  return next
}

export function removeHeroBanners(ids: string[]): void {
  if (ids.length === 0) return
  const idSet = new Set(ids)
  const file = readFile()
  const items = normalizeSortOrders(file.items.filter(row => !idSet.has(row.id)))
  writeFile({ version: 1, items })
}

export function reorderHeroBanners(orderedIds: string[]): HeroBanner[] {
  const file = readFile()
  const byId = new Map(file.items.map(row => [row.id, row]))
  const ordered: HeroBanner[] = []
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
  const items = assignSortOrders(ordered)
  writeFile({ version: 1, items })
  return items
}

export function setHeroBannerActive(id: string, isActive: boolean): HeroBanner {
  return updateHeroBanner(id, { isActive })
}
