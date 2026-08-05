export const socialLinkQueryKeys = {
  all: ['social-links'] as const,
  lists: () => [...socialLinkQueryKeys.all, 'list'] as const,
  list: (source: 'remote' | 'local') => [...socialLinkQueryKeys.lists(), source] as const,
}
