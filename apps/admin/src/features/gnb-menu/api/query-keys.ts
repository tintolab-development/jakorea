export const gnbMenuQueryKeys = {
  all: ['gnb-menu'] as const,
  detail: () => [...gnbMenuQueryKeys.all, 'detail', 'remote'] as const,
}
