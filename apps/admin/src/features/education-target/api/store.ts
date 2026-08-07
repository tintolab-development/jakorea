/**
 * 교육 대상 관리 — localStorage mock (API 연동 전)
 * 고정 5항목 — 개수·인덱스 색상 변경 불가, 명칭만 수정
 */

import type {
  EducationTarget,
  EducationTargetKey,
  EducationTargetNamePatch,
} from '@/entities/education-target/model/types'
import { EDUCATION_TARGET_INDEX_COLORS } from '@/entities/education-target/model/types'

const STORAGE_KEY = 'admin.jakorea.educationTargets.v1'

export const EDUCATION_TARGETS_CHANGED_EVENT = 'jakorea:education-targets-changed' as const

type StoreFile = {
  version: 1
  items: EducationTarget[]
}

type SeedRow = {
  key: EducationTargetKey
  name: string
}

const SEED_ROWS: readonly SeedRow[] = [
  { key: 'preschool', name: '유아' },
  { key: 'elementary', name: '초등학교' },
  { key: 'middle', name: '중학교' },
  { key: 'high', name: '고등학교' },
  { key: 'adult', name: '성인' },
]

const ALL_KEYS: readonly EducationTargetKey[] = [
  'preschool',
  'elementary',
  'middle',
  'high',
  'adult',
]

function isTargetKey(value: unknown): value is EducationTargetKey {
  return (
    value === 'preschool' ||
    value === 'elementary' ||
    value === 'middle' ||
    value === 'high' ||
    value === 'adult'
  )
}

function buildSeedTargets(): EducationTarget[] {
  const base = new Date('2026-07-01T00:00:00.000Z')
  return SEED_ROWS.map((row, index) => {
    const ts = new Date(base.getTime() + index * 60_000).toISOString()
    return {
      id: `edu-target-${row.key}`,
      key: row.key,
      sortOrder: index + 1,
      name: row.name,
      indexColor: EDUCATION_TARGET_INDEX_COLORS[index]!,
      updatedAt: ts,
    }
  })
}

function ensureFixedTargets(items: EducationTarget[]): EducationTarget[] {
  const seedByKey = new Map(buildSeedTargets().map(row => [row.key, row]))
  const byKey = new Map<EducationTargetKey, EducationTarget>()

  for (const row of items) {
    if (!isTargetKey(row.key)) continue
    const seed = seedByKey.get(row.key)!
    const colorIndex = ALL_KEYS.indexOf(row.key)
    byKey.set(row.key, {
      id: seed.id,
      key: row.key,
      sortOrder: colorIndex + 1,
      name: typeof row.name === 'string' && row.name.trim() ? row.name.trim() : seed.name,
      indexColor: EDUCATION_TARGET_INDEX_COLORS[colorIndex]!,
      updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : seed.updatedAt,
    })
  }

  for (const key of ALL_KEYS) {
    if (!byKey.has(key)) {
      byKey.set(key, seedByKey.get(key)!)
    }
  }

  return ALL_KEYS.map(key => byKey.get(key)!)
}

function readFile(): StoreFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { version: 1, items: buildSeedTargets() }
    }
    const parsed = JSON.parse(raw) as StoreFile
    if (parsed?.version !== 1 || !Array.isArray(parsed.items)) {
      return { version: 1, items: buildSeedTargets() }
    }
    return { version: 1, items: ensureFixedTargets(parsed.items) }
  } catch {
    return { version: 1, items: buildSeedTargets() }
  }
}

function writeFile(file: StoreFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(EDUCATION_TARGETS_CHANGED_EVENT))
}

export function readEducationTargets(): EducationTarget[] {
  const file = readFile()
  const items = ensureFixedTargets(file.items)
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeFile({ version: 1, items })
  } else if (items.length !== file.items.length) {
    writeFile({ version: 1, items })
  }
  return items
}

export function updateEducationTargetNames(
  patches: EducationTargetNamePatch[]
): EducationTarget[] {
  const file = readFile()
  const items = ensureFixedTargets(file.items)
  const patchById = new Map(patches.map(p => [p.id, p]))
  const now = new Date().toISOString()
  const updated = items.map(row => {
    const patch = patchById.get(row.id)
    if (!patch) return row
    const name = patch.name.trim()
    return {
      ...row,
      name: name || row.name,
      indexColor: row.indexColor,
      updatedAt: now,
    }
  })
  const next = ensureFixedTargets(updated)
  writeFile({ version: 1, items: next })
  return next
}
