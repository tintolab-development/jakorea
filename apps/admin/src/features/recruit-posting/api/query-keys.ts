export const recruitPostingQueryKeys = {
  all: ['recruit-postings'] as const,
  lists: () => [...recruitPostingQueryKeys.all, 'list'] as const,
  list: (source: 'local' | 'remote', filterKey: string) =>
    [...recruitPostingQueryKeys.lists(), source, filterKey] as const,
}
