/**
 * 사업분야 관리 — localStorage mock (API 연동 전)
 * 고정 4항목 — 생성/삭제 없음
 */

import type {
  EducationBusinessField,
  EducationBusinessFieldDocument,
  EducationBusinessFieldIntro,
  EducationBusinessFieldKey,
  EducationBusinessFieldTextPatch,
} from '@/entities/education-business-field/model/types'

const STORAGE_KEY = 'admin.jakorea.educationBusinessFields.v1'

export const EDUCATION_BUSINESS_FIELDS_CHANGED_EVENT =
  'jakorea:education-business-fields-changed' as const

type StoreFile = {
  version: 1
  intro: EducationBusinessFieldIntro
  fields: EducationBusinessField[]
}

type SeedRow = {
  key: EducationBusinessFieldKey
  isActive: boolean
  name: string
  description: string
  guideText: string
}

const SEED_ROWS: readonly SeedRow[] = [
  {
    key: 'career',
    isActive: true,
    name: '진로·취업',
    description:
      '진로 탐색과 취업 역량 함양을 위한 교육으로, 청소년의 진로 설계와 직업 세계 이해를 돕습니다.',
    guideText: '',
  },
  {
    key: 'economy',
    isActive: true,
    name: '경제·금융',
    description:
      '경제 원리와 금융 지식을 바탕으로 합리적 의사결정과 재무 관리 역량을 키웁니다.',
    guideText: '',
  },
  {
    key: 'entrepreneurship',
    isActive: true,
    name: '기업가 정신',
    description:
      '창의적 문제 해결, 도전·협업·혁신을 경험하며 기업가 정신을 함양합니다.',
    guideText: '',
  },
  {
    key: 'digital_literacy',
    isActive: true,
    name: '디지털 리터러시',
    description:
      '디지털 환경에서의 정보 활용, 미디어 리터러시, 안전한 온라인 활동 역량을 키웁니다.',
    guideText: '디지털 리터러시는 교육 특성상 별도 교재를 활용하지 않습니다',
  },
]

const ALL_KEYS: readonly EducationBusinessFieldKey[] = [
  'career',
  'economy',
  'entrepreneurship',
  'digital_literacy',
]

const DEFAULT_INTRO: EducationBusinessFieldIntro = {
  mainText: 'JA Korea는 다양한 교육 콘텐츠로 청소년의 배움과 성장을 돕습니다.',
  updatedAt: '2026-07-01T00:00:00.000Z',
}

function isFieldKey(value: unknown): value is EducationBusinessFieldKey {
  return (
    value === 'career' ||
    value === 'economy' ||
    value === 'entrepreneurship' ||
    value === 'digital_literacy'
  )
}

function buildSeedFields(): EducationBusinessField[] {
  const base = new Date('2026-07-01T00:00:00.000Z')
  return SEED_ROWS.map((row, index) => {
    const ts = new Date(base.getTime() + index * 60_000).toISOString()
    return {
      id: `edu-field-${row.key}`,
      key: row.key,
      sortOrder: index + 1,
      isActive: row.isActive,
      name: row.name,
      description: row.description,
      guideText: row.guideText,
      updatedAt: ts,
    }
  })
}

function assignSortOrders(items: EducationBusinessField[]): EducationBusinessField[] {
  return items.map((row, index) => ({ ...row, sortOrder: index + 1 }))
}

function normalizeSortOrders(items: EducationBusinessField[]): EducationBusinessField[] {
  return assignSortOrders([...items].sort((a, b) => a.sortOrder - b.sortOrder))
}

