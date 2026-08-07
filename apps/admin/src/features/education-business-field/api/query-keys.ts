export const educationBusinessFieldQueryKeys = {
  all: ['education-business-fields'] as const,
  lists: () => [...educationBusinessFieldQueryKeys.all, 'list'] as const,
  list: (source: 'remote' | 'local') =>
    [...educationBusinessFieldQueryKeys.lists(), source] as const,
  documents: () => [...educationBusinessFieldQueryKeys.all, 'document'] as const,
  document: (source: 'remote' | 'local') =>
    [...educationBusinessFieldQueryKeys.documents(), source] as const,
}
