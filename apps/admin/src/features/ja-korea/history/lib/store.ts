import { create } from 'zustand'
import type { HistoryDraft, HistoryItem, HistoryVisibility } from '../model/types'

function nowIso() {
  return new Date().toISOString()
}

const seed: HistoryItem[] = [
  {
    id: 'hist-1',
    visibility: 'public',
    year: 2024,
    month: 3,
    content: 'JA Korea 창립 기념 경제교육 캠페인 실시',
    createdAt: '2024-03-10T10:00:00.000Z',
    updatedAt: '2024-03-10T10:00:00.000Z',
  },
  {
    id: 'hist-2',
    visibility: 'public',
    year: 2023,
    month: 9,
    content: '전국 중·고등학생 대상 금융리터러시 프로그램 확대',
    createdAt: '2023-09-15T09:30:00.000Z',
    updatedAt: '2023-09-15T09:30:00.000Z',
  },
  {
    id: 'hist-3',
    visibility: 'private',
    year: 2022,
    month: 6,
    content: '기업 파트너십 확대 (초안)',
    createdAt: '2022-06-01T08:00:00.000Z',
    updatedAt: '2022-06-20T11:00:00.000Z',
  },
  {
    id: 'hist-4',
    visibility: 'public',
    year: 2021,
    month: 1,
    content: 'JA Worldwide 네트워크 활동 강화',
    createdAt: '2021-01-20T14:00:00.000Z',
    updatedAt: '2021-01-20T14:00:00.000Z',
  },
]

type HistoryStore = {
  items: HistoryItem[]
  create: (draft: HistoryDraft) => HistoryItem
  update: (id: string, draft: HistoryDraft) => HistoryItem | null
  remove: (ids: string[]) => void
  setVisibility: (id: string, visibility: HistoryVisibility) => void
}

export const useHistoryStore = create<HistoryStore>(set => ({
  items: seed,

  create: draft => {
    const now = nowIso()
    const row: HistoryItem = {
      id: `hist-${Date.now()}`,
      visibility: draft.visibility,
      year: draft.year!,
      month: draft.month!,
      content: draft.content.trim(),
      createdAt: now,
      updatedAt: now,
    }
    set(state => ({ items: [row, ...state.items] }))
    return row
  },

  update: (id, draft) => {
    let updated: HistoryItem | null = null
    set(state => ({
      items: state.items.map(row => {
        if (row.id !== id) return row
        updated = {
          ...row,
          visibility: draft.visibility,
          year: draft.year!,
          month: draft.month!,
          content: draft.content.trim(),
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
