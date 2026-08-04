import { create } from 'zustand'
import type { AwardDraft, AwardItem, AwardVisibility } from '../model/types'

function nowIso() {
  return new Date().toISOString()
}

const seed: AwardItem[] = [
  {
    id: 'award-1',
    visibility: 'public',
    title: '우수 비영리기관상',
    organization: '한국사회복지협의회',
    awardedOn: '2024-05-12',
    createdAt: '2024-05-15T10:00:00.000Z',
    updatedAt: '2024-05-15T10:00:00.000Z',
  },
  {
    id: 'award-2',
    visibility: 'public',
    title: '청소년 경제교육 공로상',
    organization: '교육부',
    awardedOn: '2023-11-03',
    createdAt: '2023-11-08T09:00:00.000Z',
    updatedAt: '2023-11-08T09:00:00.000Z',
  },
  {
    id: 'award-3',
    visibility: 'private',
    title: '파트너십 우수상 (초안)',
    organization: 'JA Worldwide',
    awardedOn: '2022-08-20',
    createdAt: '2022-08-25T11:30:00.000Z',
    updatedAt: '2022-09-01T08:00:00.000Z',
  },
]

type AwardStore = {
  items: AwardItem[]
  create: (draft: AwardDraft) => AwardItem
  update: (id: string, draft: AwardDraft) => AwardItem | null
  remove: (ids: string[]) => void
  setVisibility: (id: string, visibility: AwardVisibility) => void
}

export const useAwardStore = create<AwardStore>(set => ({
  items: seed,

  create: draft => {
    const now = nowIso()
    const row: AwardItem = {
      id: `award-${Date.now()}`,
      visibility: draft.visibility,
      title: draft.title.trim(),
      organization: draft.organization.trim(),
      awardedOn: draft.awardedOn!,
      createdAt: now,
      updatedAt: now,
    }
    set(state => ({ items: [row, ...state.items] }))
    return row
  },

  update: (id, draft) => {
    let updated: AwardItem | null = null
    set(state => ({
      items: state.items.map(row => {
        if (row.id !== id) return row
        updated = {
          ...row,
          visibility: draft.visibility,
          title: draft.title.trim(),
          organization: draft.organization.trim(),
          awardedOn: draft.awardedOn!,
          updatedAt: nowIso(),
        }
        return updated
      }),
    }))
    return updated
  },

  remove: ids => {
    const idSet = new Set(ids)
    set(state => ({ items: state.items.filter(row => !idSet.has(row.id)) }))
  },

  setVisibility: (id, visibility) => {
    set(state => ({
      items: state.items.map(row =>
        row.id === id ? { ...row, visibility, updatedAt: nowIso() } : row
      ),
    }))
  },
}))
