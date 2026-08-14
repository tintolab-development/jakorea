/**
 * 후원사 목록 — localStorage mock (API 연동 전)
 * 노출 순서 삽입·전방/후방 이동 시 1씩 shift
 */

import type {
  CorporatePartner,
  CorporatePartnerCreateInput,
  CorporatePartnerListFilter,
  CorporatePartnerUpdateInput,
} from '@/entities/corporate-partner/model/types'

const STORAGE_KEY = 'admin.sponsor.corporatePartners.v1'

export const CORPORATE_PARTNERS_CHANGED_EVENT = 'jakorea:corporate-partners-changed' as const

type PartnerFile = {
  version: 1
  items: CorporatePartner[]
}

/** 로고 placeholder (가로 300×110 SVG) */
const SEED_LOGO =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="110" viewBox="0 0 300 110">
      <rect width="300" height="110" rx="8" fill="#f0f4f5"/>
      <rect x="1" y="1" width="298" height="108" rx="7" fill="none" stroke="#e0e0e0"/>
      <text x="150" y="62" text-anchor="middle" fill="#8a9aa0" font-family="sans-serif" font-size="18" font-weight="600">LOGO</text>
    </svg>`
  )

const SEED_NAMES = [
  'Samsung',
  'Citi',
  'IBM',
  'KRAFTON',
  'lululemon',
  'Microsoft',
  'Google',
  'Hyundai',
] as const

function buildSeedPartners(): CorporatePartner[] {
  const base = new Date('2026-01-15T09:00:00.000Z')
  return SEED_NAMES.map((name, index) => {
    const ts = new Date(base.getTime() + index * 86_400_000).toISOString()
    return {
      id: `corporate-partner-${index + 1}`,
      sortOrder: index + 1,
      isPublic: index % 3 !== 2,
      logoUrl: SEED_LOGO,
      logoFileName: `${name.toLowerCase()}-logo.png`,
      name,
      createdAt: ts,
      updatedAt: ts,
      version: 0,
    }
  })
}

function readFile(): PartnerFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { version: 1, items: buildSeedPartners() }
    const parsed = JSON.parse(raw) as PartnerFile
    if (parsed?.version !== 1 || !Array.isArray(parsed.items)) {
      return { version: 1, items: buildSeedPartners() }
    }
    return parsed
  } catch {
    return { version: 1, items: buildSeedPartners() }
  }
}

function writeFile(file: PartnerFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(CORPORATE_PARTNERS_CHANGED_EVENT))
}

function assignSortOrders(items: CorporatePartner[]): CorporatePartner[] {
  return items.map((row, index) => ({ ...row, sortOrder: index + 1 }))
}

function normalizeSortOrders(items: CorporatePartner[]): CorporatePartner[] {
  return assignSortOrders([...items].sort((a, b) => a.sortOrder - b.sortOrder))
}

function ymdFromIso(iso: string): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

function matchesFilter(row: CorporatePartner, filter?: CorporatePartnerListFilter): boolean {
  if (!filter) return true
  if (filter.isPublic === true && !row.isPublic) return false
  if (filter.isPublic === false && row.isPublic) return false
  const nameQ = filter.name?.trim().toLowerCase()
  if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false
  const created = ymdFromIso(row.createdAt)
  if (filter.registeredFrom && created < filter.registeredFrom) return false
  if (filter.registeredTo && created > filter.registeredTo) return false
  return true
}

export function countCorporatePartners(): number {
  return normalizeSortOrders(readFile().items).length
}

export function readCorporatePartners(
  filter?: CorporatePartnerListFilter
): CorporatePartner[] {
  const file = readFile()
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeFile(file)
  }
  const items = normalizeSortOrders(file.items)
  if (!filter) return items
  return items.filter(row => matchesFilter(row, filter))
}

/**
 * 삽입: p 위치(1…n+1)에 넣고, 기존 sortOrder >= p 는 +1 후 재채번
 */
export function createCorporatePartner(
  input: CorporatePartnerCreateInput
): CorporatePartner {
  const file = readFile()
  const n = file.items.length
  let p = Math.floor(Number(input.sortOrder))
  if (!Number.isFinite(p)) p = n + 1
  p = Math.min(Math.max(p, 1), n + 1)

  const name = input.name.trim()
  if (!name) throw new Error('NAME_REQUIRED')
  if (!input.logoUrl.trim()) throw new Error('LOGO_REQUIRED')

  const now = new Date().toISOString()
  const shifted = file.items.map(row =>
    row.sortOrder >= p ? { ...row, sortOrder: row.sortOrder + 1 } : row
  )

  const item: CorporatePartner = {
    id: `corporate-partner-${Date.now()}`,
    sortOrder: p,
    isPublic: input.isPublic,
    logoUrl: input.logoUrl.trim(),
    logoFileName: input.logoFileName?.trim() || undefined,
    name,
    createdAt: now,
    updatedAt: now,
    version: 0,
  }

  const next = normalizeSortOrders([...shifted, item])
  writeFile({ version: 1, items: next })
  return next.find(row => row.id === item.id)!
}

/**
 * 수정: 순서 이동
 * p < o → [p, o) +1
 * p > o → (o, p] -1
 */
export function updateCorporatePartner(
  id: string,
  patch: CorporatePartnerUpdateInput
): CorporatePartner {
  const file = readFile()
  const index = file.items.findIndex(row => row.id === id)
  if (index < 0) throw new Error(`Corporate partner not found: ${id}`)

  const prev = file.items[index]!
  const n = file.items.length
  let items = file.items.map(row => ({ ...row }))

  if (patch.sortOrder !== undefined) {
    const o = prev.sortOrder
    let p = Math.floor(Number(patch.sortOrder))
    if (!Number.isFinite(p)) p = o
    p = Math.min(Math.max(p, 1), n)

    if (p !== o) {
      if (p < o) {
        items = items.map(row => {
          if (row.id === id) return row
          if (row.sortOrder >= p && row.sortOrder < o) {
            return { ...row, sortOrder: row.sortOrder + 1 }
          }
          return row
        })
      } else {
        items = items.map(row => {
          if (row.id === id) return row
          if (row.sortOrder > o && row.sortOrder <= p) {
            return { ...row, sortOrder: row.sortOrder - 1 }
          }
          return row
        })
      }
      const self = items.find(row => row.id === id)!
      self.sortOrder = p
    }
  }

  const selfIdx = items.findIndex(row => row.id === id)
  const self = items[selfIdx]!
  if (patch.isPublic !== undefined) self.isPublic = patch.isPublic
  if (patch.logoUrl !== undefined) {
    if (!patch.logoUrl.trim()) throw new Error('LOGO_REQUIRED')
    self.logoUrl = patch.logoUrl.trim()
  }
  if (patch.logoFileName !== undefined) {
    self.logoFileName = patch.logoFileName?.trim() || undefined
  }
  if (patch.name !== undefined) {
    const name = patch.name.trim()
    if (!name) throw new Error('NAME_REQUIRED')
    self.name = name
  }
  self.updatedAt = new Date().toISOString()
  items[selfIdx] = self

  const next = normalizeSortOrders(items)
  writeFile({ version: 1, items: next })
  return next.find(row => row.id === id)!
}

export function removeCorporatePartners(ids: string[]): void {
  if (ids.length === 0) return
  const idSet = new Set(ids)
  const file = readFile()
  const items = normalizeSortOrders(file.items.filter(row => !idSet.has(row.id)))
  writeFile({ version: 1, items })
}

export function reorderCorporatePartners(orderedIds: string[]): CorporatePartner[] {
  const file = readFile()
  const byId = new Map(file.items.map(row => [row.id, row]))
  const ordered: CorporatePartner[] = []
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

export function setCorporatePartnerPublic(
  id: string,
  isPublic: boolean
): CorporatePartner {
  return updateCorporatePartner(id, { isPublic })
}
