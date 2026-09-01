/**
 * 운영원칙 관리 — localStorage mock (API 연동 전)
 * 운영 원칙 고정 5항목 — 생성/삭제 없음, 아이콘 고정
 */

import type {
  OperatingPrinciple,
  OperatingPrinciplesDoc,
  OperatingPrinciplesIntro,
  OperatingPrinciplesSavePayload,
  PrincipleIconKey,
} from '@/entities/operating-principles/model/types'

const STORAGE_KEY = 'admin.jakorea.operatingPrinciples.v1'

export const OPERATING_PRINCIPLES_CHANGED_EVENT = 'jakorea:operating-principles-changed' as const

type DocFile = {
  version: 1
  data: OperatingPrinciplesDoc
}

type SeedRow = {
  iconKey: PrincipleIconKey
  isActive: boolean
  title: string
  subText: string
}

/** 시안 seed — 고정 5항목 */
const SEED_ROWS: readonly SeedRow[] = [
  {
    iconKey: 'p1',
    isActive: true,
    title: '엄격한 회계 투명성과 독립적 외부 감사',
    subText:
      'JA Korea는 JA Worldwide의 글로벌 규정과 기준을 준수하며, 엄정한 내부 회계 시스템을 운영합니다. 또한 매년 공인된 외부 회계법인으로부터 정기 감사를 받습니다.',
  },
  {
    iconKey: 'p2',
    isActive: true,
    title: '건전한 거버넌스와 책임 있는 이사회 운영',
    subText:
      '이사회는 1년에 2회 이상 정기적으로 개최되며, 의결 과정과 기록은 투명하게 관리합니다.',
  },
  {
    iconKey: 'p3',
    isActive: true,
    title: '잠재적 이해상충 방지 및 개인정보 보호',
    subText:
      '이해관계가 없는 독립성과 공정성을 유지하며, 대한민국 개인정보보호법 등 관련 법규를 준수합니다.',
  },
  {
    iconKey: 'p4',
    isActive: true,
    title: '후원 목적의 철저한 준수 및 자산의 보호',
    subText:
      '후원금은 오직 청소년 교육 목적에만 사용되며, 조직의 자산은 안전하고 책임감 있게 관리합니다.',
  },
  {
    iconKey: 'p5',
    isActive: true,
    title: '파트너십을 통한 사회적 영향력 확산',
    subText:
      '다양한 파트너십과 소통을 통해 청소년에게 더 큰 기회와 건강한 성장을 지원합니다.',
  },
]

const ALL_KEYS: readonly PrincipleIconKey[] = ['p1', 'p2', 'p3', 'p4', 'p5']

const SEED_INTRO: OperatingPrinciplesIntro = {
  topSubText: '투명한 운영으로 신뢰를 이어갑니다.',
  mainText:
    'JA Korea는 청소년의 미래를 지원하는 글로벌 교육 NGO로서 신뢰를 바탕으로 투명하고 정직하게 운영합니다.',
}

