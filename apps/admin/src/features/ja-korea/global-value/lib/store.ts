import { create } from 'zustand'
import type { GlobalValueId, GlobalValueItem } from '../model/types'
import { GLOBAL_VALUE_DEFS } from '../model/types'

function reindex(rows: GlobalValueItem[]): GlobalValueItem[] {
  return rows.map((row, index) => ({ ...row, order: index }))
}

const seedTexts: Record<
  GlobalValueId,
  { mainText: string; subText: string; active: boolean }
> = {
  belief: {
    active: true,
    mainText: 'Belief',
    subText: '청소년의 잠재력을\n믿습니다',
  },
  connection: {
    active: true,
    mainText: 'Connection',
    subText: '기업·학교·지역과\n연결합니다',
  },
  integrity: {
    active: true,
    mainText: 'Integrity',
    subText: '정직과 책임으로\n교육합니다',
  },
  excellence: {
    active: true,
    mainText: 'Excellence',
    subText: '탁월한 교육 경험을\n제공합니다',
  },
  respect: {
    active: true,
    mainText: 'Respect',
    subText: '서로를 존중하는\n공동체를 만듭니다',
  },
}

const seed: GlobalValueItem[] = reindex(
  GLOBAL_VALUE_DEFS.map((def, index) => ({
    id: def.id,
    order: index,
    iconKey: def.id,
    ...seedTexts[def.id],
  }))
)

type GlobalValueStore = {
  items: GlobalValueItem[]
  setActive: (id: GlobalValueId, active: boolean) => void
  reorder: (orderedIds: GlobalValueId[]) => void
  saveAll: (drafts: GlobalValueItem[]) => void
}

export const useGlobalValueStore = create<GlobalValueStore>((set, get) => ({
  items: seed,

  setActive: (id, active) => {
    set(state => ({
      items: state.items.map(row => (row.id === id ? { ...row, active } : row)),
    }))
  },

  reorder: orderedIds => {
    const map = new Map(get().items.map(row => [row.id, row]))
    const next: GlobalValueItem[] = []
    for (const id of orderedIds) {
      const row = map.get(id)
      if (row) next.push(row)
    }
    for (const row of get().items) {
      if (!orderedIds.includes(row.id)) next.push(row)
    }
    set({ items: reindex(next) })
  },

  saveAll: drafts => {
    const byId = new Map(drafts.map(row => [row.id, row]))
    set(state => ({
      items: reindex(
        state.items.map(row => {
          const draft = byId.get(row.id)
          if (!draft) return row
          return {
            ...row,
            active: draft.active,
            mainText: draft.mainText,
            subText: draft.subText,
            order: draft.order,
          }
        })
      ),
    }))
  },
}))
