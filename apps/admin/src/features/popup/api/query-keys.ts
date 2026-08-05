export const popupQueryKeys = {
  all: ['popups'] as const,
  lists: () => [...popupQueryKeys.all, 'list'] as const,
  list: (source: 'remote' | 'local') => [...popupQueryKeys.lists(), source] as const,
}
