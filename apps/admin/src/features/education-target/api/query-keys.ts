export const educationTargetQueryKeys = {
  all: ['education-targets'] as const,
  lists: () => [...educationTargetQueryKeys.all, 'list'] as const,
  list: () => [...educationTargetQueryKeys.lists(), 'remote'] as const,
}
