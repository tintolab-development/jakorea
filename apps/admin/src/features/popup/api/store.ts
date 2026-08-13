/**
 * 팝업 — localStorage mock (API 연동 전)
 */

import type {
  Popup,
  PopupCreateInput,
  PopupListFilter,
  PopupUpdateInput,
} from '@/entities/popup/model/types'
import { MAX_ACTIVE_POPUPS, PopupActiveLimitError } from '@/entities/popup/model/types'

const STORAGE_KEY = 'admin.jakorea.popups.v1'

export const POPUPS_CHANGED_EVENT = 'jakorea:popups-changed' as const

type PopupFile = {
  version: 1
  items: Popup[]
}

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
      <text x="160" y="96" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="18">Popup</text>
    </svg>`
  )

const SEED_ROWS: readonly Omit<
  Popup,
  'id' | 'sortOrder' | 'createdAt' | 'updatedAt' | 'version'
>[] = [
  {
    isActive: true,
    imageUrl: SEED_IMAGE,
    imageFileName: 'popup-1.jpg',
    name: '2026 JA Korea 여름 캠프 모집',
    altText: '여름 캠프 모집 안내 팝업',
    periodStart: '2026-06-01',
    periodEnd: '2026-12-31',
    linkEnabled: true,
    linkUrl: 'https://www.jakorea.org/',
  },
  {
    isActive: true,
    imageUrl: SEED_IMAGE,
    imageFileName: 'popup-2.jpg',
    name: '청소년 경제교육 프로그램 안내',
    altText: '경제교육 프로그램 안내',
    periodStart: '2026-01-01',
    periodEnd: '2026-12-31',
    linkEnabled: false,
    linkUrl: '',
  },
  {
    isActive: true,
    imageUrl: SEED_IMAGE,
    imageFileName: 'popup-3.jpg',
    name: '자원봉사자 모집 공고',
    altText: '자원봉사자 모집',
    periodStart: '2026-03-01',
    periodEnd: '2026-09-30',
    linkEnabled: true,
    linkUrl: 'https://www.jakorea.org/',
  },
  {
    isActive: true,
    imageUrl: SEED_IMAGE,
    imageFileName: 'popup-4.jpg',
    name: 'JA Korea 뉴스레터 구독',
    altText: '뉴스레터 구독 안내',
    periodStart: '2026-01-01',
    periodEnd: '2026-12-31',
    linkEnabled: true,
    linkUrl: 'https://www.jakorea.org/',
  },
  {
    isActive: false,
    imageUrl: SEED_IMAGE,
    imageFileName: 'popup-5.jpg',
    name: '창업 교육 세미나',
    altText: '창업 교육 세미나 안내',
    periodStart: '2026-04-01',
    periodEnd: '2026-06-30',
    linkEnabled: false,
    linkUrl: '',
  },
  {
    isActive: false,
    imageUrl: SEED_IMAGE,
    imageFileName: 'popup-6.jpg',
    name: '금융 리터러시 캠페인',
    altText: '금융 리터러시 캠페인',
    periodStart: '2026-02-01',
    periodEnd: '2026-05-31',
    linkEnabled: true,
    linkUrl: 'https://www.jakorea.org/',
  },
  {
    isActive: false,
    imageUrl: SEED_IMAGE,
    imageFileName: 'popup-7.jpg',
    name: '만료 테스트 팝업',
    altText: '기간이 지난 팝업',
    periodStart: '2025-01-01',
    periodEnd: '2025-12-31',
    linkEnabled: false,
    linkUrl: '',
  },
  {
    isActive: false,
    imageUrl: SEED_IMAGE,
    imageFileName: 'popup-8.jpg',
    name: '파트너십 안내',
    altText: '파트너십 안내 팝업',
    periodStart: '2026-07-01',
    periodEnd: '2026-12-31',
    linkEnabled: true,
    linkUrl: 'https://www.jakorea.org/',
  },
  {
    isActive: false,
    imageUrl: SEED_IMAGE,
    imageFileName: 'popup-9.jpg',
    name: '연말 기부 캠페인',
    altText: '연말 기부 캠페인',
    periodStart: '2026-11-01',
    periodEnd: '2026-12-31',
    linkEnabled: false,
    linkUrl: '',
  },
  {
    isActive: false,
    imageUrl: SEED_IMAGE,
    imageFileName: 'popup-10.jpg',
    name: '신학기 프로그램 안내',
    altText: '신학기 프로그램',
    periodStart: '2026-02-01',
    periodEnd: '2026-03-31',
    linkEnabled: true,
    linkUrl: 'https://www.jakorea.org/',
  },
]

function todayYmd(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildSeedPopups(): Popup[] {
  const base = new Date('2026-07-01T00:00:00.000Z')
  return SEED_ROWS.map((row, index) => {
    const ts = new Date(base.getTime() + index * 60_000).toISOString()
    return {
      ...row,
      id: `popup-${index + 1}`,
      sortOrder: index + 1,
      version: 0,
      createdAt: ts,
      updatedAt: ts,
    }
  })
}

function ensurePopupVersion(row: Popup): Popup {
  return { ...row, version: row.version ?? 0 }
}

function readFile(): PopupFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { version: 1, items: buildSeedPopups() }
    }
    const parsed = JSON.parse(raw) as PopupFile
    if (parsed?.version !== 1 || !Array.isArray(parsed.items)) {
      return { version: 1, items: buildSeedPopups() }
    }
    return {
      version: 1,
      items: parsed.items.map(row => ensurePopupVersion(row as Popup)),
    }
  } catch {
    return { version: 1, items: buildSeedPopups() }
  }
}

function writeFile(file: PopupFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(POPUPS_CHANGED_EVENT))
}

function assignSortOrders(items: Popup[]): Popup[] {
  return items.map((row, index) => ({ ...row, sortOrder: index + 1 }))
}

function normalizeSortOrders(items: Popup[]): Popup[] {
  return assignSortOrders([...items].sort((a, b) => a.sortOrder - b.sortOrder))
}

/** 게시 기간 만료 시 자동 미사용 */
function applyExpiry(items: Popup[]): { items: Popup[]; changed: boolean } {
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

function countActive(items: Popup[]): number {
  return items.filter(row => row.isActive).length
}

function assertCanActivate(items: Popup[], excludeId?: string): void {
  const activeCount = items.filter(row => row.isActive && row.id !== excludeId).length
  if (activeCount >= MAX_ACTIVE_POPUPS) {
    throw new PopupActiveLimitError()
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

function matchesFilter(row: Popup, filter?: PopupListFilter): boolean {
  if (!filter) return true

  if (filter.isActive === true && !row.isActive) return false
  if (filter.isActive === false && row.isActive) return false

  const nameQ = filter.name?.trim().toLowerCase()
  if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false

  const altQ = filter.altText?.trim().toLowerCase()
  if (altQ && !row.altText.toLowerCase().includes(altQ)) return false

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

export function readPopups(filter?: PopupListFilter): Popup[] {
  const file = readFile()
  const { items, changed } = applyExpiry(normalizeSortOrders(file.items))
  if (changed || !localStorage.getItem(STORAGE_KEY)) {
    writeFile({ version: 1, items })
  }
  return items.filter(row => matchesFilter(row, filter))
}

export function createPopup(input: PopupCreateInput): Popup {
  const file = readFile()
  const { items: baseItems } = applyExpiry(normalizeSortOrders(file.items))

  if (input.isActive) {
    assertCanActivate(baseItems)
  }

  const now = new Date().toISOString()
  const item: Popup = {
    id: `popup-${Date.now()}`,
    sortOrder: baseItems.length + 1,
    version: 0,
    isActive: input.isActive,
    imageUrl: input.imageUrl,
    imageFileName: input.imageFileName,
    name: input.name.trim(),
    altText: input.altText.trim(),
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    linkEnabled: input.linkEnabled,
    linkUrl: input.linkEnabled ? input.linkUrl.trim() : '',
    createdAt: now,
    updatedAt: now,
  }

  // 등록 직후 기간이 이미 만료된 경우 미사용으로 보정
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

export function updatePopup(id: string, patch: PopupUpdateInput): Popup {
  const file = readFile()
  const { items: baseItems } = applyExpiry(normalizeSortOrders(file.items))
  const index = baseItems.findIndex(row => row.id === id)
  if (index < 0) {
    throw new Error(`Popup not found: ${id}`)
  }
  const prev = baseItems[index]!

  const next: Popup = {
    ...prev,
    ...(patch.isActive !== undefined ? { isActive: patch.isActive } : {}),
    ...(patch.imageUrl !== undefined ? { imageUrl: patch.imageUrl } : {}),
    ...(patch.imageFileName !== undefined ? { imageFileName: patch.imageFileName } : {}),
    ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
    ...(patch.altText !== undefined ? { altText: patch.altText.trim() } : {}),
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

export function removePopups(ids: string[]): void {
  if (ids.length === 0) return
  const idSet = new Set(ids)
  const file = readFile()
  const { items: baseItems } = applyExpiry(normalizeSortOrders(file.items))
  const items = normalizeSortOrders(baseItems.filter(row => !idSet.has(row.id)))
  writeFile({ version: 1, items })
}

export function reorderPopups(orderedIds: string[]): Popup[] {
  const file = readFile()
  const { items: baseItems } = applyExpiry(normalizeSortOrders(file.items))
  const byId = new Map(baseItems.map(row => [row.id, row]))
  const ordered: Popup[] = []
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

export function setPopupActive(id: string, isActive: boolean): Popup {
  if (isActive) {
    const file = readFile()
    const { items } = applyExpiry(normalizeSortOrders(file.items))
    const target = items.find(row => row.id === id)
    if (!target) {
      throw new Error(`Popup not found: ${id}`)
    }
    if (!target.isActive) {
      assertCanActivate(items, id)
    }
  }
  return updatePopup(id, { isActive })
}

export function getActivePopupCount(): number {
  return countActive(readPopups())
}
