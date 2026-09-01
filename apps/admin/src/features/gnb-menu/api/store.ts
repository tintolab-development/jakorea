/**
 * GNB 메뉴 관리 — localStorage mock
 */

import type {
  GnbMenuDoc,
  GnbSubMenu,
  GnbTopMenu,
  GnbTopMenuId,
} from '@/entities/gnb-menu/model/types'

const STORAGE_KEY = 'admin.site.gnbMenu.v1'

export const GNB_MENU_CHANGED_EVENT = 'jakorea:gnb-menu-changed' as const

type FileShape = {
  version: 1
  data: GnbMenuDoc
}

type SeedItem = { id: string; name: string; isActive?: boolean }

const SEED_GROUPS: ReadonlyArray<{
  id: GnbTopMenuId
  label: string
  items: readonly SeedItem[]
}> = [
  {
    id: 'ja_korea',
    label: 'JA Korea',
    items: [
      { id: 'ja-intro', name: '기관 소개' },
      { id: 'ja-transparency', name: '투명경영' },
      { id: 'ja-people', name: '함께하는 사람들' },
      { id: 'ja-directions', name: '오시는 길' },
      { id: 'ja-notices', name: '공지사항' },
      { id: 'ja-history', name: 'JA History' },
      { id: 'ja-recruit', name: '채용' },
    ],
  },
  {
    id: 'impact_story',
    label: '임팩트 스토리',
    items: [{ id: 'impact-story', name: '임팩트 스토리' }],
  },
  {
    id: 'education',
    label: '교육 소개',
    items: [
      { id: 'edu-career', name: '진로·취업' },
      { id: 'edu-finance', name: '경제·금융' },
      { id: 'edu-entrepreneur', name: '기업가정신' },
      { id: 'edu-literacy', name: '디지털 리터러시' },
      { id: 'edu-textbook', name: '교재 소개' },
    ],
  },
  {
    id: 'participate',
    label: '참여하기',
    items: [
      { id: 'part-program', name: '프로그램 신청' },
      { id: 'part-result', name: '결과 확인', isActive: false },
      { id: 'part-online', name: '온라인 학습' },
      { id: 'part-alumni', name: 'Alumni' },
    ],
  },
  {
    id: 'sponsor',
    label: '후원하기',
    items: [
      { id: 'sp-individual', name: '개인후원' },
      { id: 'sp-corporate', name: '기업후원' },
      { id: 'sp-talent', name: '재능기부' },
    ],
  },
]

function buildSeedDoc(): GnbMenuDoc {
  return {
    groups: SEED_GROUPS.map((g, gIndex) => ({
      id: g.id,
      label: g.label,
      sortOrder: gIndex + 1,
      items: g.items.map((item, i) => ({
        id: item.id,
        sortOrder: i + 1,
        isActive: item.isActive !== false,
        name: item.name,
        version: 0,
      })),
    })),
    updatedAt: '2026-07-01T00:00:00.000Z',
  }
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function normalizeItems(raw: unknown, seedItems: GnbSubMenu[]): GnbSubMenu[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return seedItems.map((row, i) => ({ ...row, sortOrder: i + 1 }))
  }
  const seedById = new Map(seedItems.map(s => [s.id, s]))
  const normalized: GnbSubMenu[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const r = row as Partial<GnbSubMenu>
    const id = asString(r.id, '')
    if (!id || !seedById.has(id)) continue
    const seed = seedById.get(id)!
    normalized.push({
      id,
      sortOrder: typeof r.sortOrder === 'number' ? r.sortOrder : seed.sortOrder,
      isActive: asBool(r.isActive, seed.isActive),
      name: asString(r.name, seed.name).trim() || seed.name,
      version: typeof r.version === 'number' ? r.version : seed.version,
    })
    seedById.delete(id)
  }
  // 시드에 남아 있는 고정 id 유지 (개수 불변)
  for (const seed of seedById.values()) {
    normalized.push({ ...seed })
  }
  return normalized
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((row, i) => ({ ...row, sortOrder: i + 1 }))
}

function normalizeDoc(raw: Partial<GnbMenuDoc> | null | undefined): GnbMenuDoc {
  const seed = buildSeedDoc()
  if (!raw || !Array.isArray(raw.groups)) return seed

  const rawById = new Map(
    raw.groups
      .filter((g): g is GnbTopMenu => Boolean(g && typeof g === 'object' && 'id' in g))
      .map(g => [g.id, g])
  )

  const groups = seed.groups.map(seedGroup => {
    const rawGroup = rawById.get(seedGroup.id)
    return {
      id: seedGroup.id,
      label: seedGroup.label,
      sortOrder: seedGroup.sortOrder,
      items: normalizeItems(rawGroup?.items, seedGroup.items),
    }
  })

  return {
    groups,
    updatedAt: asString(raw.updatedAt, seed.updatedAt),
  }
}

function readFile(): FileShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { version: 1, data: buildSeedDoc() }
    const parsed = JSON.parse(raw) as FileShape
    if (parsed?.version !== 1 || !parsed.data) {
      return { version: 1, data: buildSeedDoc() }
    }
    return { version: 1, data: normalizeDoc(parsed.data) }
  } catch {
    return { version: 1, data: buildSeedDoc() }
  }
}

function writeFile(file: FileShape): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(GNB_MENU_CHANGED_EVENT))
}

function cloneDoc(doc: GnbMenuDoc): GnbMenuDoc {
  return {
    updatedAt: doc.updatedAt,
    groups: doc.groups.map(g => ({
      ...g,
      items: g.items.map(item => ({ ...item })),
    })),
  }
}

export function readGnbMenu(): GnbMenuDoc {
  const file = readFile()
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeFile(file)
  }
  return cloneDoc(file.data)
}

export function saveGnbMenu(doc: GnbMenuDoc): GnbMenuDoc {
  const seed = buildSeedDoc()
  const next = normalizeDoc({
    groups: doc.groups.map(g => {
      const seedGroup = seed.groups.find(s => s.id === g.id)
      return {
        ...g,
        label: seedGroup?.label ?? g.label,
        items: g.items.map(item => ({
          ...item,
          name: item.name.trim() || seedGroup?.items.find(s => s.id === item.id)?.name || item.name,
        })),
      }
    }),
    updatedAt: new Date().toISOString(),
  })
  // empty name reject after normalize still has seed fallback; validate explicit empty on client
  for (const g of doc.groups) {
    for (const item of g.items) {
      if (!item.name.trim()) {
        throw new Error('NAME_REQUIRED')
      }
    }
  }
  writeFile({ version: 1, data: next })
  return cloneDoc(next)
}
