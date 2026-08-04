import { create } from 'zustand'
import type { SocialChannelId, SocialLink } from '../model/types'
import { SOCIAL_CHANNEL_DEFS } from '../model/types'

function reindex(rows: SocialLink[]): SocialLink[] {
  return rows.map((row, index) => ({ ...row, order: index }))
}

const seed: SocialLink[] = reindex(
  SOCIAL_CHANNEL_DEFS.map((ch, index) => ({
    id: ch.id,
    order: index,
    active: ch.id === 'instagram' || ch.id === 'youtube' || ch.id === 'naver-blog',
    name: ch.name,
    linkUrl:
      ch.id === 'instagram'
        ? 'https://www.instagram.com/jakorea'
        : ch.id === 'youtube'
          ? 'https://www.youtube.com/@jakorea'
          : ch.id === 'naver-blog'
            ? 'https://blog.naver.com/jakorea'
            : '',
  }))
)

type SocialLinkStore = {
  links: SocialLink[]
  setActive: (id: SocialChannelId, active: boolean) => void
  reorder: (orderedIds: SocialChannelId[]) => void
  /** 수정 모드 저장 — active인데 URL 비어 있으면 실패 */
  saveAll: (
    drafts: SocialLink[]
  ) => { ok: true } | { ok: false; missingIds: SocialChannelId[] }
}

export const useSocialLinkStore = create<SocialLinkStore>((set, get) => ({
  links: seed,

  setActive: (id, active) => {
    set(state => ({
      links: state.links.map(row => (row.id === id ? { ...row, active } : row)),
    }))
  },

  reorder: orderedIds => {
    const map = new Map(get().links.map(row => [row.id, row]))
    const next: SocialLink[] = []
    for (const id of orderedIds) {
      const row = map.get(id)
      if (row) next.push(row)
    }
    for (const row of get().links) {
      if (!orderedIds.includes(row.id)) next.push(row)
    }
    set({ links: reindex(next) })
  },

  saveAll: drafts => {
    const missingIds = drafts
      .filter(row => row.active && !row.linkUrl.trim())
      .map(row => row.id)
    if (missingIds.length > 0) {
      return { ok: false, missingIds }
    }
    const byId = new Map(drafts.map(row => [row.id, row]))
    set(state => ({
      links: reindex(
        state.links.map(row => {
          const draft = byId.get(row.id)
          if (!draft) return row
          return {
            ...row,
            active: draft.active,
            linkUrl: draft.linkUrl.trim(),
          }
        })
      ),
    }))
    return { ok: true }
  },
}))
