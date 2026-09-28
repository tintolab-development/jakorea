export const educationBusinessFieldQueryKeys = {
  all: ['education-business-fields'] as const,
  lists: () => [...educationBusinessFieldQueryKeys.all, 'list'] as const,
  list: () => [...educationBusinessFieldQueryKeys.lists(), 'remote'] as const,
  documents: () => [...educationBusinessFieldQueryKeys.all, 'document'] as const,
  document: () => [...educationBusinessFieldQueryKeys.documents(), 'remote'] as const,
}
