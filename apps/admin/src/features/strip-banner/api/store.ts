/**
 * 메인 상단 띠배너 — localStorage mock (API 연동 전)
 */

import type {
  StripBanner,
  StripBannerCreateInput,
  StripBannerListFilter,
  StripBannerUpdateInput,
} from '@/entities/strip-banner/model/types'
import {
  MAX_ACTIVE_STRIP_BANNERS,
  StripBannerActiveLimitError,
} from '@/entities/strip-banner/model/types'

const STORAGE_KEY = 'admin.jakorea.strip-banners.v1'

export const STRIP_BANNERS_CHANGED_EVENT = 'jakorea:strip-banners-changed' as const

type StripBannerFile = {
  version: 1
  items: StripBanner[]
}

const SEED_ROWS: readonly Omit<StripBanner, 'id' | 'sortOrder' | 'createdAt' | 'updatedAt'>[] = [
  {
    isActive: true,
    text: '경제교육 봉사자 모집 중',
    periodStart: '2026-09-15',
    periodEnd: '2027-09-15',
    linkEnabled: true,
    linkUrl: 'https://www.jakorea.org/',
  },
  {
    isActive: true,
    text: '2026 연차보고서가 발간되었습니다',
    periodStart: '2026-09-15',
    periodEnd: '2027-09-15',
    linkEnabled: true,
    linkUrl: 'http://jakorea.org/_File/bbs/4/files_1739770612_0.pdf',
  },
  {
    isActive: false,
    text: '청소년 경제교육 프로그램 참가자 모집',
    periodStart: '2026-09-15',
    periodEnd: '2027-09-15',
    linkEnabled: false,
    linkUrl: '',
  },
  {
    isActive: false,
    text: 'JA Korea 뉴스레터 구독 안내',
    periodStart: '2026-09-15',
    periodEnd: '2027-09-15',
    linkEnabled: true,
    linkUrl: 'https://www.jakorea.org/',
  },
  {
    isActive: false,
    text: '만료 테스트 띠배너',
    periodStart: '2025-01-01',
    periodEnd: '2025-12-31',
    linkEnabled: false,
    linkUrl: '',
  },
]

function todayYmd(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildSeedStripBanners(): StripBanner[] {
  const base = new Date('2026-09-15T00:00:00.000Z')
  return SEED_ROWS.map((row, index) => {
    const ts = new Date(base.getTime() + index * 60_000).toISOString()
    return {
      ...row,
      id: `strip-banner-${index + 1}`,
      sortOrder: index + 1,
      createdAt: ts,
      updatedAt: ts,
    }
  })
}

function readFile(): StripBannerFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { version: 1, items: buildSeedStripBanners() }
    }
    const parsed = JSON.parse(raw) as StripBannerFile
    if (parsed?.version !== 1 || !Array.isArray(parsed.items)) {
      return { version: 1, items: buildSeedStripBanners() }
    }
    return parsed
  } catch {
    return { version: 1, items: buildSeedStripBanners() }
  }
}

function writeFile(file: StripBannerFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(STRIP_BANNERS_CHANGED_EVENT))
}

function assignSortOrders(items: StripBanner[]): StripBanner[] {
  return items.map((row, index) => ({ ...row, sortOrder: index + 1 }))
}

function normalizeSortOrders(items: StripBanner[]): StripBanner[] {
  return assignSortOrders([...items].sort((a, b) => a.sortOrder - b.sortOrder))
}

/** 게시 기간 만료 시 자동 미사용 */
function applyExpiry(items: StripBanner[]): { items: StripBanner[]; changed: boolean } {
  const today = todayYmd()
  let changed = false
  const next = items.map(row => {
    if (row.isActive && row.periodEnd < today) {
      changed = true
      return { ...row, isActive: false, updatedAt: new Date().toISOString() }
    }
    return row
  })
  return { items: next, changed }
}

function countActive(items: StripBanner[]): number {
  return items.filter(row => row.isActive).length
}

function assertCanActivate(items: StripBanner[], excludeId?: string): void {
  const activeCount = items.filter(row => row.isActive && row.id !== excludeId).length
  if (activeCount >= MAX_ACTIVE_STRIP_BANNERS) {
    throw new StripBannerActiveLimitError()
  }
}

function periodsOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart <= bEnd && bStart <= aEnd
}