function isPrincipleIconKey(value: unknown): value is PrincipleIconKey {
  return value === 'p1' || value === 'p2' || value === 'p3' || value === 'p4' || value === 'p5'
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function buildSeedPrinciples(): OperatingPrinciple[] {
  const base = new Date('2026-07-01T00:00:00.000Z')
  return SEED_ROWS.map((row, index) => {
    const ts = new Date(base.getTime() + index * 60_000).toISOString()
    return {
      id: `operating-principle-${row.iconKey}`,
      iconKey: row.iconKey,
      sortOrder: index + 1,
      isActive: row.isActive,
      title: row.title,
      subText: row.subText,
      version: 0,
      updatedAt: ts,
    }
  })
}

function buildSeedDoc(): OperatingPrinciplesDoc {
  return {
    intro: { ...SEED_INTRO },
    settingVersion: 0,
    principles: buildSeedPrinciples(),
    updatedAt: '2026-07-01T00:00:00.000Z',
  }
}

function assignSortOrders(items: OperatingPrinciple[]): OperatingPrinciple[] {
  return items.map((row, index) => ({ ...row, sortOrder: index + 1 }))
}

function normalizeSortOrders(items: OperatingPrinciple[]): OperatingPrinciple[] {
  return assignSortOrders([...items].sort((a, b) => a.sortOrder - b.sortOrder))
}

/** 누락/초과 키를 seed로 보정하고 아이콘 키·id는 고정 유지 */
function ensureFixedPrinciples(items: OperatingPrinciple[]): OperatingPrinciple[] {
  const seedByKey = new Map(buildSeedPrinciples().map(row => [row.iconKey, row]))
  const byKey = new Map<PrincipleIconKey, OperatingPrinciple>()

  for (const row of items) {
    if (!isPrincipleIconKey(row.iconKey)) continue
    const seed = seedByKey.get(row.iconKey)!
    byKey.set(row.iconKey, {
      ...row,
      id: seed.id,
      iconKey: row.iconKey,
      isActive: Boolean(row.isActive),
      title: typeof row.title === 'string' ? row.title : seed.title,
      subText: typeof row.subText === 'string' ? row.subText : seed.subText,
      version: typeof row.version === 'number' ? row.version : 0,
      updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : seed.updatedAt,
      sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : seed.sortOrder,
    })
  }

  for (const key of ALL_KEYS) {
    if (!byKey.has(key)) {
      byKey.set(key, seedByKey.get(key)!)
    }
  }

  return normalizeSortOrders([...byKey.values()])
}

function normalizeIntro(raw: Partial<OperatingPrinciplesIntro> | null | undefined): OperatingPrinciplesIntro {
  return {
    topSubText: asString(raw?.topSubText, SEED_INTRO.topSubText),
    mainText: asString(raw?.mainText, SEED_INTRO.mainText),
  }
}

function normalizeDoc(raw: Partial<OperatingPrinciplesDoc> | null | undefined): OperatingPrinciplesDoc {
  const seed = buildSeedDoc()
  if (!raw || typeof raw !== 'object') return seed
  const principles = Array.isArray(raw.principles)
    ? ensureFixedPrinciples(raw.principles as OperatingPrinciple[])
    : seed.principles
  return {
    intro: normalizeIntro(raw.intro),
    settingVersion:
      typeof raw.settingVersion === 'number' ? raw.settingVersion : seed.settingVersion,
    principles,
    updatedAt: asString(raw.updatedAt, seed.updatedAt),
  }
}

function readFile(): DocFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { version: 1, data: buildSeedDoc() }
    const parsed = JSON.parse(raw) as DocFile
    if (parsed?.version !== 1 || !parsed.data) {
      return { version: 1, data: buildSeedDoc() }
    }
    return { version: 1, data: normalizeDoc(parsed.data) }
  } catch {
    return { version: 1, data: buildSeedDoc() }
  }
}

function writeFile(file: DocFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(OPERATING_PRINCIPLES_CHANGED_EVENT))
}

export function readOperatingPrinciples(): OperatingPrinciplesDoc {
  const file = readFile()
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeFile(file)
  }
  return file.data
}

export function reorderOperatingPrinciples(orderedIds: string[]): OperatingPrinciplesDoc {
  const file = readFile()
  const items = ensureFixedPrinciples(file.data.principles)
  const byId = new Map(items.map(row => [row.id, row]))
  const ordered: OperatingPrinciple[] = []
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
  const next: OperatingPrinciplesDoc = {
    ...file.data,
    principles: assignSortOrders(ordered),
    updatedAt: new Date().toISOString(),
  }
  writeFile({ version: 1, data: next })
  return next
}

export function setPrincipleActive(id: string, isActive: boolean): OperatingPrinciplesDoc {
  const file = readFile()
  const items = ensureFixedPrinciples(file.data.principles)
  const index = items.findIndex(row => row.id === id)
  if (index < 0) {
    throw new Error(`Operating principle not found: ${id}`)
  }
  const now = new Date().toISOString()
  const updated = [...items]
  updated[index] = {
    ...items[index]!,
    isActive,
    updatedAt: now,
  }
  const next: OperatingPrinciplesDoc = {
    ...file.data,
    principles: normalizeSortOrders(updated),
    updatedAt: now,
  }
  writeFile({ version: 1, data: next })
  return next
}

export function saveOperatingPrinciplesContent(
  payload: OperatingPrinciplesSavePayload
): OperatingPrinciplesDoc {
  const file = readFile()
  const items = ensureFixedPrinciples(file.data.principles)
  const patchById = new Map(payload.principles.map(p => [p.id, p]))
  const now = new Date().toISOString()
  const updated = items.map(row => {
    const patch = patchById.get(row.id)
    if (!patch) return row
    return {
      ...row,
      title: patch.title,
      subText: patch.subText,
      updatedAt: now,
    }
  })
  const next: OperatingPrinciplesDoc = {
    intro: {
      topSubText: payload.intro.topSubText.trim(),
      mainText: payload.intro.mainText.trimEnd(),
    },
    settingVersion: file.data.settingVersion,
    principles: normalizeSortOrders(updated),
    updatedAt: now,
  }
  writeFile({ version: 1, data: normalizeDoc(next) })
  return normalizeDoc(next)
}
