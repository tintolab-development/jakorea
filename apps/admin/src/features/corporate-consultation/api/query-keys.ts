import type { CorporateConsultationListFilter } from '@/entities/corporate-consultation/model/types'

export const corporateConsultationQueryKeys = {
  all: ['corporate-consultations'] as const,
  lists: () => [...corporateConsultationQueryKeys.all, 'list'] as const,
  list: (source: 'remote' | 'local', filter: CorporateConsultationListFilter) =>
    [...corporateConsultationQueryKeys.lists(), source, filter] as const,
  details: () => [...corporateConsultationQueryKeys.all, 'detail'] as const,
  detail: (source: 'remote' | 'local', id: string) =>
    [...corporateConsultationQueryKeys.details(), source, id] as const,
}