function ensureFixedKeys(items: EducationBusinessField[]): EducationBusinessField[] {
  const seedByKey = new Map(buildSeedFields().map(row => [row.key, row]))
  const byKey = new Map<EducationBusinessFieldKey, EducationBusinessField>()

  for (const row of items) {
    if (!isFieldKey(row.key)) continue
    const seed = seedByKey.get(row.key)!
    byKey.set(row.key, {
      ...row,
      id: seed.id,
      key: row.key,
      isActive: Boolean(row.isActive),
      name: typeof row.name === 'string' ? row.name : seed.name,
      description: typeof row.description === 'string' ? row.description : seed.description,
      guideText: typeof row.guideText === 'string' ? row.guideText : seed.guideText,
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

function normalizeIntro(intro: Partial<EducationBusinessFieldIntro> | undefined): EducationBusinessFieldIntro {
  return {
    mainText:
      typeof intro?.mainText === 'string' && intro.mainText.length > 0
        ? intro.mainText
        : DEFAULT_INTRO.mainText,
    updatedAt:
      typeof intro?.updatedAt === 'string' ? intro.updatedAt : DEFAULT_INTRO.updatedAt,
  }
}

function readFile(): StoreFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { version: 1, intro: { ...DEFAULT_INTRO }, fields: buildSeedFields() }
    }
    const parsed = JSON.parse(raw) as StoreFile
    if (parsed?.version !== 1 || !Array.isArray(parsed.fields)) {
      return { version: 1, intro: { ...DEFAULT_INTRO }, fields: buildSeedFields() }
    }
    return {
      version: 1,
      intro: normalizeIntro(parsed.intro),
      fields: ensureFixedKeys(parsed.fields),
    }
  } catch {
    return { version: 1, intro: { ...DEFAULT_INTRO }, fields: buildSeedFields() }
  }
}

function writeFile(file: StoreFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(EDUCATION_BUSINESS_FIELDS_CHANGED_EVENT))
}

export function readEducationBusinessFieldDocument(): EducationBusinessFieldDocument {
  const file = readFile()
  const fields = ensureFixedKeys(file.fields)
  const intro = normalizeIntro(file.intro)
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeFile({ version: 1, intro, fields })
  } else if (fields.length !== file.fields.length) {
    writeFile({ version: 1, intro, fields })
  }
  return { intro, fields }
}

export function readEducationBusinessFields(): EducationBusinessField[] {
  return readEducationBusinessFieldDocument().fields
}

export function reorderEducationBusinessFields(
  orderedIds: string[]
): EducationBusinessField[] {
  const file = readFile()
  const items = ensureFixedKeys(file.fields)
  const byId = new Map(items.map(row => [row.id, row]))
  const ordered: EducationBusinessField[] = []
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
  writeFile({ version: 1, intro: file.intro, fields: next })
  return next
}

export function setEducationBusinessFieldActive(
  id: string,
  isActive: boolean
): EducationBusinessField {
  const file = readFile()
  const items = ensureFixedKeys(file.fields)
  const index = items.findIndex(row => row.id === id)
  if (index < 0) {
    throw new Error(`Education business field not found: ${id}`)
  }
  const next: EducationBusinessField = {
    ...items[index]!,
    isActive,
    updatedAt: new Date().toISOString(),
  }
  const updated = [...items]
  updated[index] = next
  writeFile({ version: 1, intro: file.intro, fields: normalizeSortOrders(updated) })
  return next
}

export function saveEducationBusinessFieldDocument(input: {
  mainText: string
  patches: EducationBusinessFieldTextPatch[]
}): EducationBusinessFieldDocument {
  const file = readFile()
  const items = ensureFixedKeys(file.fields)
  const patchById = new Map(input.patches.map(p => [p.id, p]))
  const now = new Date().toISOString()
  const updated = items.map(row => {
    const patch = patchById.get(row.id)
    if (!patch) return row
    return {
      ...row,
      name: patch.name,
      description: patch.description,
      guideText: patch.guideText,
      updatedAt: now,
    }
  })
  const doc: StoreFile = {
    version: 1,
    intro: { mainText: input.mainText, updatedAt: now },
    fields: normalizeSortOrders(updated),
  }
  writeFile(doc)
  return { intro: doc.intro, fields: doc.fields }
}
