export const educationTargetQueryKeys = {
  all: ['education-targets'] as const,
  lists: () => [...educationTargetQueryKeys.all, 'list'] as const,
  list: (source: 'remote' | 'local') =>
    [...educationTargetQueryKeys.lists(), source] as const,
}
