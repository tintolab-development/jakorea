export const heroBannerQueryKeys = {
  all: ['hero-banners'] as const,
  lists: () => [...heroBannerQueryKeys.all, 'list'] as const,
  list: (source: 'remote' | 'local') => [...heroBannerQueryKeys.lists(), source] as const,
}
