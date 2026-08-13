import type { PopupListFilter } from '@/entities/popup/model/types'

export const popupQueryKeys = {
  all: ['popups'] as const,
  lists: () => [...popupQueryKeys.all, 'list'] as const,
  list: (source: 'remote' | 'local', filter: PopupListFilter = {}) =>
    [...popupQueryKeys.lists(), source, filter] as const,
}
