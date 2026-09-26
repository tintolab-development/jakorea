import type { EducationTextbookListFilter } from '@/entities/education-textbook/model/types'

export const educationTextbookQueryKeys = {
  all: ['education-textbooks'] as const,
  lists: () => [...educationTextbookQueryKeys.all, 'list'] as const,
  list: (filter: EducationTextbookListFilter) =>
    [...educationTextbookQueryKeys.lists(), 'remote', filter] as const,
  details: () => [...educationTextbookQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...educationTextbookQueryKeys.details(), 'remote', id] as const,
}
