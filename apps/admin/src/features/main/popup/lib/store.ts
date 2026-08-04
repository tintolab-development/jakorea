import { create } from 'zustand'
import dayjs from 'dayjs'
import type { MainPopup, MainPopupDraft } from '../model/types'
import { MAIN_POPUP_MAX_ACTIVE } from '../model/types'
import { isPopupPeriodExpired } from './format'

const PLACEHOLDER_IMG =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
      <rect fill="#296075" width="320" height="180"/>
      <text x="160" y="96" fill="#fff" font-family="sans-serif" font-size="18" text-anchor="middle">Popup</text>
    </svg>`
  )

function nowIso() {
  return new Date().toISOString()
}

function reindex(rows: MainPopup[]): MainPopup[] {
  return rows.map((row, index) => ({ ...row, order: index }))
}

/** 게시기간 만료 시 사용 여부 자동 비활성화 */
function applyExpiry(rows: MainPopup[]): MainPopup[] {
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

function countActive(rows: MainPopup[], excludeId?: string): number {
  return rows.filter(row => row.active && row.id !== excludeId).length
}

const seed: MainPopup[] = reindex([
  {
    id: 'popup-1',
    order: 0,
    active: true,
    imageUrl: PLACEHOLDER_IMG,
    imageName: 'popup-welcome.png',
    name: '환영 팝업',
    altText: 'JA Korea 환영 안내',
    startDate: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().add(30, 'day').format('YYYY-MM-DD'),
    linkEnabled: true,
    linkUrl: 'https://www.jakorea.org',
    createdAt: dayjs().subtract(10, 'day').toISOString(),
    updatedAt: nowIso(),
  },
  {
    id: 'popup-2',
    order: 1,
    active: true,
    imageUrl: PLACEHOLDER_IMG,
    imageName: 'popup-program.png',
    name: '프로그램 안내',
    altText: '신규 프로그램 모집',
    startDate: dayjs().format('YYYY-MM-DD'),
    endDate: dayjs().add(14, 'day').format('YYYY-MM-DD'),
    linkEnabled: false,
    linkUrl: '',
    createdAt: dayjs().subtract(3, 'day').toISOString(),
    updatedAt: nowIso(),
  },
  {
    id: 'popup-3',
    order: 2,
    active: false,
    imageUrl: PLACEHOLDER_IMG,
    imageName: 'popup-old.png',
    name: '만료 예정 팝업',
    altText: '종료된 캠페인',
    startDate: dayjs().subtract(60, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    linkEnabled: true,
    linkUrl: 'https://example.com',
    createdAt: dayjs().subtract(60, 'day').toISOString(),
    updatedAt: nowIso(),
  },
])

type MainPopupStore = {
  popups: MainPopup[]
  syncExpiry: () => void
  create: (draft: MainPopupDraft) => { ok: true; row: MainPopup } | { ok: false; reason: 'max-active' }
  update: (
    id: string,
    draft: MainPopupDraft
  ) => { ok: true; row: MainPopup } | { ok: false; reason: 'max-active' | 'not-found' }
  remove: (ids: string[]) => void
  setActive: (
    id: string,
    active: boolean
  ) => { ok: true } | { ok: false; reason: 'max-active' | 'not-found' }
  reorder: (orderedIds: string[]) => void
}

export const useMainPopupStore = create<MainPopupStore>((set, get) => ({
  popups: applyExpiry(seed),

  syncExpiry: () => {
    set(state => ({ popups: applyExpiry(state.popups) }))
  },

  create: draft => {
    const current = applyExpiry(get().popups)
    if (draft.active && countActive(current) >= MAIN_POPUP_MAX_ACTIVE) {
      return { ok: false, reason: 'max-active' }
    }
    const row: MainPopup = {
      id: `popup-${Date.now()}`,
      order: current.length,
      active: draft.active,
      imageUrl: draft.imageUrl,
      imageName: draft.imageName,
      name: draft.name.trim(),
      altText: draft.altText.trim(),
      startDate: draft.startDate,
      endDate: draft.endDate,
      linkEnabled: draft.linkEnabled,
      linkUrl: draft.linkEnabled ? draft.linkUrl.trim() : '',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    set({ popups: reindex([...current, row]) })
    return { ok: true, row }
  },

  update: (id, draft) => {
    const current = applyExpiry(get().popups)
    const existing = current.find(row => row.id === id)
    if (!existing) return { ok: false, reason: 'not-found' }
    if (draft.active && countActive(current, id) >= MAIN_POPUP_MAX_ACTIVE) {
      return { ok: false, reason: 'max-active' }
    }
    let updated: MainPopup | null = null
    const next = current.map(row => {
      if (row.id !== id) return row
      updated = {
        ...row,
        active: draft.active,
        imageUrl: draft.imageUrl,
        imageName: draft.imageName,
        name: draft.name.trim(),
        altText: draft.altText.trim(),
        startDate: draft.startDate,
        endDate: draft.endDate,
        linkEnabled: draft.linkEnabled,
        linkUrl: draft.linkEnabled ? draft.linkUrl.trim() : '',
        updatedAt: nowIso(),
      }
      return updated
    })
    set({ popups: next })
    return updated ? { ok: true, row: updated } : { ok: false, reason: 'not-found' }
  },

  remove: ids => {
    const idSet = new Set(ids)
    set(state => ({
      popups: reindex(applyExpiry(state.popups).filter(row => !idSet.has(row.id))),
    }))
  },

  setActive: (id, active) => {
    const current = applyExpiry(get().popups)
    const existing = current.find(row => row.id === id)
    if (!existing) return { ok: false, reason: 'not-found' }
    if (active && countActive(current, id) >= MAIN_POPUP_MAX_ACTIVE) {
      return { ok: false, reason: 'max-active' }
    }
    set({
      popups: current.map(row =>
        row.id === id ? { ...row, active, updatedAt: nowIso() } : row
      ),
    })
    return { ok: true }
  },

  reorder: orderedIds => {
    const map = new Map(get().popups.map(row => [row.id, row]))
    const next: MainPopup[] = []
    for (const id of orderedIds) {
      const row = map.get(id)
      if (row) next.push(row)
    }
    for (const row of get().popups) {
      if (!orderedIds.includes(row.id)) next.push(row)
    }
    set({ popups: reindex(applyExpiry(next)) })
  },
}))
