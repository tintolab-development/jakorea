import type { EducationTextbookListFilter } from '@/entities/education-textbook/model/types'

export const educationTextbookQueryKeys = {
  all: ['education-textbooks'] as const,
  lists: () => [...educationTextbookQueryKeys.all, 'list'] as const,
  list: (source: 'remote' | 'local', filter: EducationTextbookListFilter) =>
    [...educationTextbookQueryKeys.lists(), source, filter] as const,
  details: () => [...educationTextbookQueryKeys.all, 'detail'] as const,
  detail: (source: 'remote' | 'local', id: string) =>
    [...educationTextbookQueryKeys.details(), source, id] as const,
}
