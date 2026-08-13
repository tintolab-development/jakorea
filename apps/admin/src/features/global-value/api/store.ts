/**
 * JA Global Value — localStorage mock (API 연동 전)
 * 고정 5항목 — 생성/삭제 없음
 */

import type {
  GlobalValue,
  GlobalValueKey,
  GlobalValueTextPatch,
} from '@/entities/global-value/model/types'

const STORAGE_KEY = 'admin.jakorea.globalValues.v1'

export const GLOBAL_VALUES_CHANGED_EVENT = 'jakorea:global-values-changed' as const

type GlobalValueFile = {
  version: 1
  items: GlobalValue[]
}

type SeedRow = {
  key: GlobalValueKey
  isActive: boolean
  mainText: string
  subText: string
}

/** 시안 seed — 고정 5항목 */
const SEED_ROWS: readonly SeedRow[] = [
  {
    key: 'value_1',
    isActive: true,
    mainText: 'BELIEVE IN THE BOUNDLESS POTENTIAL OF YOUNG PEOPLE',
    subText: '청소년의 무한한 잠재력에 대한 믿음',
  },
  {
    key: 'value_2',
    isActive: true,
    mainText: 'ADVOCATE FOR RELEVANT, HANDS-ON LEARNING',
    subText: '실전 중심의 학습 장려',
  },
  {
    key: 'value_3',
    isActive: true,
    mainText: 'TEACH ECONOMICS AND ENTREPRENEURSHIP FOR A MORE SUSTAINABLE WORLD',
    subText: '지속가능한 세상을 위한 시장경제와 기업가정신 교육',
  },
  {
    key: 'value_4',
    isActive: true,
    mainText: 'APPROACH OUR WORK WITH PASSION, HONESTY, INTEGRITY, AND EXCELLENCE',
    subText: '열정, 정직, 진정성, 탁월함에 기반한 실천',
  },
  {
    key: 'value_5',
    isActive: true,
    mainText: 'SEEK DIVERSE PERSPECTIVES TO REFLECT THE COMMUNITIES WE SERVE',
    subText: '파트너십과 협업을 통한 영향력 확대',
  },
]

const ALL_KEYS: readonly GlobalValueKey[] = [
  'value_1',
  'value_2',
  'value_3',
  'value_4',
  'value_5',
]

function isGlobalValueKey(value: unknown): value is GlobalValueKey {
  return (
    value === 'value_1' ||
    value === 'value_2' ||
    value === 'value_3' ||
    value === 'value_4' ||
    value === 'value_5'
  )
}

function buildSeedValues(): GlobalValue[] {
  const base = new Date('2026-07-01T00:00:00.000Z')
  return SEED_ROWS.map((row, index) => {
    const ts = new Date(base.getTime() + index * 60_000).toISOString()
    return {
      id: String(index + 1),
      key: row.key,
      sortOrder: index + 1,
      isActive: row.isActive,
      mainText: row.mainText,
      subText: row.subText,
      iconKey: row.key,
      updatedAt: ts,
      version: 0,
    }
  })
}

/** 누락/초과 키를 seed로 보정하고 아이콘 키는 고정값 유지 */
function ensureFixedKeys(items: GlobalValue[]): GlobalValue[] {
  const seedByKey = new Map(buildSeedValues().map(row => [row.key, row]))
  const byKey = new Map<GlobalValueKey, GlobalValue>()

  for (const row of items) {
    if (!isGlobalValueKey(row.key)) continue
    const seed = seedByKey.get(row.key)!
    byKey.set(row.key, {
      ...row,
      id: seed.id,
      key: row.key,
      iconKey: row.key,
      isActive: Boolean(row.isActive),
      mainText: typeof row.mainText === 'string' ? row.mainText : seed.mainText,
      subText: typeof row.subText === 'string' ? row.subText : seed.subText,
      updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : seed.updatedAt,
      sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : seed.sortOrder,
      version: typeof row.version === 'number' ? row.version : 0,
    })
  }

  for (const key of ALL_KEYS) {
    if (!byKey.has(key)) {
      byKey.set(key, seedByKey.get(key)!)
    }
  }

  return normalizeSortOrders([...byKey.values()])
}

function readFile(): GlobalValueFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { version: 1, items: buildSeedValues() }
    }
    const parsed = JSON.parse(raw) as GlobalValueFile
    if (parsed?.version !== 1 || !Array.isArray(parsed.items)) {
      return { version: 1, items: buildSeedValues() }
    }
    return { version: 1, items: ensureFixedKeys(parsed.items) }
  } catch {
    return { version: 1, items: buildSeedValues() }
  }
}

function writeFile(file: GlobalValueFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(GLOBAL_VALUES_CHANGED_EVENT))
}

function assignSortOrders(items: GlobalValue[]): GlobalValue[] {
  return items.map((row, index) => ({ ...row, sortOrder: index + 1 }))
}

function normalizeSortOrders(items: GlobalValue[]): GlobalValue[] {
  return assignSortOrders([...items].sort((a, b) => a.sortOrder - b.sortOrder))
}

export function readGlobalValues(): GlobalValue[] {
  const file = readFile()
  const items = ensureFixedKeys(file.items)
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeFile({ version: 1, items })
  } else if (items.length !== file.items.length) {
    writeFile({ version: 1, items })
  }
  return items
}

export function reorderGlobalValues(orderedIds: string[]): GlobalValue[] {
  const file = readFile()
  const items = ensureFixedKeys(file.items)
  const byId = new Map(items.map(row => [row.id, row]))
  const ordered: GlobalValue[] = []
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

export function setGlobalValueActive(id: string, isActive: boolean): GlobalValue {
  const file = readFile()
  const items = ensureFixedKeys(file.items)
  const index = items.findIndex(row => row.id === id)
  if (index < 0) {
    throw new Error(`Global value not found: ${id}`)
  }
  const next: GlobalValue = {
    ...items[index]!,
    isActive,
    updatedAt: new Date().toISOString(),
  }
  const updated = [...items]
  updated[index] = next
  writeFile({ version: 1, items: normalizeSortOrders(updated) })
  return next
}

export function updateGlobalValueTexts(patches: GlobalValueTextPatch[]): GlobalValue[] {
  const file = readFile()
  const items = ensureFixedKeys(file.items)
  const patchById = new Map(patches.map(p => [p.id, p]))
  const now = new Date().toISOString()
  const updated = items.map(row => {
    const patch = patchById.get(row.id)
    if (!patch) return row
    return {
      ...row,
      mainText: patch.mainText,
      subText: patch.subText,
      updatedAt: now,
    }
  })
  writeFile({ version: 1, items: normalizeSortOrders(updated) })
  return normalizeSortOrders(updated)
}
