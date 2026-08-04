import { create } from 'zustand'
import dayjs from 'dayjs'
import type { StripBanner, StripBannerDraft } from '../model/types'
import { STRIP_BANNER_MAX_ACTIVE } from '../model/types'
import { isPopupPeriodExpired } from '@/features/main/popup/lib/format'

function nowIso() {
  return new Date().toISOString()
}

function reindex(rows: StripBanner[]): StripBanner[] {
  return rows.map((row, index) => ({ ...row, order: index }))
}

function applyExpiry(rows: StripBanner[]): StripBanner[] {
  let changed = false
  const next = rows.map(row => {
    if (row.active && isPopupPeriodExpired(row.endDate)) {
      changed = true
      return { ...row, active: false, updatedAt: nowIso() }
    }
    return row
  })
  return changed ? next : rows
}

function countActive(rows: StripBanner[], excludeId?: string): number {
  return rows.filter(row => row.active && row.id !== excludeId).length
}

const seed: StripBanner[] = reindex([
  {
    id: 'strip-1',
    order: 0,
    active: true,
    text: 'JA Korea 신규 프로그램을 확인해 보세요',
    startDate: dayjs().subtract(3, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().add(20, 'day').format('YYYY-MM-DD'),
    linkEnabled: true,
    linkUrl: 'https://www.jakorea.org',
    createdAt: dayjs().subtract(5, 'day').toISOString(),
    updatedAt: nowIso(),
  },
  {
    id: 'strip-2',
    order: 1,
    active: false,
    text: '후원으로 청소년의 가능성을 키워주세요',
    startDate: dayjs().format('YYYY-MM-DD'),
    endDate: dayjs().add(60, 'day').format('YYYY-MM-DD'),
    linkEnabled: false,
    linkUrl: '',
    createdAt: dayjs().subtract(1, 'day').toISOString(),
    updatedAt: nowIso(),
  },
])

type StripBannerStore = {
  banners: StripBanner[]
  syncExpiry: () => void
  create: (
    draft: StripBannerDraft
  ) => { ok: true; row: StripBanner } | { ok: false; reason: 'max-active' }
  update: (
    id: string,
    draft: StripBannerDraft
  ) => { ok: true; row: StripBanner } | { ok: false; reason: 'max-active' | 'not-found' }
  remove: (ids: string[]) => void
  setActive: (
    id: string,
    active: boolean
  ) => { ok: true } | { ok: false; reason: 'max-active' | 'not-found' }
  reorder: (orderedIds: string[]) => void
}

export const useStripBannerStore = create<StripBannerStore>((set, get) => ({
  banners: applyExpiry(seed),

  syncExpiry: () => {
    set(state => ({ banners: applyExpiry(state.banners) }))
  },

  create: draft => {
    const current = applyExpiry(get().banners)
    if (draft.active && countActive(current) >= STRIP_BANNER_MAX_ACTIVE) {
      return { ok: false, reason: 'max-active' }
    }
    const row: StripBanner = {
      id: `strip-${Date.now()}`,
      order: current.length,
      active: draft.active,
      text: draft.text.trim(),
      startDate: draft.startDate,
      endDate: draft.endDate,
      linkEnabled: draft.linkEnabled,
      linkUrl: draft.linkEnabled ? draft.linkUrl.trim() : '',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    set({ banners: reindex([...current, row]) })
    return { ok: true, row }
  },

  update: (id, draft) => {
    const current = applyExpiry(get().banners)
    if (!current.find(row => row.id === id)) return { ok: false, reason: 'not-found' }
    if (draft.active && countActive(current, id) >= STRIP_BANNER_MAX_ACTIVE) {
      return { ok: false, reason: 'max-active' }
    }
    let updated: StripBanner | null = null
    set({
      banners: current.map(row => {
        if (row.id !== id) return row
        updated = {
          ...row,
          active: draft.active,
          text: draft.text.trim(),
          startDate: draft.startDate,
          endDate: draft.endDate,
          linkEnabled: draft.linkEnabled,
          linkUrl: draft.linkEnabled ? draft.linkUrl.trim() : '',
          updatedAt: nowIso(),
        }
        return updated
      }),
    })
    return updated ? { ok: true, row: updated } : { ok: false, reason: 'not-found' }
  },

  remove: ids => {
    const idSet = new Set(ids)
    set(state => ({
      banners: reindex(applyExpiry(state.banners).filter(row => !idSet.has(row.id))),
    }))
  },

  setActive: (id, active) => {
    const current = applyExpiry(get().banners)
    if (!current.find(row => row.id === id)) return { ok: false, reason: 'not-found' }
    if (active && countActive(current, id) >= STRIP_BANNER_MAX_ACTIVE) {
      return { ok: false, reason: 'max-active' }
    }
    set({
      banners: current.map(row =>
        row.id === id ? { ...row, active, updatedAt: nowIso() } : row
      ),
    })
    return { ok: true }
  },

  reorder: orderedIds => {
    const map = new Map(get().banners.map(row => [row.id, row]))
    const next: StripBanner[] = []
    for (const id of orderedIds) {
      const row = map.get(id)
      if (row) next.push(row)
    }
    for (const row of get().banners) {
      if (!orderedIds.includes(row.id)) next.push(row)
    }
    set({ banners: reindex(applyExpiry(next)) })
  },
}))
