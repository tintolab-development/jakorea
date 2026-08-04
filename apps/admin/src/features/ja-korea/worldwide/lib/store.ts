import { create } from 'zustand'
import type { WorldwideContent } from '../model/types'
import { WORLDWIDE_REGION_DEFS } from '../model/types'

const seedUrls: Partial<Record<(typeof WORLDWIDE_REGION_DEFS)[number]['id'], string>> = {
  americas: 'https://www.jaworldwide.org/',
  europe: 'https://www.jaworldwide.org/',
  africa: 'https://www.jaworldwide.org/',
  'middle-east': 'https://www.jaworldwide.org/',
  'asia-pacific': 'https://www.jaworldwide.org/',
  china: 'https://www.jaworldwide.org/',
  japan: 'https://www.jaworldwide.org/',
  korea: 'https://www.jakorea.org/',
}

const seed: WorldwideContent = {
  regions: WORLDWIDE_REGION_DEFS.map(def => ({
    id: def.id,
    name: def.name,
    linkUrl: seedUrls[def.id] ?? '',
  })),
  notice:
    'JA Worldwide는 전 세계 네트워크와 연결되어 있습니다.\n국가·지역명을 선택하면 해당 JA 사이트로 이동합니다.',
}

type WorldwideStore = {
  content: WorldwideContent
  save: (next: WorldwideContent) => void
}

export const useWorldwideStore = create<WorldwideStore>(set => ({
  content: seed,
  save: next => {
    // 국가·지역명은 고정 — draft의 name은 무시하고 시드 defs 기준으로 보존
    const nameById = new Map(WORLDWIDE_REGION_DEFS.map(d => [d.id, d.name]))
    set({
      content: {
        notice: next.notice,
        regions: next.regions.map(row => ({
          id: row.id,
          name: nameById.get(row.id) ?? row.name,
          linkUrl: row.linkUrl.trim(),
        })),
      },
    })
  },
}))
