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

const BRANCH_SEED: ReadonlyArray<{
  id: WorldwideBranchId
  name: string
  linkUrl: string
  apiId: number
}> = [
  { id: 'worldwide', name: 'JA Worldwide', linkUrl: 'https://www.jaworldwide.org/', apiId: 1 },
  { id: 'usa', name: 'JUNIOR ACHIEVEMENT USA', linkUrl: 'https://jausa.ja.org/', apiId: 2 },
  { id: 'europe', name: 'JA EUROPE', linkUrl: 'https://jaeurope.org/', apiId: 3 },
  {
    id: 'mena',
    name: 'INJAZ AL-ARAB JA MENA',
    linkUrl: 'https://www.injazalarab.org/',
    apiId: 4,
  },
  {
    id: 'asia-pacific',
    name: 'JA ASIA PACIFIC',
    linkUrl: 'https://www.jaasiapacific.org/',
    apiId: 5,
  },
  {
    id: 'americas',
    name: 'JA AMERICAS includes Canada',
    linkUrl: 'https://jaamericas.org/',
    apiId: 6,
  },
  { id: 'africa', name: 'JA AFRICA', linkUrl: 'https://ja-africa.org/', apiId: 7 },
]

const BOTTOM_TEXT_SEED =
  'JA Worldwide는 100여년간 쌓아온 경험과 열정을 가진 세계에서 가장 영향력 있는 청소년 교육 NGO중 하나로서, 매년 약 100여 개국에서 50만명의 교육 진행자들과 함께 1,500만명 이상의 청소년들을 교육하고 있습니다.'

function buildSeedWorldwide(): JaKoreaWorldwide {
  return {
    branches: BRANCH_SEED.map(b => ({
      id: b.id,
      name: b.name,
      linkUrl: b.linkUrl,
      apiId: b.apiId,
      version: 0,
    })),
    bottomText: BOTTOM_TEXT_SEED,
    updatedAt: '2026-07-01T00:00:00.000Z',
    settingVersion: 0,
  }
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function normalizeBranches(raw: unknown): WorldwideBranch[] {
  const byId = new Map<string, Partial<WorldwideBranch>>()
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!item || typeof item !== 'object') continue
      const rec = item as Partial<WorldwideBranch>
      if (typeof rec.id === 'string') {
        byId.set(rec.id, rec)
      }
    }
  }
  return BRANCH_SEED.map(seed => {
    const prev = byId.get(seed.id)
    return {
      id: seed.id,
      name: seed.name,
      linkUrl: asString(prev?.linkUrl, seed.linkUrl),
      apiId: typeof prev?.apiId === 'number' ? prev.apiId : seed.apiId,
      version: typeof prev?.version === 'number' ? prev.version : 0,
    }
  })
}

function normalizeWorldwide(raw: Partial<JaKoreaWorldwide> | null | undefined): JaKoreaWorldwide {
  const seed = buildSeedWorldwide()
  if (!raw || typeof raw !== 'object') return seed
  return {
    branches: normalizeBranches(raw.branches),
    bottomText: asString(raw.bottomText, seed.bottomText),
    updatedAt: asString(raw.updatedAt, seed.updatedAt),
    settingVersion: typeof raw.settingVersion === 'number' ? raw.settingVersion : 0,
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
      apiId: b.apiId,
      version: b.version,
    })),
    bottomText: data.bottomText.trimEnd(),
    updatedAt: new Date().toISOString(),
    settingVersion: data.settingVersion ?? 0,
  })
  writeWorldwideFile({ version: 1, data: next })
  return next
}