function matchesFilter(row: StripBanner, filter?: StripBannerListFilter): boolean {
  if (!filter) return true

  if (filter.isActive === true && !row.isActive) return false
  if (filter.isActive === false && row.isActive) return false

  const textQ = filter.text?.trim().toLowerCase()
  if (textQ && !row.text.toLowerCase().includes(textQ)) return false

  const fStart = filter.periodStart?.trim()
  const fEnd = filter.periodEnd?.trim()
  if (fStart || fEnd) {
    const rangeStart = fStart || '0000-01-01'
    const rangeEnd = fEnd || '9999-12-31'
    if (!periodsOverlap(row.periodStart, row.periodEnd, rangeStart, rangeEnd)) {
      return false
    }
  }

  return true
}

export function readStripBanners(filter?: StripBannerListFilter): StripBanner[] {
  const file = readFile()
  const { items, changed } = applyExpiry(normalizeSortOrders(file.items))
  if (changed || !localStorage.getItem(STORAGE_KEY)) {
    writeFile({ version: 1, items })
  }
  return items.filter(row => matchesFilter(row, filter))
}

export function createStripBanner(input: StripBannerCreateInput): StripBanner {
  const file = readFile()
  const { items: baseItems } = applyExpiry(normalizeSortOrders(file.items))

  if (input.isActive) {
    assertCanActivate(baseItems)
  }

  const now = new Date().toISOString()
  const item: StripBanner = {
    id: `strip-banner-${Date.now()}`,
    sortOrder: baseItems.length + 1,
    isActive: input.isActive,
    text: input.text.trim(),
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    linkEnabled: input.linkEnabled,
    linkUrl: input.linkEnabled ? input.linkUrl.trim() : '',
    createdAt: now,
    updatedAt: now,
  }

  const finalized =
    item.isActive && item.periodEnd < todayYmd()
      ? { ...item, isActive: false }
      : item

  if (finalized.isActive) {
    assertCanActivate(baseItems)
  }

  const next = normalizeSortOrders([...baseItems, finalized])
  writeFile({ version: 1, items: next })
  return finalized
}

export function updateStripBanner(id: string, patch: StripBannerUpdateInput): StripBanner {
  const file = readFile()
  const { items: baseItems } = applyExpiry(normalizeSortOrders(file.items))
  const index = baseItems.findIndex(row => row.id === id)
  if (index < 0) {
    throw new Error(`StripBanner not found: ${id}`)
  }
  const prev = baseItems[index]!

  const next: StripBanner = {
    ...prev,
    ...(patch.isActive !== undefined ? { isActive: patch.isActive } : {}),
    ...(patch.text !== undefined ? { text: patch.text.trim() } : {}),
    ...(patch.periodStart !== undefined ? { periodStart: patch.periodStart } : {}),
    ...(patch.periodEnd !== undefined ? { periodEnd: patch.periodEnd } : {}),
    ...(patch.linkEnabled !== undefined ? { linkEnabled: patch.linkEnabled } : {}),
    ...(patch.linkUrl !== undefined ? { linkUrl: patch.linkUrl.trim() } : {}),
    updatedAt: new Date().toISOString(),
  }

  if (!next.linkEnabled) {
    next.linkUrl = ''
  }

  if (next.isActive && next.periodEnd < todayYmd()) {
    next.isActive = false
  }

  if (next.isActive && !prev.isActive) {
    assertCanActivate(baseItems, id)
  }

  const items = [...baseItems]
  items[index] = next
  writeFile({ version: 1, items: normalizeSortOrders(items) })
  return next
}

export function removeStripBanners(ids: string[]): void {
  if (ids.length === 0) return
  const idSet = new Set(ids)
  const file = readFile()
  const { items: baseItems } = applyExpiry(normalizeSortOrders(file.items))
  const items = normalizeSortOrders(baseItems.filter(row => !idSet.has(row.id)))
  writeFile({ version: 1, items })
}

export function reorderStripBanners(orderedIds: string[]): StripBanner[] {
  const file = readFile()
  const { items: baseItems } = applyExpiry(normalizeSortOrders(file.items))
  const byId = new Map(baseItems.map(row => [row.id, row]))
  const ordered: StripBanner[] = []
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

export function setStripBannerActive(id: string, isActive: boolean): StripBanner {
  if (isActive) {
    const file = readFile()
    const { items } = applyExpiry(normalizeSortOrders(file.items))
    const target = items.find(row => row.id === id)
    if (!target) {
      throw new Error(`StripBanner not found: ${id}`)
    }
    if (!target.isActive) {
      assertCanActivate(items, id)
    }
  }
  return updateStripBanner(id, { isActive })
}

export function getActiveStripBannerCount(): number {
  return countActive(readStripBanners())
}
