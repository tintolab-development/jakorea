export const gnbMenuQueryKeys = {
  all: ['gnb-menu'] as const,
  detail: (source: 'remote' | 'local') => [...gnbMenuQueryKeys.all, 'detail', source] as const,
}
