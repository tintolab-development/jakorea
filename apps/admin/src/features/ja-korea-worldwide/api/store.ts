/**
 * JA Worldwide 관리 — localStorage mock (API 연동 전)
 */

import type {
  JaKoreaWorldwide,
  WorldwideBranch,
  WorldwideBranchId,
} from '@/entities/ja-korea-worldwide/model/types'

const STORAGE_KEY = 'admin.jakorea.jaKoreaWorldwide.v1'

export const JA_KOREA_WORLDWIDE_CHANGED_EVENT = 'jakorea:ja-korea-worldwide-changed' as const

type WorldwideFile = {
  version: 1
  data: JaKoreaWorldwide
}

const BRANCH_SEED: ReadonlyArray<{ id: WorldwideBranchId; name: string; linkUrl: string }> = [
  { id: 'worldwide', name: 'JA Worldwide', linkUrl: 'https://www.jaworldwide.org/' },
  { id: 'usa', name: 'JUNIOR ACHIEVEMENT USA', linkUrl: 'https://jausa.ja.org/' },
  { id: 'europe', name: 'JA EUROPE', linkUrl: 'https://jaeurope.org/' },
  { id: 'mena', name: 'INJAZ AL_ARAB JA MENA', linkUrl: 'https://www.injazalarab.org/' },
  { id: 'asia-pacific', name: 'JA ASIA PACIFIC', linkUrl: 'https://www.jaasiapacific.org/' },
  {
    id: 'americas',
    name: 'JA AMERICAS includes Canada',
    linkUrl: 'https://jaamericas.org/',
  },
  { id: 'africa', name: 'JA AFRICA', linkUrl: 'https://ja-africa.org/' },
]

const BOTTOM_TEXT_SEED =
  'JA Worldwide는 100여년간 쌓아온 경험과 열정을 가진 세계에서 가장 영향력 있는 청소년 교육 NGO중 하나로서, 매년 약 100여 개국에서 50만명의 교육 진행자들과 함께 1,500만명 이상의 청소년들을 교육하고 있습니다.'

function buildSeedWorldwide(): JaKoreaWorldwide {
  return {
    branches: BRANCH_SEED.map(b => ({ id: b.id, name: b.name, linkUrl: b.linkUrl })),
    bottomText: BOTTOM_TEXT_SEED,
    updatedAt: '2026-07-01T00:00:00.000Z',
  }
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function normalizeBranches(raw: unknown): WorldwideBranch[] {
  const byId = new Map<string, string>()
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!item || typeof item !== 'object') continue
      const rec = item as Partial<WorldwideBranch>
      if (typeof rec.id === 'string' && typeof rec.linkUrl === 'string') {
        byId.set(rec.id, rec.linkUrl)
      }
    }
  }
  return BRANCH_SEED.map(seed => ({
    id: seed.id,
    name: seed.name,
    linkUrl: asString(byId.get(seed.id), seed.linkUrl),
  }))
}

function normalizeWorldwide(raw: Partial<JaKoreaWorldwide> | null | undefined): JaKoreaWorldwide {
  const seed = buildSeedWorldwide()
  if (!raw || typeof raw !== 'object') return seed
  return {
    branches: normalizeBranches(raw.branches),
    bottomText: asString(raw.bottomText, seed.bottomText),
    updatedAt: asString(raw.updatedAt, seed.updatedAt),
  }
}

function readWorldwideFile(): WorldwideFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { version: 1, data: buildSeedWorldwide() }
    const parsed = JSON.parse(raw) as WorldwideFile
    if (parsed?.version !== 1 || !parsed.data) {
      return { version: 1, data: buildSeedWorldwide() }
    }
    return { version: 1, data: normalizeWorldwide(parsed.data) }
  } catch {
    return { version: 1, data: buildSeedWorldwide() }
  }
}

function writeWorldwideFile(file: WorldwideFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(JA_KOREA_WORLDWIDE_CHANGED_EVENT))
}

export function readJaKoreaWorldwide(): JaKoreaWorldwide {
  const file = readWorldwideFile()
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeWorldwideFile(file)
  }
  return file.data
}

export function saveJaKoreaWorldwide(data: JaKoreaWorldwide): JaKoreaWorldwide {
  const next = normalizeWorldwide({
    branches: data.branches.map(b => ({
      id: b.id,
      name: b.name,
      linkUrl: b.linkUrl.trim(),
    })),
    bottomText: data.bottomText.trimEnd(),
    updatedAt: new Date().toISOString(),
  })
  writeWorldwideFile({ version: 1, data: next })
  return next
}
