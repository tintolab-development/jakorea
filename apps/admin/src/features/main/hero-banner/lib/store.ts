import { create } from 'zustand'
import type { HeroBanner, HeroBannerDraft } from '../model/types'

const PLACEHOLDER_IMG =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
      <rect fill="#01a1af" width="320" height="180"/>
      <text x="160" y="96" fill="#fff" font-family="sans-serif" font-size="18" text-anchor="middle">Hero Banner</text>
    </svg>`
  )

function nowIso() {
  return new Date().toISOString()
}

function reindex(rows: HeroBanner[]): HeroBanner[] {
  return rows.map((row, index) => ({ ...row, order: index }))
}

const seed: HeroBanner[] = reindex([
  {
    id: 'hero-1',
    order: 0,
    active: true,
    imageUrl: PLACEHOLDER_IMG,
    imageName: 'hero-main.png',
    topText: 'JA Korea',
    mainTitle: '청소년의 가능성을 키웁니다',
    bottomText: '경제·금융 교육으로 미래를 준비하세요',
    linkUrl: 'https://www.jakorea.org',
    updatedAt: nowIso(),
  },
  {
    id: 'hero-2',
    order: 1,
    active: true,
    imageUrl: PLACEHOLDER_IMG,
    imageName: 'hero-program.png',
    topText: '프로그램',
    mainTitle: '다양한 교육 프로그램을 만나보세요',
    bottomText: '',
    linkUrl: '',
    updatedAt: nowIso(),
  },
  {
    id: 'hero-3',
    order: 2,
    active: false,
    imageUrl: PLACEHOLDER_IMG,
    imageName: 'hero-draft.png',
    topText: '',
    mainTitle: '미사용 배너 예시',
    bottomText: '사용 토글을 켜면 메인에 노출됩니다',
    linkUrl: 'https://example.com',
    updatedAt: nowIso(),
  },
])

type HeroBannerStore = {
  banners: HeroBanner[]
  list: () => HeroBanner[]
  create: (draft: HeroBannerDraft) => HeroBanner
  update: (id: string, draft: HeroBannerDraft) => HeroBanner | null
  remove: (ids: string[]) => void
  setActive: (id: string, active: boolean) => void
  reorder: (orderedIds: string[]) => void
}

export const useHeroBannerStore = create<HeroBannerStore>((set, get) => ({
  banners: seed,

  list: () => get().banners,

  create: draft => {
    const row: HeroBanner = {
      id: `hero-${Date.now()}`,
      order: get().banners.length,
      active: draft.active,
      imageUrl: draft.imageUrl,
      imageName: draft.imageName,
      topText: draft.topText.trim(),
      mainTitle: draft.mainTitle.trim(),
      bottomText: draft.bottomText.trim(),
      linkUrl: draft.linkUrl.trim(),
      updatedAt: nowIso(),
    }
    set(state => ({ banners: reindex([...state.banners, row]) }))
    return row
  },

  update: (id, draft) => {
    let updated: HeroBanner | null = null
    set(state => ({
      banners: state.banners.map(row => {
        if (row.id !== id) return row
        updated = {
          ...row,
          active: draft.active,
          imageUrl: draft.imageUrl,
          imageName: draft.imageName,
          topText: draft.topText.trim(),
          mainTitle: draft.mainTitle.trim(),
          bottomText: draft.bottomText.trim(),
          linkUrl: draft.linkUrl.trim(),
          updatedAt: nowIso(),
        }
        return updated
      }),
    }))
    return updated
  },

  remove: ids => {
    const idSet = new Set(ids)
    set(state => ({
      banners: reindex(state.banners.filter(row => !idSet.has(row.id))),
    }))
  },

  setActive: (id, active) => {
    set(state => ({
      banners: state.banners.map(row =>
        row.id === id ? { ...row, active, updatedAt: nowIso() } : row
      ),
    }))
  },

  reorder: orderedIds => {
    const map = new Map(get().banners.map(row => [row.id, row]))
    const next: HeroBanner[] = []
    for (const id of orderedIds) {
      const row = map.get(id)
      if (row) next.push(row)
    }
    for (const row of get().banners) {
      if (!orderedIds.includes(row.id)) next.push(row)
    }
    set({ banners: reindex(next) })
  },
}))
